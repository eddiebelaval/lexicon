/**
 * Diaries S7 - Seed Data
 *
 * Production seed data for 90 Day Fiance: The Diaries Season 7.
 * Includes cast entities (Neo4j), scenes, contracts, crew, and availability.
 *
 * Run with: npm run seed:diaries
 */

// Load environment variables from .env.local before importing neo4j
import { config } from 'dotenv';
config({ path: '.env.local' });

import { writeQuery, closeDriver } from '../lib/neo4j';
import { generateId } from '../lib/utils';
import type {
  EntityType,
  RelationshipType,
  CreateEntityInput,
  CreateRelationshipInput,
  ProdSceneStatus,
  ContractStatus,
  PaymentType,
  CrewRole,
  AvailabilityStatus,
} from '../types';

// Static UUIDs for Diaries S7
const UNIVERSE_ID = '22222222-2222-2222-2222-222222222222';
const PRODUCTION_ID = '33333333-3333-3333-3333-333333333333';

// ============================================
// Cast Entities (Neo4j nodes)
// ============================================

interface SeedEntity extends Omit<CreateEntityInput, 'universeId'> {
  id: string;
}

const cast: SeedEntity[] = [
  {
    id: 'cast-chantel',
    type: 'character',
    name: 'Chantel',
    aliases: ['Chantel Everett'],
    description: 'Cast member navigating post-separation life and co-parenting challenges. Based in Atlanta, GA.',
    status: 'active',
  },
  {
    id: 'cast-kobe',
    type: 'character',
    name: 'Kobe',
    aliases: ['Kobe Blaise'],
    description: 'Cameroonian husband adjusting to life in the US. Based in Kansas City area.',
    status: 'active',
  },
  {
    id: 'cast-emily',
    type: 'character',
    name: 'Emily',
    aliases: ['Emily Bieberly'],
    description: 'Married to Kobe, navigating family dynamics and cultural differences in the Midwest.',
    status: 'active',
  },
  {
    id: 'cast-jasmine',
    type: 'character',
    name: 'Jasmine',
    aliases: ['Jasmine Pineda'],
    description: 'Panamanian cast member known for her strong personality and relationship drama.',
    status: 'active',
  },
  {
    id: 'cast-matt',
    type: 'character',
    name: 'Matt',
    aliases: ['Matt Ryan'],
    description: 'Cast member dealing with trust issues and relationship complexities.',
    status: 'active',
  },
  {
    id: 'cast-tyray',
    type: 'character',
    name: 'Tyray',
    aliases: ['Tyray Mollett'],
    description: 'Cast member from South Carolina looking for love and navigating online relationships.',
    status: 'active',
  },
  {
    id: 'cast-cleo',
    type: 'character',
    name: 'Cleo',
    aliases: [],
    description: 'Cast member with a complicated relationship history. Based in the NYC area.',
    status: 'active',
  },
  {
    id: 'cast-kenny',
    type: 'character',
    name: 'Kenny',
    aliases: ['Kenny Niedermeier'],
    description: 'American cast member in an international relationship. Based in Florida.',
    status: 'active',
  },
  {
    id: 'cast-armando',
    type: 'character',
    name: 'Armando',
    aliases: ['Armando Rubio'],
    description: 'Mexican cast member navigating cross-cultural relationship dynamics.',
    status: 'active',
  },
  {
    id: 'cast-loren',
    type: 'character',
    name: 'Loren',
    aliases: ['Loren Brovarnik'],
    description: 'Cast member balancing growing family with relationship challenges. Based in South Florida.',
    status: 'active',
  },
  {
    id: 'cast-alex',
    type: 'character',
    name: 'Alex',
    aliases: ['Alexei Brovarnik'],
    description: 'Israeli husband to Loren, navigating fatherhood and cultural expectations.',
    status: 'active',
  },
  {
    id: 'cast-brandon',
    type: 'character',
    name: 'Brandon',
    aliases: ['Brandon Gibbs'],
    description: 'Cast member from Virginia dealing with family boundaries and relationship growth.',
    status: 'active',
  },
  {
    id: 'cast-julia',
    type: 'character',
    name: 'Julia',
    aliases: ['Julia Trubkina'],
    description: 'Russian cast member adjusting to rural American life with Brandon.',
    status: 'active',
  },
  {
    id: 'cast-tiffany',
    type: 'character',
    name: 'Tiffany',
    aliases: ['Tiffany Franco'],
    description: 'Cast member navigating single parenthood and relationship rebuilding. Based in Maryland.',
    status: 'active',
  },
  {
    id: 'cast-caesar',
    type: 'character',
    name: 'Caesar',
    aliases: ['Caesar Mack'],
    description: 'Cast member known for his romantic pursuits and trusting nature. Based in North Carolina.',
    status: 'active',
  },
];

// ============================================
// Crew & ACs
// ============================================

interface SeedCrewMember {
  id: string;
  name: string;
  role: CrewRole;
  contactEmail: string | null;
  contactPhone: string | null;
}

const crew: SeedCrewMember[] = [
  { id: 'crew-ian', name: 'Ian', role: 'ac', contactEmail: 'ian@production.tv', contactPhone: null },
  { id: 'crew-steph', name: 'Stephanie', role: 'ac', contactEmail: 'steph@production.tv', contactPhone: null },
  { id: 'crew-ryan', name: 'Ryan', role: 'ac', contactEmail: 'ryan@production.tv', contactPhone: null },
  { id: 'crew-andrew', name: 'Andrew', role: 'ac', contactEmail: 'andrew@production.tv', contactPhone: null },
  { id: 'crew-brendan', name: 'Brendan', role: 'ac', contactEmail: 'brendan@production.tv', contactPhone: null },
  { id: 'crew-curt', name: 'Curt', role: 'producer', contactEmail: 'curt@production.tv', contactPhone: null },
  { id: 'crew-josh-p', name: 'Josh P', role: 'ac', contactEmail: 'joshp@production.tv', contactPhone: null },
  { id: 'crew-chris', name: 'Chris', role: 'ac', contactEmail: 'chris@production.tv', contactPhone: null },
  { id: 'crew-sed', name: 'Sed', role: 'coordinator', contactEmail: 'sed@production.tv', contactPhone: null },
  { id: 'crew-jerry', name: 'Jerry', role: 'fixer', contactEmail: 'jerry@production.tv', contactPhone: null },
];

// ============================================
// Scenes (~20 sample scenes)
// ============================================

interface SeedScene {
  id: string;
  sceneNumber: string;
  title: string;
  description: string;
  castEntityIds: string[];
  scheduledDate: string;
  scheduledTime: string | null;
  location: string;
  locationDetails: string | null;
  status: ProdSceneStatus;
  equipmentNotes: string | null;
  isSelfShot: boolean;
}

const scenes: SeedScene[] = [
  {
    id: 'scene-001',
    sceneNumber: 'D7-001',
    title: 'Chantel apartment move-in',
    description: 'Chantel settles into her new apartment in Atlanta after the separation.',
    castEntityIds: ['cast-chantel'],
    scheduledDate: '2025-09-15',
    scheduledTime: '10:00',
    location: 'Atlanta, GA',
    locationDetails: 'Chantel residence - midtown apartment',
    status: 'shot',
    equipmentNotes: null,
    isSelfShot: false,
  },
  {
    id: 'scene-002',
    sceneNumber: 'D7-002',
    title: 'Kobe & Emily family dinner',
    description: 'Kobe and Emily host a family dinner to discuss future plans and budgeting.',
    castEntityIds: ['cast-kobe', 'cast-emily'],
    scheduledDate: '2025-09-22',
    scheduledTime: '17:00',
    location: 'Salina, KS',
    locationDetails: 'Kobe & Emily residence',
    status: 'shot',
    equipmentNotes: 'Two-camera setup for dinner table',
    isSelfShot: false,
  },
  {
    id: 'scene-003',
    sceneNumber: 'D7-003',
    title: 'Jasmine therapy session',
    description: 'Jasmine attends a solo therapy session to work through relationship issues.',
    castEntityIds: ['cast-jasmine'],
    scheduledDate: '2025-10-01',
    scheduledTime: '14:00',
    location: 'Panama City, Panama',
    locationDetails: 'Therapist office - Casco Viejo',
    status: 'shot',
    equipmentNotes: 'Audio priority - lavaliers required',
    isSelfShot: false,
  },
  {
    id: 'scene-004',
    sceneNumber: 'D7-004',
    title: 'Matt confrontation call',
    description: 'Matt has a heated video call about trust and boundaries.',
    castEntityIds: ['cast-matt'],
    scheduledDate: '2025-10-08',
    scheduledTime: '20:00',
    location: 'Phoenix, AZ',
    locationDetails: 'Matt home office',
    status: 'shot',
    equipmentNotes: 'Capture both sides of video call - screen record + room cam',
    isSelfShot: false,
  },
  {
    id: 'scene-005',
    sceneNumber: 'D7-005',
    title: 'Tyray arrives in country',
    description: 'Tyray lands at the airport for his first in-person meeting.',
    castEntityIds: ['cast-tyray'],
    scheduledDate: '2025-10-14',
    scheduledTime: '08:00',
    location: 'Columbia, SC',
    locationDetails: 'Columbia Metropolitan Airport',
    status: 'shot',
    equipmentNotes: 'Airport permits secured. Handheld only.',
    isSelfShot: false,
  },
  {
    id: 'scene-006',
    sceneNumber: 'D7-006',
    title: 'Cleo night out with friends',
    description: 'Cleo goes out with friends in Queens and opens up about her relationship.',
    castEntityIds: ['cast-cleo'],
    scheduledDate: '2025-10-20',
    scheduledTime: '21:00',
    location: 'Queens, NY',
    locationDetails: 'Restaurant in Astoria',
    status: 'shot',
    equipmentNotes: 'Low light setup. Restaurant aware of filming.',
    isSelfShot: false,
  },
  {
    id: 'scene-007',
    sceneNumber: 'D7-007',
    title: 'Kenny & Armando anniversary',
    description: 'Kenny and Armando celebrate their anniversary with a special dinner.',
    castEntityIds: ['cast-kenny', 'cast-armando'],
    scheduledDate: '2025-11-03',
    scheduledTime: '19:00',
    location: 'Cabo San Lucas, Mexico',
    locationDetails: 'Beachfront restaurant - El Farallon',
    status: 'shot',
    equipmentNotes: 'Drone approved for exterior establishing shots',
    isSelfShot: false,
  },
  {
    id: 'scene-008',
    sceneNumber: 'D7-008',
    title: 'Loren & Alex baby prep',
    description: 'Loren and Alex prepare the nursery for their newest addition.',
    castEntityIds: ['cast-loren', 'cast-alex'],
    scheduledDate: '2025-11-10',
    scheduledTime: '11:00',
    location: 'Hollywood, FL',
    locationDetails: 'Loren & Alex residence',
    status: 'shot',
    equipmentNotes: null,
    isSelfShot: false,
  },
  {
    id: 'scene-009',
    sceneNumber: 'D7-009',
    title: 'Brandon farm day',
    description: 'Brandon works on the family farm and discusses independence with Julia.',
    castEntityIds: ['cast-brandon', 'cast-julia'],
    scheduledDate: '2025-11-18',
    scheduledTime: '07:00',
    location: 'Dinwiddie, VA',
    locationDetails: 'Gibbs family farm',
    status: 'shot',
    equipmentNotes: 'Outdoor shooting - weather backup plan needed',
    isSelfShot: false,
  },
  {
    id: 'scene-010',
    sceneNumber: 'D7-010',
    title: 'Tiffany single mom morning',
    description: 'Tiffany navigates a typical morning routine as a single parent.',
    castEntityIds: ['cast-tiffany'],
    scheduledDate: '2025-12-02',
    scheduledTime: '06:30',
    location: 'Frederick, MD',
    locationDetails: 'Tiffany residence',
    status: 'shot',
    equipmentNotes: 'Early call - minimal crew. Natural light preferred.',
    isSelfShot: false,
  },
  {
    id: 'scene-011',
    sceneNumber: 'D7-011',
    title: 'Caesar video date',
    description: 'Caesar goes on a video date with a new prospect and gets advice from friends.',
    castEntityIds: ['cast-caesar'],
    scheduledDate: '2025-12-10',
    scheduledTime: '19:00',
    location: 'Jacksonville, NC',
    locationDetails: 'Caesar apartment',
    status: 'shot',
    equipmentNotes: 'Screen capture rig for laptop video call',
    isSelfShot: false,
  },
  {
    id: 'scene-012',
    sceneNumber: 'D7-012',
    title: 'Chantel holiday with family',
    description: 'Chantel spends the holidays with her family and reflects on the year.',
    castEntityIds: ['cast-chantel'],
    scheduledDate: '2025-12-22',
    scheduledTime: '12:00',
    location: 'Atlanta, GA',
    locationDetails: 'Everett family home',
    status: 'scheduled',
    equipmentNotes: null,
    isSelfShot: false,
  },
  {
    id: 'scene-013',
    sceneNumber: 'D7-013',
    title: 'Kobe business pitch',
    description: 'Kobe presents his business idea to potential investors.',
    castEntityIds: ['cast-kobe'],
    scheduledDate: '2026-01-08',
    scheduledTime: '10:00',
    location: 'Kansas City, MO',
    locationDetails: 'WeWork coworking space',
    status: 'scheduled',
    equipmentNotes: 'Boardroom setup - permission from venue needed',
    isSelfShot: false,
  },
  {
    id: 'scene-014',
    sceneNumber: 'D7-014',
    title: 'Jasmine & Matt reunion',
    description: 'Jasmine and Matt meet in person for the first time in months.',
    castEntityIds: ['cast-jasmine', 'cast-matt'],
    scheduledDate: '2026-01-15',
    scheduledTime: '16:00',
    location: 'Miami, FL',
    locationDetails: 'Miami International Airport arrivals',
    status: 'scheduled',
    equipmentNotes: 'Airport crew pass required. Two cams minimum.',
    isSelfShot: false,
  },
  {
    id: 'scene-015',
    sceneNumber: 'D7-015',
    title: 'Tyray cooking lesson',
    description: 'Tyray takes a cooking lesson to impress his partner.',
    castEntityIds: ['cast-tyray'],
    scheduledDate: '2026-01-22',
    scheduledTime: '15:00',
    location: 'Columbia, SC',
    locationDetails: 'Sur La Table cooking school',
    status: 'scheduled',
    equipmentNotes: null,
    isSelfShot: false,
  },
  {
    id: 'scene-016',
    sceneNumber: 'D7-016',
    title: 'Loren doctor visit',
    description: 'Loren goes to a prenatal checkup with Alex.',
    castEntityIds: ['cast-loren', 'cast-alex'],
    scheduledDate: '2026-02-03',
    scheduledTime: '09:00',
    location: 'Hollywood, FL',
    locationDetails: 'Memorial Regional Hospital',
    status: 'scheduled',
    equipmentNotes: 'Medical release forms required. HIPAA compliance.',
    isSelfShot: false,
  },
  {
    id: 'scene-017',
    sceneNumber: 'D7-017',
    title: 'Caesar gym transformation',
    description: 'Caesar shows his fitness progress and talks about self-improvement.',
    castEntityIds: ['cast-caesar'],
    scheduledDate: '2026-02-14',
    scheduledTime: '08:00',
    location: 'Jacksonville, NC',
    locationDetails: 'Gold Gym - Western Blvd',
    status: 'scheduled',
    equipmentNotes: 'GoPro for workout POV shots',
    isSelfShot: false,
  },
  {
    id: 'scene-018',
    sceneNumber: 'D7-018',
    title: 'Emily solo interview',
    description: 'Emily sits down for a reflective interview about her journey.',
    castEntityIds: ['cast-emily'],
    scheduledDate: '2026-02-25',
    scheduledTime: '13:00',
    location: 'Salina, KS',
    locationDetails: 'Local park pavilion',
    status: 'scheduled',
    equipmentNotes: 'Interview setup - backlight + key light',
    isSelfShot: false,
  },
  {
    id: 'scene-019',
    sceneNumber: 'D7-019',
    title: 'Brandon & Julia apartment hunting',
    description: 'Brandon and Julia look at apartments as they plan to move out on their own.',
    castEntityIds: ['cast-brandon', 'cast-julia'],
    scheduledDate: '2026-03-05',
    scheduledTime: '10:00',
    location: 'Richmond, VA',
    locationDetails: 'Various apartment complexes',
    status: 'scheduled',
    equipmentNotes: 'Run-and-gun setup. Multiple locations in one day.',
    isSelfShot: false,
  },
  {
    id: 'scene-020',
    sceneNumber: 'D7-020',
    title: 'Cleo self-shot diary',
    description: 'Cleo records a personal diary entry from home.',
    castEntityIds: ['cast-cleo'],
    scheduledDate: '2026-03-12',
    scheduledTime: null,
    location: 'Queens, NY',
    locationDetails: 'Cleo apartment',
    status: 'scheduled',
    equipmentNotes: 'Self-shot kit shipped to cast member',
    isSelfShot: true,
  },
];

// ============================================
// Cast Contracts
// ============================================

interface SeedContract {
  id: string;
  castEntityId: string;
  contractStatus: ContractStatus;
  paymentType: PaymentType | null;
  shootDone: boolean;
  interviewDone: boolean;
  pickupDone: boolean;
  paymentDone: boolean;
  notes: string | null;
}

const contracts: SeedContract[] = [
  // Signed (8)
  {
    id: 'contract-chantel',
    castEntityId: 'cast-chantel',
    contractStatus: 'signed',
    paymentType: 'flat',
    shootDone: true,
    interviewDone: true,
    pickupDone: false,
    paymentDone: false,
    notes: 'Season regular. Full arc commitment.',
  },
  {
    id: 'contract-kobe',
    castEntityId: 'cast-kobe',
    contractStatus: 'signed',
    paymentType: 'flat',
    shootDone: true,
    interviewDone: false,
    pickupDone: false,
    paymentDone: false,
    notes: 'Paired with Emily. Joint scheduling.',
  },
  {
    id: 'contract-emily',
    castEntityId: 'cast-emily',
    contractStatus: 'signed',
    paymentType: 'flat',
    shootDone: true,
    interviewDone: false,
    pickupDone: false,
    paymentDone: false,
    notes: 'Paired with Kobe. Joint scheduling.',
  },
  {
    id: 'contract-jasmine',
    castEntityId: 'cast-jasmine',
    contractStatus: 'signed',
    paymentType: 'flat',
    shootDone: false,
    interviewDone: false,
    pickupDone: false,
    paymentDone: false,
    notes: 'International shoot logistics needed for Panama.',
  },
  {
    id: 'contract-loren',
    castEntityId: 'cast-loren',
    contractStatus: 'signed',
    paymentType: 'flat',
    shootDone: true,
    interviewDone: true,
    pickupDone: true,
    paymentDone: true,
    notes: 'Completed all deliverables.',
  },
  {
    id: 'contract-alex',
    castEntityId: 'cast-alex',
    contractStatus: 'signed',
    paymentType: 'flat',
    shootDone: true,
    interviewDone: true,
    pickupDone: true,
    paymentDone: true,
    notes: 'Completed all deliverables. Paired with Loren.',
  },
  {
    id: 'contract-brandon',
    castEntityId: 'cast-brandon',
    contractStatus: 'signed',
    paymentType: 'daily',
    shootDone: true,
    interviewDone: false,
    pickupDone: false,
    paymentDone: false,
    notes: 'Daily rate. Interview still pending.',
  },
  {
    id: 'contract-julia',
    castEntityId: 'cast-julia',
    contractStatus: 'signed',
    paymentType: 'daily',
    shootDone: true,
    interviewDone: false,
    pickupDone: false,
    paymentDone: false,
    notes: 'Daily rate. Paired with Brandon.',
  },

  // Pending (3)
  {
    id: 'contract-matt',
    castEntityId: 'cast-matt',
    contractStatus: 'pending',
    paymentType: 'flat',
    shootDone: false,
    interviewDone: false,
    pickupDone: false,
    paymentDone: false,
    notes: 'Waiting on legal review of contract terms.',
  },
  {
    id: 'contract-cleo',
    castEntityId: 'cast-cleo',
    contractStatus: 'pending',
    paymentType: null,
    shootDone: false,
    interviewDone: false,
    pickupDone: false,
    paymentDone: false,
    notes: 'Payment type TBD. Negotiating terms.',
  },
  {
    id: 'contract-tiffany',
    castEntityId: 'cast-tiffany',
    contractStatus: 'pending',
    paymentType: 'daily',
    shootDone: false,
    interviewDone: false,
    pickupDone: false,
    paymentDone: false,
    notes: 'Returning cast. Updated terms under review.',
  },

  // Offer Sent (2)
  {
    id: 'contract-kenny',
    castEntityId: 'cast-kenny',
    contractStatus: 'offer_sent',
    paymentType: 'flat',
    shootDone: false,
    interviewDone: false,
    pickupDone: false,
    paymentDone: false,
    notes: 'Offer sent 2025-09-01. Follow up needed.',
  },
  {
    id: 'contract-armando',
    castEntityId: 'cast-armando',
    contractStatus: 'offer_sent',
    paymentType: 'flat',
    shootDone: false,
    interviewDone: false,
    pickupDone: false,
    paymentDone: false,
    notes: 'Paired with Kenny. Waiting on Mexico work permit.',
  },

  // DNC (2)
  {
    id: 'contract-tyray',
    castEntityId: 'cast-tyray',
    contractStatus: 'dnc',
    paymentType: null,
    shootDone: false,
    interviewDone: false,
    pickupDone: false,
    paymentDone: false,
    notes: 'Do not contact per management request.',
  },
  {
    id: 'contract-caesar',
    castEntityId: 'cast-caesar',
    contractStatus: 'dnc',
    paymentType: null,
    shootDone: false,
    interviewDone: false,
    pickupDone: false,
    paymentDone: false,
    notes: 'Previous season issues. DNC until further notice.',
  },
];

// ============================================
// Cast Relationships (Neo4j)
// ============================================

interface SeedRelationship {
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  context: string;
  strength: 1 | 2 | 3 | 4 | 5;
  ongoing: boolean;
}

const relationships: SeedRelationship[] = [
  {
    sourceId: 'cast-kobe',
    targetId: 'cast-emily',
    type: 'family_of',
    context: 'Married couple. Core storyline pair for the season.',
    strength: 5,
    ongoing: true,
  },
  {
    sourceId: 'cast-loren',
    targetId: 'cast-alex',
    type: 'family_of',
    context: 'Married couple with children. Fan-favorite pairing.',
    strength: 5,
    ongoing: true,
  },
  {
    sourceId: 'cast-brandon',
    targetId: 'cast-julia',
    type: 'family_of',
    context: 'Married couple navigating independence from family.',
    strength: 4,
    ongoing: true,
  },
  {
    sourceId: 'cast-kenny',
    targetId: 'cast-armando',
    type: 'family_of',
    context: 'Married couple in a cross-border relationship.',
    strength: 5,
    ongoing: true,
  },
  {
    sourceId: 'cast-jasmine',
    targetId: 'cast-matt',
    type: 'knows',
    context: 'Complicated romantic connection with trust issues.',
    strength: 3,
    ongoing: true,
  },
  {
    sourceId: 'cast-chantel',
    targetId: 'cast-tiffany',
    type: 'knows',
    context: 'Cast friends who bonded over shared experiences.',
    strength: 3,
    ongoing: true,
  },
  {
    sourceId: 'cast-caesar',
    targetId: 'cast-tyray',
    type: 'knows',
    context: 'Acquaintances from cast events and tell-all tapings.',
    strength: 2,
    ongoing: true,
  },
];

// ============================================
// Crew Availability (sample week: Jan 13-17, 2026)
// ============================================

interface SeedAvailability {
  crewMemberId: string;
  date: string;
  status: AvailabilityStatus;
  notes: string | null;
}

const crewAvailability: SeedAvailability[] = [
  // Monday Jan 13
  { crewMemberId: 'crew-ian', date: '2026-01-13', status: 'available', notes: null },
  { crewMemberId: 'crew-steph', date: '2026-01-13', status: 'available', notes: null },
  { crewMemberId: 'crew-ryan', date: '2026-01-13', status: 'booked', notes: 'On Jasmine/Matt Miami shoot' },
  { crewMemberId: 'crew-andrew', date: '2026-01-13', status: 'available', notes: null },
  { crewMemberId: 'crew-brendan', date: '2026-01-13', status: 'ooo', notes: 'PTO through Wednesday' },
  { crewMemberId: 'crew-curt', date: '2026-01-13', status: 'available', notes: null },
  { crewMemberId: 'crew-josh-p', date: '2026-01-13', status: 'available', notes: null },
  { crewMemberId: 'crew-chris', date: '2026-01-13', status: 'dark', notes: 'No shoots assigned' },
  { crewMemberId: 'crew-sed', date: '2026-01-13', status: 'available', notes: null },
  { crewMemberId: 'crew-jerry', date: '2026-01-13', status: 'available', notes: null },

  // Tuesday Jan 14
  { crewMemberId: 'crew-ian', date: '2026-01-14', status: 'booked', notes: 'Kobe business pitch prep' },
  { crewMemberId: 'crew-steph', date: '2026-01-14', status: 'available', notes: null },
  { crewMemberId: 'crew-ryan', date: '2026-01-14', status: 'booked', notes: 'On Jasmine/Matt Miami shoot' },
  { crewMemberId: 'crew-andrew', date: '2026-01-14', status: 'available', notes: null },
  { crewMemberId: 'crew-brendan', date: '2026-01-14', status: 'ooo', notes: 'PTO through Wednesday' },
  { crewMemberId: 'crew-curt', date: '2026-01-14', status: 'booked', notes: 'Production meeting' },
  { crewMemberId: 'crew-josh-p', date: '2026-01-14', status: 'available', notes: null },
  { crewMemberId: 'crew-chris', date: '2026-01-14', status: 'available', notes: null },
  { crewMemberId: 'crew-sed', date: '2026-01-14', status: 'available', notes: null },
  { crewMemberId: 'crew-jerry', date: '2026-01-14', status: 'holding', notes: 'Possible fixer needed for airport shoot' },

  // Wednesday Jan 15
  { crewMemberId: 'crew-ian', date: '2026-01-15', status: 'available', notes: null },
  { crewMemberId: 'crew-steph', date: '2026-01-15', status: 'booked', notes: 'Jasmine/Matt airport reunion' },
  { crewMemberId: 'crew-ryan', date: '2026-01-15', status: 'booked', notes: 'Jasmine/Matt airport reunion' },
  { crewMemberId: 'crew-andrew', date: '2026-01-15', status: 'available', notes: null },
  { crewMemberId: 'crew-brendan', date: '2026-01-15', status: 'ooo', notes: 'PTO last day' },
  { crewMemberId: 'crew-curt', date: '2026-01-15', status: 'booked', notes: 'Supervising Miami shoot' },
  { crewMemberId: 'crew-josh-p', date: '2026-01-15', status: 'available', notes: null },
  { crewMemberId: 'crew-chris', date: '2026-01-15', status: 'available', notes: null },
  { crewMemberId: 'crew-sed', date: '2026-01-15', status: 'booked', notes: 'Coordinating Miami logistics' },
  { crewMemberId: 'crew-jerry', date: '2026-01-15', status: 'booked', notes: 'Airport fixer - Miami' },

  // Thursday Jan 16
  { crewMemberId: 'crew-ian', date: '2026-01-16', status: 'available', notes: null },
  { crewMemberId: 'crew-steph', date: '2026-01-16', status: 'available', notes: null },
  { crewMemberId: 'crew-ryan', date: '2026-01-16', status: 'available', notes: 'Returning from Miami' },
  { crewMemberId: 'crew-andrew', date: '2026-01-16', status: 'booked', notes: 'Tyray cooking scene' },
  { crewMemberId: 'crew-brendan', date: '2026-01-16', status: 'available', notes: 'Back from PTO' },
  { crewMemberId: 'crew-curt', date: '2026-01-16', status: 'available', notes: null },
  { crewMemberId: 'crew-josh-p', date: '2026-01-16', status: 'booked', notes: 'Tyray cooking scene' },
  { crewMemberId: 'crew-chris', date: '2026-01-16', status: 'available', notes: null },
  { crewMemberId: 'crew-sed', date: '2026-01-16', status: 'available', notes: null },
  { crewMemberId: 'crew-jerry', date: '2026-01-16', status: 'available', notes: null },

  // Friday Jan 17
  { crewMemberId: 'crew-ian', date: '2026-01-17', status: 'available', notes: null },
  { crewMemberId: 'crew-steph', date: '2026-01-17', status: 'available', notes: null },
  { crewMemberId: 'crew-ryan', date: '2026-01-17', status: 'dark', notes: 'Off day after travel' },
  { crewMemberId: 'crew-andrew', date: '2026-01-17', status: 'available', notes: null },
  { crewMemberId: 'crew-brendan', date: '2026-01-17', status: 'available', notes: null },
  { crewMemberId: 'crew-curt', date: '2026-01-17', status: 'available', notes: null },
  { crewMemberId: 'crew-josh-p', date: '2026-01-17', status: 'available', notes: null },
  { crewMemberId: 'crew-chris', date: '2026-01-17', status: 'ooo', notes: 'Personal day' },
  { crewMemberId: 'crew-sed', date: '2026-01-17', status: 'available', notes: null },
  { crewMemberId: 'crew-jerry', date: '2026-01-17', status: 'available', notes: null },
];

// ============================================
// Exported Data (for use by other modules)
// ============================================

export const diariesS7Data = {
  universeId: UNIVERSE_ID,
  productionId: PRODUCTION_ID,
  cast,
  crew,
  scenes,
  contracts,
  relationships,
  crewAvailability,
};

// ============================================
// Seed Functions
// ============================================

async function clearUniverse() {
  console.log('Clearing existing Diaries S7 data...');
  await writeQuery(
    `
    MATCH (e:Entity {universeId: $universeId})
    DETACH DELETE e
    `,
    { universeId: UNIVERSE_ID }
  );
}

async function seedCastEntities() {
  console.log('Seeding cast entities...');

  for (const member of cast) {
    await writeQuery(
      `
      CREATE (e:Entity {
        id: $id,
        type: $type,
        name: $name,
        aliases: $aliases,
        description: $description,
        status: $status,
        universeId: $universeId,
        metadata: $metadata,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      `,
      {
        ...member,
        aliases: member.aliases || [],
        metadata: JSON.stringify(member.metadata || {}),
        universeId: UNIVERSE_ID,
      }
    );
  }

  console.log(`Created ${cast.length} cast entities`);
}

async function seedRelationships() {
  console.log('Seeding cast relationships...');

  for (const rel of relationships) {
    await writeQuery(
      `
      MATCH (source:Entity {id: $sourceId})
      MATCH (target:Entity {id: $targetId})
      CREATE (source)-[r:${rel.type.toUpperCase()} {
        id: $id,
        type: $type,
        context: $context,
        strength: $strength,
        ongoing: $ongoing
      }]->(target)
      `,
      {
        sourceId: rel.sourceId,
        targetId: rel.targetId,
        id: generateId(),
        type: rel.type,
        context: rel.context,
        strength: rel.strength,
        ongoing: rel.ongoing,
      }
    );
  }

  console.log(`Created ${relationships.length} relationships`);
}

async function main() {
  console.log('\nDiaries S7 Seed Script\n');
  console.log('================================\n');

  try {
    await clearUniverse();
    await seedCastEntities();
    await seedRelationships();

    console.log('\nNeo4j seeding complete!\n');
    console.log('Summary:');
    console.log(`  - Cast members: ${cast.length}`);
    console.log(`  - Relationships: ${relationships.length}`);
    console.log(`  - Scenes (data only): ${scenes.length}`);
    console.log(`  - Contracts (data only): ${contracts.length}`);
    console.log(`  - Crew members (data only): ${crew.length}`);
    console.log(`  - Availability entries (data only): ${crewAvailability.length}`);
    console.log('\nNote: Scenes, contracts, crew, and availability are Supabase data.');
    console.log('Use the production API to seed those into PostgreSQL.\n');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await closeDriver();
  }
}

main();
