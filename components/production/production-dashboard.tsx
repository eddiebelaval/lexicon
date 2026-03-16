'use client';

/**
 * Production Dashboard — Overview of production status
 *
 * Shows stat cards, upcoming scenes, and incomplete contracts
 * for the active production in a universe.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Users,
  FileCheck,
  Clapperboard,
  UserCog,
  MapPin,
  CalendarDays,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductionStats } from './production-stats';
import { useProduction } from './production-context';
import { useRealtimeSubscription } from '@/lib/hooks/use-realtime';
import { SCENE_STATUS_CONFIG, CONTRACT_STATUS_CONFIG } from '@/lib/production-config';
import type {
  ProdScene,
  CastContract,
  CrewMember,
} from '@/types';

type LoadingState = 'idle' | 'loading' | 'loaded' | 'error';

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-surface-tertiary border border-panel-border rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-gray-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-16 bg-gray-800 rounded animate-pulse" />
              <div className="h-6 w-10 bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 bg-gray-800/50 rounded-md animate-pulse"
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard component
// ---------------------------------------------------------------------------

export function ProductionDashboard() {
  const params = useParams();
  const universeId = params.id as string;
  const { production, loading: prodLoading } = useProduction();
  const [scenes, setScenes] = useState<ProdScene[]>([]);
  const [contracts, setContracts] = useState<CastContract[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [state, setState] = useState<LoadingState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = useCallback(async () => {
    if (!production) return;
    setState('loading');
    setErrorMsg('');

    try {
      // Fetch scenes, contracts, crew in parallel
      const [scenesRes, contractsRes, crewRes] = await Promise.all([
        fetch(`/api/scenes?productionId=${production.id}`),
        fetch(`/api/cast-contracts?productionId=${production.id}`),
        fetch(`/api/crew?productionId=${production.id}`),
      ]);

      const [scenesData, contractsData, crewData] = await Promise.all([
        scenesRes.json(),
        contractsRes.json(),
        crewRes.json(),
      ]);

      if (scenesData.success) {
        setScenes(scenesData.data.items ?? scenesData.data ?? []);
      }
      if (contractsData.success) {
        setContracts(contractsData.data.items ?? contractsData.data ?? []);
      }
      if (crewData.success) {
        setCrew(crewData.data.items ?? crewData.data ?? []);
      }

      setState('loaded');
    } catch (err) {
      console.error('Production dashboard fetch failed:', err);
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to load production data'
      );
      setState('error');
    }
  }, [production]);

  useEffect(() => {
    if (production) fetchData();
  }, [production, fetchData]);

  // Auto-refresh when production data changes (filtered to this production)
  useRealtimeSubscription('scenes', {
    filter: production ? `production_id=eq.${production.id}` : undefined,
    onChange: fetchData,
    enabled: !!production,
  });
  useRealtimeSubscription('cast_contracts', {
    filter: production ? `production_id=eq.${production.id}` : undefined,
    onChange: fetchData,
    enabled: !!production,
  });
  useRealtimeSubscription('crew_members', {
    filter: production ? `production_id=eq.${production.id}` : undefined,
    onChange: fetchData,
    enabled: !!production,
  });

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  const totalCast = contracts.length;
  const signedContracts = contracts.filter(
    (c) => c.contractStatus === 'signed'
  ).length;
  const scenesShot = scenes.filter(
    (s) => s.status === 'shot' || s.status === 'self_shot'
  ).length;
  const activeCrew = crew.filter((c) => c.isActive).length;

  const upcomingScenes = scenes
    .filter(
      (s) => s.status === 'scheduled' || s.status === 'postponed'
    )
    .sort((a, b) => {
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      return a.scheduledDate.localeCompare(b.scheduledDate);
    })
    .slice(0, 10);

  const incompleteContracts = contracts.filter(
    (c) =>
      !c.shootDone || !c.interviewDone || !c.pickupDone || !c.paymentDone
  );

  const stats = [
    {
      label: 'Total Cast',
      value: totalCast,
      detail: `${signedContracts} signed`,
      icon: Users,
    },
    {
      label: 'Signed Contracts',
      value: signedContracts,
      detail: totalCast > 0
        ? `${Math.round((signedContracts / totalCast) * 100)}%`
        : undefined,
      icon: FileCheck,
    },
    {
      label: 'Scenes',
      value: `${scenesShot}/${scenes.length}`,
      detail: 'shot / total',
      icon: Clapperboard,
    },
    {
      label: 'Active Crew',
      value: activeCrew,
      detail: `${crew.length} total`,
      icon: UserCog,
    },
  ];

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  function getMissingItems(c: CastContract): string[] {
    const missing: string[] = [];
    if (!c.shootDone) missing.push('shoot');
    if (!c.interviewDone) missing.push('intv');
    if (!c.pickupDone) missing.push('pickup');
    if (!c.paymentDone) missing.push('payment');
    return missing;
  }

  // -----------------------------------------------------------------------
  // States
  // -----------------------------------------------------------------------

  if (prodLoading || state === 'loading' || state === 'idle') {
    return (
      <div className="space-y-8">
        <StatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            <div className="h-5 w-36 bg-gray-800 rounded animate-pulse mb-4" />
            <ListSkeleton rows={4} />
          </section>
          <section>
            <div className="h-5 w-44 bg-gray-800 rounded animate-pulse mb-4" />
            <ListSkeleton rows={4} />
          </section>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
        <p className="text-sm text-gray-400 mb-4">{errorMsg}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-vhs-400 border border-vhs-400/30 rounded-md hover:bg-vhs-400/10 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (!production) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Clapperboard className="h-12 w-12 text-gray-600 mb-4" />
        <h2 className="text-lg font-medium text-gray-300 mb-2">
          No production set up yet
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md">
          Set up your production to start tracking cast, crew, scenes, contracts, and deliverables — all in one place.
        </p>
        <Link
          href={`/universe/${universeId}/production/intake`}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-vhs-400 text-white rounded-md hover:bg-vhs-500 transition-colors"
        >
          <Clapperboard className="h-4 w-4" />
          Set Up Your Production
        </Link>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <ProductionStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Scenes */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Upcoming Scenes
          </h2>

          {upcomingScenes.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center border border-panel-border rounded-lg bg-surface-secondary">
              <CalendarDays className="h-8 w-8 text-gray-600 mb-2" />
              <p className="text-sm text-gray-400">No upcoming scenes</p>
              <p className="text-xs text-gray-600 mt-0.5">Schedule scenes from the Calendar tab.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingScenes.map((scene) => (
                <div
                  key={scene.id}
                  className="flex items-center justify-between bg-surface-secondary border border-panel-border rounded-lg px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {scene.sceneNumber && (
                        <span className="text-xs font-mono text-gray-500">
                          #{scene.sceneNumber}
                        </span>
                      )}
                      <span className="text-sm font-medium text-gray-200 truncate">
                        {scene.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {scene.scheduledDate && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDateShort(scene.scheduledDate)}
                        </span>
                      )}
                      {scene.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" />
                          {scene.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={cn(
                      'ml-3 shrink-0 px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                      `${SCENE_STATUS_CONFIG[scene.status].bg} ${SCENE_STATUS_CONFIG[scene.status].text}`
                    )}
                  >
                    {SCENE_STATUS_CONFIG[scene.status].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Incomplete Contracts */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Incomplete Contracts
          </h2>

          {incompleteContracts.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center border border-panel-border rounded-lg bg-surface-secondary">
              <FileCheck className="h-8 w-8 text-emerald-500/50 mb-2" />
              <p className="text-sm text-emerald-400">All contracts complete</p>
              <p className="text-xs text-gray-600 mt-0.5">Nothing needs attention right now.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {incompleteContracts.map((contract) => {
                const missing = getMissingItems(contract);
                return (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between bg-surface-secondary border border-panel-border rounded-lg px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-200 truncate font-mono">
                        {contract.castEntityId}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                            `${CONTRACT_STATUS_CONFIG[contract.contractStatus].bg} ${CONTRACT_STATUS_CONFIG[contract.contractStatus].text}`
                          )}
                        >
                          {CONTRACT_STATUS_CONFIG[contract.contractStatus].label}
                        </span>
                        <span className="text-xs text-gray-600">|</span>
                        <span className="text-xs text-red-400/80">
                          missing: {missing.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
