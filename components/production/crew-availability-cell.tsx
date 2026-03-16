'use client';

/**
 * Crew Availability Cell — Single cell in the availability grid
 *
 * Displays status with color-coded background and abbreviated label.
 * Clickable to cycle through availability states.
 * Uses centralized AVAILABILITY_STATUS_CONFIG for color consistency.
 */

import { cn } from '@/lib/utils';
import { AVAILABILITY_STATUS_CONFIG } from '@/lib/production-config';
import type { AvailabilityStatus } from '@/types/production';

interface CrewAvailabilityCellProps {
  status: AvailabilityStatus | null;
  notes: string | null;
  onClick: () => void;
}

export function CrewAvailabilityCell({
  status,
  notes,
  onClick,
}: CrewAvailabilityCellProps) {
  const config = status ? AVAILABILITY_STATUS_CONFIG[status] : null;

  const tooltip = config
    ? `${config.label}${notes ? ` — ${notes}` : ''}`
    : 'Click to set status';

  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={cn(
        'flex h-10 w-full items-center justify-center rounded border text-xs font-medium transition-colors',
        config
          ? `${config.bg} ${config.border} ${config.text} hover:brightness-125`
          : 'bg-surface-tertiary border-panel-border border-dashed text-gray-600 hover:border-gray-500'
      )}
    >
      {config?.abbrev ?? ''}
    </button>
  );
}
