'use client';

/**
 * Crew Availability Cell — Single cell in the availability grid
 *
 * Displays status with color-coded background and abbreviated label.
 * Clickable to cycle through availability states.
 */

import { cn } from '@/lib/utils';
import type { AvailabilityStatus } from '@/types/production';

interface CrewAvailabilityCellProps {
  status: AvailabilityStatus | null;
  notes: string | null;
  onClick: () => void;
}

const statusConfig: Record<
  AvailabilityStatus,
  { bg: string; label: string; full: string }
> = {
  available: {
    bg: 'bg-emerald-500/30 border-emerald-500/50',
    label: 'A',
    full: 'Available',
  },
  booked: {
    bg: 'bg-sky-500/30 border-sky-500/50',
    label: 'B',
    full: 'Booked',
  },
  ooo: {
    bg: 'bg-red-500/30 border-red-500/50',
    label: 'O',
    full: 'Out of Office',
  },
  dark: {
    bg: 'bg-gray-500/30 border-gray-500/50',
    label: 'D',
    full: 'Dark',
  },
  holding: {
    bg: 'bg-amber-500/30 border-amber-500/50',
    label: 'H',
    full: 'Holding',
  },
};

export function CrewAvailabilityCell({
  status,
  notes,
  onClick,
}: CrewAvailabilityCellProps) {
  const config = status ? statusConfig[status] : null;

  const tooltip = config
    ? `${config.full}${notes ? ` — ${notes}` : ''}`
    : 'No entry';

  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={cn(
        'flex h-10 w-full items-center justify-center rounded border text-xs font-medium transition-colors',
        config
          ? `${config.bg} text-gray-200 hover:brightness-125`
          : 'bg-surface-tertiary border-panel-border border-dashed text-gray-600 hover:border-gray-500'
      )}
    >
      {config?.label ?? ''}
    </button>
  );
}
