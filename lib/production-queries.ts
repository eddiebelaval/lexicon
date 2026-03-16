/**
 * Production Query Functions
 *
 * Structured query functions that Lexi uses to answer production questions.
 * Each returns typed data from Supabase production tables.
 *
 * Uses the service role client (same pattern as lib/storylines.ts)
 * to bypass RLS for server-side production intelligence queries.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  ProdScene,
  CastContract,
  CrewAvailability,
  AvailabilityStatus,
} from '@/types';

// ============================================
// Supabase Client (service role)
// ============================================

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

function mapSceneRow(row: Record<string, unknown>): ProdScene {
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
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapContractRow(row: Record<string, unknown>): CastContract {
  return {
    id: row.id as string,
    productionId: row.production_id as string,
    castEntityId: row.cast_entity_id as string,
    contractStatus: row.contract_status as CastContract['contractStatus'],
    paymentType: row.payment_type as CastContract['paymentType'],
    shootDone: row.shoot_done as boolean,
    interviewDone: row.interview_done as boolean,
    pickupDone: row.pickup_done as boolean,
    paymentDone: row.payment_done as boolean,
    notes: row.notes as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapAvailabilityRow(row: Record<string, unknown>): CrewAvailability {
  return {
    id: row.id as string,
    crewMemberId: row.crew_member_id as string,
    date: row.date as string,
    status: row.status as AvailabilityStatus,
    notes: row.notes as string | null,
  };
}

// ============================================
// Query Functions
// ============================================

/**
 * Get upcoming scenes for a production within the next N days.
 * Returns scenes sorted by scheduled date ascending.
 */
export async function getUpcomingScenes(
  productionId: string,
  days: number
): Promise<ProdScene[]> {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  const todayStr = today.toISOString().split('T')[0];
  const futureStr = futureDate.toISOString().split('T')[0];

  const { data, error } = await getSupabase()
    .from('prod_scenes')
    .select('*')
    .eq('production_id', productionId)
    .gte('scheduled_date', todayStr)
    .lte('scheduled_date', futureStr)
    .in('status', ['scheduled', 'postponed'])
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming scenes:', error);
    return [];
  }

  return (data || []).map(mapSceneRow);
}

/**
 * Get all cast contracts for a production with completion percentage.
 * Returns contracts with a computed completionPct field.
 */
export interface CastCompletionStatus extends CastContract {
  completionPct: number;
}

export async function getCastCompletionStatus(
  productionId: string
): Promise<CastCompletionStatus[]> {
  const { data, error } = await getSupabase()
    .from('cast_contracts')
    .select('*')
    .eq('production_id', productionId)
    .order('contract_status', { ascending: true });

  if (error) {
    console.error('Error fetching cast completion status:', error);
    return [];
  }

  return (data || []).map((row) => {
    const contract = mapContractRow(row);
    const steps = [
      contract.shootDone,
      contract.interviewDone,
      contract.pickupDone,
      contract.paymentDone,
    ];
    const completedSteps = steps.filter(Boolean).length;
    const completionPct = Math.round((completedSteps / steps.length) * 100);

    return { ...contract, completionPct };
  });
}

/**
 * Get all crew availability entries for a specific date.
 * Joins with crew_members to include crew name and role.
 */
export interface CrewAvailabilityWithDetails extends CrewAvailability {
  crewName: string;
  crewRole: string;
}

export async function getCrewAvailabilityForDate(
  productionId: string,
  date: string
): Promise<CrewAvailabilityWithDetails[]> {
  // First get crew member IDs for this production
  const { data: crewData, error: crewError } = await getSupabase()
    .from('crew_members')
    .select('id, name, role')
    .eq('production_id', productionId)
    .eq('is_active', true);

  if (crewError || !crewData) {
    console.error('Error fetching crew members:', crewError);
    return [];
  }

  const crewIds = crewData.map((c) => c.id as string);
  if (crewIds.length === 0) return [];

  // Then get availability for those crew members on the given date
  const { data: availData, error: availError } = await getSupabase()
    .from('crew_availability')
    .select('*')
    .in('crew_member_id', crewIds)
    .eq('date', date);

  if (availError) {
    console.error('Error fetching crew availability:', availError);
    return [];
  }

  // Build a lookup map for crew info
  const crewMap = new Map<string, { name: string; role: string }>();
  for (const c of crewData) {
    crewMap.set(c.id as string, {
      name: c.name as string,
      role: c.role as string,
    });
  }

  // Map availability rows and enrich with crew details
  return (availData || []).map((row) => {
    const avail = mapAvailabilityRow(row);
    const crewInfo = crewMap.get(avail.crewMemberId);
    return {
      ...avail,
      crewName: crewInfo?.name || 'Unknown',
      crewRole: crewInfo?.role || 'unknown',
    };
  });
}

/**
 * Get all scenes that feature a specific cast member.
 * Searches the cast_entity_ids array column.
 */
export async function getScenesForCastMember(
  castEntityId: string
): Promise<ProdScene[]> {
  const { data, error } = await getSupabase()
    .from('prod_scenes')
    .select('*')
    .contains('cast_entity_ids', [castEntityId])
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching scenes for cast member:', error);
    return [];
  }

  return (data || []).map(mapSceneRow);
}

/**
 * Get contracts that are missing any completion step.
 * Returns only contracts where at least one of shoot/interview/pickup/payment is not done.
 */
export async function getIncompleteContracts(
  productionId: string
): Promise<CastCompletionStatus[]> {
  const allContracts = await getCastCompletionStatus(productionId);
  return allContracts.filter((c) => c.completionPct < 100);
}

/**
 * Get scenes filtered by status for a production.
 */
export async function getScenesByStatus(
  productionId: string,
  status: string
): Promise<ProdScene[]> {
  const { data, error } = await getSupabase()
    .from('prod_scenes')
    .select('*')
    .eq('production_id', productionId)
    .eq('status', status)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching scenes by status:', error);
    return [];
  }

  return (data || []).map(mapSceneRow);
}
