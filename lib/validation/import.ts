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
