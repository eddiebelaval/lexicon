'use client';

/**
 * Lifecycle Panel — Full lifecycle view for an asset instance
 *
 * Shows: stage pipeline (all stages as dots), current stage pill,
 * advance button, transition history. Used in asset detail views
 * and expandable rows.
 */

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Lock, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LifecycleStagePill } from './lifecycle-stage-pill';
import { LifecycleAdvanceButton } from './lifecycle-advance-button';
import { LifecycleHistory } from './lifecycle-history';
import type {
  AssetInstanceWithStage,
  LifecycleStage,
  AssetTypeWithStages,
} from '@/types';

interface LifecyclePanelProps {
  assetInstanceId: string;
  showHistory?: boolean;
}

export function LifecyclePanel({
  assetInstanceId,
  showHistory = true,
}: LifecyclePanelProps) {
  const [instance, setInstance] = useState<AssetInstanceWithStage | null>(null);
  const [stages, setStages] = useState<LifecycleStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch asset instance (includes current stage + type info)
      const res = await fetch(`/api/assets/${assetInstanceId}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to load asset');
      }

      const inst: AssetInstanceWithStage = data.data;
      setInstance(inst);

      // Fetch all stages for this asset type
      const stagesRes = await fetch(`/api/asset-types/${inst.assetTypeId}`);
      const stagesData = await stagesRes.json();

      if (stagesData.success) {
        const typeWithStages: AssetTypeWithStages = stagesData.data;
        setStages(typeWithStages.stages || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [assetInstanceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleAdvance() {
    fetchData();
    setHistoryKey((k) => k + 1);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 py-3">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-vhs-400" />
        Loading lifecycle...
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-400 py-3">
        <AlertCircle className="h-3.5 w-3.5" />
        {error || 'Asset not found'}
      </div>
    );
  }

  const currentOrder = instance.currentStage.stageOrder;
  const nextStage = stages
    .filter((s) => s.stageOrder > currentOrder)
    .sort((a, b) => a.stageOrder - b.stageOrder)[0] ?? null;
  const isComplete = instance.currentStage.isTerminal;

  return (
    <div className="space-y-4">
      {/* Stage pipeline — horizontal dots */}
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => {
          const isCurrent = stage.id === instance.currentStageId;
          const isPast = stage.stageOrder < currentOrder;
          const isFuture = stage.stageOrder > currentOrder;

          return (
            <div key={stage.id} className="flex items-center gap-1">
              {i > 0 && (
                <div
                  className={cn(
                    'h-px w-4',
                    isPast || isCurrent ? 'bg-gray-500' : 'bg-panel-border'
                  )}
                />
              )}
              <div
                className="relative group"
                title={stage.name}
              >
                <div
                  className={cn(
                    'rounded-full transition-all',
                    isCurrent
                      ? 'w-3 h-3 ring-2 ring-offset-1 ring-offset-surface-primary'
                      : 'w-2 h-2',
                    isPast && 'opacity-60'
                  )}
                  style={{
                    backgroundColor: isPast || isCurrent ? stage.color : undefined,
                    borderColor: isCurrent ? stage.color : undefined,
                    ['--tw-ring-color' as string]: isCurrent ? stage.color : undefined,
                  }}
                >
                  {isFuture && (
                    <div className="w-full h-full rounded-full bg-panel-border" />
                  )}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 text-[10px] text-gray-400 bg-surface-elevated border border-panel-border rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {stage.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current stage + advance */}
      <div className="flex items-center gap-3">
        <LifecycleStagePill stage={instance.currentStage} size="md" />

        {instance.isBlocked && (
          <span className="inline-flex items-center gap-1 text-xs text-red-400">
            <Lock className="h-3 w-3" />
            Blocked{instance.blockedBy ? `: ${instance.blockedBy}` : ''}
          </span>
        )}

        {isComplete && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
            <Flag className="h-3 w-3" />
            Complete
          </span>
        )}

        {nextStage && !isComplete && !instance.isBlocked && (
          <LifecycleAdvanceButton
            assetInstanceId={instance.id}
            nextStage={nextStage}
            onAdvance={handleAdvance}
          />
        )}
      </div>

      {/* History */}
      {showHistory && (
        <div className="border-t border-panel-border pt-3">
          <h4 className="text-[10px] font-medium uppercase tracking-wider text-gray-600 mb-2">
            History
          </h4>
          <LifecycleHistory
            key={historyKey}
            assetInstanceId={assetInstanceId}
          />
        </div>
      )}
    </div>
  );
}
