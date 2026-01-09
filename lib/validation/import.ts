/**
 * Import Validation Schemas
 *
 * Zod schemas for validating import data.
 * Used for CSV/Excel import operations.
 */

import { z } from 'zod';
import { entityTypeSchema, entityStatusSchema } from './entity';

/**
 * Column mapping configuration for CSV import
 */
export interface ColumnMapping {
  name: string; // Required: maps to entity name
  type?: string; // Maps to entity type
  description?: string; // Maps to description
  aliases?: string; // Maps to aliases (comma-separated)
  status?: string; // Maps to status
  imageUrl?: string; // Maps to imageUrl
}

/**
 * A single row of import data after mapping
 */
export interface MappedImportRow {
  name: string;
  type: string;
  description: string;
  aliases: string[];
  status: string;
  imageUrl?: string;
}

/**
 * Validation result for a single row
 */
export interface RowValidationResult {
  valid: boolean;
  row: number;
  data?: MappedImportRow;
  errors: string[];
}

/**
 * Import result summary
 */
export interface ImportResult {
  success: boolean;
  entitiesCreated: number;
  entitiesSkipped: number;
  errors: { row: number; message: string }[];
}

/**
 * Schema for entity import row
 */
export const importRowSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .trim(),
  type: entityTypeSchema,
  description: z
    .string()
    .max(5000, 'Description must be 5000 characters or less')
    .default(''),
  aliases: z.array(z.string().trim()).default([]),
  status: entityStatusSchema.default('active'),
  imageUrl: z
    .string()
    .url('Invalid image URL')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
});

/**
 * Schema for the import request body
 */
export const importRequestSchema = z.object({
  universeId: z.string().uuid('Invalid universe ID'),
  entities: z.array(importRowSchema).min(1, 'At least one entity is required'),
});

/**
 * Validate and transform a single import row
 */
export function validateImportRow(
  rawRow: Record<string, string>,
  mapping: ColumnMapping,
  rowNumber: number
): RowValidationResult {
  const errors: string[] = [];

  // Extract values based on mapping
  const name = mapping.name ? rawRow[mapping.name]?.trim() : undefined;
  const type = mapping.type ? rawRow[mapping.type]?.trim().toLowerCase() : 'character';
  const description = mapping.description ? rawRow[mapping.description]?.trim() : '';
  const aliasesRaw = mapping.aliases ? rawRow[mapping.aliases]?.trim() : '';
  const status = mapping.status ? rawRow[mapping.status]?.trim().toLowerCase() : 'active';
  const imageUrl = mapping.imageUrl ? rawRow[mapping.imageUrl]?.trim() : undefined;

  // Validate name
  if (!name) {
    errors.push('Name is required');
    return { valid: false, row: rowNumber, errors };
  }

  if (name.length > 200) {
    errors.push('Name must be 200 characters or less');
  }

  // Validate type
  const validTypes = ['character', 'location', 'event', 'object', 'faction'];
  const normalizedType = type || 'character';
  if (!validTypes.includes(normalizedType)) {
    errors.push(`Invalid type "${type}". Must be one of: ${validTypes.join(', ')}`);
  }

  // Validate status
  const validStatuses = ['active', 'inactive', 'deceased'];
  const normalizedStatus = status || 'active';
  if (!validStatuses.includes(normalizedStatus)) {
    errors.push(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`);
  }

  // Validate description length
  if (description && description.length > 5000) {
    errors.push('Description must be 5000 characters or less');
  }

  // Parse aliases
  const aliases = aliasesRaw
    ? aliasesRaw
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0)
    : [];

  // Validate aliases
  if (aliases.length > 20) {
    errors.push('Maximum 20 aliases allowed');
  }

  const longAliases = aliases.filter((a) => a.length > 100);
  if (longAliases.length > 0) {
    errors.push('Each alias must be 100 characters or less');
  }

  // Validate imageUrl if provided
  if (imageUrl && imageUrl.length > 0) {
    try {
      new URL(imageUrl);
    } catch {
      errors.push('Invalid image URL format');
    }
  }

  if (errors.length > 0) {
    return { valid: false, row: rowNumber, errors };
  }

  return {
    valid: true,
    row: rowNumber,
    data: {
      name,
      type: normalizedType,
      description: description || '',
      aliases,
      status: normalizedStatus,
      imageUrl: imageUrl || undefined,
    },
    errors: [],
  };
}

/**
 * Validate all import rows
 */
export function validateImportRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): {
  validRows: MappedImportRow[];
  invalidRows: { row: number; errors: string[] }[];
} {
  const validRows: MappedImportRow[] = [];
  const invalidRows: { row: number; errors: string[] }[] = [];

  // Check for duplicate names
  const nameSet = new Set<string>();
  const duplicateNames: string[] = [];

  rows.forEach((row, idx) => {
    const result = validateImportRow(row, mapping, idx + 2); // +2 because row 1 is header

    if (result.valid && result.data) {
      // Check for duplicates
      const normalizedName = result.data.name.toLowerCase();
      if (nameSet.has(normalizedName)) {
        duplicateNames.push(result.data.name);
        invalidRows.push({
          row: idx + 2,
          errors: [`Duplicate name "${result.data.name}" in import data`],
        });
      } else {
        nameSet.add(normalizedName);
        validRows.push(result.data);
      }
    } else {
      invalidRows.push({
        row: result.row,
        errors: result.errors,
      });
    }
  });

  return { validRows, invalidRows };
}

/**
 * Type exports
 */
export type ImportRowInput = z.infer<typeof importRowSchema>;
export type ImportRequestInput = z.infer<typeof importRequestSchema>;

// ============================================================================
// STORYLINE IMPORT SCHEMAS
// ============================================================================

/**
 * Column mapping configuration for storyline CSV import
 */
export interface StorylineColumnMapping {
  title: string; // Required: maps to storyline title
  synopsis?: string; // Maps to synopsis (~300 words)
  narrative?: string; // Maps to narrative (5,000+ words)
  primaryCastNames?: string; // Comma-separated cast names
  supportingCastNames?: string; // Comma-separated cast names
  season?: string; // Season identifier
  episodeRange?: string; // Episode range (e.g., "1-5")
  tags?: string; // Comma-separated tags
  status?: string; // active, archived, developing
}

/**
 * A single storyline row after mapping
 */
export interface MappedStorylineRow {
  title: string;
  synopsis: string;
  narrative: string;
  primaryCastNames: string[];
  supportingCastNames: string[];
  season?: string;
  episodeRange?: string;
  tags: string[];
  status: string;
}

/**
 * Resolved storyline with cast IDs
 */
export interface ResolvedStorylineRow extends Omit<MappedStorylineRow, 'primaryCastNames' | 'supportingCastNames'> {
  primaryCast: string[];
  supportingCast: string[];
  unmatchedCast: string[];
}

/**
 * Storyline validation result
 */
export interface StorylineRowValidationResult {
  valid: boolean;
  row: number;
  data?: MappedStorylineRow;
  errors: string[];
}

/**
 * Storyline import result summary
 */
export interface StorylineImportResult {
  success: boolean;
  storylinesCreated: number;
  storylinesSkipped: number;
  castResolution: {
    matched: number;
    unmatched: string[];
  };
  errors: { row: number; message: string }[];
}

/**
 * Schema for storyline import row
 */
export const storylineImportRowSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less')
    .trim(),
  synopsis: z
    .string()
    .max(5000, 'Synopsis must be 5000 characters or less')
    .default(''),
  narrative: z
    .string()
    .max(500000, 'Narrative must be 500,000 characters or less')
    .default(''),
  primaryCastNames: z.array(z.string().trim()).default([]),
  supportingCastNames: z.array(z.string().trim()).default([]),
  season: z.string().max(50).optional(),
  episodeRange: z.string().max(50).optional(),
  tags: z.array(z.string().trim().max(50)).max(20).default([]),
  status: z.enum(['active', 'archived', 'developing']).default('active'),
});

/**
 * Schema for the storyline import request body
 */
export const storylineImportRequestSchema = z.object({
  universeId: z.string().uuid('Invalid universe ID'),
  storylines: z.array(storylineImportRowSchema).min(1, 'At least one storyline is required'),
});

/**
 * Validate and transform a single storyline import row
 */
export function validateStorylineImportRow(
  rawRow: Record<string, string>,
  mapping: StorylineColumnMapping,
  rowNumber: number
): StorylineRowValidationResult {
  const errors: string[] = [];

  // Extract values based on mapping
  const title = mapping.title ? rawRow[mapping.title]?.trim() : undefined;
  const synopsis = mapping.synopsis ? rawRow[mapping.synopsis]?.trim() : '';
  const narrative = mapping.narrative ? rawRow[mapping.narrative]?.trim() : '';
  const primaryCastRaw = mapping.primaryCastNames ? rawRow[mapping.primaryCastNames]?.trim() : '';
  const supportingCastRaw = mapping.supportingCastNames ? rawRow[mapping.supportingCastNames]?.trim() : '';
  const season = mapping.season ? rawRow[mapping.season]?.trim() : undefined;
  const episodeRange = mapping.episodeRange ? rawRow[mapping.episodeRange]?.trim() : undefined;
  const tagsRaw = mapping.tags ? rawRow[mapping.tags]?.trim() : '';
  const status = mapping.status ? rawRow[mapping.status]?.trim().toLowerCase() : 'active';

  // Validate title
  if (!title) {
    errors.push('Title is required');
    return { valid: false, row: rowNumber, errors };
  }

  if (title.length > 500) {
    errors.push('Title must be 500 characters or less');
  }

  // Validate synopsis length
  if (synopsis && synopsis.length > 5000) {
    errors.push('Synopsis must be 5000 characters or less');
  }

  // Validate narrative length
  if (narrative && narrative.length > 500000) {
    errors.push('Narrative must be 500,000 characters or less');
  }

  // Validate status
  const validStatuses = ['active', 'archived', 'developing'];
  const normalizedStatus = status || 'active';
  if (!validStatuses.includes(normalizedStatus)) {
    errors.push(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`);
  }

  // Parse cast names
  const primaryCastNames = primaryCastRaw
    ? primaryCastRaw
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n.length > 0)
    : [];

  const supportingCastNames = supportingCastRaw
    ? supportingCastRaw
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n.length > 0)
    : [];

  // Validate cast limits
  if (primaryCastNames.length > 20) {
    errors.push('Primary cast cannot exceed 20 members');
  }

  if (supportingCastNames.length > 100) {
    errors.push('Supporting cast cannot exceed 100 members');
  }

  // Parse tags
  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  // Validate tags
  if (tags.length > 20) {
    errors.push('Cannot have more than 20 tags');
  }

  const longTags = tags.filter((t) => t.length > 50);
  if (longTags.length > 0) {
    errors.push('Each tag must be 50 characters or less');
  }

  // Validate season and episode range lengths
  if (season && season.length > 50) {
    errors.push('Season must be 50 characters or less');
  }

  if (episodeRange && episodeRange.length > 50) {
    errors.push('Episode range must be 50 characters or less');
  }

  if (errors.length > 0) {
    return { valid: false, row: rowNumber, errors };
  }

  return {
    valid: true,
    row: rowNumber,
    data: {
      title,
      synopsis: synopsis || '',
      narrative: narrative || '',
      primaryCastNames,
      supportingCastNames,
      season: season || undefined,
      episodeRange: episodeRange || undefined,
      tags,
      status: normalizedStatus,
    },
    errors: [],
  };
}

/**
 * Validate all storyline import rows
 */
export function validateStorylineImportRows(
  rows: Record<string, string>[],
  mapping: StorylineColumnMapping
): {
  validRows: MappedStorylineRow[];
  invalidRows: { row: number; errors: string[] }[];
} {
  const validRows: MappedStorylineRow[] = [];
  const invalidRows: { row: number; errors: string[] }[] = [];

  // Check for duplicate titles
  const titleSet = new Set<string>();

  rows.forEach((row, idx) => {
    const result = validateStorylineImportRow(row, mapping, idx + 2); // +2 because row 1 is header

    if (result.valid && result.data) {
      // Check for duplicates
      const normalizedTitle = result.data.title.toLowerCase();
      if (titleSet.has(normalizedTitle)) {
        invalidRows.push({
          row: idx + 2,
          errors: [`Duplicate title "${result.data.title}" in import data`],
        });
      } else {
        titleSet.add(normalizedTitle);
        validRows.push(result.data);
      }
    } else {
      invalidRows.push({
        row: result.row,
        errors: result.errors,
      });
    }
  });

  return { validRows, invalidRows };
}

/**
 * Type exports for storyline import
 */
export type StorylineImportRowInput = z.infer<typeof storylineImportRowSchema>;
export type StorylineImportRequestInput = z.infer<typeof storylineImportRequestSchema>;
