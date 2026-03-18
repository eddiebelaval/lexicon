/**
 * Excel (.xlsx) Parser for Onboarding
 *
 * Parses production spreadsheets into cast, crew, and scene data.
 * Handles the messy reality of production spreadsheets:
 * - Multiple sheets (cast, crew, schedule on different tabs)
 * - Merged cells, color-coded statuses, abbreviations
 * - Inconsistent column naming
 *
 * Uses SheetJS (xlsx) for parsing.
 */

import * as XLSX from 'xlsx';
import type { CastDraft, CrewDraft, ImportedScene, ImportedFileData } from '@/lib/onboarding/engine';
import type { CrewRole } from '@/types';

// ============================================
// Column Detection Patterns
// ============================================

const CAST_NAME_PATTERNS = [
  'name', 'cast', 'cast member', 'cast_member', 'castmember',
  'talent', 'participant', 'subject', 'person',
];

const CAST_LOCATION_PATTERNS = [
  'location', 'city', 'home', 'hometown', 'where', 'base',
  'home city', 'home_city', 'address',
];

const CREW_NAME_PATTERNS = [
  'name', 'crew', 'crew member', 'crew_member', 'crewmember',
  'team member', 'staff', 'person',
];

const CREW_ROLE_PATTERNS = [
  'role', 'title', 'position', 'job', 'department', 'dept',
];

const CREW_EMAIL_PATTERNS = [
  'email', 'e-mail', 'mail', 'contact', 'email address',
];

const CREW_PHONE_PATTERNS = [
  'phone', 'mobile', 'cell', 'telephone', 'number', 'contact number',
];

const SCENE_TITLE_PATTERNS = [
  'scene', 'title', 'description', 'activity', 'event', 'shoot',
  'scene title', 'shoot description',
];

const SCENE_DATE_PATTERNS = [
  'date', 'shoot date', 'shoot_date', 'scheduled', 'when', 'day',
];

const SCENE_LOCATION_PATTERNS = [
  'location', 'where', 'venue', 'place', 'address', 'shoot location',
];

const SCENE_CAST_PATTERNS = [
  'cast', 'talent', 'participants', 'who', 'with', 'cast members',
];

// ============================================
// Helpers
// ============================================

function normalize(s: string): string {
  return s.toLowerCase().replace(/[_\s-]+/g, ' ').trim();
}

function matchesPatterns(header: string, patterns: string[]): boolean {
  const norm = normalize(header);
  return patterns.some((p) => norm === p || norm.includes(p));
}

function findColumn(headers: string[], patterns: string[]): string | null {
  for (const h of headers) {
    if (matchesPatterns(h, patterns)) return h;
  }
  return null;
}

function parseCrewRole(raw: string): CrewRole {
  const lower = raw.toLowerCase().trim();
  const roleMap: Record<string, CrewRole> = {
    'ac': 'ac',
    'assistant camera': 'ac',
    'camera': 'ac',
    'camera operator': 'ac',
    'producer': 'producer',
    'field producer': 'field_producer',
    'fp': 'field_producer',
    'coordinator': 'coordinator',
    'coord': 'coordinator',
    'production coordinator': 'coordinator',
    'fixer': 'fixer',
    'editor': 'editor',
    'post': 'post_supervisor',
    'post supervisor': 'post_supervisor',
    'post-production': 'post_supervisor',
    'ep': 'staff',
    'executive producer': 'staff',
    'showrunner': 'staff',
    'staff': 'staff',
  };
  return roleMap[lower] || 'ac';
}

/**
 * Detect what kind of data a sheet contains based on headers
 */
type SheetType = 'cast' | 'crew' | 'schedule' | 'mixed' | 'unknown';

function detectSheetType(headers: string[]): SheetType {
  const hasCastName = findColumn(headers, CAST_NAME_PATTERNS) !== null;
  const hasCrewRole = findColumn(headers, CREW_ROLE_PATTERNS) !== null;
  const hasSceneDate = findColumn(headers, SCENE_DATE_PATTERNS) !== null;
  const hasSceneTitle = findColumn(headers, SCENE_TITLE_PATTERNS) !== null;

  // Sheet name + header heuristic
  if (hasSceneDate && hasSceneTitle) return 'schedule';
  if (hasCrewRole && hasCastName) return 'crew'; // Role column is the differentiator
  if (hasCastName && !hasCrewRole) return 'cast';
  if (hasCastName) return 'mixed';
  return 'unknown';
}

// ============================================
// Sheet Parsers
// ============================================

function parseCastSheet(rows: Record<string, string>[], headers: string[]): CastDraft[] {
  const nameCol = findColumn(headers, CAST_NAME_PATTERNS);
  const locationCol = findColumn(headers, CAST_LOCATION_PATTERNS);
  if (!nameCol) return [];

  return rows
    .map((row) => ({
      name: (row[nameCol] || '').trim(),
      location: locationCol ? (row[locationCol] || '').trim() : '',
      description: '',
    }))
    .filter((c) => c.name.length > 0);
}

function parseCrewSheet(rows: Record<string, string>[], headers: string[]): CrewDraft[] {
  const nameCol = findColumn(headers, CREW_NAME_PATTERNS);
  const roleCol = findColumn(headers, CREW_ROLE_PATTERNS);
  const emailCol = findColumn(headers, CREW_EMAIL_PATTERNS);
  const phoneCol = findColumn(headers, CREW_PHONE_PATTERNS);
  if (!nameCol) return [];

  return rows
    .map((row) => ({
      name: (row[nameCol] || '').trim(),
      role: parseCrewRole(roleCol ? (row[roleCol] || '') : 'ac'),
      contactEmail: emailCol ? (row[emailCol] || '').trim() : '',
      contactPhone: phoneCol ? (row[phoneCol] || '').trim() : '',
    }))
    .filter((c) => c.name.length > 0);
}

function parseScheduleSheet(rows: Record<string, string>[], headers: string[]): ImportedScene[] {
  const titleCol = findColumn(headers, SCENE_TITLE_PATTERNS);
  const dateCol = findColumn(headers, SCENE_DATE_PATTERNS);
  const locationCol = findColumn(headers, SCENE_LOCATION_PATTERNS);
  const castCol = findColumn(headers, SCENE_CAST_PATTERNS);
  if (!titleCol && !dateCol) return [];

  return rows
    .map((row) => {
      const title = titleCol ? (row[titleCol] || '').trim() : '';
      const date = dateCol ? (row[dateCol] || '').trim() : '';
      const location = locationCol ? (row[locationCol] || '').trim() : '';
      const castRaw = castCol ? (row[castCol] || '').trim() : '';
      const castNames = castRaw
        ? castRaw.split(/[,;&]/).map((n) => n.trim()).filter(Boolean)
        : [];

      return { title, date, location, castNames };
    })
    .filter((s) => s.title.length > 0 || s.date.length > 0);
}

// ============================================
// Main Parser
// ============================================

/**
 * Parse an Excel or CSV file buffer into onboarding data.
 *
 * @param buffer - File contents as ArrayBuffer
 * @param fileName - Original file name (for display)
 * @returns Parsed import data ready for the onboarding engine
 */
export function parseSpreadsheet(buffer: ArrayBuffer, fileName: string): ImportedFileData {
  const workbook = XLSX.read(buffer, { type: 'array' });

  const allCast: CastDraft[] = [];
  const allCrew: CrewDraft[] = [];
  const allScenes: ImportedScene[] = [];
  let totalRows = 0;
  let firstHeaders: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Convert sheet to array of objects
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false, // Get formatted strings, not raw values
    });

    if (rawRows.length === 0) continue;

    // Get headers from first row's keys
    const headers = Object.keys(rawRows[0]);
    if (firstHeaders.length === 0) firstHeaders = headers;

    // Convert all values to strings
    const rows = rawRows.map((row) => {
      const stringRow: Record<string, string> = {};
      for (const [key, val] of Object.entries(row)) {
        stringRow[key] = val != null ? String(val) : '';
      }
      return stringRow;
    });

    totalRows += rows.length;

    // Also check sheet name for hints
    const sheetNameLower = sheetName.toLowerCase();
    let sheetType = detectSheetType(headers);

    // Sheet name overrides header detection
    if (sheetNameLower.includes('cast') || sheetNameLower.includes('talent')) {
      sheetType = 'cast';
    } else if (sheetNameLower.includes('crew') || sheetNameLower.includes('team') || sheetNameLower.includes('staff')) {
      sheetType = 'crew';
    } else if (sheetNameLower.includes('schedule') || sheetNameLower.includes('calendar') || sheetNameLower.includes('shoot')) {
      sheetType = 'schedule';
    }

    switch (sheetType) {
      case 'cast':
        allCast.push(...parseCastSheet(rows, headers));
        break;
      case 'crew':
        allCrew.push(...parseCrewSheet(rows, headers));
        break;
      case 'schedule':
        allScenes.push(...parseScheduleSheet(rows, headers));
        break;
      case 'mixed': {
        // Try to extract both cast and crew
        const cast = parseCastSheet(rows, headers);
        const crew = parseCrewSheet(rows, headers);
        if (cast.length > 0) allCast.push(...cast);
        if (crew.length > 0) allCrew.push(...crew);
        break;
      }
      case 'unknown': {
        // Last resort: treat as cast if there's a name column
        const nameCol = findColumn(headers, [...CAST_NAME_PATTERNS, ...CREW_NAME_PATTERNS]);
        if (nameCol) {
          allCast.push(...parseCastSheet(rows, headers));
        }
        break;
      }
    }
  }

  // Deduplicate cast by name (case-insensitive)
  const seenCast = new Set<string>();
  const dedupedCast = allCast.filter((c) => {
    const key = c.name.toLowerCase();
    if (seenCast.has(key)) return false;
    seenCast.add(key);
    return true;
  });

  // Deduplicate crew by name
  const seenCrew = new Set<string>();
  const dedupedCrew = allCrew.filter((c) => {
    const key = c.name.toLowerCase();
    if (seenCrew.has(key)) return false;
    seenCrew.add(key);
    return true;
  });

  return {
    fileName,
    cast: dedupedCast,
    crew: dedupedCrew,
    scenes: allScenes,
    rawHeaders: firstHeaders,
    totalRows,
  };
}
