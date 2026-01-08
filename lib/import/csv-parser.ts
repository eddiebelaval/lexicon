/**
 * CSV Parser
 *
 * Parses CSV text into structured data with error handling.
 * Supports common delimiters and handles edge cases like quoted fields.
 */

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: { row: number; message: string }[];
}

export interface ParseOptions {
  delimiter?: string;
  skipEmptyRows?: boolean;
  trimValues?: boolean;
}

/**
 * Auto-detect the delimiter used in CSV text
 */
function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] || '';

  const delimiters = [',', '\t', ';', '|'];
  const counts = delimiters.map((d) => ({
    delimiter: d,
    count: (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length,
  }));

  // Return the delimiter with the highest count
  counts.sort((a, b) => b.count - a.count);
  return counts[0]?.count > 0 ? counts[0].delimiter : ',';
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(
  line: string,
  delimiter: string
): { values: string[]; error?: string } {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
          continue;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        current += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        if (current.length === 0) {
          // Start of quoted field
          inQuotes = true;
          i++;
          continue;
        } else {
          // Quote in middle of unquoted field
          current += char;
          i++;
          continue;
        }
      } else if (char === delimiter) {
        values.push(current);
        current = '';
        i++;
        continue;
      } else if (char === '\r') {
        // Skip carriage return
        i++;
        continue;
      } else {
        current += char;
        i++;
        continue;
      }
    }
  }

  // Don't forget the last value
  values.push(current);

  if (inQuotes) {
    return { values: [], error: 'Unclosed quote in line' };
  }

  return { values };
}

/**
 * Parse CSV text into headers and rows
 */
export function parseCSV(
  text: string,
  options: ParseOptions = {}
): CSVParseResult {
  const {
    delimiter = detectDelimiter(text),
    skipEmptyRows = true,
    trimValues = true,
  } = options;

  const errors: { row: number; message: string }[] = [];
  const lines = text.split('\n');

  // Handle empty file or file with only whitespace
  if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
    return { headers: [], rows: [], errors: [{ row: 0, message: 'Empty file' }] };
  }

  // Parse header row
  const headerResult = parseCSVLine(lines[0], delimiter);
  if (headerResult.error) {
    errors.push({ row: 1, message: headerResult.error });
    return { headers: [], rows: [], errors };
  }

  const headers = headerResult.values.map((h) =>
    trimValues ? h.trim() : h
  );

  // Validate headers - check for empty headers
  const emptyHeaderIndex = headers.findIndex((h) => h === '');
  if (emptyHeaderIndex !== -1) {
    errors.push({
      row: 1,
      message: `Empty header at column ${emptyHeaderIndex + 1}`,
    });
  }

  // Check for duplicate headers
  const headerSet = new Set<string>();
  headers.forEach((h, idx) => {
    if (headerSet.has(h.toLowerCase())) {
      errors.push({
        row: 1,
        message: `Duplicate header "${h}" at column ${idx + 1}`,
      });
    }
    headerSet.add(h.toLowerCase());
  });

  // Parse data rows
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty rows if configured
    if (skipEmptyRows && line.trim() === '') {
      continue;
    }

    const rowResult = parseCSVLine(line, delimiter);
    if (rowResult.error) {
      errors.push({ row: i + 1, message: rowResult.error });
      continue;
    }

    const values = rowResult.values.map((v) =>
      trimValues ? v.trim() : v
    );

    // Check column count mismatch
    if (values.length !== headers.length) {
      errors.push({
        row: i + 1,
        message: `Column count mismatch: expected ${headers.length}, got ${values.length}`,
      });
      // Still try to create a row with available data
    }

    // Create row object
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });

    rows.push(row);
  }

  return { headers, rows, errors };
}

/**
 * Common column name mappings for auto-detection
 */
export const COMMON_COLUMN_MAPPINGS: Record<string, string[]> = {
  name: ['name', 'title', 'entity', 'entity_name', 'entityname'],
  type: ['type', 'entity_type', 'entitytype', 'category', 'kind'],
  description: [
    'description',
    'desc',
    'details',
    'summary',
    'bio',
    'biography',
    'about',
  ],
  aliases: [
    'aliases',
    'alias',
    'aka',
    'also_known_as',
    'alsoknownas',
    'nicknames',
    'nickname',
  ],
  status: ['status', 'state', 'active', 'is_active'],
  imageUrl: ['image', 'imageurl', 'image_url', 'avatar', 'picture', 'photo'],
};

/**
 * Auto-detect column mappings based on header names
 */
export function autoDetectColumnMappings(
  headers: string[]
): Record<string, string | undefined> {
  const mappings: Record<string, string | undefined> = {
    name: undefined,
    type: undefined,
    description: undefined,
    aliases: undefined,
    status: undefined,
    imageUrl: undefined,
  };

  const normalizedHeaders = headers.map((h) => h.toLowerCase().replace(/[_\s-]/g, ''));

  for (const [field, possibleNames] of Object.entries(COMMON_COLUMN_MAPPINGS)) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      if (possibleNames.includes(normalizedHeaders[i])) {
        mappings[field] = headers[i];
        break;
      }
    }
  }

  return mappings;
}

/**
 * Generate a sample CSV string for download template
 */
export function generateSampleCSV(): string {
  const headers = ['name', 'type', 'description', 'aliases', 'status'];
  const rows = [
    [
      "D'Artagnan",
      'character',
      'Young Gascon swordsman who joins the Musketeers',
      "Charles de Batz,D'Art",
      'active',
    ],
    [
      'Paris',
      'location',
      'Capital of France and main setting of the story',
      'La Ville Lumiere',
      'active',
    ],
    [
      'The Siege of La Rochelle',
      'event',
      'Military siege where the Musketeers prove their valor',
      'La Rochelle Siege',
      'active',
    ],
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Quote cells that contain commas or quotes
          if (cell.includes(',') || cell.includes('"')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(',')
    ),
  ].join('\n');

  return csvContent;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(
  headers: string[],
  rows: Record<string, string>[]
): string {
  const escapeCell = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const dataLines = rows.map((row) =>
    headers.map((header) => escapeCell(row[header] || '')).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
}
