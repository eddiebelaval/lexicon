/**
 * Production Alerts Engine
 *
 * Detects production problems: unsigned contracts, double-booked crew,
 * overdue deliverables, stuck lifecycle stages, and unassigned scenes.
 * Each detector returns an array of typed alert objects.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface ProductionAlert {
  id: string;
  type:
    | 'unsigned_contract'
    | 'double_booked'
    | 'overdue_deliverable'
    | 'stuck_stage'
    | 'unassigned_scene';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  entityId?: string;
  entityName?: string;
  actionUrl?: string;
}

// ============================================
// Supabase client (same pattern as lib/lifecycle.ts)
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
// Helpers
// ============================================

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(dateStr: string, referenceStr: string): number {
  const a = new Date(dateStr);
  const b = new Date(referenceStr);
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================
// Detectors
// ============================================

/**
 * Contracts with status != 'signed' that have scenes scheduled in the next 7 days.
 * Severity: critical.
 */
export async function getUnsignedContractAlerts(
  productionId: string
): Promise<ProductionAlert[]> {
  const today = todayStr();
  const weekOut = daysFromNow(7);

  // Get all non-signed contracts for this production
  const { data: contracts, error: cErr } = await getSupabase()
    .from('cast_contracts')
    .select('id, cast_entity_id, contract_status')
    .eq('production_id', productionId)
    .neq('contract_status', 'signed');

  if (cErr) {
    console.error('Failed to fetch contracts for alerts:', cErr.message);
    return [];
  }

  if (!contracts || contracts.length === 0) return [];

  // Get scenes scheduled in the next 7 days
  const { data: scenes, error: sErr } = await getSupabase()
    .from('scenes')
    .select('id, title, scheduled_date, cast_entity_ids')
    .eq('production_id', productionId)
    .gte('scheduled_date', today)
    .lte('scheduled_date', weekOut);

  if (sErr) {
    console.error('Failed to fetch scenes for contract alerts:', sErr.message);
    return [];
  }

  if (!scenes || scenes.length === 0) return [];

  // Find contracts whose cast member appears in an upcoming scene
  const alerts: ProductionAlert[] = [];
  const seen = new Set<string>();

  for (const contract of contracts) {
    const castId = contract.cast_entity_id as string;
    if (seen.has(castId)) continue;

    const hasUpcomingScene = scenes.some((s) => {
      const ids = (s.cast_entity_ids as string[]) || [];
      return ids.includes(castId);
    });

    if (hasUpcomingScene) {
      seen.add(castId);
      alerts.push({
        id: `unsigned-${contract.id}`,
        type: 'unsigned_contract',
        severity: 'critical',
        title: `Unsigned contract: ${castId}`,
        description: `Contract status is "${contract.contract_status}" but cast member has scenes scheduled in the next 7 days.`,
        entityId: contract.id as string,
        entityName: castId,
      });
    }
  }

  return alerts;
}

/**
 * Crew members assigned to 2+ scenes on the same date.
 * Severity: warning.
 */
export async function getDoubleBookedCrewAlerts(
  productionId: string
): Promise<ProductionAlert[]> {
  // Get all scenes for the production that have a scheduled date
  const { data: scenes, error: sErr } = await getSupabase()
    .from('scenes')
    .select('id, title, scheduled_date')
    .eq('production_id', productionId)
    .not('scheduled_date', 'is', null);

  if (sErr) {
    console.error('Failed to fetch scenes for double-book check:', sErr.message);
    return [];
  }

  if (!scenes || scenes.length === 0) return [];

  const sceneIds = scenes.map((s) => s.id as string);

  // Get all assignments for those scenes
  const { data: assignments, error: aErr } = await getSupabase()
    .from('scene_assignments')
    .select('id, scene_id, crew_member_id')
    .in('scene_id', sceneIds);

  if (aErr) {
    console.error('Failed to fetch assignments for double-book check:', aErr.message);
    return [];
  }

  if (!assignments || assignments.length === 0) return [];

  // Build a map: crew_member_id -> date -> scene_ids[]
  const sceneById = new Map<string, { title: string; date: string }>();
  for (const s of scenes) {
    sceneById.set(s.id as string, {
      title: s.title as string,
      date: s.scheduled_date as string,
    });
  }

  const crewDateMap = new Map<string, Map<string, string[]>>();
  for (const a of assignments) {
    const crewId = a.crew_member_id as string;
    const sceneId = a.scene_id as string;
    const scene = sceneById.get(sceneId);
    if (!scene) continue;

    if (!crewDateMap.has(crewId)) {
      crewDateMap.set(crewId, new Map());
    }
    const dateMap = crewDateMap.get(crewId)!;
    if (!dateMap.has(scene.date)) {
      dateMap.set(scene.date, []);
    }
    dateMap.get(scene.date)!.push(sceneId);
  }

  // Find double-bookings
  const alerts: ProductionAlert[] = [];

  // Fetch crew names in bulk
  const crewIds = Array.from(crewDateMap.keys());
  const { data: crewMembers } = await getSupabase()
    .from('crew_members')
    .select('id, name')
    .in('id', crewIds);

  const crewNameMap = new Map<string, string>();
  for (const cm of crewMembers || []) {
    crewNameMap.set(cm.id as string, cm.name as string);
  }

  for (const [crewId, dateMap] of crewDateMap) {
    for (const [date, sceneIdList] of dateMap) {
      if (sceneIdList.length >= 2) {
        const crewName = crewNameMap.get(crewId) || crewId;
        const sceneTitles = sceneIdList
          .map((sid) => sceneById.get(sid)?.title || sid)
          .join(', ');

        alerts.push({
          id: `double-booked-${crewId}-${date}`,
          type: 'double_booked',
          severity: 'warning',
          title: `Double-booked: ${crewName} on ${date}`,
          description: `Assigned to ${sceneIdList.length} scenes: ${sceneTitles}`,
          entityId: crewId,
          entityName: crewName,
        });
      }
    }
  }

  return alerts;
}

/**
 * Asset instances where due_date < today AND completed_at IS NULL.
 * Severity: critical if 3+ days overdue, warning otherwise.
 */
export async function getOverdueDeliverableAlerts(
  productionId: string
): Promise<ProductionAlert[]> {
  const today = todayStr();

  const { data: instances, error } = await getSupabase()
    .from('asset_instances')
    .select('id, name, due_date, completed_at')
    .eq('production_id', productionId)
    .lt('due_date', today)
    .is('completed_at', null);

  if (error) {
    console.error('Failed to fetch overdue deliverables:', error.message);
    return [];
  }

  if (!instances || instances.length === 0) return [];

  return instances.map((inst) => {
    const overdueDays = daysBetween(inst.due_date as string, today);
    return {
      id: `overdue-${inst.id}`,
      type: 'overdue_deliverable' as const,
      severity: overdueDays >= 3 ? ('critical' as const) : ('warning' as const),
      title: `Overdue: ${inst.name}`,
      description: `${overdueDays} day${overdueDays !== 1 ? 's' : ''} past due date (${inst.due_date}).`,
      entityId: inst.id as string,
      entityName: inst.name as string,
    };
  });
}

/**
 * Asset instances where auto_advance_after_days is set on their current stage
 * and stage_entered_at + auto_advance_after_days < today.
 * Severity: warning.
 */
export async function getStuckStageAlerts(
  productionId: string
): Promise<ProductionAlert[]> {
  // Get all non-completed asset instances for this production
  const { data: instances, error: iErr } = await getSupabase()
    .from('asset_instances')
    .select('id, name, current_stage_id, stage_entered_at')
    .eq('production_id', productionId)
    .is('completed_at', null);

  if (iErr) {
    console.error('Failed to fetch instances for stuck-stage check:', iErr.message);
    return [];
  }

  if (!instances || instances.length === 0) return [];

  // Get all stages that have auto_advance_after_days set
  const stageIds = [...new Set(instances.map((i) => i.current_stage_id as string))];

  const { data: stages, error: sErr } = await getSupabase()
    .from('lifecycle_stages')
    .select('id, name, auto_advance_after_days')
    .in('id', stageIds)
    .not('auto_advance_after_days', 'is', null);

  if (sErr) {
    console.error('Failed to fetch stages for stuck-stage check:', sErr.message);
    return [];
  }

  if (!stages || stages.length === 0) return [];

  const stageMap = new Map<
    string,
    { name: string; autoAdvanceDays: number }
  >();
  for (const s of stages) {
    stageMap.set(s.id as string, {
      name: s.name as string,
      autoAdvanceDays: s.auto_advance_after_days as number,
    });
  }

  const today = new Date();
  const alerts: ProductionAlert[] = [];

  for (const inst of instances) {
    const stageInfo = stageMap.get(inst.current_stage_id as string);
    if (!stageInfo) continue;

    const enteredAt = new Date(inst.stage_entered_at as string);
    const deadlineMs =
      enteredAt.getTime() + stageInfo.autoAdvanceDays * 24 * 60 * 60 * 1000;

    if (today.getTime() > deadlineMs) {
      const stuckDays = Math.floor(
        (today.getTime() - deadlineMs) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `stuck-${inst.id}`,
        type: 'stuck_stage',
        severity: 'warning',
        title: `Stuck: ${inst.name}`,
        description: `In "${stageInfo.name}" for ${stuckDays} day${stuckDays !== 1 ? 's' : ''} past auto-advance threshold (${stageInfo.autoAdvanceDays}d).`,
        entityId: inst.id as string,
        entityName: inst.name as string,
      });
    }
  }

  return alerts;
}

/**
 * Scenes with status='scheduled' and scheduledDate in next 7 days
 * but zero scene_assignments. Severity: warning.
 */
export async function getUnassignedSceneAlerts(
  productionId: string
): Promise<ProductionAlert[]> {
  const today = todayStr();
  const weekOut = daysFromNow(7);

  const { data: scenes, error: sErr } = await getSupabase()
    .from('scenes')
    .select('id, title, scene_number, scheduled_date')
    .eq('production_id', productionId)
    .eq('status', 'scheduled')
    .gte('scheduled_date', today)
    .lte('scheduled_date', weekOut);

  if (sErr) {
    console.error('Failed to fetch scenes for unassigned check:', sErr.message);
    return [];
  }

  if (!scenes || scenes.length === 0) return [];

  const sceneIds = scenes.map((s) => s.id as string);

  // Get all assignments for these scenes
  const { data: assignments, error: aErr } = await getSupabase()
    .from('scene_assignments')
    .select('scene_id')
    .in('scene_id', sceneIds);

  if (aErr) {
    console.error('Failed to fetch assignments for unassigned check:', aErr.message);
    return [];
  }

  const assignedSceneIds = new Set(
    (assignments || []).map((a) => a.scene_id as string)
  );

  const alerts: ProductionAlert[] = [];

  for (const scene of scenes) {
    const sceneId = scene.id as string;
    if (!assignedSceneIds.has(sceneId)) {
      const label = scene.scene_number
        ? `#${scene.scene_number} ${scene.title}`
        : (scene.title as string);
      alerts.push({
        id: `unassigned-${sceneId}`,
        type: 'unassigned_scene',
        severity: 'warning',
        title: `Unassigned scene: ${label}`,
        description: `Scheduled for ${scene.scheduled_date} with no crew assigned.`,
        entityId: sceneId,
        entityName: label,
      });
    }
  }

  return alerts;
}

/**
 * Calls all 5 alert detectors, deduplicates by id, sorts critical first.
 */
export async function getAllAlerts(
  productionId: string
): Promise<ProductionAlert[]> {
  const [unsigned, doubleBooked, overdue, stuck, unassigned] =
    await Promise.all([
      getUnsignedContractAlerts(productionId),
      getDoubleBookedCrewAlerts(productionId),
      getOverdueDeliverableAlerts(productionId),
      getStuckStageAlerts(productionId),
      getUnassignedSceneAlerts(productionId),
    ]);

  const all = [...unsigned, ...doubleBooked, ...overdue, ...stuck, ...unassigned];

  // Deduplicate by id
  const seen = new Set<string>();
  const unique: ProductionAlert[] = [];
  for (const alert of all) {
    if (!seen.has(alert.id)) {
      seen.add(alert.id);
      unique.push(alert);
    }
  }

  // Sort by severity: critical > warning > info
  const severityOrder: Record<string, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  unique.sort(
    (a, b) =>
      (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
  );

  return unique;
}
