/**
 * Crew Availability Database Operations
 *
 * PostgreSQL operations for managing crew availability in Supabase.
 * Tracks daily availability status for crew members.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  CrewAvailability,
  CreateCrewAvailabilityInput,
  UpdateCrewAvailabilityInput,
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
 * Convert database row to CrewAvailability type
 */
function parseCrewAvailabilityFromDb(row: Record<string, unknown>): CrewAvailability {
  return {
    id: row.id as string,
    crewMemberId: row.crew_member_id as string,
    date: row.date as string,
    status: row.status as CrewAvailability['status'],
    notes: row.notes as string | null,
  };
}

// ============================================
// Crew Availability CRUD Operations
// ============================================

/**
 * Create a new crew availability entry
 */
export async function createCrewAvailability(
  input: CreateCrewAvailabilityInput
): Promise<CrewAvailability> {
  const { data, error } = await getSupabase()
    .from('crew_availability')
    .insert({
      crew_member_id: input.crewMemberId,
      date: input.date,
      status: input.status || 'available',
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create crew availability: ${error.message}`);
  }

  return parseCrewAvailabilityFromDb(data);
}

/**
 * Get a crew availability entry by ID
 */
export async function getCrewAvailability(id: string): Promise<CrewAvailability | null> {
  const { data, error } = await getSupabase()
    .from('crew_availability')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get crew availability: ${error.message}`);
  }

  return parseCrewAvailabilityFromDb(data);
}

/**
 * List crew availability by crew member or production
 */
export async function listCrewAvailability(
  options: {
    crewMemberId?: string;
    productionId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: CrewAvailability['status'];
  } = {}
): Promise<CrewAvailability[]> {
  const { crewMemberId, productionId, date, startDate, endDate, status } = options;

  // If productionId is provided, first get crew member IDs for that production
  let crewMemberIds: string[] | undefined;

  if (productionId) {
    const { data: crewMembers } = await getSupabase()
      .from('crew_members')
      .select('id')
      .eq('production_id', productionId);

    crewMemberIds = crewMembers?.map((c: Record<string, unknown>) => c.id as string);
    if (!crewMemberIds || crewMemberIds.length === 0) {
      return [];
    }
  }

  let query = getSupabase()
    .from('crew_availability')
    .select('*');

  if (crewMemberId) {
    query = query.eq('crew_member_id', crewMemberId);
  }

  if (crewMemberIds) {
    query = query.in('crew_member_id', crewMemberIds);
  }

  if (date) {
    query = query.eq('date', date);
  }

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  if (status) {
    query = query.eq('status', status);
  }

  query = query.order('date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list crew availability: ${error.message}`);
  }

  return (data || []).map(parseCrewAvailabilityFromDb);
}

/**
 * Update a crew availability entry
 */
export async function updateCrewAvailability(
  id: string,
  input: UpdateCrewAvailabilityInput
): Promise<CrewAvailability | null> {
  const updates: Record<string, unknown> = {};

  if (input.status !== undefined) updates.status = input.status;
  if (input.notes !== undefined) updates.notes = input.notes;

  const { data, error } = await getSupabase()
    .from('crew_availability')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to update crew availability: ${error.message}`);
  }

  return parseCrewAvailabilityFromDb(data);
}

/**
 * Delete a crew availability entry
 */
export async function deleteCrewAvailability(id: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('crew_availability')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete crew availability: ${error.message}`);
  }

  return true;
}
