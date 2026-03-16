/**
 * Production Config — Shared constants for production UI
 *
 * Centralizes status color mappings so they're consistent across
 * dashboard, calendar, cast board, and scene cards.
 */

import type { ProdSceneStatus, ContractStatus, AvailabilityStatus } from '@/types';

// ============================================
// Scene Status
// ============================================

export const SCENE_STATUS_CONFIG: Record<
  ProdSceneStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  scheduled: { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-l-sky-500', label: 'Scheduled' },
  shot: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-l-emerald-500', label: 'Shot' },
  cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-l-red-500', label: 'Cancelled' },
  postponed: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-l-amber-500', label: 'Postponed' },
  self_shot: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-l-violet-500', label: 'Self-Shot' },
};

// ============================================
// Contract Status
// ============================================

export const CONTRACT_STATUS_CONFIG: Record<
  ContractStatus,
  { bg: string; text: string; label: string }
> = {
  signed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Signed' },
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
  offer_sent: { bg: 'bg-sky-500/20', text: 'text-sky-400', label: 'Offer Sent' },
  dnc: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'DNC' },
  email_sent: { bg: 'bg-violet-500/20', text: 'text-violet-400', label: 'Email Sent' },
  declined: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Declined' },
};

// ============================================
// Crew Availability Status
// ============================================

export const AVAILABILITY_STATUS_CONFIG: Record<
  AvailabilityStatus,
  { bg: string; border: string; text: string; abbrev: string; label: string }
> = {
  available: { bg: 'bg-emerald-500/30', border: 'border-emerald-500/50', text: 'text-emerald-300', abbrev: 'A', label: 'Available' },
  booked: { bg: 'bg-sky-500/30', border: 'border-sky-500/50', text: 'text-sky-300', abbrev: 'B', label: 'Booked' },
  ooo: { bg: 'bg-red-500/30', border: 'border-red-500/50', text: 'text-red-300', abbrev: 'O', label: 'OOO' },
  dark: { bg: 'bg-gray-500/30', border: 'border-gray-500/50', text: 'text-gray-400', abbrev: 'D', label: 'Dark' },
  holding: { bg: 'bg-amber-500/30', border: 'border-amber-500/50', text: 'text-amber-300', abbrev: 'H', label: 'Holding' },
};

// ============================================
// Completion fields (typed for cast board)
// ============================================

export type CompletionField = 'shootDone' | 'interviewDone' | 'pickupDone' | 'paymentDone';

export const COMPLETION_FIELDS: { field: CompletionField; label: string }[] = [
  { field: 'shootDone', label: 'Shoot' },
  { field: 'interviewDone', label: 'INTV' },
  { field: 'pickupDone', label: 'PU' },
  { field: 'paymentDone', label: '$' },
];

// ============================================
// Helpers
// ============================================

export function formatSnakeCase(status: string): string {
  return status.replace(/_/g, ' ');
}
