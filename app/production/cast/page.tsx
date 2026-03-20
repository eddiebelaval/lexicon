'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { CastCardGrid } from '@/components/production/cast-card-grid';
import { useProduction } from '@/components/production/production-context';
import { useRealtimeSubscription } from '@/lib/hooks/use-realtime';
import type { CastContract } from '@/types/production';

export default function CastPage() {
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

  if (prodLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-vhs-400" />
        <p className="mt-3 text-sm">Loading cast...</p>
      </div>
    );
  }

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
    <CastCardGrid
      contracts={contracts}
      loading={loading}
    />
  );
}
