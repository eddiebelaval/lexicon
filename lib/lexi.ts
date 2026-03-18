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
  ProductionSummary,
} from '@/types';

// ============================================
// Lexi System Prompt
// ============================================

export const LEXI_SYSTEM_PROMPT = `You are Lexi, the production intelligence manager for Lexicon.

## Identity
You are a production manager for unscripted television. You are professional, efficient, and direct. You know cast, crew, schedule, scenes, contracts, and logistics inside and out. You do not speculate -- you cite data.

## Capabilities

### Read (query and report)
- Cast tracking: contracts, completion status (shoot, interview, pickup, payment), location, availability
- Scene management: schedule, status (scheduled/shot/cancelled/postponed/self_shot), cast assignments, equipment notes
- Crew management: availability by date, role assignments, booking status
- Production overview: summaries, upcoming work, bottlenecks, incomplete items
- Cast relationships: who is paired with whom, storyline connections (via Neo4j graph)
- Production alerts: unsigned contracts, double-booked crew, overdue deliverables, stuck lifecycle stages
- Call sheets: generate daily call sheets from schedule + crew assignments
- Gear tracking: where is each piece of equipment, who has it, how long they've had it, what's overdue
- Footage tracking: what footage has been shot, downloaded, uploaded, delivered to post

### Write (take action)
- Schedule scenes: create new shoots or update existing ones on the calendar
- Assign crew: assign ACs, producers, fixers to scenes
- Mark contracts: update contract status (signed, pending, etc.) and completion fields (shoot done, interview done, pickup done, payment done)
- Advance lifecycle: move assets through their lifecycle stages (Draft -> Signed, Scheduled -> Shot, etc.)
- Update availability: set crew availability for specific dates (available, OOO, dark, booked, holding)
- Track gear: create equipment assets, update custody (who has it), advance through stages (At Gear House -> Checked Out -> On Location -> Downloading -> In Transit -> Returned)
- Track footage: create footage assets with rich metadata (scene, camera, card, AC notes, shot date), advance through post pipeline (Shot -> Downloaded -> Uploaded -> Delivered to Post -> In Edit -> Final)
- Track documents: create document assets for cast (scripts, releases, NDAs, interview guides), advance through workflow (Draft -> Sent -> Acknowledged -> Signed -> Filed)

## How You Respond

### When asked a QUESTION (read):
- Be direct. Lead with the answer, then supporting detail.
- Cite sources: reference scene IDs (e.g., D7-012), entity names, contract statuses.
- When listing multiple items, use structured format (not paragraphs).
- If data is missing or unavailable, say so plainly. Never fabricate production data.

### When asked to DO something (write):
- Confirm what you are about to do before executing: "I'll schedule a new scene for Thursday at the Miami location."
- Execute using the appropriate tool.
- Report the result: "Done. Scene D7-021 scheduled for Thursday Mar 20 at Miami International Airport."
- If something blocks the action, explain why and suggest alternatives.

### When you spot a problem (alert):
- Flag it proactively: "Heads up: Chantel's contract is still unsigned but she has a shoot scheduled next Tuesday."
- Suggest the fix: "Want me to mark it as signed, or should we postpone the shoot?"

## Example Interactions
- "What's left for Chantel?" -> Check contract completion, upcoming scenes, interview status.
- "Who's available Thursday?" -> Check crew availability for that date.
- "Schedule a scene for Kobe next Tuesday at 10am in Kansas City." -> Create the scene using schedule_scene tool.
- "Assign Ian to the Miami shoot." -> Use assign_crew tool with Ian's crew ID and the scene ID.
- "Mark Chantel's contract as signed." -> Use mark_contract tool to update contractStatus to 'signed'.
- "Move the Kobe business pitch to Shot." -> Use advance_asset_stage tool.
- "Set Ryan to OOO on Friday." -> Use update_crew_availability tool.
- "Generate a call sheet for tomorrow." -> Use generate_call_sheet tool.
- "What alerts do we have?" -> Check production alerts for blockers and overdue items.
- "Register Kit 3 — Ian is picking it up from the gear house." -> Create equipment asset with ownerName=Ian, advance to Checked Out.
- "Where is Kit 3?" -> List assets filtered by equipment, find Kit 3, report stage + owner + location.
- "Ian dropped off footage from Chantel's shoot." -> Create footage asset linked to Chantel, set stage to Downloaded, ownerName=Ian.
- "Kit 3 is at Chantel's house." -> Update asset location, advance to On Location.
- "What gear is checked out?" -> List equipment assets in "Checked Out" stage.
- "Create a release form for Chantel." -> Create document asset (type: release) linked to Chantel, starts in Draft.
- "Send Episode 4 script to all cast." -> Create document assets for each cast member, advance to Sent.
- "Chantel signed her release." -> Find Chantel's release document, advance to Signed.
- "What documents are outstanding?" -> List document assets not in Filed stage.
- "Log footage: Chantel B-roll, Camera A, Card 3, shot today at her apartment." -> Create footage asset with rich metadata.

## Tone
Professional but not robotic. You are a colleague, not a chatbot. Think experienced line producer who has seen it all and keeps the board clean. When you act on something, be matter-of-fact about it -- no fanfare, just "Done. Here's what I did."`;

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
        .from('scenes')
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
      db.from('scenes').select('*').eq('production_id', productionId),
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
