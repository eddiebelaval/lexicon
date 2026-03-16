/**
 * Supabase-only seeder for Diaries S7 production data
 * Skips Neo4j entirely — seeds universe, production, crew, scenes, contracts
 * Run: npx tsx seed/seed-supabase.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const UNIVERSE_ID = '22222222-2222-2222-2222-222222222222';
const PRODUCTION_ID = '33333333-3333-3333-3333-333333333333';
const OWNER_ID = '3f1e2fc1-aef2-4b2e-8592-15597ca94b17';

async function seed() {
  console.log('Seeding Diaries S7 to Supabase...\n');

  // 1. Universe
  console.log('1. Creating universe...');
  const { error: uErr } = await supabase.from('universes').upsert({
    id: UNIVERSE_ID,
    name: 'Diaries Season 7',
    description: '90 Day Fiance: Diaries — production universe for scheduling, tracking, and cast management',
    owner_id: OWNER_ID,
    is_public: true,
    entity_count: 15,
    relationship_count: 7,
  });
  if (uErr) console.error('  Universe error:', uErr.message);
  else console.log('  Universe created');

  // 2. Production
  console.log('2. Creating production...');
  const { error: pErr } = await supabase.from('productions').upsert({
    id: PRODUCTION_ID,
    universe_id: UNIVERSE_ID,
    name: 'Diaries Season 7',
    season: 'Season 7',
    status: 'active',
    start_date: '2025-09-01',
    end_date: '2026-03-31',
    created_by: OWNER_ID,
  });
  if (pErr) console.error('  Production error:', pErr.message);
  else console.log('  Production created');

  // 3. Crew
  console.log('3. Seeding crew...');
  const crewData = [
    { name: 'Ian', role: 'ac', contact_email: 'ian@production.tv' },
    { name: 'Stephanie', role: 'ac', contact_email: 'steph@production.tv' },
    { name: 'Ryan', role: 'ac', contact_email: 'ryan@production.tv' },
    { name: 'Andrew', role: 'ac', contact_email: 'andrew@production.tv' },
    { name: 'Brendan', role: 'ac', contact_email: 'brendan@production.tv' },
    { name: 'Curt', role: 'producer', contact_email: 'curt@production.tv' },
    { name: 'Josh P', role: 'ac', contact_email: 'joshp@production.tv' },
    { name: 'Chris', role: 'ac', contact_email: 'chris@production.tv' },
    { name: 'Sed', role: 'coordinator', contact_email: 'sed@production.tv' },
    { name: 'Jerry', role: 'fixer', contact_email: 'jerry@production.tv' },
  ].map(c => ({ ...c, production_id: PRODUCTION_ID }));

  const { error: cErr } = await supabase.from('crew_members').insert(crewData);
  if (cErr) console.error('  Crew error:', cErr.message);
  else console.log(`  ${crewData.length} crew members created`);

  // 4. Scenes
  console.log('4. Seeding scenes...');
  const scenesData = [
    { scene_number: 'D7-001', title: 'Chantel apartment move-in', description: 'Chantel settles into her new apartment in Atlanta after the separation.', cast_entity_ids: ['cast-chantel'], scheduled_date: '2025-09-15', scheduled_time: '10:00', location: 'Atlanta, GA', status: 'shot' },
    { scene_number: 'D7-002', title: 'Kobe & Emily family dinner', description: 'Kobe and Emily host a family dinner to discuss future plans.', cast_entity_ids: ['cast-kobe', 'cast-emily'], scheduled_date: '2025-09-22', scheduled_time: '17:00', location: 'Salina, KS', status: 'shot', equipment_notes: 'Two-camera setup' },
    { scene_number: 'D7-003', title: 'Jasmine therapy session', description: 'Jasmine attends a solo therapy session.', cast_entity_ids: ['cast-jasmine'], scheduled_date: '2025-10-01', scheduled_time: '14:00', location: 'Panama City, Panama', status: 'shot', equipment_notes: 'Audio priority - lavaliers required' },
    { scene_number: 'D7-004', title: 'Matt confrontation call', description: 'Matt has a heated video call about trust and boundaries.', cast_entity_ids: ['cast-matt'], scheduled_date: '2025-10-08', scheduled_time: '20:00', location: 'Phoenix, AZ', status: 'shot' },
    { scene_number: 'D7-005', title: 'Tyray arrives in country', description: 'Tyray lands at the airport for his first in-person meeting.', cast_entity_ids: ['cast-tyray'], scheduled_date: '2025-10-14', scheduled_time: '08:00', location: 'Columbia, SC', status: 'shot', equipment_notes: 'Airport permits secured. Handheld only.' },
    { scene_number: 'D7-006', title: 'Cleo night out with friends', description: 'Cleo goes out with friends in Queens.', cast_entity_ids: ['cast-cleo'], scheduled_date: '2025-10-20', scheduled_time: '21:00', location: 'Queens, NY', status: 'shot' },
    { scene_number: 'D7-007', title: 'Kenny & Armando anniversary', description: 'Kenny and Armando celebrate their anniversary.', cast_entity_ids: ['cast-kenny', 'cast-armando'], scheduled_date: '2025-11-03', scheduled_time: '19:00', location: 'Cabo San Lucas, Mexico', status: 'shot', equipment_notes: 'Drone approved for exteriors' },
    { scene_number: 'D7-008', title: 'Loren & Alex baby prep', description: 'Loren and Alex prepare the nursery.', cast_entity_ids: ['cast-loren', 'cast-alex'], scheduled_date: '2025-11-10', scheduled_time: '11:00', location: 'Hollywood, FL', status: 'shot' },
    { scene_number: 'D7-009', title: 'Brandon farm day', description: 'Brandon works on the farm and discusses independence with Julia.', cast_entity_ids: ['cast-brandon', 'cast-julia'], scheduled_date: '2025-11-18', scheduled_time: '07:00', location: 'Dinwiddie, VA', status: 'shot' },
    { scene_number: 'D7-010', title: 'Tiffany single mom morning', description: 'Tiffany navigates a typical morning as a single parent.', cast_entity_ids: ['cast-tiffany'], scheduled_date: '2025-12-02', scheduled_time: '06:30', location: 'Frederick, MD', status: 'shot' },
    { scene_number: 'D7-011', title: 'Caesar video date', description: 'Caesar goes on a video date with a new prospect.', cast_entity_ids: ['cast-caesar'], scheduled_date: '2025-12-10', scheduled_time: '19:00', location: 'Jacksonville, NC', status: 'shot' },
    { scene_number: 'D7-012', title: 'Chantel & Ashley girls trip planning', description: 'Chantel and Ashley plan a girls trip getaway.', cast_entity_ids: ['cast-chantel'], scheduled_date: '2026-01-06', scheduled_time: '14:00', location: 'Atlanta, GA', status: 'scheduled' },
    { scene_number: 'D7-013', title: 'Kenny & Armando visa interview', description: 'Kenny and Armando attend their visa interview.', cast_entity_ids: ['cast-kenny', 'cast-armando'], scheduled_date: '2026-01-15', scheduled_time: '10:00', location: 'Ciudad Juarez, Mexico', status: 'scheduled', equipment_notes: 'No filming inside consulate' },
    { scene_number: 'D7-014', title: 'Jasmine & Matt reconciliation dinner', description: 'Jasmine and Matt attempt to reconcile over dinner.', cast_entity_ids: ['cast-jasmine', 'cast-matt'], scheduled_date: '2026-01-22', scheduled_time: '19:00', location: 'Dunedin, FL', status: 'scheduled' },
    { scene_number: 'D7-015', title: 'Tyray surgery consultation', description: 'Tyray consults with a surgeon about a procedure.', cast_entity_ids: ['cast-tyray'], scheduled_date: '2026-02-03', scheduled_time: '09:00', location: 'San Francisco, CA', status: 'scheduled' },
    { scene_number: 'D7-016', title: 'Emily & Kobe pickup interview', description: 'Pickup interview with Emily and Kobe.', cast_entity_ids: ['cast-emily', 'cast-kobe'], scheduled_date: '2026-02-10', scheduled_time: '18:00', location: 'Salina, KS', status: 'scheduled' },
    { scene_number: 'D7-017', title: 'Cleo UK content shoot', description: 'Cleo does a content shoot in the UK.', cast_entity_ids: ['cast-cleo'], scheduled_date: '2026-02-17', scheduled_time: '15:00', location: 'London, UK', status: 'scheduled' },
    { scene_number: 'D7-018', title: 'Brandon & Julia baby shower', description: 'Brandon and Julia host a baby shower.', cast_entity_ids: ['cast-brandon', 'cast-julia'], scheduled_date: '2026-02-24', scheduled_time: '12:00', location: 'Norfolk, VA', status: 'scheduled' },
    { scene_number: 'D7-019', title: 'Loren & Alex interview', description: 'Final interview segment with Loren and Alex.', cast_entity_ids: ['cast-loren', 'cast-alex'], scheduled_date: '2026-03-03', scheduled_time: '11:00', location: 'Hollywood, FL', status: 'scheduled' },
    { scene_number: 'D7-020', title: 'Caesar pickup interview', description: 'Caesar final pickup interview.', cast_entity_ids: ['cast-caesar'], scheduled_date: '2026-03-10', scheduled_time: '12:00', location: 'Jacksonville, NC', status: 'scheduled' },
  ].map(s => ({ ...s, production_id: PRODUCTION_ID }));

  const { error: sErr } = await supabase.from('scenes').insert(scenesData);
  if (sErr) console.error('  Scenes error:', sErr.message);
  else console.log(`  ${scenesData.length} scenes created`);

  // 5. Cast contracts
  console.log('5. Seeding cast contracts...');
  const contractsData = [
    { cast_entity_id: 'cast-chantel', contract_status: 'signed', payment_type: 'flat', shoot_done: true, interview_done: true, pickup_done: true, payment_done: true },
    { cast_entity_id: 'cast-kobe', contract_status: 'signed', payment_type: 'flat', shoot_done: true, interview_done: true, pickup_done: false, payment_done: false },
    { cast_entity_id: 'cast-emily', contract_status: 'signed', payment_type: 'flat', shoot_done: true, interview_done: true, pickup_done: false, payment_done: false },
    { cast_entity_id: 'cast-jasmine', contract_status: 'signed', payment_type: 'daily', shoot_done: true, interview_done: false, pickup_done: false, payment_done: false },
    { cast_entity_id: 'cast-matt', contract_status: 'signed', payment_type: 'daily', shoot_done: true, interview_done: false, pickup_done: false, payment_done: false },
    { cast_entity_id: 'cast-tyray', contract_status: 'signed', payment_type: 'flat', shoot_done: true, interview_done: true, pickup_done: true, payment_done: false },
    { cast_entity_id: 'cast-cleo', contract_status: 'signed', payment_type: 'flat', shoot_done: true, interview_done: true, pickup_done: false, payment_done: false },
    { cast_entity_id: 'cast-kenny', contract_status: 'signed', payment_type: 'flat', shoot_done: true, interview_done: true, pickup_done: true, payment_done: true },
    { cast_entity_id: 'cast-armando', contract_status: 'email_sent', payment_type: null, shoot_done: false, interview_done: false, pickup_done: false, payment_done: false },
    { cast_entity_id: 'cast-loren', contract_status: 'signed', payment_type: 'daily', shoot_done: true, interview_done: false, pickup_done: false, payment_done: false },
    { cast_entity_id: 'cast-alex', contract_status: 'signed', payment_type: 'daily', shoot_done: true, interview_done: false, pickup_done: false, payment_done: false },
    { cast_entity_id: 'cast-brandon', contract_status: 'signed', payment_type: 'daily', shoot_done: true, interview_done: true, pickup_done: false, payment_done: false },
    { cast_entity_id: 'cast-julia', contract_status: 'pending', payment_type: null, shoot_done: false, interview_done: false, pickup_done: false, payment_done: false },
    { cast_entity_id: 'cast-tiffany', contract_status: 'offer_sent', payment_type: null, shoot_done: false, interview_done: false, pickup_done: false, payment_done: false },
    { cast_entity_id: 'cast-caesar', contract_status: 'dnc', payment_type: null, shoot_done: false, interview_done: false, pickup_done: false, payment_done: false },
  ].map(c => ({ ...c, production_id: PRODUCTION_ID }));

  const { error: ctErr } = await supabase.from('cast_contracts').insert(contractsData);
  if (ctErr) console.error('  Contracts error:', ctErr.message);
  else console.log(`  ${contractsData.length} cast contracts created`);

  // 6. Crew availability (sample week)
  console.log('6. Seeding crew availability...');
  const { data: crewRows } = await supabase.from('crew_members').select('id, name').eq('production_id', PRODUCTION_ID);
  if (crewRows && crewRows.length > 0) {
    const dates = ['2026-01-13', '2026-01-14', '2026-01-15', '2026-01-16', '2026-01-17'];
    const statuses = ['available', 'available', 'booked', 'available', 'ooo'];
    const availData: { crew_member_id: string; date: string; status: string }[] = [];

    for (const crew of crewRows) {
      for (let i = 0; i < dates.length; i++) {
        availData.push({
          crew_member_id: crew.id,
          date: dates[i],
          status: statuses[(crewRows.indexOf(crew) + i) % statuses.length],
        });
      }
    }

    const { error: aErr } = await supabase.from('crew_availability').insert(availData);
    if (aErr) console.error('  Availability error:', aErr.message);
    else console.log(`  ${availData.length} availability entries created`);
  }

  // Summary
  console.log('\n================================');
  console.log('Seed complete!');
  console.log('================================');
  console.log(`Universe: ${UNIVERSE_ID}`);
  console.log(`Production: ${PRODUCTION_ID}`);
  console.log(`Crew: 10 members`);
  console.log(`Scenes: 20 (11 shot, 9 scheduled)`);
  console.log(`Contracts: 15 (mixed statuses)`);
  console.log(`\nLexi is ready. Try: "What's left for Chantel?"\n`);
}

seed().catch(console.error);
