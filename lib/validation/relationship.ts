/**
 * Relationship Validation Schemas
 *
 * Zod schemas for validating relationship input data.
 * Used in API routes for request validation.
 */

import { z } from 'zod';

/**
 * Valid relationship types
 */
export const relationshipTypeSchema = z.enum([
  'knows',
  'loves',
  'opposes',
  'works_for',
  'family_of',
  'located_at',
  'participated_in',
  'possesses',
  'member_of',
]);

/**
 * Valid strength values (1-5)
 */
export const strengthSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

/**
 * Schema for creating a new relationship
 */
export const createRelationshipSchema = z.object({
  type: relationshipTypeSchema,
  sourceId: z.string().uuid('Invalid source entity ID'),
  targetId: z.string().uuid('Invalid target entity ID'),
  context: z
    .string()
    .max(2000, 'Context must be 2000 characters or less')
    .optional()
    .default(''),
  strength: strengthSchema.optional().default(3),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  ongoing: z.boolean().optional().default(true),
  metadata: z.record(z.unknown()).optional().default({}),
}).refine((data) => data.sourceId !== data.targetId, {
  message: 'Source and target entities cannot be the same',
  path: ['targetId'],
});

/**
 * Schema for updating an existing relationship
 */
export const updateRelationshipSchema = z
  .object({
    type: relationshipTypeSchema.optional(),
    context: z
      .string()
      .max(2000, 'Context must be 2000 characters or less')
      .optional(),
    strength: strengthSchema.optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
    ongoing: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Schema for listing relationships with filters
 */
export const listRelationshipsQuerySchema = z.object({
  universeId: z.string().uuid('Invalid universe ID'),
  entityId: z.string().uuid('Invalid entity ID').optional(),
  type: relationshipTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'strength']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Schema for relationship ID parameter
 */
export const relationshipIdSchema = z.object({
  id: z.string().uuid('Invalid relationship ID'),
});

/**
 * Type exports for use in API routes
 */
export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;
export type UpdateRelationshipInput = z.infer<typeof updateRelationshipSchema>;
export type ListRelationshipsQuery = z.infer<typeof listRelationshipsQuerySchema>;
