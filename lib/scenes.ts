/**
 * Scene Database Operations
 *
 * PostgreSQL operations for managing production scenes in Supabase.
 * Scenes represent individual filming segments within a production.
 *
 * Note: Types are prefixed as ProdScene to avoid collision with chat types.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  ProdScene,
  CreateProdSceneInput,
  UpdateProdSceneInput,
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

/**
 * Convert database row to ProdScene type
 */
function parseSceneFromDb(row: Record<string, unknown>): ProdScene {
  return {
    id: row.id as string,
    productionId: row.production_id as string,
    sceneNumber: row.scene_number as string | null,
    title: row.title as string,
    description: row.description as string | null,
    castEntityIds: (row.cast_entity_ids as string[]) || [],
    scheduledDate: row.scheduled_date as string | null,
    scheduledTime: row.scheduled_time as string | null,
    location: row.location as string | null,
    locationDetails: row.location_details as string | null,
    status: row.status as ProdScene['status'],
    equipmentNotes: row.equipment_notes as string | null,
    isSelfShot: row.is_self_shot as boolean,
    episodeId: (row.episode_id as string | null) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

// ============================================
// Scene CRUD Operations
// ============================================

/**
 * Create a new scene
 */
export async function createScene(
  input: CreateProdSceneInput
): Promise<ProdScene> {
  const { data, error } = await getSupabase()
    .from('scenes')
    .insert({
      production_id: input.productionId,
      scene_number: input.sceneNumber || null,
      title: input.title,
      description: input.description || null,
      cast_entity_ids: input.castEntityIds || [],
      scheduled_date: input.scheduledDate || null,
      scheduled_time: input.scheduledTime || null,
      location: input.location || null,
      location_details: input.locationDetails || null,
      status: input.status || 'scheduled',
      equipment_notes: input.equipmentNotes || null,
      is_self_shot: input.isSelfShot || false,
      episode_id: input.episodeId || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create scene: ${error.message}`);
  }

  return parseSceneFromDb(data);
}

/**
 * Get a scene by ID
 */
export async function getScene(id: string): Promise<ProdScene | null> {
  const { data, error } = await getSupabase()
    .from('scenes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get scene: ${error.message}`);
  }

  return parseSceneFromDb(data);
}

/**
 * List scenes for a production with pagination and date range filters
 */
export async function listScenes(
  productionId: string,
  options: {
    status?: ProdScene['status'];
    startDate?: string;
    endDate?: string;
    castEntityId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<PaginatedResponse<ProdScene>> {
  const { status, startDate, endDate, castEntityId, limit = 100, offset = 0 } = options;

  let query = getSupabase()
    .from('scenes')
    .select('*', { count: 'exact' })
    .eq('production_id', productionId);

  if (status) {
    query = query.eq('status', status);
  }

  if (startDate) {
    query = query.gte('scheduled_date', startDate);
  }

  if (endDate) {
    query = query.lte('scheduled_date', endDate);
  }

  if (castEntityId) {
    query = query.contains('cast_entity_ids', [castEntityId]);
  }

  query = query
    .order('scheduled_date', { ascending: true, nullsFirst: false })
    .order('scheduled_time', { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list scenes: ${error.message}`);
  }

  const items = (data || []).map(parseSceneFromDb);
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
 * Update a scene
 */
export async function updateScene(
  id: string,
  input: UpdateProdSceneInput
): Promise<ProdScene | null> {
  const updates: Record<string, unknown> = {};

  if (input.sceneNumber !== undefined) updates.scene_number = input.sceneNumber;
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.castEntityIds !== undefined) updates.cast_entity_ids = input.castEntityIds;
  if (input.scheduledDate !== undefined) updates.scheduled_date = input.scheduledDate;
  if (input.scheduledTime !== undefined) updates.scheduled_time = input.scheduledTime;
  if (input.location !== undefined) updates.location = input.location;
  if (input.locationDetails !== undefined) updates.location_details = input.locationDetails;
  if (input.status !== undefined) updates.status = input.status;
  if (input.equipmentNotes !== undefined) updates.equipment_notes = input.equipmentNotes;
  if (input.isSelfShot !== undefined) updates.is_self_shot = input.isSelfShot;
  if (input.episodeId !== undefined) updates.episode_id = input.episodeId;

  const { data, error } = await getSupabase()
    .from('scenes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to update scene: ${error.message}`);
  }

  return parseSceneFromDb(data);
}

/**
 * Delete a scene
 */
export async function deleteScene(id: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('scenes')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete scene: ${error.message}`);
  }

  return true;
}
