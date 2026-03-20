/**
 * CSV Export API Route
 *
 * GET /api/export?productionId=...&type=cast|crew|scenes|callsheet&date=YYYY-MM-DD
 *
 * Returns a CSV file download for the requested data type.
 * Uses service role key (called by Lexi or authenticated dashboard).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

type ExportType = 'cast' | 'crew' | 'scenes' | 'callsheet';

function escapeCsvField(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields: unknown[]): string {
  return fields.map(escapeCsvField).join(',');
}

async function exportCast(productionId: string): Promise<string> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('cast_contracts')
    .select('*')
    .eq('production_id', productionId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to export cast: ${error.message}`);

  const header = toCsvRow([
    'Cast Entity ID', 'Contract Status', 'Payment Type',
    'Daily Rate', 'Flat Fee', 'Total Payment', 'Paid Amount',
    'Shoot Done', 'Interview Done', 'Pickup Done', 'Payment Done',
    'Notes', 'Created At',
  ]);

  const rows = (data || []).map((row) =>
    toCsvRow([
      row.cast_entity_id, row.contract_status, row.payment_type,
      row.daily_rate, row.flat_fee, row.total_payment, row.paid_amount,
      row.shoot_done, row.interview_done, row.pickup_done, row.payment_done,
      row.notes, row.created_at,
    ])
  );

  return [header, ...rows].join('\n');
}

async function exportCrew(productionId: string): Promise<string> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('crew_members')
    .select('*')
    .eq('production_id', productionId)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to export crew: ${error.message}`);

  const header = toCsvRow([
    'Name', 'Role', 'Email', 'Phone', 'Active', 'Created At',
  ]);

  const rows = (data || []).map((row) =>
    toCsvRow([
      row.name, row.role, row.contact_email, row.contact_phone,
      row.is_active, row.created_at,
    ])
  );

  return [header, ...rows].join('\n');
}

async function exportScenes(productionId: string): Promise<string> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('scenes')
    .select('*, episodes(episode_number, title)')
    .eq('production_id', productionId)
    .order('scheduled_date', { ascending: true });

  if (error) throw new Error(`Failed to export scenes: ${error.message}`);

  const header = toCsvRow([
    'Scene Number', 'Title', 'Date', 'Time', 'Location',
    'Location Details', 'Status', 'Self Shot', 'Equipment Notes',
    'Episode', 'Created At',
  ]);

  const rows = (data || []).map((row) => {
    const ep = row.episodes as { episode_number: number; title: string | null } | null;
    return toCsvRow([
      row.scene_number, row.title, row.scheduled_date, row.scheduled_time,
      row.location, row.location_details, row.status, row.is_self_shot,
      row.equipment_notes,
      ep ? `Ep ${ep.episode_number}${ep.title ? `: ${ep.title}` : ''}` : '',
      row.created_at,
    ]);
  });

  return [header, ...rows].join('\n');
}

async function exportCallSheet(productionId: string, date: string): Promise<string> {
  const supabase = getServiceSupabase();

  const { data: scenes, error: sceneError } = await supabase
    .from('scenes')
    .select('*')
    .eq('production_id', productionId)
    .eq('scheduled_date', date)
    .neq('status', 'cancelled')
    .order('scheduled_time', { ascending: true });

  if (sceneError) throw new Error(`Failed to export call sheet: ${sceneError.message}`);

  if (!scenes || scenes.length === 0) {
    return 'No scenes scheduled for this date.';
  }

  const sceneIds = scenes.map((s) => s.id as string);

  const { data: assignments } = await supabase
    .from('scene_assignments')
    .select('*, crew_members(name, role, contact_phone)')
    .in('scene_id', sceneIds);

  const assignmentsByScene = new Map<string, typeof assignments>();
  for (const a of assignments || []) {
    const sceneId = a.scene_id as string;
    if (!assignmentsByScene.has(sceneId)) assignmentsByScene.set(sceneId, []);
    assignmentsByScene.get(sceneId)!.push(a);
  }

  const header = toCsvRow([
    'Scene', 'Title', 'Time', 'Location', 'Status', 'Crew', 'Equipment Notes',
  ]);

  const rows = scenes.map((scene) => {
    const sceneAssignments = assignmentsByScene.get(scene.id as string) || [];
    const crewList = sceneAssignments
      .map((a) => {
        const crew = a.crew_members as { name: string; role: string } | null;
        return crew ? `${crew.name} (${crew.role})` : 'Unknown';
      })
      .join('; ');

    return toCsvRow([
      scene.scene_number, scene.title, scene.scheduled_time,
      scene.location, scene.status, crewList, scene.equipment_notes,
    ]);
  });

  return [header, ...rows].join('\n');
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const productionId = searchParams.get('productionId');
    const type = searchParams.get('type') as ExportType;
    const date = searchParams.get('date');

    if (!productionId) {
      return NextResponse.json({ error: 'productionId is required' }, { status: 400 });
    }

    if (!type || !['cast', 'crew', 'scenes', 'callsheet'].includes(type)) {
      return NextResponse.json({ error: 'type must be one of: cast, crew, scenes, callsheet' }, { status: 400 });
    }

    if (type === 'callsheet' && !date) {
      return NextResponse.json({ error: 'date is required for callsheet export' }, { status: 400 });
    }

    let csv: string;
    let filename: string;

    switch (type) {
      case 'cast':
        csv = await exportCast(productionId);
        filename = `cast-contracts-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'crew':
        csv = await exportCrew(productionId);
        filename = `crew-roster-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'scenes':
        csv = await exportScenes(productionId);
        filename = `scenes-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'callsheet':
        csv = await exportCallSheet(productionId, date!);
        filename = `call-sheet-${date}.csv`;
        break;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
