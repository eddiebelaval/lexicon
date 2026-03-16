/**
 * Lifecycle Engine Type Definitions
 *
 * Types for the asset lifecycle management system.
 * Every production asset moves through typed stages with
 * transitions, timestamps, owners, and blockers.
 */

// ============================================
// Asset Type
// ============================================

export interface AssetType {
  id: string;
  productionId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sourceTable: string | null;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetTypeInput {
  productionId: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sourceTable?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateAssetTypeInput {
  name?: string;
  description?: string | null;
  icon?: string | null;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================
// Lifecycle Stage
// ============================================

export interface LifecycleStage {
  id: string;
  assetTypeId: string;
  name: string;
  slug: string;
  description: string | null;
  stageOrder: number;
  isInitial: boolean;
  isTerminal: boolean;
  color: string;
  bgColor: string | null;
  autoAdvanceAfterDays: number | null;
  requiresConfirmation: boolean;
  createdAt: Date;
}

export interface CreateLifecycleStageInput {
  assetTypeId: string;
  name: string;
  slug?: string;
  description?: string;
  stageOrder: number;
  isInitial?: boolean;
  isTerminal?: boolean;
  color?: string;
  bgColor?: string;
  autoAdvanceAfterDays?: number;
  requiresConfirmation?: boolean;
}

export interface UpdateLifecycleStageInput {
  name?: string;
  description?: string | null;
  color?: string;
  bgColor?: string | null;
  autoAdvanceAfterDays?: number | null;
  requiresConfirmation?: boolean;
}

// ============================================
// Asset Instance
// ============================================

export interface AssetInstance {
  id: string;
  productionId: string;
  assetTypeId: string;
  name: string;
  description: string | null;
  currentStageId: string;
  stageEnteredAt: Date;
  ownerId: string | null;
  ownerName: string | null;
  sourceType: string | null;
  sourceId: string | null;
  metadata: Record<string, unknown>;
  blockedBy: string | null;
  isBlocked: boolean;
  priority: number;
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

/** Asset instance with its current stage and asset type info populated */
export interface AssetInstanceWithStage extends AssetInstance {
  currentStage: LifecycleStage;
  assetType: AssetType;
}

export interface CreateAssetInstanceInput {
  productionId: string;
  assetTypeId: string;
  name: string;
  description?: string;
  currentStageId: string;
  ownerName?: string;
  sourceType?: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
  priority?: number;
  dueDate?: string;
}

export interface UpdateAssetInstanceInput {
  name?: string;
  description?: string | null;
  ownerName?: string | null;
  blockedBy?: string | null;
  isBlocked?: boolean;
  priority?: number;
  dueDate?: string | null;
  metadata?: Record<string, unknown>;
}

// ============================================
// Stage Transition
// ============================================

export interface StageTransition {
  id: string;
  assetInstanceId: string;
  fromStageId: string | null;
  toStageId: string;
  transitionedBy: string | null;
  transitionedByName: string | null;
  reason: string | null;
  automated: boolean;
  transitionedAt: Date;
}

/** With stage names populated for display */
export interface StageTransitionWithNames extends StageTransition {
  fromStageName: string | null;
  toStageName: string;
}

export interface AdvanceStageInput {
  toStageId: string;
  reason?: string;
  transitionedByName?: string;
  automated?: boolean;
}

// ============================================
// Allowed Transition
// ============================================

export interface AllowedTransition {
  id: string;
  assetTypeId: string;
  fromStageId: string;
  toStageId: string;
}

// ============================================
// Composite Types (for UI)
// ============================================

/** Full lifecycle view: asset type with all its stages */
export interface AssetTypeWithStages extends AssetType {
  stages: LifecycleStage[];
}

/** Dashboard summary: counts per stage for an asset type */
export interface LifecycleSummary {
  assetType: AssetType;
  stages: {
    stage: LifecycleStage;
    count: number;
    blocked: number;
    overdue: number;
  }[];
  total: number;
  completed: number;
}
