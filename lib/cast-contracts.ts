/**
 * Cast Contract Database Operations
 *
 * PostgreSQL operations for managing cast contracts in Supabase.
 * Tracks contract status and completion milestones for cast members.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  CastContract,
  CreateCastContractInput,
  UpdateCastContractInput,
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
 * Convert database row to CastContract type
 */
function parseCastContractFromDb(row: Record<string, unknown>): CastContract {
  return {
    id: row.id as string,
    productionId: row.production_id as string,
    castEntityId: row.cast_entity_id as string,
    castName: (row.cast_name as string) ?? null,
    contractStatus: row.contract_status as CastContract['contractStatus'],
    paymentType: row.payment_type as CastContract['paymentType'],
    dailyRate: row.daily_rate != null ? Number(row.daily_rate) : null,
    flatFee: row.flat_fee != null ? Number(row.flat_fee) : null,
    totalPayment: row.total_payment != null ? Number(row.total_payment) : null,
    paidAmount: row.paid_amount != null ? Number(row.paid_amount) : null,
    paidDate: row.paid_date ? new Date(row.paid_date as string) : null,
    shootDone: row.shoot_done as boolean,
    interviewDone: row.interview_done as boolean,
    pickupDone: row.pickup_done as boolean,
    paymentDone: row.payment_done as boolean,
    notes: row.notes as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

// ============================================
// Cast Contract CRUD Operations
// ============================================

/**
 * Create a new cast contract
 */
export async function createCastContract(
  input: CreateCastContractInput
): Promise<CastContract> {
  const { data, error } = await getSupabase()
    .from('cast_contracts')
    .insert({
      production_id: input.productionId,
      cast_entity_id: input.castEntityId,
      cast_name: input.castName || null,
      contract_status: input.contractStatus || 'pending',
      payment_type: input.paymentType || null,
      daily_rate: input.dailyRate ?? null,
      flat_fee: input.flatFee ?? null,
      total_payment: input.totalPayment ?? null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create cast contract: ${error.message}`);
  }

  return parseCastContractFromDb(data);
}

/**
 * Get a cast contract by ID
 */
export async function getCastContract(id: string): Promise<CastContract | null> {
  const { data, error } = await getSupabase()
    .from('cast_contracts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get cast contract: ${error.message}`);
  }

  return parseCastContractFromDb(data);
}

/**
 * List cast contracts for a production with pagination
 */
export async function listCastContracts(
  productionId: string,
  options: {
    contractStatus?: CastContract['contractStatus'];
    incomplete?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<PaginatedResponse<CastContract>> {
  const { contractStatus, incomplete, limit = 50, offset = 0 } = options;

  let query = getSupabase()
    .from('cast_contracts')
    .select('*', { count: 'exact' })
    .eq('production_id', productionId);

  if (contractStatus) {
    query = query.eq('contract_status', contractStatus);
  }

  if (incomplete) {
    // Filter for contracts where any milestone is not done
    query = query.or(
      'shoot_done.eq.false,interview_done.eq.false,pickup_done.eq.false,payment_done.eq.false'
    );
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list cast contracts: ${error.message}`);
  }

  const items = (data || []).map(parseCastContractFromDb);
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
 * Update a cast contract
 */
export async function updateCastContract(
  id: string,
  input: UpdateCastContractInput
): Promise<CastContract | null> {
  const updates: Record<string, unknown> = {};

  if (input.castName !== undefined) updates.cast_name = input.castName;
  if (input.contractStatus !== undefined) updates.contract_status = input.contractStatus;
  if (input.paymentType !== undefined) updates.payment_type = input.paymentType;
  if (input.dailyRate !== undefined) updates.daily_rate = input.dailyRate;
  if (input.flatFee !== undefined) updates.flat_fee = input.flatFee;
  if (input.totalPayment !== undefined) updates.total_payment = input.totalPayment;
  if (input.paidAmount !== undefined) updates.paid_amount = input.paidAmount;
  if (input.paidDate !== undefined) updates.paid_date = input.paidDate;
  if (input.shootDone !== undefined) updates.shoot_done = input.shootDone;
  if (input.interviewDone !== undefined) updates.interview_done = input.interviewDone;
  if (input.pickupDone !== undefined) updates.pickup_done = input.pickupDone;
  if (input.paymentDone !== undefined) updates.payment_done = input.paymentDone;
  if (input.notes !== undefined) updates.notes = input.notes;

  const { data, error } = await getSupabase()
    .from('cast_contracts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to update cast contract: ${error.message}`);
  }

  return parseCastContractFromDb(data);
}

/**
 * Delete a cast contract
 */
export async function deleteCastContract(id: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('cast_contracts')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete cast contract: ${error.message}`);
  }

  return true;
}
