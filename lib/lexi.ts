/**
 * Lexi - Production Intelligence Entity
 *
 * Lexi is Lexicon's production manager intelligence layer.
 * Same entity pattern as Ava (Parallax) or Dae (Homer).
 *
 * She knows cast relationships (Neo4j graph) and production data
 * (Supabase tables). She answers questions about scheduling,
 * contracts, crew availability, and cast completion status.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Production,
  ProdScene,
  CastContract,
  CrewMember,
  CrewAvailability,
  ProductionSummary,
} from '@/types';

// ============================================
// Lexi System Prompt
// ============================================

export const LEXI_SYSTEM_PROMPT = `You are Lexi, the production intelligence manager for Lexicon.

## Identity
You are a production manager for unscripted television. You are professional, efficient, and direct. You know cast, crew, schedule, scenes, contracts, and logistics inside and out. You do not speculate -- you cite data.

## Capabilities
- Cast tracking: contracts, completion status (shoot, interview, pickup, payment), location, availability
- Scene management: schedule, status (scheduled/shot/cancelled/postponed/self_shot), cast assignments, equipment notes
- Crew management: availability by date, role assignments, booking status
- Production overview: summaries, upcoming work, bottlenecks, incomplete items
- Cast relationships: who is paired with whom, storyline connections (via Neo4j graph)

## How You Answer
- Be direct. Lead with the answer, then supporting detail.
- Cite sources: reference scene IDs (e.g., D7-012), entity names, contract statuses.
- When listing multiple items, use structured format (not paragraphs).
- If data is missing or unavailable, say so plainly. Never fabricate production data.
- When asked about relationships between cast members, reference the graph data provided in context.

## Example Questions You Handle
- "What's left for Chantel?" -> Check contract completion, upcoming scenes, interview status.
- "Who's available Thursday?" -> Check crew availability for that date.
- "Which cast haven't done interviews?" -> Filter contracts where interviewDone is false.
- "What scenes are coming up this week?" -> Filter upcoming scenes by date range.
- "Who still needs to sign?" -> Filter contracts by status != 'signed'.
- "Give me a production summary." -> Return counts and upcoming items.
- "What's the status on the Miami shoot?" -> Look up scenes by location.

## Tone
Professional but not robotic. You are a colleague, not a chatbot. Think experienced line producer who has seen it all and keeps the board clean.`;

// ============================================
// Supabase Client (service role for server-side queries)
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _adminClient: SupabaseClient<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAdminClient(): SupabaseClient<any> {
  if (!_adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables for Lexi');
    }

    _adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _adminClient;
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

function mapProductionRow(row: Record<string, unknown>): Production {
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
// Context Builder
// ============================================

/**
 * Build production context string for Claude system prompt.
 * Fetches current production state from Supabase and formats
 * it for prepending to the Lexi system prompt.
 */
export async function buildProductionContext(
  productionId: string
): Promise<string> {
  try {
    const db = getAdminClient();

    // Fetch production, upcoming scenes, incomplete contracts, and crew in parallel
    const [productionRes, scenesRes, contractsRes, crewRes] = await Promise.all([
      db.from('productions').select('*').eq('id', productionId).single(),
      db
        .from('prod_scenes')
        .select('*')
        .eq('production_id', productionId)
        .in('status', ['scheduled', 'postponed'])
        .order('scheduled_date', { ascending: true })
        .limit(10),
      db
        .from('cast_contracts')
        .select('*')
        .eq('production_id', productionId),
      db
        .from('crew_members')
        .select('*')
        .eq('production_id', productionId)
        .eq('is_active', true),
    ]);

    if (productionRes.error || !productionRes.data) {
      return ''; // Production not found, return empty context
    }

    const production = mapProductionRow(productionRes.data);
    const upcomingScenes = (scenesRes.data || []).map(mapSceneRow);
    const allContracts = (contractsRes.data || []).map(mapContractRow);
    const activeCrew = crewRes.data || [];

    // Build incomplete contracts list
    const incompleteContracts = allContracts.filter(
      (c) => !c.shootDone || !c.interviewDone || !c.pickupDone || !c.paymentDone
    );

    const signedCount = allContracts.filter((c) => c.contractStatus === 'signed').length;
    const shotScenes = upcomingScenes.length; // Upcoming only - total shot count not fetched here

    const lines: string[] = [
      '## Current Production Context',
      `Production: ${production.name} (${production.status})`,
      `Season: ${production.season || 'N/A'}`,
      `Cast Contracts: ${allContracts.length} total, ${signedCount} signed`,
      `Active Crew: ${activeCrew.length}`,
      '',
    ];

    if (upcomingScenes.length > 0) {
      lines.push('### Upcoming Scenes');
      for (const scene of upcomingScenes) {
        const castList = scene.castEntityIds.join(', ');
        lines.push(
          `- ${scene.sceneNumber || 'TBD'}: "${scene.title}" | ${scene.scheduledDate || 'TBD'} | ${scene.location || 'TBD'} | Cast: [${castList}] | Status: ${scene.status}`
        );
      }
      lines.push('');
    }

    if (incompleteContracts.length > 0) {
      lines.push('### Incomplete Contracts');
      for (const contract of incompleteContracts) {
        const missing: string[] = [];
        if (!contract.shootDone) missing.push('shoot');
        if (!contract.interviewDone) missing.push('interview');
        if (!contract.pickupDone) missing.push('pickup');
        if (!contract.paymentDone) missing.push('payment');
        lines.push(
          `- ${contract.castEntityId}: ${contract.contractStatus} | Missing: ${missing.join(', ')}`
        );
      }
      lines.push('');
    }

    return lines.join('\n');
  } catch (error) {
    console.error('Error building production context:', error);
    return ''; // Graceful degradation
  }
}

// ============================================
// Production Summary
// ============================================

/**
 * Build a structured ProductionSummary object with counts and upcoming data.
 */
export async function buildProductionSummary(
  productionId: string
): Promise<ProductionSummary | null> {
  try {
    const db = getAdminClient();

    const [productionRes, scenesRes, contractsRes, crewRes] = await Promise.all([
      db.from('productions').select('*').eq('id', productionId).single(),
      db.from('prod_scenes').select('*').eq('production_id', productionId),
      db.from('cast_contracts').select('*').eq('production_id', productionId),
      db
        .from('crew_members')
        .select('*')
        .eq('production_id', productionId)
        .eq('is_active', true),
    ]);

    if (productionRes.error || !productionRes.data) {
      return null;
    }

    const production = mapProductionRow(productionRes.data);
    const allScenes = (scenesRes.data || []).map(mapSceneRow);
    const allContracts = (contractsRes.data || []).map(mapContractRow);

    const signedContracts = allContracts.filter((c) => c.contractStatus === 'signed');
    const shotScenes = allScenes.filter((s) => s.status === 'shot');
    const upcomingScenes = allScenes
      .filter((s) => s.status === 'scheduled' || s.status === 'postponed')
      .sort((a, b) => {
        const dateA = a.scheduledDate || '';
        const dateB = b.scheduledDate || '';
        return dateA.localeCompare(dateB);
      })
      .slice(0, 10);

    const incompleteContracts = allContracts.filter(
      (c) => !c.shootDone || !c.interviewDone || !c.pickupDone || !c.paymentDone
    );

    return {
      production,
      totalCast: allContracts.length,
      signedCast: signedContracts.length,
      totalScenes: allScenes.length,
      scenesShot: shotScenes.length,
      totalCrew: (crewRes.data || []).length,
      upcomingScenes,
      incompleteContracts,
    };
  } catch (error) {
    console.error('Error building production summary:', error);
    return null;
  }
}
