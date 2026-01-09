/**
 * Storyline Database Operations
 *
 * PostgreSQL operations for managing storylines in Supabase.
 * Storylines are long-form narratives for couples/story arcs in the Living Universe.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Storyline,
  StorylineWithCast,
  CreateStorylineInput,
  UpdateStorylineInput,
  StorylineUpdate,
  CreateStorylineUpdateInput,
  StorylineSearchResult,
  PaginatedResponse,
} from '@/types';
import { getEntitiesByIds } from './entities';

// Lazy-initialize Supabase client to avoid build-time errors
// Note: Using untyped client since storylines table isn't in generated types yet
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
 * Generate a URL-friendly slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Convert database row to Storyline type
 */
function parseStorylineFromDb(row: Record<string, unknown>): Storyline {
  return {
    id: row.id as string,
    universeId: row.universe_id as string,
    title: row.title as string,
    slug: row.slug as string,
    synopsis: row.synopsis as string | null,
    narrative: row.narrative as string | null,
    primaryCast: (row.primary_cast as string[]) || [],
    supportingCast: (row.supporting_cast as string[]) || [],
    status: row.status as Storyline['status'],
    season: row.season as string | null,
    episodeRange: row.episode_range as string | null,
    tags: (row.tags as string[]) || [],
    lastEnrichedAt: row.last_enriched_at ? new Date(row.last_enriched_at as string) : null,
    enrichmentSources: (row.enrichment_sources as Storyline['enrichmentSources']) || [],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    createdBy: row.created_by as string | null,
    updatedBy: row.updated_by as string | null,
  };
}

/**
 * Convert database row to StorylineUpdate type
 */
function parseStorylineUpdateFromDb(row: Record<string, unknown>): StorylineUpdate {
  return {
    id: row.id as string,
    storylineId: row.storyline_id as string,
    updateType: row.update_type as StorylineUpdate['updateType'],
    sourceUrl: row.source_url as string | null,
    sourceName: row.source_name as string | null,
    title: row.title as string | null,
    content: row.content as string,
    summary: row.summary as string | null,
    confidenceScore: row.confidence_score as number | null,
    processedAt: row.processed_at ? new Date(row.processed_at as string) : null,
    includedInDigest: row.included_in_digest as boolean,
    publishedAt: row.published_at ? new Date(row.published_at as string) : null,
    createdAt: new Date(row.created_at as string),
  };
}

// ============================================
// Storyline CRUD Operations
// ============================================

/**
 * Create a new storyline
 */
export async function createStoryline(
  input: CreateStorylineInput,
  userId?: string
): Promise<Storyline> {
  const slug = input.slug || generateSlug(input.title);

  const { data, error } = await getSupabase()
    .from('storylines')
    .insert({
      universe_id: input.universeId,
      title: input.title,
      slug,
      synopsis: input.synopsis || null,
      narrative: input.narrative || null,
      primary_cast: input.primaryCast || [],
      supporting_cast: input.supportingCast || [],
      status: input.status || 'active',
      season: input.season || null,
      episode_range: input.episodeRange || null,
      tags: input.tags || [],
      created_by: userId || null,
      updated_by: userId || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create storyline: ${error.message}`);
  }

  return parseStorylineFromDb(data);
}

/**
 * Get a storyline by ID
 */
export async function getStoryline(id: string): Promise<Storyline | null> {
  const { data, error } = await getSupabase()
    .from('storylines')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get storyline: ${error.message}`);
  }

  return parseStorylineFromDb(data);
}

/**
 * Get a storyline with populated cast entities
 */
export async function getStorylineWithCast(id: string): Promise<StorylineWithCast | null> {
  const storyline = await getStoryline(id);
  if (!storyline) return null;

  // Fetch cast entities from Neo4j
  const allCastIds = [...storyline.primaryCast, ...storyline.supportingCast];
  const castEntities = allCastIds.length > 0 ? await getEntitiesByIds(allCastIds) : [];

  // Split into primary and supporting
  const primaryCastEntities = castEntities.filter((e) =>
    storyline.primaryCast.includes(e.id)
  );
  const supportingCastEntities = castEntities.filter((e) =>
    storyline.supportingCast.includes(e.id)
  );

  return {
    ...storyline,
    primaryCastEntities,
    supportingCastEntities,
  };
}

/**
 * Get a storyline by slug within a universe
 */
export async function getStorylineBySlug(
  universeId: string,
  slug: string
): Promise<Storyline | null> {
  const { data, error } = await getSupabase()
    .from('storylines')
    .select('*')
    .eq('universe_id', universeId)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get storyline: ${error.message}`);
  }

  return parseStorylineFromDb(data);
}

/**
 * List storylines for a universe with pagination
 */
export async function listStorylines(
  universeId: string,
  options: {
    status?: Storyline['status'];
    season?: string;
    castEntityId?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'title' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<PaginatedResponse<Storyline>> {
  const {
    status,
    season,
    castEntityId,
    limit = 50,
    offset = 0,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = options;

  // Build query
  let query = getSupabase()
    .from('storylines')
    .select('*', { count: 'exact' })
    .eq('universe_id', universeId);

  if (status) {
    query = query.eq('status', status);
  }

  if (season) {
    query = query.eq('season', season);
  }

  if (castEntityId) {
    // Filter by cast member (in either primary or supporting)
    query = query.or(
      `primary_cast.cs.["${castEntityId}"],supporting_cast.cs.["${castEntityId}"]`
    );
  }

  // Map sortBy to database column names
  const sortColumn = {
    title: 'title',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }[sortBy];

  query = query
    .order(sortColumn, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list storylines: ${error.message}`);
  }

  const items = (data || []).map(parseStorylineFromDb);
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
 * Update a storyline
 */
export async function updateStoryline(
  id: string,
  input: UpdateStorylineInput,
  userId?: string
): Promise<Storyline | null> {
  // Build update object with only provided fields
  const updates: Record<string, unknown> = {
    updated_by: userId || null,
  };

  if (input.title !== undefined) updates.title = input.title;
  if (input.slug !== undefined) updates.slug = input.slug;
  if (input.synopsis !== undefined) updates.synopsis = input.synopsis;
  if (input.narrative !== undefined) updates.narrative = input.narrative;
  if (input.primaryCast !== undefined) updates.primary_cast = input.primaryCast;
  if (input.supportingCast !== undefined) updates.supporting_cast = input.supportingCast;
  if (input.status !== undefined) updates.status = input.status;
  if (input.season !== undefined) updates.season = input.season;
  if (input.episodeRange !== undefined) updates.episode_range = input.episodeRange;
  if (input.tags !== undefined) updates.tags = input.tags;

  const { data, error } = await getSupabase()
    .from('storylines')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to update storyline: ${error.message}`);
  }

  return parseStorylineFromDb(data);
}

/**
 * Delete a storyline
 */
export async function deleteStoryline(id: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('storylines')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete storyline: ${error.message}`);
  }

  return true;
}

// ============================================
// Search Operations
// ============================================

/**
 * Full-text search storylines
 */
export async function searchStorylines(
  universeId: string,
  query: string,
  limit = 10
): Promise<StorylineSearchResult[]> {
  // Use PostgreSQL full-text search
  const { data, error } = await getSupabase()
    .from('storylines')
    .select('id, title, synopsis, narrative, primary_cast')
    .eq('universe_id', universeId)
    .textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english',
    })
    .limit(limit);

  if (error) {
    console.error('Storyline search error:', error);
    return [];
  }

  return (data || []).map((row, index) => ({
    id: row.id,
    title: row.title,
    synopsis: row.synopsis,
    narrative: row.narrative,
    primaryCast: row.primary_cast || [],
    rank: index + 1, // Simple rank based on order
  }));
}

/**
 * Get storylines that contain a specific cast member
 */
export async function getStorylinesForEntity(
  entityId: string,
  limit = 20
): Promise<Storyline[]> {
  const { data, error } = await getSupabase()
    .from('storylines')
    .select('*')
    .or(
      `primary_cast.cs.["${entityId}"],supporting_cast.cs.["${entityId}"]`
    )
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get storylines for entity: ${error.message}`);
  }

  return (data || []).map(parseStorylineFromDb);
}

// ============================================
// Storyline Update Operations
// ============================================

/**
 * Create a storyline update (news, social media, etc.)
 */
export async function createStorylineUpdate(
  input: CreateStorylineUpdateInput
): Promise<StorylineUpdate> {
  const { data, error } = await getSupabase()
    .from('storyline_updates')
    .insert({
      storyline_id: input.storylineId,
      update_type: input.updateType,
      source_url: input.sourceUrl || null,
      source_name: input.sourceName || null,
      title: input.title || null,
      content: input.content,
      summary: input.summary || null,
      confidence_score: input.confidenceScore || null,
      published_at: input.publishedAt?.toISOString() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create storyline update: ${error.message}`);
  }

  return parseStorylineUpdateFromDb(data);
}

/**
 * Get updates for a storyline
 */
export async function getStorylineUpdates(
  storylineId: string,
  options: {
    updateType?: StorylineUpdate['updateType'];
    includedInDigest?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<PaginatedResponse<StorylineUpdate>> {
  const { updateType, includedInDigest, limit = 50, offset = 0 } = options;

  let query = getSupabase()
    .from('storyline_updates')
    .select('*', { count: 'exact' })
    .eq('storyline_id', storylineId);

  if (updateType) {
    query = query.eq('update_type', updateType);
  }

  if (includedInDigest !== undefined) {
    query = query.eq('included_in_digest', includedInDigest);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get storyline updates: ${error.message}`);
  }

  const items = (data || []).map(parseStorylineUpdateFromDb);
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
 * Get unprocessed updates for digest generation
 */
export async function getUnprocessedUpdates(
  universeId?: string,
  limit = 100
): Promise<StorylineUpdate[]> {
  // If universeId is specified, first get storyline IDs for that universe
  let storylineIds: string[] | undefined;

  if (universeId) {
    const { data: storylines } = await getSupabase()
      .from('storylines')
      .select('id')
      .eq('universe_id', universeId);

    storylineIds = storylines?.map((s) => s.id);
    if (!storylineIds || storylineIds.length === 0) {
      return [];
    }
  }

  let query = getSupabase()
    .from('storyline_updates')
    .select('*')
    .eq('included_in_digest', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (storylineIds) {
    query = query.in('storyline_id', storylineIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get unprocessed updates:', error);
    return [];
  }

  return (data || []).map(parseStorylineUpdateFromDb);
}

/**
 * Mark updates as included in digest
 */
export async function markUpdatesAsProcessed(updateIds: string[]): Promise<void> {
  if (updateIds.length === 0) return;

  const { error } = await getSupabase()
    .from('storyline_updates')
    .update({
      included_in_digest: true,
      processed_at: new Date().toISOString(),
    })
    .in('id', updateIds);

  if (error) {
    throw new Error(`Failed to mark updates as processed: ${error.message}`);
  }
}

// ============================================
// Enrichment Operations
// ============================================

/**
 * Update storyline enrichment status
 */
export async function updateEnrichmentStatus(
  storylineId: string,
  source: { type: 'web' | 'social' | 'manual'; name: string; url?: string }
): Promise<void> {
  const storyline = await getStoryline(storylineId);
  if (!storyline) return;

  const newSource = {
    ...source,
    enrichedAt: new Date().toISOString(),
  };

  const enrichmentSources = [...storyline.enrichmentSources, newSource];

  await getSupabase()
    .from('storylines')
    .update({
      last_enriched_at: new Date().toISOString(),
      enrichment_sources: enrichmentSources,
    })
    .eq('id', storylineId);
}

// ============================================
// Bulk Operations
// ============================================

/**
 * Create multiple storylines at once (for import)
 */
export async function createStorylinesBatch(
  inputs: CreateStorylineInput[],
  userId?: string
): Promise<{ created: Storyline[]; errors: { index: number; message: string }[] }> {
  const created: Storyline[] = [];
  const errors: { index: number; message: string }[] = [];

  for (let i = 0; i < inputs.length; i++) {
    try {
      const storyline = await createStoryline(inputs[i], userId);
      created.push(storyline);
    } catch (err) {
      errors.push({
        index: i,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return { created, errors };
}

/**
 * Get storylines that need enrichment (haven't been enriched in X hours)
 */
export async function getStorylinesNeedingEnrichment(
  universeId: string,
  hoursThreshold = 24,
  limit = 50
): Promise<Storyline[]> {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hoursThreshold);

  const { data, error } = await getSupabase()
    .from('storylines')
    .select('*')
    .eq('universe_id', universeId)
    .eq('status', 'active')
    .or(`last_enriched_at.is.null,last_enriched_at.lt.${cutoff.toISOString()}`)
    .order('last_enriched_at', { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get storylines needing enrichment: ${error.message}`);
  }

  return (data || []).map(parseStorylineFromDb);
}
