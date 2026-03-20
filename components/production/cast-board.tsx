'use client';

/**
 * Cast Board — Full table view of cast contracts for a production
 *
 * Fetches contracts via API, supports optimistic checkbox toggling,
 * and displays a summary bar.
 */

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw, Users } from 'lucide-react';
import { CastRow } from '@/components/production/cast-row';
import { KPIRow, getHealthColor } from './bluf';
import { useProduction } from '@/components/production/production-context';
import { useRealtimeSubscription } from '@/lib/hooks/use-realtime';
import type { CastContract } from '@/types/production';

export function CastBoard() {
  const { production, loading: prodLoading } = useProduction();
  const [contracts, setContracts] = useState<CastContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!production) return;
    setLoading(true);
    setError(null);

    try {
      const castRes = await fetch(`/api/cast-contracts?productionId=${production.id}`);
      if (!castRes.ok) throw new Error('Failed to fetch cast contracts');
      const castData = await castRes.json();
      const items = castData?.data?.items ?? castData?.data ?? [];
      setContracts(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [production]);

  useEffect(() => {
    if (production) fetchData();
  }, [production, fetchData]);

  useRealtimeSubscription('cast_contracts', {
    filter: production ? `production_id=eq.${production.id}` : undefined,
    onChange: () => fetchData(),
    enabled: !!production,
  });

  const handleToggle = useCallback(
    async (id: string, field: string, value: boolean) => {
      // Optimistic update
      setContracts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
      );

      try {
        const res = await fetch(`/api/cast-contracts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        });

        if (!res.ok) {
          // Revert on failure
          setContracts((prev) =>
            prev.map((c) => (c.id === id ? { ...c, [field]: !value } : c))
          );
        }
      } catch {
        // Revert on network error
        setContracts((prev) =>
          prev.map((c) => (c.id === id ? { ...c, [field]: !value } : c))
        );
      }
    },
    []
  );

  // Summary stats
  const signedCount = contracts.filter((c) => c.contractStatus === 'signed').length;
  const totalCount = contracts.length;
  const completionFields = ['shootDone', 'interviewDone', 'pickupDone', 'paymentDone'] as const;
  const totalChecks = totalCount * completionFields.length;
  const doneChecks = contracts.reduce(
    (sum, c) => sum + completionFields.filter((f) => c[f]).length,
    0
  );
  const completionPct = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0;
  const signedPct = totalCount > 0 ? Math.round((signedCount / totalCount) * 100) : 0;

  // Loading skeleton
  if (prodLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-vhs-400" />
        <p className="mt-3 text-sm">Loading cast board...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="mt-3 text-sm text-red-400">{error}</p>
        <button
          type="button"
          onClick={fetchData}
          className="mt-4 flex items-center gap-2 rounded-md bg-surface-secondary px-4 py-2 text-sm text-gray-300 hover:bg-surface-tertiary transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* KPI summary */}
      <KPIRow items={[
        { label: 'Signed', value: `${signedCount}/${contracts.length}`, color: getHealthColor(signedPct) },
        { label: 'Completion', value: `${completionPct}%`, color: getHealthColor(completionPct) },
      ]} />

      {/* Table */}
      {contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-panel-border rounded-lg bg-surface-secondary">
          <Users className="h-10 w-10 text-gray-600 mb-3" />
          <h3 className="text-sm font-medium text-gray-300 mb-1">No cast contracts yet</h3>
          <p className="text-xs text-gray-500 max-w-xs">
            Add cast members and their contracts from the production dashboard to start tracking.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-panel-border">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-panel-border bg-panel-header">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Payment
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Shoot
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Interview
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pickup
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Payment
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <CastRow
                  key={contract.id}
                  contract={contract}
                  onToggle={handleToggle}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
