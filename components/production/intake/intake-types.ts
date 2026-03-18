/**
 * Intake Wizard Types
 *
 * Local state types for the multi-step intake wizard.
 * All data is collected locally, then created in batch on "Launch."
 */

import type { CrewRole } from '@/types';

// ============================================
// Wizard State
// ============================================

export interface IntakeState {
  show: ShowSetupData;
  cast: CastMemberDraft[];
  crew: CrewMemberDraft[];
  assetTypes: AssetTypeDraft[];
  currentStep: number;
}

// ============================================
// Step 1: Show Setup
// ============================================

export interface ShowSetupData {
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  notes: string;
}

// ============================================
// Step 2: Cast
// ============================================

export interface CastMemberDraft {
  tempId: string;
  name: string;
  aliases: string;
  description: string;
  location: string;
}

// ============================================
// Step 3: Crew
// ============================================

export interface CrewMemberDraft {
  tempId: string;
  name: string;
  role: CrewRole;
  contactEmail: string;
  contactPhone: string;
}

// ============================================
// Step 4: Asset Types
// ============================================

export interface LifecycleStageDraft {
  tempId: string;
  name: string;
  color: string;
  isInitial: boolean;
  isTerminal: boolean;
}

export interface AssetTypeDraft {
  tempId: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  enabled: boolean;
  stages: LifecycleStageDraft[];
}

// ============================================
// Defaults
// ============================================

export const DEFAULT_ASSET_TYPES: AssetTypeDraft[] = [
  {
    tempId: 'default-contract',
    name: 'Contract',
    slug: 'contract',
    icon: 'FileCheck',
    color: '#10b981',
    enabled: true,
    stages: [
      { tempId: 'c-1', name: 'Draft', color: '#6b7280', isInitial: true, isTerminal: false },
      { tempId: 'c-2', name: 'Sent', color: '#3b82f6', isInitial: false, isTerminal: false },
      { tempId: 'c-3', name: 'Negotiating', color: '#f59e0b', isInitial: false, isTerminal: false },
      { tempId: 'c-4', name: 'Signed', color: '#10b981', isInitial: false, isTerminal: false },
      { tempId: 'c-5', name: 'Active', color: '#8b5cf6', isInitial: false, isTerminal: false },
      { tempId: 'c-6', name: 'Complete', color: '#22c55e', isInitial: false, isTerminal: true },
    ],
  },
  {
    tempId: 'default-shoot',
    name: 'Shoot',
    slug: 'shoot',
    icon: 'Video',
    color: '#3b82f6',
    enabled: true,
    stages: [
      { tempId: 's-1', name: 'Proposed', color: '#6b7280', isInitial: true, isTerminal: false },
      { tempId: 's-2', name: 'Scheduled', color: '#3b82f6', isInitial: false, isTerminal: false },
      { tempId: 's-3', name: 'Crew Assigned', color: '#8b5cf6', isInitial: false, isTerminal: false },
      { tempId: 's-4', name: 'Shot', color: '#f59e0b', isInitial: false, isTerminal: false },
      { tempId: 's-5', name: 'Footage Uploaded', color: '#10b981', isInitial: false, isTerminal: false },
      { tempId: 's-6', name: 'Logged', color: '#22c55e', isInitial: false, isTerminal: true },
    ],
  },
  {
    tempId: 'default-deliverable',
    name: 'Deliverable',
    slug: 'deliverable',
    icon: 'Package',
    color: '#f59e0b',
    enabled: true,
    stages: [
      { tempId: 'd-1', name: 'Defined', color: '#6b7280', isInitial: true, isTerminal: false },
      { tempId: 'd-2', name: 'In Progress', color: '#3b82f6', isInitial: false, isTerminal: false },
      { tempId: 'd-3', name: 'Review', color: '#f59e0b', isInitial: false, isTerminal: false },
      { tempId: 'd-4', name: 'Approved', color: '#10b981', isInitial: false, isTerminal: false },
      { tempId: 'd-5', name: 'Shipped', color: '#22c55e', isInitial: false, isTerminal: true },
    ],
  },
  {
    tempId: 'default-equipment',
    name: 'Equipment',
    slug: 'equipment',
    icon: 'Camera',
    color: '#8b5cf6',
    enabled: true,
    stages: [
      { tempId: 'eq-1', name: 'At Gear House', color: '#22c55e', isInitial: true, isTerminal: false },
      { tempId: 'eq-2', name: 'Checked Out', color: '#3b82f6', isInitial: false, isTerminal: false },
      { tempId: 'eq-3', name: 'On Location', color: '#8b5cf6', isInitial: false, isTerminal: false },
      { tempId: 'eq-4', name: 'Downloading', color: '#f59e0b', isInitial: false, isTerminal: false },
      { tempId: 'eq-5', name: 'In Transit', color: '#6366f1', isInitial: false, isTerminal: false },
      { tempId: 'eq-6', name: 'Returned', color: '#22c55e', isInitial: false, isTerminal: true },
    ],
  },
  {
    tempId: 'default-footage',
    name: 'Footage',
    slug: 'footage',
    icon: 'Film',
    color: '#ec4899',
    enabled: true,
    stages: [
      { tempId: 'ft-1', name: 'Shot', color: '#6b7280', isInitial: true, isTerminal: false },
      { tempId: 'ft-2', name: 'Downloaded', color: '#3b82f6', isInitial: false, isTerminal: false },
      { tempId: 'ft-3', name: 'In Transit', color: '#6366f1', isInitial: false, isTerminal: false },
      { tempId: 'ft-4', name: 'Uploaded', color: '#8b5cf6', isInitial: false, isTerminal: false },
      { tempId: 'ft-5', name: 'Delivered to Post', color: '#f59e0b', isInitial: false, isTerminal: false },
      { tempId: 'ft-6', name: 'In Edit', color: '#ec4899', isInitial: false, isTerminal: false },
      { tempId: 'ft-7', name: 'Final', color: '#22c55e', isInitial: false, isTerminal: true },
    ],
  },
];

export function createEmptyIntakeState(): IntakeState {
  return {
    show: {
      name: '',
      season: '',
      startDate: '',
      endDate: '',
      notes: '',
    },
    cast: [],
    crew: [],
    assetTypes: DEFAULT_ASSET_TYPES.map((t) => ({ ...t, stages: t.stages.map((s) => ({ ...s })) })),
    currentStep: 0,
  };
}
