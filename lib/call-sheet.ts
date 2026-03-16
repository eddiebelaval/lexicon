/**
 * Call Sheet Generator
 *
 * Generates structured call sheets for a production on a given date.
 * Fetches scenes, crew assignments, and resolves cast entity names from Neo4j.
 */

import { getServiceSupabase } from './supabase';
import { getEntitiesByIds } from './entities';
import type {
  ProdScene,
  Production,
  CrewMember,
  SceneAssignment,
} from '@/types';

// ============================================
// Call Sheet Types
// ============================================

export interface CallSheetEntry {
  scene: ProdScene;
  crewAssignments: { crewName: string; role: string; notes: string | null }[];
  castNames: string[];
}

export interface CallSheet {
  productionName: string;
  date: string;
  entries: CallSheetEntry[];
  generalNotes: string | null;
}

// Uses shared service-role client from lib/supabase.ts
const getSupabase = getServiceSupabase;

// ============================================
// Row Mappers
// ============================================

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

function parseSceneFromDb(row: Record<string, unknown>): ProdScene {
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

function parseAssignmentFromDb(row: Record<string, unknown>): SceneAssignment {
  return {
    id: row.id as string,
    sceneId: row.scene_id as string,
    crewMemberId: row.crew_member_id as string,
    role: row.role as SceneAssignment['role'],
    notes: row.notes as string | null,
    status: row.status as SceneAssignment['status'],
    createdAt: new Date(row.created_at as string),
  };
}

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
// Call Sheet Generator
// ============================================

/**
 * Generate a call sheet for a production on a specific date.
 *
 * 1. Fetches the production record
 * 2. Fetches all scenes scheduled for that date
 * 3. For each scene, fetches scene_assignments joined with crew_members
 * 4. Resolves cast entity IDs to names via Neo4j (falls back to raw IDs)
 * 5. Returns a structured CallSheet
 */
export async function generateCallSheet(
  productionId: string,
  date: string
): Promise<CallSheet> {
  const supabase = getSupabase();

  // 1. Fetch the production
  const { data: prodData, error: prodError } = await supabase
    .from('productions')
    .select('*')
    .eq('id', productionId)
    .single();

  if (prodError) {
    throw new Error(`Failed to fetch production: ${prodError.message}`);
  }

  const production = parseProductionFromDb(prodData);

  // 2. Fetch scenes for this date
  const { data: sceneRows, error: sceneError } = await supabase
    .from('scenes')
    .select('*')
    .eq('production_id', productionId)
    .eq('scheduled_date', date)
    .order('scheduled_time', { ascending: true, nullsFirst: false });

  if (sceneError) {
    throw new Error(`Failed to fetch scenes: ${sceneError.message}`);
  }

  const scenes = (sceneRows || []).map(parseSceneFromDb);

  if (scenes.length === 0) {
    return {
      productionName: production.name,
      date,
      entries: [],
      generalNotes: production.notes,
    };
  }

  // 3. Fetch assignments for all scenes in one query
  const sceneIds = scenes.map((s) => s.id);

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from('scene_assignments')
    .select('*')
    .in('scene_id', sceneIds);

  if (assignmentError) {
    throw new Error(`Failed to fetch assignments: ${assignmentError.message}`);
  }

  const assignments = (assignmentRows || []).map(parseAssignmentFromDb);

  // Fetch all referenced crew members in one query
  const crewMemberIds = [...new Set(assignments.map((a) => a.crewMemberId))];
  const crewMap = new Map<string, CrewMember>();

  if (crewMemberIds.length > 0) {
    const { data: crewRows, error: crewError } = await supabase
      .from('crew_members')
      .select('*')
      .in('id', crewMemberIds);

    if (crewError) {
      throw new Error(`Failed to fetch crew members: ${crewError.message}`);
    }

    for (const row of crewRows || []) {
      const member = parseCrewMemberFromDb(row);
      crewMap.set(member.id, member);
    }
  }

  // 4. Resolve cast entity IDs to names via Neo4j
  const allCastIds = [...new Set(scenes.flatMap((s) => s.castEntityIds))];
  const castNameMap = new Map<string, string>();

  if (allCastIds.length > 0) {
    try {
      const entities = await getEntitiesByIds(allCastIds);
      for (const entity of entities) {
        castNameMap.set(entity.id, entity.name);
      }
    } catch {
      // Neo4j unavailable — fall back to raw IDs
      console.warn('Neo4j unavailable for cast name resolution, using raw IDs');
    }
  }

  // 5. Build entries
  const entries: CallSheetEntry[] = scenes.map((scene) => {
    const sceneAssignments = assignments.filter((a) => a.sceneId === scene.id);

    const crewAssignments = sceneAssignments.map((a) => {
      const crew = crewMap.get(a.crewMemberId);
      return {
        crewName: crew?.name || a.crewMemberId,
        role: a.role,
        notes: a.notes,
      };
    });

    const castNames = scene.castEntityIds.map(
      (id) => castNameMap.get(id) || id
    );

    return { scene, crewAssignments, castNames };
  });

  return {
    productionName: production.name,
    date,
    entries,
    generalNotes: production.notes,
  };
}
