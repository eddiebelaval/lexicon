/**
 * Production Validation Schemas
 *
 * Zod schemas for validating production management input data.
 * Used in API routes for request validation.
 */

import { z } from 'zod';

// ============================================
// Shared Enums
// ============================================

export const productionStatusSchema = z.enum([
  'pre_production',
  'active',
  'post_production',
  'wrapped',
]);

export const crewRoleSchema = z.enum([
  'staff',
  'ac',
  'producer',
  'fixer',
  'editor',
  'coordinator',
]);

export const prodSceneStatusSchema = z.enum([
  'scheduled',
  'shot',
  'cancelled',
  'postponed',
  'self_shot',
]);

export const assignmentRoleSchema = z.enum([
  'ac',
  'producer',
  'fixer',
  'coordinator',
  'backup',
]);

export const assignmentStatusSchema = z.enum([
  'assigned',
  'confirmed',
  'completed',
  'cancelled',
]);

export const contractStatusSchema = z.enum([
  'signed',
  'pending',
  'offer_sent',
  'dnc',
  'email_sent',
  'declined',
]);

export const paymentTypeSchema = z.enum(['daily', 'flat']);

export const availabilityStatusSchema = z.enum([
  'available',
  'ooo',
  'dark',
  'holding',
  'booked',
]);

export const uploadStatusSchema = z.enum([
  'pending',
  'in_progress',
  'complete',
  'cancelled',
]);

// ============================================
// Production Schemas
// ============================================

export const createProductionSchema = z.object({
  universeId: z.string().uuid('Invalid universe ID'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .trim(),
  season: z.string().max(50).trim().optional(),
  status: productionStatusSchema.optional().default('active'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().max(5000).trim().optional(),
});

export const updateProductionSchema = z
  .object({
    name: z.string().min(1).max(200).trim().optional(),
    season: z.string().max(50).trim().optional().nullable(),
    status: productionStatusSchema.optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    notes: z.string().max(5000).trim().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listProductionsQuerySchema = z.object({
  universeId: z.string().uuid('Invalid universe ID').optional(),
  status: productionStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================
// Crew Member Schemas
// ============================================

export const createCrewMemberSchema = z.object({
  productionId: z.string().uuid('Invalid production ID'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .trim(),
  role: crewRoleSchema,
  contactEmail: z.string().email('Invalid email').optional(),
  contactPhone: z.string().max(30).trim().optional(),
});

export const updateCrewMemberSchema = z
  .object({
    name: z.string().min(1).max(200).trim().optional(),
    role: crewRoleSchema.optional(),
    contactEmail: z.string().email().optional().nullable(),
    contactPhone: z.string().max(30).trim().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listCrewQuerySchema = z.object({
  productionId: z.string().uuid('Invalid production ID'),
  role: crewRoleSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================
// Scene Schemas
// ============================================

export const createProdSceneSchema = z.object({
  productionId: z.string().uuid('Invalid production ID'),
  sceneNumber: z.string().max(20).trim().optional(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less')
    .trim(),
  description: z.string().max(5000).trim().optional(),
  castEntityIds: z.array(z.string()).optional().default([]),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().max(50).trim().optional(),
  location: z.string().max(300).trim().optional(),
  locationDetails: z.string().max(500).trim().optional(),
  status: prodSceneStatusSchema.optional().default('scheduled'),
  equipmentNotes: z.string().max(500).trim().optional(),
  isSelfShot: z.boolean().optional().default(false),
});

export const updateProdSceneSchema = z
  .object({
    sceneNumber: z.string().max(20).trim().optional().nullable(),
    title: z.string().min(1).max(500).trim().optional(),
    description: z.string().max(5000).trim().optional().nullable(),
    castEntityIds: z.array(z.string()).optional(),
    scheduledDate: z.string().optional().nullable(),
    scheduledTime: z.string().max(50).trim().optional().nullable(),
    location: z.string().max(300).trim().optional().nullable(),
    locationDetails: z.string().max(500).trim().optional().nullable(),
    status: prodSceneStatusSchema.optional(),
    equipmentNotes: z.string().max(500).trim().optional().nullable(),
    isSelfShot: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listScenesQuerySchema = z.object({
  productionId: z.string().uuid('Invalid production ID'),
  status: prodSceneStatusSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  castEntityId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================
// Scene Assignment Schemas
// ============================================

export const createSceneAssignmentSchema = z.object({
  sceneId: z.string().uuid('Invalid scene ID'),
  crewMemberId: z.string().uuid('Invalid crew member ID'),
  role: assignmentRoleSchema.optional().default('ac'),
  notes: z.string().max(500).trim().optional(),
});

export const updateSceneAssignmentSchema = z
  .object({
    role: assignmentRoleSchema.optional(),
    notes: z.string().max(500).trim().optional().nullable(),
    status: assignmentStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// ============================================
// Cast Contract Schemas
// ============================================

export const createCastContractSchema = z.object({
  productionId: z.string().uuid('Invalid production ID'),
  castEntityId: z.string().min(1, 'Cast entity ID is required'),
  contractStatus: contractStatusSchema.optional().default('pending'),
  paymentType: paymentTypeSchema.optional(),
  notes: z.string().max(1000).trim().optional(),
});

export const updateCastContractSchema = z
  .object({
    contractStatus: contractStatusSchema.optional(),
    paymentType: paymentTypeSchema.optional().nullable(),
    shootDone: z.boolean().optional(),
    interviewDone: z.boolean().optional(),
    pickupDone: z.boolean().optional(),
    paymentDone: z.boolean().optional(),
    notes: z.string().max(1000).trim().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listCastContractsQuerySchema = z.object({
  productionId: z.string().uuid('Invalid production ID'),
  contractStatus: contractStatusSchema.optional(),
  incomplete: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================
// Crew Availability Schemas
// ============================================

export const createCrewAvailabilitySchema = z.object({
  crewMemberId: z.string().uuid('Invalid crew member ID'),
  date: z.string().min(1, 'Date is required'),
  status: availabilityStatusSchema.optional().default('available'),
  notes: z.string().max(500).trim().optional(),
});

export const updateCrewAvailabilitySchema = z
  .object({
    status: availabilityStatusSchema.optional(),
    notes: z.string().max(500).trim().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listCrewAvailabilityQuerySchema = z.object({
  crewMemberId: z.string().uuid('Invalid crew member ID').optional(),
  productionId: z.string().uuid('Invalid production ID').optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: availabilityStatusSchema.optional(),
});

// ============================================
// Upload Task Schemas
// ============================================

export const createUploadTaskSchema = z.object({
  sceneId: z.string().uuid('Invalid scene ID'),
  crewMemberId: z.string().uuid('Invalid crew member ID').optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().max(50).trim().optional(),
  notes: z.string().max(500).trim().optional(),
});

export const updateUploadTaskSchema = z
  .object({
    crewMemberId: z.string().uuid().optional().nullable(),
    scheduledDate: z.string().optional().nullable(),
    scheduledTime: z.string().max(50).trim().optional().nullable(),
    status: uploadStatusSchema.optional(),
    notes: z.string().max(500).trim().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// ============================================
// Shared ID Schemas
// ============================================

export const productionIdSchema = z.object({
  id: z.string().uuid('Invalid production ID'),
});

export const sceneIdSchema = z.object({
  id: z.string().uuid('Invalid scene ID'),
});

export const crewMemberIdSchema = z.object({
  id: z.string().uuid('Invalid crew member ID'),
});

export const castContractIdSchema = z.object({
  id: z.string().uuid('Invalid cast contract ID'),
});

export const crewAvailabilityIdSchema = z.object({
  id: z.string().uuid('Invalid crew availability ID'),
});

export const uploadTaskIdSchema = z.object({
  id: z.string().uuid('Invalid upload task ID'),
});
