/**
 * Crew Member Database Operations
 *
 * PostgreSQL operations for managing crew members in Supabase.
 * Crew members are production staff (ACs, producers, fixers, etc.).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  CrewMember,
  CreateCrewMemberInput,
  UpdateCrewMemberInput,
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
 * Convert database row to CrewMember type
 */
function parseCrewMemberFromDb(row: Record<string, unknown>): CrewMember {
  return {
    id: row.id as string,
    productionId: row.production_id as string,
    name: row.name as string,
    role: row.role as CrewMember['role'],
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

// ============================================
// Crew Member CRUD Operations
// ============================================

/**
 * Create a new crew member
 */
export async function createCrewMember(
  input: CreateCrewMemberInput
): Promise<CrewMember> {
  const { data, error } = await getSupabase()
    .from('crew_members')
    .insert({
      production_id: input.productionId,
      name: input.name,
      role: input.role,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create crew member: ${error.message}`);
  }

  return parseCrewMemberFromDb(data);
}

/**
 * Get a crew member by ID
 */
export async function getCrewMember(id: string): Promise<CrewMember | null> {
  const { data, error } = await getSupabase()
    .from('crew_members')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get crew member: ${error.message}`);
  }

  return parseCrewMemberFromDb(data);
}

/**
 * List crew members for a production with pagination
 */
export async function listCrewMembers(
  productionId: string,
  options: {
    role?: CrewMember['role'];
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<PaginatedResponse<CrewMember>> {
  const { role, isActive, limit = 50, offset = 0 } = options;

  let query = getSupabase()
    .from('crew_members')
    .select('*', { count: 'exact' })
    .eq('production_id', productionId);

  if (role) {
    query = query.eq('role', role);
  }

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  query = query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list crew members: ${error.message}`);
  }

  const items = (data || []).map(parseCrewMemberFromDb);
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
 * Update a crew member
 */
export async function updateCrewMember(
  id: string,
  input: UpdateCrewMemberInput
): Promise<CrewMember | null> {
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.role !== undefined) updates.role = input.role;
  if (input.contactEmail !== undefined) updates.contact_email = input.contactEmail;
  if (input.contactPhone !== undefined) updates.contact_phone = input.contactPhone;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  const { data, error } = await getSupabase()
    .from('crew_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to update crew member: ${error.message}`);
  }

  return parseCrewMemberFromDb(data);
}

/**
 * Delete a crew member
 */
export async function deleteCrewMember(id: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('crew_members')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete crew member: ${error.message}`);
  }

  return true;
}
