/**
 * Entity Validation Schemas
 *
 * Zod schemas for validating entity input data.
 * Used in API routes for request validation.
 */

import { z } from 'zod';

/**
 * Valid entity types
 */
export const entityTypeSchema = z.enum([
  'character',
  'location',
  'event',
  'object',
  'faction',
]);

/**
 * Valid entity statuses
 */
export const entityStatusSchema = z.enum(['active', 'inactive', 'deceased']);

/**
 * Schema for creating a new entity
 */
export const createEntitySchema = z.object({
  type: entityTypeSchema,
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .trim(),
  aliases: z
    .array(
      z
        .string()
        .min(1, 'Alias cannot be empty')
        .max(100, 'Alias must be 100 characters or less')
        .trim()
    )
    .max(20, 'Maximum 20 aliases allowed')
    .optional()
    .default([]),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be 5000 characters or less')
    .trim(),
  status: entityStatusSchema.optional().default('active'),
  imageUrl: z
    .string()
    .url('Invalid image URL')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  metadata: z.record(z.unknown()).optional().default({}),
  universeId: z.string().uuid('Invalid universe ID'),
});

/**
 * Schema for updating an existing entity
 */
export const updateEntitySchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name cannot be empty')
      .max(200, 'Name must be 200 characters or less')
      .trim()
      .optional(),
    aliases: z
      .array(
        z
          .string()
          .min(1, 'Alias cannot be empty')
          .max(100, 'Alias must be 100 characters or less')
          .trim()
      )
      .max(20, 'Maximum 20 aliases allowed')
      .optional(),
    description: z
      .string()
      .min(1, 'Description cannot be empty')
      .max(5000, 'Description must be 5000 characters or less')
      .trim()
      .optional(),
    status: entityStatusSchema.optional(),
    imageUrl: z
    .string()
    .url('Invalid image URL')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Schema for listing entities with filters
 */
export const listEntitiesQuerySchema = z.object({
  universeId: z.string().uuid('Invalid universe ID'),
  type: entityTypeSchema.optional(),
  status: entityStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Schema for searching entities
 */
export const searchEntitiesQuerySchema = z.object({
  universeId: z.string().uuid('Invalid universe ID'),
  q: z.string().min(1, 'Search query is required').max(200),
  type: entityTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

/**
 * Schema for entity ID parameter
 */
export const entityIdSchema = z.object({
  id: z.string().uuid('Invalid entity ID'),
});

/**
 * Type exports for use in API routes
 */
export type CreateEntityInput = z.infer<typeof createEntitySchema>;
export type UpdateEntityInput = z.infer<typeof updateEntitySchema>;
export type ListEntitiesQuery = z.infer<typeof listEntitiesQuerySchema>;
export type SearchEntitiesQuery = z.infer<typeof searchEntitiesQuerySchema>;
