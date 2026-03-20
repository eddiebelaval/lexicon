/**
 * Episode Database Operations
 *
 * PostgreSQL operations for managing episodes in Supabase.
 * Links productions to episodes and scenes to episodes.
 */

import { getServiceSupabase } from './supabase';
import type {
  Episode,
  CreateEpisodeInput,
  UpdateEpisodeInput,
  PaginatedResponse,
} from '@/types';

/**
 * Convert database row to Episode type
 */
function parseEpisodeFromDb(row: Record<string, unknown>): Episode {
  return {
    id: row.id as string,
    productionId: row.production_id as string,
    episodeNumber: row.episode_number as number,
    title: row.title as string | null,
    description: row.description as string | null,
    airDate: row.air_date as string | null,
    premiereDate: row.premiere_date as string | null,
    status: row.status as Episode['status'],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Create a new episode
 */
export async function createEpisode(
  input: CreateEpisodeInput
): Promise<Episode> {
  const { data, error } = await getServiceSupabase()
    .from('episodes')
    .insert({
      production_id: input.productionId,
      episode_number: input.episodeNumber,
      title: input.title || null,
      description: input.description || null,
      air_date: input.airDate || null,
      premiere_date: input.premiereDate || null,
      status: input.status || 'planned',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create episode: ${error.message}`);
  }

  return parseEpisodeFromDb(data);
}

/**
 * Get an episode by ID
 */
export async function getEpisode(id: string): Promise<Episode | null> {
  const { data, error } = await getServiceSupabase()
    .from('episodes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get episode: ${error.message}`);
  }

  return parseEpisodeFromDb(data);
}

/**
 * List episodes for a production
 */
export async function listEpisodes(
  productionId: string,
  options: {
    status?: Episode['status'];
    limit?: number;
    offset?: number;
  } = {}
): Promise<PaginatedResponse<Episode>> {
  const { status, limit = 50, offset = 0 } = options;

  let query = getServiceSupabase()
    .from('episodes')
    .select('*', { count: 'exact' })
    .eq('production_id', productionId);

  if (status) {
    query = query.eq('status', status);
  }

  query = query
    .order('episode_number', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list episodes: ${error.message}`);
  }

  const items = (data || []).map(parseEpisodeFromDb);
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
 * Update an episode
 */
export async function updateEpisode(
  id: string,
  input: UpdateEpisodeInput
): Promise<Episode | null> {
  const updates: Record<string, unknown> = {};

  if (input.episodeNumber !== undefined) updates.episode_number = input.episodeNumber;
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.airDate !== undefined) updates.air_date = input.airDate;
  if (input.premiereDate !== undefined) updates.premiere_date = input.premiereDate;
  if (input.status !== undefined) updates.status = input.status;

  const { data, error } = await getServiceSupabase()
    .from('episodes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to update episode: ${error.message}`);
  }

  return parseEpisodeFromDb(data);
}

/**
 * Delete an episode
 */
export async function deleteEpisode(id: string): Promise<boolean> {
  const { error } = await getServiceSupabase()
    .from('episodes')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete episode: ${error.message}`);
  }

  return true;
}
