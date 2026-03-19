/**
 * Import Diaries S7 Production Calendar (Excel)
 *
 * Reads the live production Excel and imports into Lexicon's Supabase.
 * Bypasses Neo4j (may be hibernated) — uses fallback entity IDs.
 * Uses service role key to bypass RLS.
 *
 * Usage: cd ~/Development/id8/lexicon && npx tsx scripts/import-diaries-s7.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load env from .env.local
config({ path: path.join(__dirname, '..', '.env.local') });

const EXCEL_PATH = path.join(
  process.env.HOME || '',
  'Downloads/DIA_S7_Prod Calendar 9.4.xlsx'
);

// ============================================
// Supabase client (service role — bypasses RLS)
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// Status mapping: Excel → Lexicon
// ============================================

type ContractStatus = 'pending' | 'signed' | 'active' | 'complete' | 'cancelled';

// DB constraint: contract_status IN ('signed', 'pending', 'offer_sent', 'dnc', 'email_sent', 'declined')
function mapShootStatus(raw: string): {
  contractStatus: ContractStatus;
  shootDone: boolean;
  interviewDone: boolean;
  pickupDone: boolean;
} {
  const lower = raw.toLowerCase().trim();

  if (lower.includes('pick ups done') || lower.includes('pickups done')) {
    return { contractStatus: 'signed', shootDone: true, interviewDone: true, pickupDone: true };
  }
  if (lower.includes('principal filming done') || lower.includes('principal done')) {
    return { contractStatus: 'signed', shootDone: true, interviewDone: true, pickupDone: false };
  }
  if (lower.includes('currently shooting')) {
    return { contractStatus: 'signed', shootDone: false, interviewDone: false, pickupDone: false };
  }
  if (lower.includes('contract signed') || lower.includes('signed')) {
    return { contractStatus: 'signed', shootDone: false, interviewDone: false, pickupDone: false };
  }
  if (lower.includes('email sent')) {
    return { contractStatus: 'email_sent', shootDone: false, interviewDone: false, pickupDone: false };
  }
  if (lower.includes('offer sent') || lower.includes('offer')) {
    return { contractStatus: 'offer_sent', shootDone: false, interviewDone: false, pickupDone: false };
  }
  if (lower.includes('dnc') || lower.includes('do not call')) {
    return { contractStatus: 'dnc', shootDone: false, interviewDone: false, pickupDone: false };
  }
  if (lower.includes('declined')) {
    return { contractStatus: 'declined', shootDone: false, interviewDone: false, pickupDone: false };
  }

  // Default: interested, hold, reaching out, no status → pending
  return { contractStatus: 'pending', shootDone: false, interviewDone: false, pickupDone: false };
}

function mapPaymentType(raw: string): 'daily' | 'flat' | null {
  const lower = raw.toLowerCase().trim();
  if (lower.includes('daily') || lower.includes('day rate')) return 'daily';
  if (lower.includes('flat')) return 'flat';
  return null;
}

// ============================================
// Parse Excel sheets
// ============================================

interface CastMember {
  name: string;
  shootStatus: string;
  producer: string;
  scenesShot: string;
  scenesToShoot: string;
  beatSheetStatus: string;
  city: string;
  segments: number;
  contractStatus: ContractStatus;
  shootDone: boolean;
  interviewDone: boolean;
  pickupDone: boolean;
  paymentType: 'daily' | 'flat' | null;
}

interface CrewMember {
  name: string;
  role: string;
  weeks: number | null;
}

interface EpisodeSchedule {
  episodeNumber: string;
  fineCut: string | null;
  notesDue: string | null;
  pictureLock: string | null;
  masterDelivery: string | null;
  airDate: string | null;
}

function excelDateToISO(serial: number): string | null {
  if (!serial || serial < 40000) return null;
  // Excel serial date to JS date
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

function parseTalentTracker(wb: XLSX.WorkBook): CastMember[] {
  const sheet = wb.Sheets['Talent Tracker'];
  if (!sheet) {
    console.error('No "Talent Tracker" sheet found');
    return [];
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const cast: CastMember[] = [];

  // Row 0 is the header: Couple, Shoot Status, Producer, Notes, Scenes Shot, etc.
  // Data starts at row 1
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as (string | number)[];
    if (!row || row.length < 3) continue;

    // Column layout (verified from actual file):
    // [0]=number, [1]=Couple name, [2]=Shoot Status, [3]=Producer,
    // [4]=Notes, [5]=Scenes Shot, [6]=Scenes to Shoot,
    // [7]=Beat Sheet Status, [8]=Cities for B-Roll, [9]=# of Segments
    const couple = String(row[1] || '').trim();
    const status = String(row[2] || '').trim();
    const producer = String(row[3] || '').trim();
    const scenesShot = String(row[5] || '').trim();
    const scenesToShoot = String(row[6] || '').trim();
    const beatSheet = String(row[7] || '').trim();
    const city = String(row[8] || '').trim();
    const segments = Number(row[9]) || 1;

    // Skip empty rows, section headers, and noise
    if (!couple || couple === 'SELECTS' || couple === 'COLOR KEY:') continue;
    if (couple.toUpperCase() === 'DO NOT CALL' || couple.toUpperCase() === 'DNC') continue;
    // Skip if the name is just a number (row number leaking)
    if (/^\d+$/.test(couple)) continue;
    // Clean city — "DONE" or "SENT TO NETWORK" are beat sheet statuses, not cities
    const cityClean = (city === 'DONE' || city.includes('SENT TO') || city.includes('NETWORK'))
      ? '' : city;

    const mapped = mapShootStatus(status);

    // Check for payment type in notes
    const allText = `${scenesShot} ${scenesToShoot} ${status}`;
    const paymentType = mapPaymentType(allText);

    cast.push({
      name: couple,
      shootStatus: status,
      producer,
      scenesShot,
      scenesToShoot,
      beatSheetStatus: beatSheet,
      city: cityClean,
      segments,
      ...mapped,
      paymentType,
    });
  }

  return cast;
}

function parseCastCalendarContracts(wb: XLSX.WorkBook): Map<string, { paymentType: 'daily' | 'flat' | null; signed: boolean }> {
  const sheet = wb.Sheets['Cast Calendar'];
  if (!sheet) return new Map();

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const contracts = new Map<string, { paymentType: 'daily' | 'flat' | null; signed: boolean }>();

  // The Cast Calendar has contract data in the right columns
  // Headers at row 0: ..., Main Cast, Signed, Daily/Flat, Principal Complete, ...
  // We need to scan for cast names paired with payment info
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as (string | number)[];
    if (!row || row.length < 10) continue;

    // Check columns 7+ for cast names with contract data
    // The pattern is: [col] = cast name, [col+1] = signed status, [col+2] = daily/flat
    for (let c = 7; c < row.length - 2; c++) {
      const name = String(row[c] || '').trim();
      const signedVal = String(row[c + 1] || '').trim().toLowerCase();
      const paymentVal = String(row[c + 2] || '').trim().toLowerCase();

      if (name && name.length > 2 && !name.includes('Main Cast') && !name.includes('SUNDAY')) {
        // Clean name — remove producer initials in parens like "Chantel + Ashley (JF)"
        const cleanName = name.replace(/\s*\([^)]*\)\s*$/, '').trim();
        if (cleanName) {
          contracts.set(cleanName.toLowerCase(), {
            paymentType: mapPaymentType(paymentVal),
            signed: signedVal.includes('signed') || signedVal.includes('sign'),
          });
        }
      }
    }
  }

  return contracts;
}

function parseWeeklyScheduleCrew(wb: XLSX.WorkBook): CrewMember[] {
  const sheet = wb.Sheets['Weekly Schedule'];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  if (rows.length < 2) return [];

  // Row 1 has producer names with week counts: "Sarah\n(20 weeks)", "Anthony\n(14 weeks)", etc.
  const crewRow = rows[1] as (string | number)[];
  const crew: CrewMember[] = [];

  for (const cell of crewRow) {
    const val = String(cell || '').trim();
    if (!val) continue;

    // Parse "Name\n(N weeks)" or just "Name"
    const lines = val.split(/[\r\n]+/);
    const name = lines[0].trim();
    if (!name || name.length < 2) continue;

    let weeks: number | null = null;
    if (lines.length > 1) {
      const weekMatch = lines[1].match(/(\d+)\s*weeks?/i);
      if (weekMatch) weeks = parseInt(weekMatch[1]);
    }

    // Filter out column headers that aren't crew
    const nameLower = name.toLowerCase();
    const skipPatterns = [
      'sp ', 'edit ', 'prod weeks', 'edit weeks', 'actual days',
      'post run', 'prep', 'online', 'review', 'delivery', 'air date',
      'count', 'supervising',
    ];
    if (skipPatterns.some(p => nameLower.startsWith(p) || nameLower === p)) continue;

    // Determine role from position and context
    let role = 'producer';
    if (nameLower === 'chris') {
      role = 'staff'; // Supervising producer
    }

    crew.push({ name, role, weeks });
  }

  return crew;
}

function parseKeyEdit(wb: XLSX.WorkBook): EpisodeSchedule[] {
  const sheet = wb.Sheets['Key Edit'];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const episodes: EpisodeSchedule[] = [];

  // Row 2 is headers: EP #, FC, FC Notes Due, PL, PL Notes Due, LC, Master Delivery, Air Date
  // Data starts at row 3
  for (let i = 3; i < rows.length; i++) {
    const row = rows[i] as (string | number)[];
    if (!row || !row[0]) continue;

    const epNum = String(row[0]).trim();
    if (!epNum) continue;

    episodes.push({
      episodeNumber: epNum,
      fineCut: excelDateToISO(Number(row[1])),
      notesDue: excelDateToISO(Number(row[2])),
      pictureLock: excelDateToISO(Number(row[3])),
      masterDelivery: excelDateToISO(Number(row[5])),
      airDate: excelDateToISO(Number(row[6])),
    });
  }

  return episodes;
}

// ============================================
// Supabase insertion
// ============================================

async function importToSupabase(
  cast: CastMember[],
  calendarContracts: Map<string, { paymentType: 'daily' | 'flat' | null; signed: boolean }>,
  crew: CrewMember[],
  episodes: EpisodeSchedule[]
) {
  console.log('\n--- Creating Universe ---');

  // 1. Create universe
  const { data: universe, error: uErr } = await supabase
    .from('universes')
    .insert({
      name: '90 Day: Diaries',
      description: 'Reality TV — Season 7 (S6B + S7)',
      is_public: false,
      owner_id: '5e6b0b3e-26f6-43ca-8586-0e8b6b090c08', // Eddie (eddie@tryhomer.vip)
    })
    .select()
    .single();

  if (uErr) throw new Error(`Universe creation failed: ${uErr.message}`);
  console.log(`  Universe: ${universe.id} — ${universe.name}`);

  // 2. Create production
  const { data: production, error: pErr } = await supabase
    .from('productions')
    .insert({
      universe_id: universe.id,
      name: '90 Day: Diaries S7',
      season: '7',
      status: 'active',
    })
    .select()
    .single();

  if (pErr) throw new Error(`Production creation failed: ${pErr.message}`);
  console.log(`  Production: ${production.id} — ${production.name}`);

  // 3. Create cast contracts
  console.log(`\n--- Importing ${cast.length} Cast Members ---`);
  let castSuccess = 0;

  for (const member of cast) {
    // Merge payment type from Cast Calendar if available
    const calendarData = calendarContracts.get(member.name.toLowerCase());
    const paymentType = member.paymentType || calendarData?.paymentType || null;

    const entityId = `cast-${member.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    const { error } = await supabase
      .from('cast_contracts')
      .insert({
        production_id: production.id,
        cast_entity_id: entityId,
        contract_status: member.contractStatus,
        payment_type: paymentType,
        shoot_done: member.shootDone,
        interview_done: member.interviewDone,
        pickup_done: member.pickupDone,
        payment_done: false,
        notes: [
          member.producer ? `Producer: ${member.producer}` : '',
          member.city ? `City: ${member.city}` : '',
          member.scenesShot ? `Scenes shot: ${member.scenesShot.replace(/\r\n/g, '; ')}` : '',
          member.scenesToShoot ? `To shoot: ${member.scenesToShoot.replace(/\r\n/g, '; ')}` : '',
          member.segments > 1 ? `Segments: ${member.segments}` : '',
        ].filter(Boolean).join('\n'),
      });

    if (error) {
      console.error(`  FAILED: ${member.name} — ${error.message}`);
    } else {
      castSuccess++;
      const statusIcon = member.contractStatus === 'complete' ? '[DONE]'
        : member.contractStatus === 'active' ? '[ACTIVE]'
        : member.contractStatus === 'signed' ? '[SIGNED]'
        : member.contractStatus === 'pending' ? '[PENDING]'
        : '[--]';
      console.log(`  ${statusIcon} ${member.name} — ${member.city || 'no city'} (${member.producer || 'no producer'})`);
    }
  }
  console.log(`  Imported ${castSuccess}/${cast.length} cast members`);

  // 4. Create crew members
  console.log(`\n--- Importing ${crew.length} Crew Members ---`);
  let crewSuccess = 0;

  for (const member of crew) {
    const { error } = await supabase
      .from('crew_members')
      .insert({
        production_id: production.id,
        name: member.name,
        role: member.role,
      });

    if (error) {
      console.error(`  FAILED: ${member.name} — ${error.message}`);
    } else {
      crewSuccess++;
      const weeksStr = member.weeks ? ` (${member.weeks} weeks)` : '';
      console.log(`  ${member.name} — ${member.role}${weeksStr}`);
    }
  }
  console.log(`  Imported ${crewSuccess}/${crew.length} crew members`);

  // 5. Create default asset types + lifecycle stages
  console.log('\n--- Creating Asset Types + Lifecycle Stages ---');
  const assetTypes = [
    {
      name: 'Contract', slug: 'contract', icon: 'FileCheck', color: '#10b981',
      stages: [
        { name: 'Draft', color: '#6b7280', isInitial: true, isTerminal: false },
        { name: 'Sent', color: '#3b82f6', isInitial: false, isTerminal: false },
        { name: 'Negotiating', color: '#f59e0b', isInitial: false, isTerminal: false },
        { name: 'Signed', color: '#10b981', isInitial: false, isTerminal: false },
        { name: 'Active', color: '#8b5cf6', isInitial: false, isTerminal: false },
        { name: 'Complete', color: '#22c55e', isInitial: false, isTerminal: true },
      ],
    },
    {
      name: 'Shoot', slug: 'shoot', icon: 'Video', color: '#3b82f6',
      stages: [
        { name: 'Proposed', color: '#6b7280', isInitial: true, isTerminal: false },
        { name: 'Scheduled', color: '#3b82f6', isInitial: false, isTerminal: false },
        { name: 'Crew Assigned', color: '#8b5cf6', isInitial: false, isTerminal: false },
        { name: 'Shot', color: '#f59e0b', isInitial: false, isTerminal: false },
        { name: 'Footage Uploaded', color: '#10b981', isInitial: false, isTerminal: false },
        { name: 'Logged', color: '#22c55e', isInitial: false, isTerminal: true },
      ],
    },
    {
      name: 'Equipment', slug: 'equipment', icon: 'Camera', color: '#8b5cf6',
      stages: [
        { name: 'At Gear House', color: '#22c55e', isInitial: true, isTerminal: false },
        { name: 'Checked Out', color: '#3b82f6', isInitial: false, isTerminal: false },
        { name: 'On Location', color: '#8b5cf6', isInitial: false, isTerminal: false },
        { name: 'Downloading', color: '#f59e0b', isInitial: false, isTerminal: false },
        { name: 'In Transit', color: '#6366f1', isInitial: false, isTerminal: false },
        { name: 'Returned', color: '#22c55e', isInitial: false, isTerminal: true },
      ],
    },
    {
      name: 'Footage', slug: 'footage', icon: 'Film', color: '#ec4899',
      stages: [
        { name: 'Shot', color: '#6b7280', isInitial: true, isTerminal: false },
        { name: 'Downloaded', color: '#3b82f6', isInitial: false, isTerminal: false },
        { name: 'In Transit', color: '#6366f1', isInitial: false, isTerminal: false },
        { name: 'Uploaded to Sony CI', color: '#8b5cf6', isInitial: false, isTerminal: false },
        { name: 'Delivered to Post', color: '#f59e0b', isInitial: false, isTerminal: false },
        { name: 'In Edit', color: '#ec4899', isInitial: false, isTerminal: false },
        { name: 'Final', color: '#22c55e', isInitial: false, isTerminal: true },
      ],
    },
    {
      name: 'Deliverable', slug: 'deliverable', icon: 'Package', color: '#f59e0b',
      stages: [
        { name: 'Defined', color: '#6b7280', isInitial: true, isTerminal: false },
        { name: 'In Progress', color: '#3b82f6', isInitial: false, isTerminal: false },
        { name: 'Review', color: '#f59e0b', isInitial: false, isTerminal: false },
        { name: 'Approved', color: '#10b981', isInitial: false, isTerminal: false },
        { name: 'Shipped', color: '#22c55e', isInitial: false, isTerminal: true },
      ],
    },
    {
      name: 'Document', slug: 'document', icon: 'FileText', color: '#06b6d4',
      stages: [
        { name: 'Draft', color: '#6b7280', isInitial: true, isTerminal: false },
        { name: 'Sent', color: '#3b82f6', isInitial: false, isTerminal: false },
        { name: 'Acknowledged', color: '#8b5cf6', isInitial: false, isTerminal: false },
        { name: 'Signed', color: '#10b981', isInitial: false, isTerminal: false },
        { name: 'Filed', color: '#22c55e', isInitial: false, isTerminal: true },
      ],
    },
  ];

  for (let i = 0; i < assetTypes.length; i++) {
    const at = assetTypes[i];
    const { data: assetType, error: atErr } = await supabase
      .from('asset_types')
      .insert({
        production_id: production.id,
        name: at.name,
        slug: at.slug,
        icon: at.icon,
        color: at.color,
        sort_order: i,
      })
      .select()
      .single();

    if (atErr) {
      console.error(`  FAILED asset type ${at.name}: ${atErr.message}`);
      continue;
    }

    // Create lifecycle stages for this asset type
    for (let j = 0; j < at.stages.length; j++) {
      const stage = at.stages[j];
      const slug = stage.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { error: stErr } = await supabase
        .from('lifecycle_stages')
        .insert({
          asset_type_id: assetType.id,
          name: stage.name,
          slug,
          stage_order: j,
          is_initial: stage.isInitial,
          is_terminal: stage.isTerminal,
          color: stage.color,
        });

      if (stErr) {
        console.error(`    FAILED stage ${stage.name}: ${stErr.message}`);
      }
    }
    console.log(`  ${at.name}: ${at.stages.length} stages`);
  }

  // 6. Create scenes from Key Edit (episode delivery schedule)
  if (episodes.length > 0) {
    console.log(`\n--- Importing ${episodes.length} Episode Schedules ---`);
    for (const ep of episodes) {
      const { error } = await supabase
        .from('scenes')
        .insert({
          production_id: production.id,
          title: `Episode ${ep.episodeNumber}`,
          scheduled_date: ep.fineCut,
          location: null,
          cast_entity_ids: [],
          description: [
            ep.fineCut ? `Fine Cut: ${ep.fineCut}` : '',
            ep.notesDue ? `Notes Due: ${ep.notesDue}` : '',
            ep.pictureLock ? `Picture Lock: ${ep.pictureLock}` : '',
            ep.masterDelivery ? `Master Delivery: ${ep.masterDelivery}` : '',
            ep.airDate ? `Air Date: ${ep.airDate}` : '',
          ].filter(Boolean).join('\n'),
        });

      if (error) {
        console.error(`  FAILED: Episode ${ep.episodeNumber} — ${error.message}`);
      } else {
        console.log(`  Episode ${ep.episodeNumber} — FC: ${ep.fineCut || 'TBD'}, Delivery: ${ep.masterDelivery || 'TBD'}`);
      }
    }
  }

  // 7. Create individual shoot scenes from Talent Tracker scene notes
  console.log('\n--- Creating Cast Shoot Scenes ---');
  let sceneCount = 0;
  for (const member of cast) {
    if (!member.scenesShot) continue;
    // Parse scene notes: "6/13 - Garden\n6/14 - Zoom\n6/15 - Proposal"
    const lines = member.scenesShot.split(/[\r\n]+/).filter(l => l.trim());
    for (const line of lines) {
      const match = line.match(/^(\d{1,2}\/\d{1,2})\s*[-–]\s*(.+)/);
      if (!match) continue;
      const [, dateStr, description] = match;
      const entityId = `cast-${member.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      // Determine if this is principal or pickup based on member status
      const shootType = member.shootStatus.toLowerCase().includes('pick up')
        ? 'pickup' : 'principal';

      const { error } = await supabase
        .from('scenes')
        .insert({
          production_id: production.id,
          title: `${member.name}: ${description.trim()}`,
          scheduled_date: null,
          location: member.city || null,
          cast_entity_ids: [entityId],
          description: `Date: ${dateStr}\nType: ${shootType}\nProducer: ${member.producer || 'unassigned'}`,
        });

      if (!error) sceneCount++;
    }
  }
  console.log(`  Created ${sceneCount} shoot scenes from Talent Tracker notes`);

  console.log('\n--- Import Complete ---');
  console.log(`  Universe: ${universe.id}`);
  console.log(`  Production: ${production.id}`);
  console.log(`  Cast contracts: ${castSuccess}`);
  console.log(`  Crew members: ${crewSuccess}`);
  console.log(`  Asset types: ${assetTypes.length} (Contract, Shoot, Equipment, Footage, Deliverable, Document)`);
  console.log(`  Episode schedules: ${episodes.length}`);
  console.log(`  Shoot scenes: ${sceneCount}`);

  return { universeId: universe.id, productionId: production.id };
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('=== Diaries S7 Production Calendar Import ===\n');

  // Check file exists
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Excel file not found: ${EXCEL_PATH}`);
    console.error('Expected: ~/Downloads/DIA_S7_Prod Calendar 9.4.xlsx');
    process.exit(1);
  }

  console.log(`Reading: ${EXCEL_PATH}`);
  const buffer = fs.readFileSync(EXCEL_PATH);
  const wb = XLSX.read(buffer, { type: 'buffer' });

  console.log(`Sheets: ${wb.SheetNames.join(', ')}\n`);

  // Parse each sheet
  const cast = parseTalentTracker(wb);
  console.log(`Talent Tracker: ${cast.length} cast members found`);

  const calendarContracts = parseCastCalendarContracts(wb);
  console.log(`Cast Calendar: ${calendarContracts.size} contract records found`);

  const crew = parseWeeklyScheduleCrew(wb);
  console.log(`Weekly Schedule: ${crew.length} crew members found`);

  const episodes = parseKeyEdit(wb);
  console.log(`Key Edit: ${episodes.length} episodes found`);

  // Preview before inserting
  console.log('\n--- Cast Preview ---');
  for (const c of cast) {
    console.log(`  ${c.name} [${c.contractStatus}] — ${c.producer || '?'} — ${c.city || '?'}`);
  }

  console.log('\n--- Crew Preview ---');
  for (const c of crew) {
    console.log(`  ${c.name} (${c.role}) ${c.weeks ? `— ${c.weeks}wk` : ''}`);
  }

  // Insert into Supabase
  const result = await importToSupabase(cast, calendarContracts, crew, episodes);

  console.log('\nDone. Open Lexicon and navigate to the production to verify.');
  console.log(`Universe ID: ${result.universeId}`);
  console.log(`Production ID: ${result.productionId}`);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
