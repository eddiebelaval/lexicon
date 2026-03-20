'use client';

/**
 * Production Dashboard — BLUF (Bottom Line Up Front)
 *
 * KPI row, alerts, Lexi brief, collapsible sections for scenes,
 * contracts, and activity feed.
 */

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Clapperboard,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { KPIRow, BLUFAlert, CollapsibleSection, DataTable, LexiBriefCard, getHealthColor } from './bluf';
import type { AlertItem } from './bluf';
import ActivityFeed from './activity-feed';
import { useProduction } from './production-context';
import { useRealtimeSubscription } from '@/lib/hooks/use-realtime';
import { SCENE_STATUS_CONFIG, CONTRACT_STATUS_CONFIG } from '@/lib/production-config';
import { getCastDisplayName } from '@/lib/cast-utils';
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

  // BLUF: alerts state
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  // BLUF: Lexi brief state
  const [lexiBrief, setLexiBrief] = useState('');
  const [briefGeneratedAt, setBriefGeneratedAt] = useState('');

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

  // Fetch alerts
  useEffect(() => {
    if (!production) return;
    const controller = new AbortController();

    async function fetchAlerts() {
      try {
        const res = await fetch(
          `/api/production-alerts?productionId=${production!.id}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAlerts(
            data.data.map((a: { severity: string; type: string; title: string; description?: string }) => ({
              severity: a.severity as AlertItem['severity'],
              type: a.type,
              message: a.title,
              details: a.description,
            }))
          );
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Failed to fetch alerts for BLUF:', err);
      }
    }

    fetchAlerts();
    return () => controller.abort();
  }, [production]);

  // Fetch Lexi brief
  useEffect(() => {
    if (!production) return;
    const controller = new AbortController();

    async function fetchBrief() {
      try {
        const res = await fetch(
          `/api/lexi-brief?productionId=${production!.id}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (data.success && data.data) {
          setLexiBrief(data.data.text);
          setBriefGeneratedAt(data.data.generatedAt);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Failed to fetch Lexi brief:', err);
      }
    }

    fetchBrief();
    return () => controller.abort();
  }, [production]);

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
  // Derived data (memoized to avoid recomputation on every render)
  // -----------------------------------------------------------------------

  const derived = useMemo(() => {
    const totalCast = contracts.length;
    const signedCount = contracts.filter(
      (c) => c.contractStatus === 'signed'
    ).length;
    const signedPct = totalCast > 0 ? Math.round((signedCount / totalCast) * 100) : 0;
    const scenesShot = scenes.filter(
      (s) => s.status === 'shot' || s.status === 'self_shot'
    ).length;
    const activeCrew = crew.filter((c) => c.isActive).length;

    const contractItemsDone = contracts.reduce((sum, c) => {
      let done = 0;
      if (c.shootDone) done++;
      if (c.interviewDone) done++;
      if (c.pickupDone) done++;
      if (c.paymentDone) done++;
      return sum + done;
    }, 0);
    const contractItemsTotal = contracts.length * 4;
    const completionPct =
      totalCast > 0 && scenes.length > 0
        ? Math.round(
            ((signedPct +
              (scenesShot / scenes.length) * 100 +
              (contractItemsTotal > 0 ? (contractItemsDone / contractItemsTotal) * 100 : 0)) /
              3)
          )
        : 0;

    const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
    const warningCount = alerts.filter((a) => a.severity === 'warning').length;

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

    return {
      totalCast, signedCount, signedPct, scenesShot, activeCrew,
      completionPct, criticalCount, warningCount,
      upcomingScenes, incompleteContracts,
    };
  }, [scenes, contracts, crew, alerts]);

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  function getMissingItems(c: CastContract): string {
    const missing: string[] = [];
    if (!c.shootDone) missing.push('shoot');
    if (!c.interviewDone) missing.push('intv');
    if (!c.pickupDone) missing.push('pickup');
    if (!c.paymentDone) missing.push('payment');
    return missing.join(', ');
  }

  // Scene DataTable columns/rows
  const sceneColumns = [
    { key: 'number', label: 'Scene #' },
    { key: 'title', label: 'Title' },
    { key: 'date', label: 'Date' },
    { key: 'location', label: 'Location' },
    { key: 'status', label: 'Status' },
  ];

  const sceneRows: Record<string, ReactNode>[] = derived.upcomingScenes.map((scene) => ({
    number: scene.sceneNumber ? `#${scene.sceneNumber}` : '',
    title: scene.title,
    date: scene.scheduledDate ? formatDateShort(scene.scheduledDate) : '',
    location: scene.location ?? '',
    status: (
      <span
        className={cn(
          'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
          `${SCENE_STATUS_CONFIG[scene.status].bg} ${SCENE_STATUS_CONFIG[scene.status].text}`
        )}
      >
        {SCENE_STATUS_CONFIG[scene.status].label}
      </span>
    ),
  }));

  // Contract DataTable columns/rows
  const contractColumns = [
    { key: 'name', label: 'Name', className: 'name' },
    { key: 'status', label: 'Status' },
    { key: 'missing', label: 'Missing' },
  ];

  const contractRows: Record<string, ReactNode>[] = derived.incompleteContracts.map((contract) => ({
    name: getCastDisplayName(contract),
    status: (
      <span
        className={cn(
          'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
          `${CONTRACT_STATUS_CONFIG[contract.contractStatus].bg} ${CONTRACT_STATUS_CONFIG[contract.contractStatus].text}`
        )}
      >
        {CONTRACT_STATUS_CONFIG[contract.contractStatus].label}
      </span>
    ),
    missing: <span className="text-xs text-red-400/80">{getMissingItems(contract)}</span>,
  }));

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
  // Main render — BLUF layers
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-0">
      {/* 1. KPI Row */}
      <KPIRow items={[
        { label: 'Cast Signed', value: `${derived.signedCount}/${contracts.length}`, color: getHealthColor(derived.signedPct) },
        { label: 'Scenes Shot', value: `${derived.scenesShot}/${scenes.length}`, meta: 'completed' },
        { label: 'Active Crew', value: String(derived.activeCrew) },
        { label: 'Completion', value: `${derived.completionPct}%`, color: getHealthColor(derived.completionPct) },
        { label: 'Alerts', value: String(alerts.length), color: derived.criticalCount > 0 ? 'var(--bluf-critical)' : derived.warningCount > 0 ? 'var(--bluf-warning)' : 'var(--bluf-healthy)' },
      ]} />

      {/* 2. BLUF Alert */}
      <BLUFAlert alerts={alerts} />

      {/* 3. Lexi Brief */}
      {lexiBrief && briefGeneratedAt && (
        <LexiBriefCard briefText={lexiBrief} generatedAt={briefGeneratedAt} />
      )}

      {/* 4. Upcoming Scenes (collapsible) */}
      <CollapsibleSection title="Upcoming Scenes" count={derived.upcomingScenes.length} defaultOpen={derived.upcomingScenes.length > 0}>
        <DataTable columns={sceneColumns} rows={sceneRows} compact />
      </CollapsibleSection>

      {/* 5. Contracts Needing Attention */}
      <CollapsibleSection title="Contracts Needing Attention" count={derived.incompleteContracts.length} defaultOpen={derived.incompleteContracts.length > 0}>
        <DataTable columns={contractColumns} rows={contractRows} compact />
      </CollapsibleSection>

      {/* 6. Activity (collapsed by default) */}
      <CollapsibleSection title="Activity" defaultOpen={false}>
        <ActivityFeed productionId={production.id} />
      </CollapsibleSection>
    </div>
  );
}
