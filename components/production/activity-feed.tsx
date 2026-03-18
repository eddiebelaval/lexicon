'use client';

/**
 * Activity Feed — Live audit trail on the production dashboard
 *
 * Shows who did what, when, and via which channel.
 * "Marcus (AC) marked Chantel's shoot done via Telegram — 3:42pm"
 *
 * Subscribes to Supabase Realtime for live updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { ActivityEntry } from '@/lib/activity-log';

interface ActivityFeedProps {
  productionId: string;
}

const CHANNEL_ICONS: Record<string, string> = {
  telegram: 'TG',
  web: 'WEB',
  system: 'SYS',
  api: 'API',
};

const CHANNEL_COLORS: Record<string, string> = {
  telegram: 'text-sky-400',
  web: 'text-emerald-400',
  system: 'text-gray-500',
  api: 'text-amber-400',
};

export default function ActivityFeed({ productionId }: ActivityFeedProps) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/activity?productionId=${productionId}&limit=30`);
      const json = await res.json();
      if (json.success) {
        setEntries(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setLoading(false);
    }
  }, [productionId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Real-time subscription — new entries appear instantly
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`activity-${productionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
          filter: `production_id=eq.${productionId}`,
        },
        () => {
          // Refetch on new entry — simpler than merging
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productionId, fetchEntries]);

  if (loading) {
    return (
      <div className="rounded-lg border border-[#1a1a1a] bg-[#141414] p-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">Activity Feed</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-[#1f1f1f] rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-[#1a1a1a] bg-[#141414] p-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">Activity Feed</h3>
        <p className="text-sm text-white/30">No activity yet. Changes from the dashboard and Telegram will appear here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#1a1a1a] bg-[#141414] p-4">
      <h3 className="text-sm font-medium text-white/60 mb-3">Activity Feed</h3>
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-[#1f1f1f] transition-colors text-sm"
          >
            {/* Channel badge */}
            <span
              className={`flex-shrink-0 text-[10px] font-mono font-bold uppercase tracking-wider mt-0.5 ${
                CHANNEL_COLORS[entry.channel] || 'text-gray-500'
              }`}
            >
              {CHANNEL_ICONS[entry.channel] || entry.channel}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <span className="text-white/90">
                <span className="font-medium">{entry.actorName}</span>
                {entry.actorRole && (
                  <span className="text-white/40"> ({entry.actorRole.toUpperCase()})</span>
                )}
                {' '}
                <span className="text-white/60">{entry.action}</span>
              </span>
            </div>

            {/* Timestamp */}
            <span className="flex-shrink-0 text-[11px] text-white/30 font-mono tabular-nums">
              {formatTime(entry.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;

  // Older than today — show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
