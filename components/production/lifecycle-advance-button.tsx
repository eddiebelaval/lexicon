'use client';

/**
 * Lifecycle Advance Button — Click to move an asset to its next stage
 *
 * Shows the next stage name and a forward arrow. Handles the API call
 * to advance the stage and calls onAdvance when complete.
 */

import { useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LifecycleStage } from '@/types';

interface LifecycleAdvanceButtonProps {
  assetInstanceId: string;
  nextStage: LifecycleStage;
  transitionedByName?: string;
  onAdvance: () => void;
  disabled?: boolean;
}

export function LifecycleAdvanceButton({
  assetInstanceId,
  nextStage,
  transitionedByName,
  onAdvance,
  disabled = false,
}: LifecycleAdvanceButtonProps) {
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdvance() {
    setAdvancing(true);
    setError(null);

    try {
      const res = await fetch(`/api/assets/${assetInstanceId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStageId: nextStage.id,
          transitionedByName,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to advance stage');
      }

      onAdvance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance');
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleAdvance}
        disabled={disabled || advancing}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
          disabled || advancing
            ? 'bg-surface-tertiary text-gray-600 cursor-not-allowed'
            : 'bg-surface-tertiary text-gray-300 hover:bg-surface-elevated hover:text-white border border-panel-border'
        )}
      >
        {advancing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: nextStage.color }}
            />
            {nextStage.name}
            <ChevronRight className="h-3 w-3" />
          </>
        )}
      </button>
      {error && (
        <span className="text-[10px] text-red-400 mt-0.5">{error}</span>
      )}
    </div>
  );
}
