'use client';

/**
 * useRealtimeSubscription — Subscribe to Supabase Realtime table changes
 *
 * Generic hook that subscribes to postgres_changes on a table,
 * fires callbacks on INSERT/UPDATE/DELETE, and cleans up on unmount.
 *
 * Usage:
 *   useRealtimeSubscription('cast_contracts', {
 *     filter: `production_id=eq.${productionId}`,
 *     onInsert: (row) => setCast(prev => [...prev, mapRow(row)]),
 *     onUpdate: (row) => setCast(prev => prev.map(c => c.id === row.id ? mapRow(row) : c)),
 *     onDelete: (row) => setCast(prev => prev.filter(c => c.id !== row.id)),
 *   });
 */

import { useEffect, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Row = Record<string, unknown>;

interface RealtimeOptions {
  /** Supabase filter string, e.g., "production_id=eq.abc-123" */
  filter?: string;
  /** Called when a new row is inserted */
  onInsert?: (row: Row) => void;
  /** Called when a row is updated (receives the new row) */
  onUpdate?: (row: Row) => void;
  /** Called when a row is deleted (receives the old row) */
  onDelete?: (row: Row) => void;
  /** Called on any change — convenience for simple refetch patterns */
  onChange?: () => void;
  /** Disable the subscription (e.g., when productionId is not yet loaded) */
  enabled?: boolean;
}

export function useRealtimeSubscription(
  table: string,
  options: RealtimeOptions
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (options.enabled === false) return;

    const supabase = getSupabase();
    const channelName = `realtime-${table}-${options.filter || 'all'}-${Date.now()}`;

    // Build the subscription config
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionConfig: Record<string, any> = {
      event: '*',
      schema: 'public',
      table,
    };

    if (options.filter) {
      subscriptionConfig.filter = options.filter;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chan = supabase.channel(channelName) as any;
    const channel = chan
      .on(
        'postgres_changes',
        subscriptionConfig,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const eventType = payload.eventType as string;
          const newRow = payload.new as Row;
          const oldRow = payload.old as Row;

          if (eventType === 'INSERT' && options.onInsert) {
            options.onInsert(newRow);
          }
          if (eventType === 'UPDATE' && options.onUpdate) {
            options.onUpdate(newRow);
          }
          if (eventType === 'DELETE' && options.onDelete) {
            options.onDelete(oldRow);
          }

          if (options.onChange) {
            options.onChange();
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, options.filter, options.enabled]);
}
