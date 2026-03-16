'use client';

/**
 * Step 5: Review & Launch
 *
 * Summarizes all intake data and creates everything in batch on launch.
 * Handles partial failures gracefully (e.g., Neo4j down for entity creation).
 */

import { useState, useCallback } from 'react';
import {
  Calendar,
  Users,
  Clapperboard,
  Layers,
  Rocket,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntakeState } from './intake-types';

interface ReviewLaunchStepProps {
  state: IntakeState;
  universeId: string;
  onLaunch: (productionId: string) => void;
  onBack: () => void;
}

type LaunchPhase =
  | 'idle'
  | 'creating-production'
  | 'adding-cast'
  | 'adding-crew'
  | 'setting-up-tracking'
  | 'done'
  | 'error';

const PHASE_LABELS: Record<LaunchPhase, string> = {
  idle: '',
  'creating-production': 'Creating production...',
  'adding-cast': 'Adding cast...',
  'adding-crew': 'Adding crew...',
  'setting-up-tracking': 'Setting up tracking...',
  done: 'Done!',
  error: 'Something went wrong',
};

export function ReviewLaunchStep({
  state,
  universeId,
  onLaunch,
  onBack,
}: ReviewLaunchStepProps) {
  const [phase, setPhase] = useState<LaunchPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const enabledAssetTypes = state.assetTypes.filter((t) => t.enabled);
  const isLaunching = phase !== 'idle' && phase !== 'done' && phase !== 'error';

  // Track created production ID for retry idempotency
  const [createdProductionId, setCreatedProductionId] = useState<string | null>(null);

  async function postApi(url: string, body: Record<string, unknown>): Promise<{ ok: boolean; data?: { id: string }; error?: string }> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: (json as { error?: { message?: string } })?.error?.message || `${res.status} error` };
    }
    return { ok: true, data: (json as { data: { id: string } }).data };
  }

  const handleLaunch = useCallback(async () => {
    setPhase('creating-production');
    setError(null);
    setWarnings([]);
    const launchWarnings: string[] = [];

    try {
      // 1. Create production (skip if already created on a previous attempt)
      let productionId = createdProductionId;
      if (!productionId) {
        const prodResult = await postApi('/api/productions', {
          universeId,
          name: state.show.name,
          season: state.show.season || undefined,
          startDate: state.show.startDate || undefined,
          endDate: state.show.endDate || undefined,
          notes: state.show.notes || undefined,
        });

        if (!prodResult.ok) {
          throw new Error(prodResult.error || 'Failed to create production');
        }

        productionId = prodResult.data!.id;
        setCreatedProductionId(productionId);
      }

      // 2. Add cast members (parallel — entity + contract per member)
      if (state.cast.length > 0) {
        setPhase('adding-cast');

        const castResults = await Promise.allSettled(
          state.cast.map(async (member) => {
            // Try Neo4j entity — capture real ID for contract linking
            let entityId = `cast-${member.name.toLowerCase().replace(/\s+/g, '-')}`;
            try {
              const entityResult = await postApi('/api/entities', {
                universeId,
                type: 'character',
                name: member.name,
                aliases: member.aliases
                  ? member.aliases.split(',').map((a: string) => a.trim()).filter(Boolean)
                  : [],
                description: member.description || `Cast member for ${state.show.name}`,
                metadata: { location: member.location || undefined },
              });
              if (entityResult.ok && entityResult.data?.id) {
                entityId = entityResult.data.id;
              }
            } catch {
              launchWarnings.push(`Could not create graph entity for ${member.name} (Neo4j may be unavailable)`);
            }

            // Create contract with real entity ID (or fallback slug)
            try {
              await postApi('/api/cast-contracts', {
                productionId,
                castEntityId: entityId,
                contractStatus: 'pending',
              });
            } catch {
              launchWarnings.push(`Could not create cast contract for ${member.name}`);
            }
          })
        );

        // Collect any rejection errors
        castResults.forEach((r, i) => {
          if (r.status === 'rejected') {
            launchWarnings.push(`Error adding cast member ${state.cast[i]?.name || i}`);
          }
        });
      }

      // 3. Add crew members (parallel)
      if (state.crew.length > 0) {
        setPhase('adding-crew');

        const crewResults = await Promise.allSettled(
          state.crew.map((member) =>
            postApi('/api/crew', {
              productionId,
              name: member.name,
              role: member.role,
              contactEmail: member.contactEmail || undefined,
              contactPhone: member.contactPhone || undefined,
            })
          )
        );

        crewResults.forEach((r, i) => {
          if (r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok)) {
            launchWarnings.push(`Could not create crew member ${state.crew[i]?.name || i}`);
          }
        });
      }

      // 4. Set up asset types and lifecycle stages
      // Asset types are created in parallel, stages sequentially per type (order matters)
      if (enabledAssetTypes.length > 0) {
        setPhase('setting-up-tracking');

        const typeResults = await Promise.allSettled(
          enabledAssetTypes.map(async (assetType, i) => {
            const atResult = await postApi('/api/asset-types', {
              productionId,
              name: assetType.name,
              slug: assetType.slug,
              icon: assetType.icon,
              color: assetType.color,
              sortOrder: i,
            });

            if (!atResult.ok || !atResult.data?.id) {
              launchWarnings.push(`Could not create asset type "${assetType.name}"`);
              return;
            }

            // Stages must be created in order (stage_order constraint)
            for (let j = 0; j < assetType.stages.length; j++) {
              const stage = assetType.stages[j];
              const stageResult = await postApi('/api/lifecycle-stages', {
                assetTypeId: atResult.data.id,
                name: stage.name,
                stageOrder: j,
                isInitial: stage.isInitial,
                isTerminal: stage.isTerminal,
                color: stage.color,
              });
              if (!stageResult.ok) {
                launchWarnings.push(`Could not create stage "${stage.name}" for ${assetType.name}`);
              }
            }
          })
        );

        typeResults.forEach((r, i) => {
          if (r.status === 'rejected') {
            launchWarnings.push(`Error setting up asset type ${enabledAssetTypes[i]?.name || i}`);
          }
        });
      }

      setWarnings(launchWarnings);
      setPhase('done');

      // Brief delay so user sees "Done!" before navigating
      setTimeout(() => {
        onLaunch(productionId);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setPhase('error');
    }
  }, [state, universeId, enabledAssetTypes, onLaunch, createdProductionId]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-medium text-gray-100">
          Review &amp; Launch
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Everything looks good? Hit launch to create your production.
        </p>
      </div>

      {/* Review summary */}
      <div className="space-y-4">
        {/* Production info */}
        <ReviewCard
          icon={<Clapperboard className="w-4 h-4 text-vhs-400" />}
          title={state.show.name}
        >
          <div className="space-y-1">
            {state.show.season && (
              <p className="text-sm text-gray-400">
                Season: {state.show.season}
              </p>
            )}
            {(state.show.startDate || state.show.endDate) && (
              <p className="text-sm text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {state.show.startDate || '?'} &mdash;{' '}
                {state.show.endDate || '?'}
              </p>
            )}
          </div>
        </ReviewCard>

        {/* Cast */}
        <ReviewCard
          icon={<Users className="w-4 h-4 text-blue-400" />}
          title={`${state.cast.length} cast member${state.cast.length !== 1 ? 's' : ''}`}
        >
          {state.cast.length > 0 ? (
            <p className="text-sm text-gray-400">
              {state.cast
                .slice(0, 5)
                .map((c) => c.name)
                .join(', ')}
              {state.cast.length > 5 && ` +${state.cast.length - 5} more`}
            </p>
          ) : (
            <p className="text-sm text-gray-600 italic">
              None added (you can add cast later)
            </p>
          )}
        </ReviewCard>

        {/* Crew */}
        <ReviewCard
          icon={<Users className="w-4 h-4 text-purple-400" />}
          title={`${state.crew.length} crew member${state.crew.length !== 1 ? 's' : ''}`}
        >
          {state.crew.length > 0 ? (
            <p className="text-sm text-gray-400">
              {state.crew
                .slice(0, 5)
                .map((c) => `${c.name} (${c.role})`)
                .join(', ')}
              {state.crew.length > 5 && ` +${state.crew.length - 5} more`}
            </p>
          ) : (
            <p className="text-sm text-gray-600 italic">
              None added (you can add crew later)
            </p>
          )}
        </ReviewCard>

        {/* Asset types */}
        <ReviewCard
          icon={<Layers className="w-4 h-4 text-green-400" />}
          title={`${enabledAssetTypes.length} asset type${enabledAssetTypes.length !== 1 ? 's' : ''}`}
        >
          {enabledAssetTypes.length > 0 ? (
            <div className="space-y-1">
              {enabledAssetTypes.map((t) => (
                <div key={t.tempId} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="text-sm text-gray-400">
                    {t.name}{' '}
                    <span className="text-gray-600">
                      ({t.stages.length} stage{t.stages.length !== 1 ? 's' : ''})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 italic">
              No asset types enabled
            </p>
          )}
        </ReviewCard>
      </div>

      {/* Launch area */}
      <div className="pt-4 border-t border-panel-border space-y-4">
        {/* Progress indicator */}
        {phase !== 'idle' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-tertiary">
            {phase === 'done' ? (
              <Check className="w-5 h-5 text-green-400 shrink-0" />
            ) : phase === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <Loader2 className="w-5 h-5 text-vhs-400 animate-spin shrink-0" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                phase === 'done' && 'text-green-400',
                phase === 'error' && 'text-red-400',
                phase !== 'done' && phase !== 'error' && 'text-gray-300'
              )}
            >
              {PHASE_LABELS[phase]}
            </span>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="px-4 py-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-xs font-medium text-yellow-400 mb-1">
              Completed with warnings:
            </p>
            <ul className="space-y-0.5">
              {warnings.map((w, i) => (
                <li key={i} className="text-xs text-yellow-400/70">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/5 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isLaunching || phase === 'done'}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              isLaunching || phase === 'done'
                ? 'text-gray-700 cursor-not-allowed'
                : 'text-gray-400 hover:text-gray-200'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex-1" />

          {phase === 'error' ? (
            <button
              type="button"
              onClick={handleLaunch}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg bg-vhs-400 text-white hover:bg-vhs-500 transition-colors"
            >
              <Rocket className="w-4 h-4" />
              Retry Launch
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isLaunching || phase === 'done'}
              className={cn(
                'flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-colors',
                isLaunching || phase === 'done'
                  ? 'bg-surface-tertiary text-gray-600 cursor-not-allowed'
                  : 'bg-vhs-400 text-white hover:bg-vhs-500'
              )}
            >
              <Rocket className="w-4 h-4" />
              {phase === 'done' ? 'Launched!' : 'Launch Production'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Review summary card component
 */
function ReviewCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 rounded-lg bg-surface-secondary border border-panel-border">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <h3 className="text-sm font-medium text-gray-200">{title}</h3>
      </div>
      {children}
    </div>
  );
}
