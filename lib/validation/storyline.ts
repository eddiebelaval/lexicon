/**
 * Storyline Validation Schemas
 *
 * Zod schemas for validating storyline input data.
 * Used in API routes for request validation.
 */

import { z } from 'zod';

/**
 * Valid storyline statuses
 */
export const storylineStatusSchema = z.enum(['active', 'archived', 'developing']);

/**
 * Valid update types for storyline updates
 */
export const updateTypeSchema = z.enum(['news', 'social_media', 'manual', 'ai_enrichment']);

/**
 * Schema for creating a new storyline
 */
export const createStorylineSchema = z.object({
  universeId: z.string().uuid('Invalid universe ID'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .max(200, 'Slug must be 200 characters or less')
    .optional(),
  synopsis: z
    .string()
    .max(5000, 'Synopsis must be 5000 characters or less')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  narrative: z
    .string()
    .max(500000, 'Narrative must be 500,000 characters or less') // ~100,000 words
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  primaryCast: z
    .array(z.string().min(1, 'Cast entity ID cannot be empty'))
    .max(20, 'Primary cast cannot exceed 20 members')
    .optional()
    .default([]),
  supportingCast: z
    .array(z.string().min(1, 'Cast entity ID cannot be empty'))
    .max(100, 'Supporting cast cannot exceed 100 members')
    .optional()
    .default([]),
  status: storylineStatusSchema.optional().default('active'),
  season: z
    .string()
    .max(50, 'Season must be 50 characters or less')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  episodeRange: z
    .string()
    .max(50, 'Episode range must be 50 characters or less')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  tags: z
    .array(z.string().min(1).max(50, 'Tag must be 50 characters or less'))
    .max(20, 'Cannot have more than 20 tags')
    .optional()
    .default([]),
});

/**
 * Schema for updating an existing storyline
 */
export const updateStorylineSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(500, 'Title must be 500 characters or less')
      .optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
      .max(200, 'Slug must be 200 characters or less')
      .optional(),
    synopsis: z
      .string()
      .max(5000, 'Synopsis must be 5000 characters or less')
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
    narrative: z
      .string()
      .max(500000, 'Narrative must be 500,000 characters or less')
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
    primaryCast: z
      .array(z.string().min(1, 'Cast entity ID cannot be empty'))
      .max(20, 'Primary cast cannot exceed 20 members')
      .optional(),
    supportingCast: z
      .array(z.string().min(1, 'Cast entity ID cannot be empty'))
      .max(100, 'Supporting cast cannot exceed 100 members')
      .optional(),
    status: storylineStatusSchema.optional(),
    season: z
      .string()
      .max(50, 'Season must be 50 characters or less')
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
    episodeRange: z
      .string()
      .max(50, 'Episode range must be 50 characters or less')
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
    tags: z
      .array(z.string().min(1).max(50, 'Tag must be 50 characters or less'))
      .max(20, 'Cannot have more than 20 tags')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Schema for listing storylines with filters
 */
export const listStorylinesQuerySchema = z.object({
  universeId: z.string().uuid('Invalid universe ID'),
  status: storylineStatusSchema.optional(),
  season: z.string().optional(),
  castEntityId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Schema for storyline ID parameter
 */
export const storylineIdSchema = z.object({
  id: z.string().uuid('Invalid storyline ID'),
});

/**
 * Schema for creating a storyline update
 */
export const createStorylineUpdateSchema = z.object({
  storylineId: z.string().uuid('Invalid storyline ID'),
  updateType: updateTypeSchema,
  sourceUrl: z.string().url('Invalid URL').optional(),
  sourceName: z.string().max(200, 'Source name must be 200 characters or less').optional(),
  title: z.string().max(500, 'Title must be 500 characters or less').optional(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content must be 50,000 characters or less'),
  summary: z.string().max(1000, 'Summary must be 1000 characters or less').optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  publishedAt: z.coerce.date().optional(),
});

/**
 * Schema for searching storylines
 */
export const searchStorylinesQuerySchema = z.object({
  universeId: z.string().uuid('Invalid universe ID'),
  q: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

/**
 * Type exports for use in API routes
 */
export type CreateStorylineInput = z.infer<typeof createStorylineSchema>;
export type UpdateStorylineInput = z.infer<typeof updateStorylineSchema>;
export type ListStorylinesQuery = z.infer<typeof listStorylinesQuerySchema>;
export type CreateStorylineUpdateInput = z.infer<typeof createStorylineUpdateSchema>;
export type SearchStorylinesQuery = z.infer<typeof searchStorylinesQuerySchema>;
