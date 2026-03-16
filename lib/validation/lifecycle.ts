/**
 * Lifecycle Validation Schemas
 *
 * Zod schemas for validating lifecycle engine input data.
 */

import { z } from 'zod';

// ============================================
// Asset Type Schemas
// ============================================

export const createAssetTypeSchema = z.object({
  productionId: z.string().uuid('Invalid production ID'),
  name: z.string().min(1, 'Name is required').max(100).trim(),
  slug: z.string().max(50).trim().optional(),
  description: z.string().max(500).trim().optional(),
  icon: z.string().max(50).trim().optional(),
  sourceTable: z.string().max(100).trim().optional(),
  color: z.string().max(20).trim().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateAssetTypeSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    description: z.string().max(500).trim().optional().nullable(),
    icon: z.string().max(50).trim().optional().nullable(),
    color: z.string().max(20).trim().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listAssetTypesQuerySchema = z.object({
  productionId: z.string().uuid('Invalid production ID'),
  includeInactive: z.coerce.boolean().optional(),
});

// ============================================
// Lifecycle Stage Schemas
// ============================================

export const createLifecycleStageSchema = z.object({
  assetTypeId: z.string().uuid('Invalid asset type ID'),
  name: z.string().min(1, 'Name is required').max(100).trim(),
  slug: z.string().max(50).trim().optional(),
  description: z.string().max(500).trim().optional(),
  stageOrder: z.number().int().min(0),
  isInitial: z.boolean().optional(),
  isTerminal: z.boolean().optional(),
  color: z.string().max(20).trim().optional(),
  bgColor: z.string().max(50).trim().optional(),
  autoAdvanceAfterDays: z.number().int().min(1).optional(),
  requiresConfirmation: z.boolean().optional(),
});

export const updateLifecycleStageSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    description: z.string().max(500).trim().optional().nullable(),
    color: z.string().max(20).trim().optional(),
    bgColor: z.string().max(50).trim().optional().nullable(),
    autoAdvanceAfterDays: z.number().int().min(1).optional().nullable(),
    requiresConfirmation: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// ============================================
// Asset Instance Schemas
// ============================================

export const createAssetInstanceSchema = z.object({
  productionId: z.string().uuid('Invalid production ID'),
  assetTypeId: z.string().uuid('Invalid asset type ID'),
  name: z.string().min(1, 'Name is required').max(300).trim(),
  description: z.string().max(2000).trim().optional(),
  currentStageId: z.string().uuid('Invalid stage ID'),
  ownerName: z.string().max(200).trim().optional(),
  sourceType: z.string().max(50).trim().optional(),
  sourceId: z.string().max(100).trim().optional(),
  metadata: z.record(z.unknown()).optional(),
  priority: z.number().int().min(0).max(2).optional(),
  dueDate: z.string().optional(),
});

export const updateAssetInstanceSchema = z
  .object({
    name: z.string().min(1).max(300).trim().optional(),
    description: z.string().max(2000).trim().optional().nullable(),
    ownerName: z.string().max(200).trim().optional().nullable(),
    blockedBy: z.string().max(500).trim().optional().nullable(),
    isBlocked: z.boolean().optional(),
    priority: z.number().int().min(0).max(2).optional(),
    dueDate: z.string().optional().nullable(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listAssetInstancesQuerySchema = z.object({
  productionId: z.string().uuid('Invalid production ID'),
  assetTypeId: z.string().uuid('Invalid asset type ID').optional(),
  stageId: z.string().uuid('Invalid stage ID').optional(),
  isBlocked: z.coerce.boolean().optional(),
  sourceType: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================
// Stage Advance Schema
// ============================================

export const advanceStageSchema = z.object({
  toStageId: z.string().uuid('Invalid target stage ID'),
  reason: z.string().max(500).trim().optional(),
  transitionedByName: z.string().max(200).trim().optional(),
  automated: z.boolean().optional(),
});

// ============================================
// ID Schemas
// ============================================

export const assetTypeIdSchema = z.object({
  id: z.string().uuid('Invalid asset type ID'),
});

export const assetInstanceIdSchema = z.object({
  id: z.string().uuid('Invalid asset instance ID'),
});
