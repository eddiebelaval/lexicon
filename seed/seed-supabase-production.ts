/**
 * Supabase Production Seed Script
 *
 * Seeds the Supabase production tables with Diaries S7 data.
 * The Neo4j seed (diaries-s7.ts) handles cast entities and relationships.
 * This script handles: production, scenes, crew, contracts, crew availability.
 *
 * Run with: npm run seed:supabase-production
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

const { universeId, productionId, scenes, crew, contracts, crewAvailability } =
  diariesS7Data;

// ============================================
// Clear existing data
// ============================================

async function clearProductionData() {
  console.log('Clearing existing production data...');

  // Delete our specific production (cascade handles children via FK)
  // But Supabase doesn't auto-cascade deletes through RLS, so delete children first
  const crewIds = crew.map((c) => c.id);

  // Children of scenes
  await supabase.from('upload_tasks').delete().in('scene_id', scenes.map((s) => s.id));
  await supabase.from('scene_assignments').delete().in('scene_id', scenes.map((s) => s.id));

  // Children of production
  await supabase.from('crew_availability').delete().in('crew_member_id', crewIds);
  await supabase.from('cast_contracts').delete().eq('production_id', productionId);
  await supabase.from('scenes').delete().eq('production_id', productionId);
  await supabase.from('crew_members').delete().eq('production_id', productionId);
  await supabase.from('productions').delete().eq('id', productionId);

  console.log('Cleared.');
}

// ============================================
// Seed functions
// ============================================

async function seedProduction() {
  console.log('Seeding production...');

  const { error } = await supabase.from('productions').insert({
    id: productionId,
    universe_id: universeId,
    name: '90 Day Fiance: The Diaries',
    season: 'Season 7',
    status: 'active',
    start_date: '2025-09-01',
    end_date: '2026-04-30',
    notes: 'Seed data for development. Based on production calendar structure.',
  });

  if (error) {
    console.error('Error seeding production:', error.message);
    throw error;
  }

  console.log('  Production created: Diaries S7');
}

async function seedCrewMembers() {
  console.log('Seeding crew members...');

  const rows = crew.map((c) => ({
    id: c.id,
    production_id: productionId,
    name: c.name,
    role: c.role,
    contact_email: c.contactEmail,
    contact_phone: c.contactPhone,
    is_active: true,
  }));

  const { error } = await supabase.from('crew_members').insert(rows);

  if (error) {
    console.error('Error seeding crew:', error.message);
    throw error;
  }

  console.log(`  ${rows.length} crew members created`);
}

async function seedScenes() {
  console.log('Seeding scenes...');

  const rows = scenes.map((s) => ({
    id: s.id,
    production_id: productionId,
    scene_number: s.sceneNumber,
    title: s.title,
    description: s.description,
    cast_entity_ids: JSON.stringify(s.castEntityIds),
    scheduled_date: s.scheduledDate,
    scheduled_time: s.scheduledTime,
    location: s.location,
    location_details: s.locationDetails,
    status: s.status,
    equipment_notes: s.equipmentNotes,
    is_self_shot: s.isSelfShot,
  }));

  const { error } = await supabase.from('scenes').insert(rows);

  if (error) {
    console.error('Error seeding scenes:', error.message);
    throw error;
  }

  console.log(`  ${rows.length} scenes created`);
}

async function seedCastContracts() {
  console.log('Seeding cast contracts...');

  const rows = contracts.map((c) => ({
    id: c.id,
    production_id: productionId,
    cast_entity_id: c.castEntityId,
    contract_status: c.contractStatus,
    payment_type: c.paymentType,
    shoot_done: c.shootDone,
    interview_done: c.interviewDone,
    pickup_done: c.pickupDone,
    payment_done: c.paymentDone,
    notes: c.notes,
  }));

  const { error } = await supabase.from('cast_contracts').insert(rows);

  if (error) {
    console.error('Error seeding contracts:', error.message);
    throw error;
  }

  console.log(`  ${rows.length} cast contracts created`);
}

async function seedCrewAvailability() {
  console.log('Seeding crew availability...');

  const rows = crewAvailability.map((a) => ({
    crew_member_id: a.crewMemberId,
    date: a.date,
    status: a.status,
    notes: a.notes,
  }));

  const { error } = await supabase.from('crew_availability').insert(rows);

  if (error) {
    console.error('Error seeding availability:', error.message);
    throw error;
  }

  console.log(`  ${rows.length} availability entries created`);
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('\nDiaries S7 — Supabase Production Seed\n');
  console.log('=====================================\n');

  try {
    // Ensure the universe exists first
    const { data: universe } = await supabase
      .from('universes')
      .select('id')
      .eq('id', universeId)
      .single();

    if (!universe) {
      console.log('Creating Diaries universe...');
      const { error } = await supabase.from('universes').insert({
        id: universeId,
        name: '90 Day Fiance: The Diaries',
        description: 'Production universe for Diaries Season 7. Cast, crew, scenes, and scheduling.',
        is_public: false,
      });

      if (error) {
        console.error('Error creating universe:', error.message);
        // Try upsert if unique constraint
        if (error.code === '23505') {
          console.log('Universe already exists, continuing...');
        } else {
          throw error;
        }
      }
    } else {
      console.log('Universe exists, proceeding...');
    }

    await clearProductionData();
    await seedProduction();
    await seedCrewMembers();
    await seedScenes();
    await seedCastContracts();
    await seedCrewAvailability();

    console.log('\nSupabase seeding complete!\n');
    console.log('Summary:');
    console.log(`  Universe:     ${universeId}`);
    console.log(`  Production:   ${productionId}`);
    console.log(`  Crew:         ${crew.length}`);
    console.log(`  Scenes:       ${scenes.length}`);
    console.log(`  Contracts:    ${contracts.length}`);
    console.log(`  Availability: ${crewAvailability.length}`);
    console.log('\nRun "npm run seed:diaries" separately to seed Neo4j cast entities.\n');
  } catch (error) {
    console.error('\nSeeding failed:', error);
    process.exit(1);
  }
}

main();
