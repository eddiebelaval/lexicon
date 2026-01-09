/**
 * Supabase Client Configuration
 *
 * PostgreSQL database client for user data and universe metadata.
 * Graph data (entities/relationships) stored in Neo4j.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type {
  Universe,
  CreateUniverseInput,
  ApiResponse,
  ApiError,
} from '@/types';

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Supabase client for browser-side operations
 * Uses anon key with RLS policies enforced
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Server-side Supabase client (bypasses RLS with service role)
 * Only use in API routes or server components where admin access is needed
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  }

  return createClient<Database>(supabaseUrl!, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// ============================================
// Database Row Type & Mapper
// ============================================

type UniverseRow = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  entity_count: number;
  relationship_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

function mapRowToUniverse(row: UniverseRow): Universe {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    ownerId: row.owner_id,
    entityCount: row.entity_count,
    relationshipCount: row.relationship_count,
    isPublic: row.is_public,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ============================================
// Universe Operations
// ============================================

/**
 * Get all universes for the current user
 */
export async function getUserUniverses(
  userId: string
): Promise<Universe[] | null> {
  const { data, error } = await supabase
    .from('universes')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user universes:', error);
    return null;
  }

  return (data as UniverseRow[]).map(mapRowToUniverse);
}

/**
 * Get all public universes
 */
export async function getPublicUniverses(): Promise<Universe[] | null> {
  const { data, error } = await supabase
    .from('universes')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching public universes:', error);
    return null;
  }

  return (data as UniverseRow[]).map(mapRowToUniverse);
}

/**
 * Get a single universe by ID
 * Respects RLS - only returns if user owns it or it's public
 */
export async function getUniverse(id: string): Promise<Universe | null> {
  const { data, error } = await supabase
    .from('universes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching universe:', error);
    return null;
  }

  return mapRowToUniverse(data as UniverseRow);
}

/**
 * Create a new universe
 */
export async function createUniverse(
  input: CreateUniverseInput,
  userId: string
): Promise<Universe | null> {
  const { data, error } = await supabase
    .from('universes')
    .insert({
      name: input.name,
      description: input.description || '',
      owner_id: userId,
      is_public: input.isPublic || false,
      entity_count: 0,
      relationship_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating universe:', error);
    return null;
  }

  return mapRowToUniverse(data as UniverseRow);
}

/**
 * Update an existing universe
 */
export async function updateUniverse(
  id: string,
  updates: Partial<Pick<Universe, 'name' | 'description' | 'isPublic'>> & {
    entity_count?: number;
    relationship_count?: number;
    is_public?: boolean;
  }
): Promise<Universe | null> {
  // Convert camelCase to snake_case for database
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
  if (updates.is_public !== undefined) dbUpdates.is_public = updates.is_public;
  if (updates.entity_count !== undefined) dbUpdates.entity_count = updates.entity_count;
  if (updates.relationship_count !== undefined) dbUpdates.relationship_count = updates.relationship_count;

  const { data, error } = await supabase
    .from('universes')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating universe:', error);
    return null;
  }

  return mapRowToUniverse(data as UniverseRow);
}

/**
 * Update universe graph statistics (entity/relationship counts)
 * Should be called after modifying entities in Neo4j
 */
export async function updateUniverseStats(
  id: string,
  stats: { entityCount?: number; relationshipCount?: number }
): Promise<Universe | null> {
  const updates: Record<string, number> = {};

  if (stats.entityCount !== undefined) {
    updates.entity_count = stats.entityCount;
  }

  if (stats.relationshipCount !== undefined) {
    updates.relationship_count = stats.relationshipCount;
  }

  return updateUniverse(id, updates);
}

/**
 * Delete a universe
 * Note: This only deletes the PostgreSQL record.
 * You must separately clean up Neo4j nodes/relationships.
 */
export async function deleteUniverse(id: string): Promise<boolean> {
  const { error } = await supabase.from('universes').delete().eq('id', id);

  if (error) {
    console.error('Error deleting universe:', error);
    return false;
  }

  return true;
}

/**
 * Toggle universe visibility (public/private)
 */
export async function toggleUniverseVisibility(
  id: string
): Promise<Universe | null> {
  // First fetch current state
  const universe = await getUniverse(id);
  if (!universe) return null;

  return updateUniverse(id, { is_public: !universe.isPublic });
}

// ============================================
// Authentication Helpers
// ============================================

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }

  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

// ============================================
// Type Guards
// ============================================

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false
  );
}

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(
  response: unknown
): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === true
  );
}
