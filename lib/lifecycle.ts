/**
 * Lifecycle Engine Database Operations
 *
 * PostgreSQL operations for managing asset types, lifecycle stages,
 * asset instances, and stage transitions in Supabase.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { slugify } from './utils';
import type {
  AssetType,
  AssetTypeWithStages,
  LifecycleStage,
  AssetInstance,
  AssetInstanceWithStage,
  StageTransition,
  StageTransitionWithNames,
  LifecycleSummary,
  CreateAssetTypeInput,
  UpdateAssetTypeInput,
  CreateLifecycleStageInput,
  CreateAssetInstanceInput,
  UpdateAssetInstanceInput,
  AdvanceStageInput,
  PaginatedResponse,
} from '@/types';

// Lazy-initialize Supabase client to avoid build-time errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: SupabaseClient<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): SupabaseClient<any> {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    _supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return _supabase;
}

// ============================================
// Row Mappers (snake_case -> camelCase)
// ============================================

function parseAssetTypeFromDb(row: Record<string, unknown>): AssetType {
  return {
    id: row.id as string,
    productionId: row.production_id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string | null,
    icon: row.icon as string | null,
    sourceTable: row.source_table as string | null,
    color: row.color as string,
    sortOrder: row.sort_order as number,
    isDefault: row.is_default as boolean,
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function parseLifecycleStageFromDb(row: Record<string, unknown>): LifecycleStage {
  return {
    id: row.id as string,
    assetTypeId: row.asset_type_id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string | null,
    stageOrder: row.stage_order as number,
    isInitial: row.is_initial as boolean,
    isTerminal: row.is_terminal as boolean,
    color: row.color as string,
    bgColor: row.bg_color as string | null,
    autoAdvanceAfterDays: row.auto_advance_after_days as number | null,
    requiresConfirmation: row.requires_confirmation as boolean,
    createdAt: new Date(row.created_at as string),
  };
}

function parseAssetInstanceFromDb(row: Record<string, unknown>): AssetInstance {
  return {
    id: row.id as string,
    productionId: row.production_id as string,
    assetTypeId: row.asset_type_id as string,
    name: row.name as string,
    description: row.description as string | null,
    currentStageId: row.current_stage_id as string,
    stageEnteredAt: new Date(row.stage_entered_at as string),
    ownerId: row.owner_id as string | null,
    ownerName: row.owner_name as string | null,
    sourceType: row.source_type as string | null,
    sourceId: row.source_id as string | null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    blockedBy: row.blocked_by as string | null,
    isBlocked: row.is_blocked as boolean,
    priority: row.priority as number,
    dueDate: row.due_date as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
  };
}

function parseStageTransitionFromDb(row: Record<string, unknown>): StageTransition {
  return {
    id: row.id as string,
    assetInstanceId: row.asset_instance_id as string,
    fromStageId: row.from_stage_id as string | null,
    toStageId: row.to_stage_id as string,
    transitionedBy: row.transitioned_by as string | null,
    transitionedByName: row.transitioned_by_name as string | null,
    reason: row.reason as string | null,
    automated: row.automated as boolean,
    transitionedAt: new Date(row.transitioned_at as string),
  };
}

// ============================================
// Asset Type Operations
// ============================================

/**
 * List asset types for a production
 */
export async function listAssetTypes(
  productionId: string,
  options: { includeInactive?: boolean } = {}
): Promise<PaginatedResponse<AssetType>> {
  const { includeInactive = false } = options;

  let query = getSupabase()
    .from('asset_types')
    .select('*', { count: 'exact' })
    .eq('production_id', productionId);

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  query = query.order('sort_order', { ascending: true });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list asset types: ${error.message}`);
  }

  const items = (data || []).map(parseAssetTypeFromDb);
  const total = count || 0;

  return {
    items,
    total,
    page: 1,
    pageSize: total,
    hasMore: false,
  };
}

/**
 * Get an asset type by ID
 */
export async function getAssetType(id: string): Promise<AssetType | null> {
  const { data, error } = await getSupabase()
    .from('asset_types')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get asset type: ${error.message}`);
  }

  return parseAssetTypeFromDb(data);
}

/**
 * Create a new asset type
 */
export async function createAssetType(input: CreateAssetTypeInput): Promise<AssetType> {
  const slug = input.slug || slugify(input.name);

  const { data, error } = await getSupabase()
    .from('asset_types')
    .insert({
      production_id: input.productionId,
      name: input.name,
      slug,
      description: input.description || null,
      icon: input.icon || null,
      source_table: input.sourceTable || null,
      color: input.color || '#6B7280',
      sort_order: input.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create asset type: ${error.message}`);
  }

  return parseAssetTypeFromDb(data);
}

/**
 * Update an asset type
 */
export async function updateAssetType(
  id: string,
  input: UpdateAssetTypeInput
): Promise<AssetType> {
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.icon !== undefined) updates.icon = input.icon;
  if (input.color !== undefined) updates.color = input.color;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  const { data, error } = await getSupabase()
    .from('asset_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Asset type not found');
    }
    throw new Error(`Failed to update asset type: ${error.message}`);
  }

  return parseAssetTypeFromDb(data);
}

/**
 * Get an asset type with its ordered lifecycle stages
 */
export async function getAssetTypeWithStages(
  id: string
): Promise<AssetTypeWithStages | null> {
  const assetType = await getAssetType(id);
  if (!assetType) return null;

  const stages = await listLifecycleStages(id);

  return {
    ...assetType,
    stages,
  };
}

// ============================================
// Lifecycle Stage Operations
// ============================================

/**
 * List lifecycle stages for an asset type, ordered by stage_order
 */
export async function listLifecycleStages(
  assetTypeId: string
): Promise<LifecycleStage[]> {
  const { data, error } = await getSupabase()
    .from('lifecycle_stages')
    .select('*')
    .eq('asset_type_id', assetTypeId)
    .order('stage_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to list lifecycle stages: ${error.message}`);
  }

  return (data || []).map(parseLifecycleStageFromDb);
}

/**
 * Create a new lifecycle stage
 */
export async function createLifecycleStage(
  input: CreateLifecycleStageInput
): Promise<LifecycleStage> {
  const slug = input.slug || slugify(input.name);

  const { data, error } = await getSupabase()
    .from('lifecycle_stages')
    .insert({
      asset_type_id: input.assetTypeId,
      name: input.name,
      slug,
      description: input.description || null,
      stage_order: input.stageOrder,
      is_initial: input.isInitial ?? false,
      is_terminal: input.isTerminal ?? false,
      color: input.color || '#6B7280',
      bg_color: input.bgColor || null,
      auto_advance_after_days: input.autoAdvanceAfterDays || null,
      requires_confirmation: input.requiresConfirmation ?? false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lifecycle stage: ${error.message}`);
  }

  return parseLifecycleStageFromDb(data);
}

// ============================================
// Asset Instance Operations
// ============================================

/**
 * List asset instances for a production with filtering and pagination
 */
export async function listAssetInstances(
  productionId: string,
  options: {
    assetTypeId?: string;
    stageId?: string;
    isBlocked?: boolean;
    sourceType?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<PaginatedResponse<AssetInstance>> {
  const { assetTypeId, stageId, isBlocked, sourceType, limit = 100, offset = 0 } = options;

  let query = getSupabase()
    .from('asset_instances')
    .select('*', { count: 'exact' })
    .eq('production_id', productionId);

  if (assetTypeId) {
    query = query.eq('asset_type_id', assetTypeId);
  }
  if (stageId) {
    query = query.eq('current_stage_id', stageId);
  }
  if (isBlocked !== undefined) {
    query = query.eq('is_blocked', isBlocked);
  }
  if (sourceType) {
    query = query.eq('source_type', sourceType);
  }

  query = query
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list asset instances: ${error.message}`);
  }

  const items = (data || []).map(parseAssetInstanceFromDb);
  const total = count || 0;

  return {
    items,
    total,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    hasMore: offset + items.length < total,
  };
}

/**
 * Get an asset instance by ID with current stage and asset type populated
 */
export async function getAssetInstance(
  id: string
): Promise<AssetInstanceWithStage | null> {
  const { data, error } = await getSupabase()
    .from('asset_instances')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get asset instance: ${error.message}`);
  }

  const instance = parseAssetInstanceFromDb(data);

  // Fetch current stage
  const { data: stageData, error: stageError } = await getSupabase()
    .from('lifecycle_stages')
    .select('*')
    .eq('id', instance.currentStageId)
    .single();

  if (stageError) {
    throw new Error(`Failed to get current stage: ${stageError.message}`);
  }

  // Fetch asset type
  const { data: typeData, error: typeError } = await getSupabase()
    .from('asset_types')
    .select('*')
    .eq('id', instance.assetTypeId)
    .single();

  if (typeError) {
    throw new Error(`Failed to get asset type: ${typeError.message}`);
  }

  return {
    ...instance,
    currentStage: parseLifecycleStageFromDb(stageData),
    assetType: parseAssetTypeFromDb(typeData),
  };
}

/**
 * Create a new asset instance and its initial stage transition
 */
export async function createAssetInstance(
  input: CreateAssetInstanceInput
): Promise<AssetInstance> {
  const now = new Date().toISOString();

  const { data, error } = await getSupabase()
    .from('asset_instances')
    .insert({
      production_id: input.productionId,
      asset_type_id: input.assetTypeId,
      name: input.name,
      description: input.description || null,
      current_stage_id: input.currentStageId,
      stage_entered_at: now,
      owner_name: input.ownerName || null,
      source_type: input.sourceType || null,
      source_id: input.sourceId || null,
      metadata: input.metadata || {},
      priority: input.priority ?? 1,
      due_date: input.dueDate || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create asset instance: ${error.message}`);
  }

  const instance = parseAssetInstanceFromDb(data);

  // Create initial stage transition record
  const { error: transitionError } = await getSupabase()
    .from('stage_transitions')
    .insert({
      asset_instance_id: instance.id,
      from_stage_id: null,
      to_stage_id: input.currentStageId,
      transitioned_by_name: input.ownerName || null,
      reason: 'Initial creation',
      automated: false,
      transitioned_at: now,
    });

  if (transitionError) {
    console.error('Failed to create initial transition:', transitionError.message);
  }

  return instance;
}

/**
 * Update an asset instance
 */
export async function updateAssetInstance(
  id: string,
  input: UpdateAssetInstanceInput
): Promise<AssetInstance> {
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.ownerName !== undefined) updates.owner_name = input.ownerName;
  if (input.blockedBy !== undefined) updates.blocked_by = input.blockedBy;
  if (input.isBlocked !== undefined) updates.is_blocked = input.isBlocked;
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.dueDate !== undefined) updates.due_date = input.dueDate;
  if (input.metadata !== undefined) updates.metadata = input.metadata;

  const { data, error } = await getSupabase()
    .from('asset_instances')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Asset instance not found');
    }
    throw new Error(`Failed to update asset instance: ${error.message}`);
  }

  return parseAssetInstanceFromDb(data);
}

/**
 * Advance an asset instance to a new stage
 *
 * 1. Check allowed_transitions — if populated, validate transition is allowed
 * 2. If not populated, allow any transition (flexible mode)
 * 3. Create a stage_transitions record
 * 4. Update asset_instances.current_stage_id and stage_entered_at
 * 5. If the target stage is_terminal, set completed_at
 */
export async function advanceStage(
  instanceId: string,
  input: AdvanceStageInput
): Promise<AssetInstance> {
  // Get the current instance
  const { data: instanceData, error: instanceError } = await getSupabase()
    .from('asset_instances')
    .select('*')
    .eq('id', instanceId)
    .single();

  if (instanceError) {
    if (instanceError.code === 'PGRST116') {
      throw new Error('Asset instance not found');
    }
    throw new Error(`Failed to get asset instance: ${instanceError.message}`);
  }

  const currentStageId = instanceData.current_stage_id as string;
  const assetTypeId = instanceData.asset_type_id as string;

  // Check if allowed_transitions are defined for this asset type
  const { data: allowedTransitions, error: atError } = await getSupabase()
    .from('allowed_transitions')
    .select('*')
    .eq('asset_type_id', assetTypeId);

  if (atError) {
    throw new Error(`Failed to check allowed transitions: ${atError.message}`);
  }

  // If transitions are defined, validate this one is allowed
  if (allowedTransitions && allowedTransitions.length > 0) {
    const isAllowed = allowedTransitions.some(
      (t: Record<string, unknown>) =>
        t.from_stage_id === currentStageId && t.to_stage_id === input.toStageId
    );

    if (!isAllowed) {
      throw new Error(
        'Transition not allowed: no matching rule in allowed_transitions'
      );
    }
  }

  // Check if target stage is terminal
  const { data: targetStage, error: stageError } = await getSupabase()
    .from('lifecycle_stages')
    .select('is_terminal')
    .eq('id', input.toStageId)
    .single();

  if (stageError) {
    throw new Error(`Failed to get target stage: ${stageError.message}`);
  }

  const now = new Date().toISOString();
  const isTerminal = targetStage.is_terminal as boolean;

  // Update the asset instance
  const updatePayload: Record<string, unknown> = {
    current_stage_id: input.toStageId,
    stage_entered_at: now,
  };

  if (isTerminal) {
    updatePayload.completed_at = now;
  }

  const { data: updatedData, error: updateError } = await getSupabase()
    .from('asset_instances')
    .update(updatePayload)
    .eq('id', instanceId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to advance stage: ${updateError.message}`);
  }

  // Create transition record
  const { error: transitionError } = await getSupabase()
    .from('stage_transitions')
    .insert({
      asset_instance_id: instanceId,
      from_stage_id: currentStageId,
      to_stage_id: input.toStageId,
      transitioned_by_name: input.transitionedByName || null,
      reason: input.reason || null,
      automated: input.automated ?? false,
      transitioned_at: now,
    });

  if (transitionError) {
    console.error('Failed to create transition record:', transitionError.message);
  }

  return parseAssetInstanceFromDb(updatedData);
}

/**
 * Delete an asset instance
 */
export async function deleteAssetInstance(id: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('asset_instances')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete asset instance: ${error.message}`);
  }

  return true;
}

// ============================================
// Transition History
// ============================================

/**
 * Get the full transition history for an asset instance with stage names
 */
export async function getTransitionHistory(
  instanceId: string
): Promise<StageTransitionWithNames[]> {
  const { data, error } = await getSupabase()
    .from('stage_transitions')
    .select('*')
    .eq('asset_instance_id', instanceId)
    .order('transitioned_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get transition history: ${error.message}`);
  }

  if (!data || data.length === 0) return [];

  // Collect all unique stage IDs for name lookup
  const stageIds = new Set<string>();
  for (const row of data) {
    if (row.from_stage_id) stageIds.add(row.from_stage_id as string);
    stageIds.add(row.to_stage_id as string);
  }

  // Fetch stage names
  const { data: stages, error: stagesError } = await getSupabase()
    .from('lifecycle_stages')
    .select('id, name')
    .in('id', Array.from(stageIds));

  if (stagesError) {
    throw new Error(`Failed to get stage names: ${stagesError.message}`);
  }

  const stageNameMap = new Map<string, string>();
  for (const s of stages || []) {
    stageNameMap.set(s.id as string, s.name as string);
  }

  return data.map((row) => {
    const transition = parseStageTransitionFromDb(row);
    return {
      ...transition,
      fromStageName: transition.fromStageId
        ? stageNameMap.get(transition.fromStageId) || null
        : null,
      toStageName: stageNameMap.get(transition.toStageId) || transition.toStageId,
    };
  });
}

// ============================================
// Lifecycle Summary
// ============================================

/**
 * Get lifecycle summary: counts per stage per asset type for a production
 */
export async function getLifecycleSummary(
  productionId: string
): Promise<LifecycleSummary[]> {
  // Get all active asset types for the production
  const { data: assetTypes, error: atError } = await getSupabase()
    .from('asset_types')
    .select('*')
    .eq('production_id', productionId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (atError) {
    throw new Error(`Failed to get asset types: ${atError.message}`);
  }

  if (!assetTypes || assetTypes.length === 0) return [];

  const parsedTypes = assetTypes.map(parseAssetTypeFromDb);
  const typeIds = parsedTypes.map((t) => t.id);

  // Bulk fetch stages + instances for all types in 2 queries (not 2N)
  const [{ data: allStageRows, error: stageError }, { data: allInstanceRows, error: instError }] =
    await Promise.all([
      getSupabase()
        .from('lifecycle_stages')
        .select('*')
        .in('asset_type_id', typeIds)
        .order('stage_order', { ascending: true }),
      getSupabase()
        .from('asset_instances')
        .select('current_stage_id, is_blocked, completed_at, due_date, asset_type_id')
        .eq('production_id', productionId)
        .in('asset_type_id', typeIds),
    ]);

  if (stageError) throw new Error(`Failed to get stages: ${stageError.message}`);
  if (instError) throw new Error(`Failed to get instances: ${instError.message}`);

  // Group by asset_type_id in memory
  const stagesByType = new Map<string, ReturnType<typeof parseLifecycleStageFromDb>[]>();
  for (const row of allStageRows || []) {
    const stage = parseLifecycleStageFromDb(row);
    const list = stagesByType.get(stage.assetTypeId) || [];
    list.push(stage);
    stagesByType.set(stage.assetTypeId, list);
  }

  const instancesByType = new Map<string, Array<Record<string, unknown>>>();
  for (const row of allInstanceRows || []) {
    const typeId = row.asset_type_id as string;
    const list = instancesByType.get(typeId) || [];
    list.push(row);
    instancesByType.set(typeId, list);
  }

  const now = new Date();
  const summaries: LifecycleSummary[] = [];

  for (const assetType of parsedTypes) {
    const stages = stagesByType.get(assetType.id) || [];
    const instanceList = instancesByType.get(assetType.id) || [];

    const stageSummaries = stages.map((stage) => {
      const stageInstances = instanceList.filter(
        (i) => i.current_stage_id === stage.id
      );
      const blocked = stageInstances.filter(
        (i) => i.is_blocked === true
      ).length;
      const overdue = stageInstances.filter((i) => {
        if (!i.due_date) return false;
        return new Date(i.due_date as string) < now && !i.completed_at;
      }).length;

      return {
        stage,
        count: stageInstances.length,
        blocked,
        overdue,
      };
    });

    const completed = instanceList.filter(
      (i) => i.completed_at !== null
    ).length;

    summaries.push({
      assetType,
      stages: stageSummaries,
      total: instanceList.length,
      completed,
    });
  }

  return summaries;
}
