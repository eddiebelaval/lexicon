/**
 * Production Database Operations
 *
 * PostgreSQL operations for managing productions in Supabase.
 * Productions represent a filming season/cycle within a universe.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Production,
  CreateProductionInput,
  UpdateProductionInput,
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
 * Convert database row to Production type
 */
function parseProductionFromDb(row: Record<string, unknown>): Production {
  return {
    id: row.id as string,
    universeId: row.universe_id as string,
    name: row.name as string,
    season: row.season as string | null,
    status: row.status as Production['status'],
    startDate: row.start_date as string | null,
    endDate: row.end_date as string | null,
    notes: row.notes as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    createdBy: row.created_by as string | null,
  };
}

// ============================================
// Production CRUD Operations
// ============================================

/**
 * Create a new production
 */
export async function createProduction(
  input: CreateProductionInput,
  userId?: string
): Promise<Production> {
  const { data, error } = await getSupabase()
    .from('productions')
    .insert({
      universe_id: input.universeId,
      name: input.name,
      season: input.season || null,
      status: input.status || 'active',
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      notes: input.notes || null,
      created_by: userId || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create production: ${error.message}`);
  }

  return parseProductionFromDb(data);
}

/**
 * Get a production by ID
 */
export async function getProduction(id: string): Promise<Production | null> {
  const { data, error } = await getSupabase()
    .from('productions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get production: ${error.message}`);
  }

  return parseProductionFromDb(data);
}

/**
 * List productions for a universe with pagination
 */
export async function listProductions(
  universeId: string | undefined,
  options: {
    status?: Production['status'];
    limit?: number;
    offset?: number;
  } = {}
): Promise<PaginatedResponse<Production>> {
  const { status, limit = 50, offset = 0 } = options;

  let query = getSupabase()
    .from('productions')
    .select('*', { count: 'exact' });

  if (universeId) {
    query = query.eq('universe_id', universeId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  query = query
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list productions: ${error.message}`);
  }

  const items = (data || []).map(parseProductionFromDb);
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
 * Update a production
 */
export async function updateProduction(
  id: string,
  input: UpdateProductionInput,
  userId?: string
): Promise<Production | null> {
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.season !== undefined) updates.season = input.season;
  if (input.status !== undefined) updates.status = input.status;
  if (input.startDate !== undefined) updates.start_date = input.startDate;
  if (input.endDate !== undefined) updates.end_date = input.endDate;
  if (input.notes !== undefined) updates.notes = input.notes;

  // Track who updated (if we have userId)
  if (userId) {
    updates.updated_by = userId;
  }

  const { data, error } = await getSupabase()
    .from('productions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to update production: ${error.message}`);
  }

  return parseProductionFromDb(data);
}

/**
 * Delete a production
 */
export async function deleteProduction(id: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('productions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete production: ${error.message}`);
  }

  return true;
}
