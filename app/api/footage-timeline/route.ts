/**
 * Footage Timeline API
 *
 * GET /api/footage-timeline?productionId=X&castMemberName=Y
 *
 * Returns all footage assets for a production (or filtered by cast member),
 * enriched with stage names, transition history, and metadata.
 * Sorted by creation date descending (newest first).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { hoursSince } from '@/lib/utils';

interface FootageTimelineEntry {
  id: string;
  name: string;
  currentStage: string;
  stageColor: string;
  owner: string;
  castMember: string;
  sceneTitle: string;
  camera: string;
  card: string;
  acNotes: string;
  location: string;
  shotDate: string;
  hoursInStage: number;
  createdAt: string;
  transitions: Array<{
    fromStage: string | null;
    toStage: string;
    by: string | null;
    reason: string | null;
    at: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productionId = searchParams.get('productionId');
    const castMemberName = searchParams.get('castMemberName') || searchParams.get('castEntityId');

    if (!productionId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'productionId is required' } },
        { status: 400 }
      );
    }

    const db = getServiceSupabase();

    // Find footage asset type
    const { data: footageType, error: ftErr } = await db
      .from('asset_types')
      .select('id')
      .eq('production_id', productionId)
      .eq('slug', 'footage')
      .single();

    if (ftErr || !footageType) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch stages and instances in parallel (both depend only on footageType.id)
    let instanceQuery = db
      .from('asset_instances')
      .select('*')
      .eq('production_id', productionId)
      .eq('asset_type_id', footageType.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (castMemberName) {
      instanceQuery = instanceQuery.contains('metadata', { castMember: castMemberName });
    }

    const [stagesResult, instancesResult] = await Promise.all([
      db.from('lifecycle_stages')
        .select('id, name, color, stage_order')
        .eq('asset_type_id', footageType.id)
        .order('stage_order', { ascending: true }),
      instanceQuery,
    ]);

    const stageMap = new Map<string, { name: string; color: string }>();
    for (const s of stagesResult.data || []) {
      stageMap.set(s.id as string, { name: s.name as string, color: s.color as string });
    }

    const instances = instancesResult.data;
    if (instancesResult.error) {
      console.error('Failed to fetch footage instances:', instancesResult.error.message);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch footage' } },
        { status: 500 }
      );
    }

    if (!instances || instances.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Get transition history (capped at 500 to prevent unbounded growth)
    const instanceIds = instances.map((i) => i.id as string);
    const { data: transitions } = await db
      .from('stage_transitions')
      .select('asset_instance_id, from_stage_id, to_stage_id, transitioned_by_name, reason, transitioned_at')
      .in('asset_instance_id', instanceIds)
      .order('transitioned_at', { ascending: true })
      .limit(500);

    // Group transitions by instance
    const transitionsByInstance = new Map<string, typeof transitions>();
    for (const t of transitions || []) {
      const instId = t.asset_instance_id as string;
      if (!transitionsByInstance.has(instId)) transitionsByInstance.set(instId, []);
      transitionsByInstance.get(instId)!.push(t);
    }

    const timeline: FootageTimelineEntry[] = instances.map((inst) => {
      const meta = (inst.metadata as Record<string, unknown>) || {};
      const stage = stageMap.get(inst.current_stage_id as string);
      const instTransitions = transitionsByInstance.get(inst.id as string) || [];

      return {
        id: inst.id as string,
        name: inst.name as string,
        currentStage: stage?.name || 'Unknown',
        stageColor: stage?.color || '#6b7280',
        owner: (inst.owner_name as string) || '',
        castMember: (meta.castMember as string) || '',
        sceneTitle: (meta.sceneTitle as string) || '',
        camera: (meta.camera as string) || '',
        card: (meta.card as string) || '',
        acNotes: (meta.acNotes as string) || '',
        location: (meta.location as string) || '',
        shotDate: (meta.shotDate as string) || '',
        hoursInStage: Math.round(hoursSince(inst.stage_entered_at as string)),
        createdAt: inst.created_at as string,
        transitions: instTransitions.map((t) => ({
          fromStage: stageMap.get(t.from_stage_id as string)?.name || null,
          toStage: stageMap.get(t.to_stage_id as string)?.name || 'Unknown',
          by: t.transitioned_by_name as string | null,
          reason: t.reason as string | null,
          at: t.transitioned_at as string,
        })),
      };
    });

    return NextResponse.json({ success: true, data: timeline });
  } catch (error) {
    console.error('Footage timeline error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to build footage timeline' } },
      { status: 500 }
    );
  }
}
