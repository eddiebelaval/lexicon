'use client';

/**
 * Lifecycle Stage Pill — Shows an asset's current stage as a colored badge
 *
 * Used across dashboard, cast board, calendar, and asset detail views.
 * Displays the stage name with a colored dot indicator.
 */

import { cn } from '@/lib/utils';
import type { LifecycleStage } from '@/types';

interface LifecycleStagePillProps {
  stage: LifecycleStage;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export function LifecycleStagePill({
  stage,
  size = 'sm',
  showDot = true,
}: LifecycleStagePillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        'bg-white/5 border border-white/10'
      )}
    >
      {showDot && (
        <span
          className="shrink-0 rounded-full"
          style={{
            backgroundColor: stage.color,
            width: size === 'sm' ? 6 : 8,
            height: size === 'sm' ? 6 : 8,
          }}
        />
      )}
      <span className="text-gray-300">{stage.name}</span>
    </span>
  );
}
