/**
 * Lifecycle Engine Seed Script
 *
 * Seeds the lifecycle engine tables with default asset types, stages,
 * and asset instances derived from Diaries S7 production data.
 *
 * Run with: npm run seed:lifecycle
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { diariesS7Data } from './diaries-s7';

// ============================================
// Supabase Client (service role — bypasses RLS)
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { productionId, contracts, scenes } = diariesS7Data;

// ============================================
// Asset Type + Stage Definitions
// ============================================

interface StageDef {
  name: string;
  slug: string;
  stageOrder: number;
  isInitial?: boolean;
  isTerminal?: boolean;
  color: string;
}

interface AssetTypeDef {
  name: string;
  slug: string;
  icon: string;
  color: string;
  sourceTable: string | null;
  stages: StageDef[];
}

const assetTypeDefs: AssetTypeDef[] = [
  {
    name: 'Contract',
    slug: 'contract',
    icon: 'FileCheck',
    color: '#10b981',
    sourceTable: 'cast_contracts',
    stages: [
      { name: 'Draft', slug: 'draft', stageOrder: 0, isInitial: true, color: '#6b7280' },
      { name: 'Sent', slug: 'sent', stageOrder: 1, color: '#3b82f6' },
      { name: 'Negotiating', slug: 'negotiating', stageOrder: 2, color: '#f59e0b' },
      { name: 'Signed', slug: 'signed', stageOrder: 3, color: '#10b981' },
      { name: 'Active', slug: 'active', stageOrder: 4, color: '#8b5cf6' },
      { name: 'Complete', slug: 'complete', stageOrder: 5, isTerminal: true, color: '#22c55e' },
    ],
  },
  {
    name: 'Shoot',
    slug: 'shoot',
    icon: 'Video',
    color: '#3b82f6',
    sourceTable: 'scenes',
    stages: [
      { name: 'Proposed', slug: 'proposed', stageOrder: 0, isInitial: true, color: '#6b7280' },
      { name: 'Scheduled', slug: 'scheduled', stageOrder: 1, color: '#3b82f6' },
      { name: 'Crew Assigned', slug: 'crew-assigned', stageOrder: 2, color: '#8b5cf6' },
      { name: 'Shot', slug: 'shot', stageOrder: 3, color: '#f59e0b' },
      { name: 'Footage Uploaded', slug: 'footage-uploaded', stageOrder: 4, color: '#10b981' },
      { name: 'Logged', slug: 'logged', stageOrder: 5, isTerminal: true, color: '#22c55e' },
    ],
  },
  {
    name: 'Deliverable',
    slug: 'deliverable',
    icon: 'Package',
    color: '#f59e0b',
    sourceTable: null,
    stages: [
      { name: 'Defined', slug: 'defined', stageOrder: 0, isInitial: true, color: '#6b7280' },
      { name: 'In Progress', slug: 'in-progress', stageOrder: 1, color: '#3b82f6' },
      { name: 'Review', slug: 'review', stageOrder: 2, color: '#f59e0b' },
      { name: 'Approved', slug: 'approved', stageOrder: 3, color: '#10b981' },
      { name: 'Shipped', slug: 'shipped', stageOrder: 4, isTerminal: true, color: '#22c55e' },
    ],
  },
];

// ============================================
// Clear existing lifecycle data
// ============================================

async function clearLifecycleData() {
  console.log('Clearing existing lifecycle data for production...');

  // Delete in dependency order: transitions -> instances -> stages -> types
  // Get asset type IDs for this production first
  const { data: existingTypes } = await supabase
    .from('asset_types')
    .select('id')
    .eq('production_id', productionId);

  if (existingTypes && existingTypes.length > 0) {
    const typeIds = existingTypes.map((t) => t.id);

    // Delete asset instances (cascade deletes transitions)
    await supabase
      .from('asset_instances')
      .delete()
      .eq('production_id', productionId);

    // Delete allowed transitions
    await supabase
      .from('allowed_transitions')
      .delete()
      .in('asset_type_id', typeIds);

    // Delete lifecycle stages
    await supabase
      .from('lifecycle_stages')
      .delete()
      .in('asset_type_id', typeIds);

    // Delete asset types
    await supabase
      .from('asset_types')
      .delete()
      .eq('production_id', productionId);
  }

  console.log('  Cleared.');
}

// ============================================
// Seed asset types and stages
// ============================================

/** Map of asset type slug -> { typeId, stages: Map<stageSlug, stageId> } */
interface SeededType {
  typeId: string;
  stages: Map<string, string>;
}

async function seedAssetTypesAndStages(): Promise<Map<string, SeededType>> {
  console.log('Seeding asset types and stages...');

  const result = new Map<string, SeededType>();

  for (const typeDef of assetTypeDefs) {
    // Insert asset type
    const { data: assetType, error: typeError } = await supabase
      .from('asset_types')
      .insert({
        production_id: productionId,
        name: typeDef.name,
        slug: typeDef.slug,
        icon: typeDef.icon,
        color: typeDef.color,
        source_table: typeDef.sourceTable,
        is_default: true,
        sort_order: assetTypeDefs.indexOf(typeDef),
      })
      .select('id')
      .single();

    if (typeError || !assetType) {
      console.error(`  Error creating asset type "${typeDef.name}":`, typeError?.message);
      throw typeError;
    }

    console.log(`  Asset type: ${typeDef.name} (${assetType.id})`);

    // Insert stages
    const stageMap = new Map<string, string>();

    for (const stageDef of typeDef.stages) {
      const { data: stage, error: stageError } = await supabase
        .from('lifecycle_stages')
        .insert({
          asset_type_id: assetType.id,
          name: stageDef.name,
          slug: stageDef.slug,
          stage_order: stageDef.stageOrder,
          is_initial: stageDef.isInitial ?? false,
          is_terminal: stageDef.isTerminal ?? false,
          color: stageDef.color,
        })
        .select('id')
        .single();

      if (stageError || !stage) {
        console.error(`    Error creating stage "${stageDef.name}":`, stageError?.message);
        throw stageError;
      }

      stageMap.set(stageDef.slug, stage.id);
    }

    console.log(`    ${typeDef.stages.length} stages created`);

    result.set(typeDef.slug, { typeId: assetType.id, stages: stageMap });
  }

  return result;
}

// ============================================
// Map contract status to lifecycle stage slug
// ============================================

function mapContractToStageSlug(contract: (typeof contracts)[number]): string {
  const allDone =
    contract.shootDone &&
    contract.interviewDone &&
    contract.pickupDone &&
    contract.paymentDone;

  const anyDone =
    contract.shootDone ||
    contract.interviewDone ||
    contract.pickupDone ||
    contract.paymentDone;

  // Check completion first
  if (allDone) return 'complete';
  if (contract.contractStatus === 'signed' && anyDone) return 'active';

  // Map raw status
  switch (contract.contractStatus) {
    case 'signed':
      return 'signed';
    case 'pending':
      return 'negotiating';
    case 'offer_sent':
      return 'sent';
    case 'email_sent':
      return 'sent';
    case 'dnc':
      return 'draft';
    case 'declined':
      return 'draft';
    default:
      return 'draft';
  }
}

// ============================================
// Map scene status to lifecycle stage slug
// ============================================

function mapSceneToStageSlug(scene: (typeof scenes)[number]): string {
  switch (scene.status) {
    case 'scheduled':
      return 'scheduled';
    case 'shot':
      return 'shot';
    case 'self_shot':
      return 'shot';
    case 'cancelled':
      return 'proposed';
    case 'postponed':
      return 'proposed';
    default:
      return 'proposed';
  }
}

// ============================================
// Seed asset instances + initial transitions
// ============================================

async function seedContractInstances(typeInfo: SeededType): Promise<number> {
  console.log('Seeding contract asset instances...');

  let count = 0;

  for (const contract of contracts) {
    const stageSlug = mapContractToStageSlug(contract);
    const stageId = typeInfo.stages.get(stageSlug);

    if (!stageId) {
      console.error(`  Stage slug "${stageSlug}" not found for contract ${contract.id}`);
      continue;
    }

    const isComplete = stageSlug === 'complete';

    const { data: instance, error: instanceError } = await supabase
      .from('asset_instances')
      .insert({
        production_id: productionId,
        asset_type_id: typeInfo.typeId,
        name: `${contract.castEntityId} Contract`,
        current_stage_id: stageId,
        source_type: 'cast_contract',
        source_id: contract.id,
        metadata: {
          contractStatus: contract.contractStatus,
          paymentType: contract.paymentType,
          shootDone: contract.shootDone,
          interviewDone: contract.interviewDone,
          pickupDone: contract.pickupDone,
          paymentDone: contract.paymentDone,
        },
        completed_at: isComplete ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (instanceError || !instance) {
      console.error(`  Error creating contract instance for ${contract.castEntityId}:`, instanceError?.message);
      throw instanceError;
    }

    // Create initial transition (from null -> mapped stage)
    const { error: transError } = await supabase
      .from('stage_transitions')
      .insert({
        asset_instance_id: instance.id,
        from_stage_id: null,
        to_stage_id: stageId,
        transitioned_by_name: 'Seed Script',
        reason: `Initial state from contract status: ${contract.contractStatus}`,
        automated: true,
      });

    if (transError) {
      console.error(`  Error creating transition for ${contract.castEntityId}:`, transError.message);
      throw transError;
    }

    count++;
  }

  console.log(`  ${count} contract instances created`);
  return count;
}

async function seedShootInstances(typeInfo: SeededType): Promise<number> {
  console.log('Seeding shoot asset instances...');

  let count = 0;

  for (const scene of scenes) {
    const stageSlug = mapSceneToStageSlug(scene);
    const stageId = typeInfo.stages.get(stageSlug);

    if (!stageId) {
      console.error(`  Stage slug "${stageSlug}" not found for scene ${scene.id}`);
      continue;
    }

    const { data: instance, error: instanceError } = await supabase
      .from('asset_instances')
      .insert({
        production_id: productionId,
        asset_type_id: typeInfo.typeId,
        name: `${scene.sceneNumber} ${scene.title}`,
        current_stage_id: stageId,
        source_type: 'scene',
        source_id: scene.id,
        metadata: {
          sceneNumber: scene.sceneNumber,
          scheduledDate: scene.scheduledDate,
          location: scene.location,
          isSelfShot: scene.isSelfShot,
          castEntityIds: scene.castEntityIds,
        },
      })
      .select('id')
      .single();

    if (instanceError || !instance) {
      console.error(`  Error creating shoot instance for ${scene.sceneNumber}:`, instanceError?.message);
      throw instanceError;
    }

    // Create initial transition
    const { error: transError } = await supabase
      .from('stage_transitions')
      .insert({
        asset_instance_id: instance.id,
        from_stage_id: null,
        to_stage_id: stageId,
        transitioned_by_name: 'Seed Script',
        reason: `Initial state from scene status: ${scene.status}`,
        automated: true,
      });

    if (transError) {
      console.error(`  Error creating transition for ${scene.sceneNumber}:`, transError.message);
      throw transError;
    }

    count++;
  }

  console.log(`  ${count} shoot instances created`);
  return count;
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('\nDiaries S7 — Lifecycle Engine Seed\n');
  console.log('=====================================\n');

  try {
    await clearLifecycleData();

    const typeMap = await seedAssetTypesAndStages();

    const contractType = typeMap.get('contract');
    const shootType = typeMap.get('shoot');

    if (!contractType || !shootType) {
      throw new Error('Failed to create required asset types');
    }

    const contractCount = await seedContractInstances(contractType);
    const shootCount = await seedShootInstances(shootType);

    console.log('\nLifecycle seeding complete!\n');
    console.log('Summary:');
    console.log(`  Production:         ${productionId}`);
    console.log(`  Asset types:        ${assetTypeDefs.length}`);
    console.log(`  Total stages:       ${assetTypeDefs.reduce((sum, t) => sum + t.stages.length, 0)}`);
    console.log(`  Contract instances:  ${contractCount}`);
    console.log(`  Shoot instances:     ${shootCount}`);
    console.log(`  Total instances:     ${contractCount + shootCount}`);
    console.log(`  Transitions:         ${contractCount + shootCount} (initial)`);
    console.log('');
  } catch (error) {
    console.error('\nSeeding failed:', error);
    process.exit(1);
  }
}

main();
