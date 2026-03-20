'use client';

/**
 * ProductionProvider — Shared production context for all production views
 *
 * Fetches the production once in the layout, shares it with all child
 * routes via React context. Eliminates duplicate /api/productions fetches
 * that were happening in every sub-view (dashboard, calendar, cast, crew).
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Production } from '@/types';

interface ProductionContextValue {
  production: Production | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const ProductionContext = createContext<ProductionContextValue>({
  production: null,
  loading: true,
  error: null,
  refetch: () => {},
});

export function useProduction() {
  return useContext(ProductionContext);
}

interface ProductionProviderProps {
  universeId?: string;
  children: React.ReactNode;
}

export function ProductionProvider({ universeId, children }: ProductionProviderProps) {
  const [production, setProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduction = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const query = universeId
        ? `/api/productions?universeId=${universeId}&limit=1`
        : `/api/productions?limit=1`;
      const res = await fetch(query, { signal: controller.signal });
      const data = await res.json();

      if (data.success && data.data.items.length > 0) {
        setProduction(data.data.items[0]);
      } else {
        setError('No production found');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load production');
    } finally {
      setLoading(false);
    }
  }, [universeId]);

  useEffect(() => {
    fetchProduction();
  }, [fetchProduction]);

  return (
    <ProductionContext.Provider
      value={{ production, loading, error, refetch: fetchProduction }}
    >
      {children}
    </ProductionContext.Provider>
  );
}
