/**
 * Cast Spreadsheet Parser
 *
 * Parses the master cast CSV/XLSX (the "bible" spreadsheet) into structured
 * cast data. Handles the specific format used in 90 Day / Diaries production:
 *
 * - Couple names: "Kara & Guillermo" kept as one unit
 * - Multi-line cells: Phone/email with "Kara: 434-242-0826\nGuillermo: (434) 242-4967"
 * - Season history as free-text with line breaks
 * - 1,300+ rows across all seasons
 * - Real PII: phones, emails, addresses
 *
 * Uses SheetJS (xlsx) for parsing.
 */

import * as XLSX from 'xlsx';

// ============================================
// Types
// ============================================

export interface ParsedCastRow {
  castName: string;           // "Kara & Guillermo"
  legalName: string | null;   // "Kara Bass\nGuillermo Antonio Rojer Castillo"
  phone: string | null;       // Raw multi-line phone field
  email: string | null;       // Raw multi-line email field
  address: string | null;
  hometown: string | null;
  birthdays: string | null;
  weddingDate: string | null;
  socialMedia: string | null;
  notes: string | null;
  pastSeasons: string[];      // Parsed list: ["90 Day S9", "Pillowtalk", ...]
  currentSeason: string | null;
  upcoming: string | null;
  beingConsidered: string | null;
}

export interface CastParseResult {
  rows: ParsedCastRow[];
  totalRows: number;
  skippedRows: number;
  columns: string[];
  seasonTags: string[];       // Unique seasons found across all rows
}

// ============================================
// Column Mapping
// ============================================

// Maps normalized header names to ParsedCastRow field names.
// Handles slight variations in how production coordinators name columns.
const COLUMN_MAP: Record<string, keyof ParsedCastRow | null> = {
  'cast': 'castName',
  'cast name': 'castName',
  'name': 'castName',
  'past seasons': 'pastSeasons',
  'current season': 'currentSeason',
  'upcoming': 'upcoming',
  'being considered for': 'beingConsidered',
  'being considered': 'beingConsidered',
  'considered for': 'beingConsidered',
  'legal name': 'legalName',
  'legal': 'legalName',
  'phone': 'phone',
  'phone number': 'phone',
  'phones': 'phone',
  'email': 'email',
  'emails': 'email',
  'email address': 'email',
  'address': 'address',
  'mailing address': 'address',
  'hometown/country of origin': 'hometown',
  'hometown': 'hometown',
  'country of origin': 'hometown',
  'home': 'hometown',
  'birthdays': 'birthdays',
  'birthday': 'birthdays',
  'dob': 'birthdays',
  'date of birth': 'birthdays',
  'wedding date (if applicable)': 'weddingDate',
  'wedding date': 'weddingDate',
  'anniversary': 'weddingDate',
  'social media accounts': 'socialMedia',
  'social media': 'socialMedia',
  'socials': 'socialMedia',
  'instagram': 'socialMedia',
  'notes': 'notes',
  'note': 'notes',
  'comments': 'notes',
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Parse season text (multi-line, comma-separated, or mixed) into individual season tags.
 */
function parseSeasons(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n\r]+/)
    .flatMap(line => line.split(/,(?![^(]*\))/)) // split on commas not inside parens
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ============================================
// Main Parser
// ============================================

/**
 * Parse a cast spreadsheet buffer (CSV or XLSX) into structured cast rows.
 *
 * @param buffer - Raw file contents
 * @param filename - Original filename (used for logging, not parsing logic)
 * @returns Parsed result with rows, stats, and extracted season tags
 */
export function parseCastSpreadsheet(buffer: Buffer, _filename: string): CastParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  // Use the first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return { rows: [], totalRows: 0, skippedRows: 0, columns: [], seasonTags: [] };
  }

  // Convert to array of objects, preserving empty cells as empty strings
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (rawRows.length === 0) {
    return { rows: [], totalRows: 0, skippedRows: 0, columns: [], seasonTags: [] };
  }

  // Build header mapping
  const rawHeaders = Object.keys(rawRows[0]);
  const columns = rawHeaders.map(h => h.trim());

  const headerMap: Record<string, keyof ParsedCastRow | null> = {};
  for (const header of rawHeaders) {
    const normalized = normalizeHeader(header);
    headerMap[header] = COLUMN_MAP[normalized] ?? null;
  }

  // Find the header key that maps to a given field
  function findHeaderForField(field: keyof ParsedCastRow): string | undefined {
    return rawHeaders.find(h => headerMap[h] === field);
  }

  const castNameHeader = findHeaderForField('castName');

  const rows: ParsedCastRow[] = [];
  let skippedRows = 0;
  const allSeasons = new Set<string>();

  for (const rawRow of rawRows) {
    // Extract cast name
    const castName = String(rawRow[castNameHeader ?? ''] ?? '').trim();

    // Skip rows with no cast name (empty rows, section dividers, etc.)
    if (!castName) {
      skippedRows++;
      continue;
    }

    // Helper to extract a string field
    function getField(field: keyof ParsedCastRow): string | null {
      const header = findHeaderForField(field);
      if (!header) return null;
      const val = String(rawRow[header] ?? '').trim();
      return val || null;
    }

    const pastSeasonsRaw = getField('pastSeasons');
    const pastSeasons = parseSeasons(pastSeasonsRaw);
    const currentSeason = getField('currentSeason');

    // Collect unique season tags
    pastSeasons.forEach(s => allSeasons.add(s));
    if (currentSeason) {
      parseSeasons(currentSeason).forEach(s => allSeasons.add(s));
    }

    rows.push({
      castName,
      legalName: getField('legalName'),
      phone: getField('phone'),
      email: getField('email'),
      address: getField('address'),
      hometown: getField('hometown'),
      birthdays: getField('birthdays'),
      weddingDate: getField('weddingDate'),
      socialMedia: getField('socialMedia'),
      notes: getField('notes'),
      pastSeasons,
      currentSeason,
      upcoming: getField('upcoming'),
      beingConsidered: getField('beingConsidered'),
    });
  }

  return {
    rows,
    totalRows: rawRows.length,
    skippedRows,
    columns,
    seasonTags: Array.from(allSeasons).sort(),
  };
}
