'use client';

/**
 * Lifecycle History — Timeline of stage transitions for an asset
 *
 * Shows every stage change: who moved it, when, and why.
 * Renders as a vertical timeline with colored dots.
 */

import { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import type { StageTransitionWithNames } from '@/types';

interface LifecycleHistoryProps {
  assetInstanceId: string;
  compact?: boolean;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function LifecycleHistory({
  assetInstanceId,
  compact = false,
}: LifecycleHistoryProps) {
  const [transitions, setTransitions] = useState<StageTransitionWithNames[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const res = await fetch(`/api/assets/${assetInstanceId}/history`);
        const data = await res.json();
        if (data.success) {
          setTransitions(data.data ?? []);
        }
      } catch {
        // Silent — history is supplementary
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [assetInstanceId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading history...
      </div>
    );
  }

  if (transitions.length === 0) {
    return (
      <div className="text-xs text-gray-600 py-2">No transitions yet.</div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        {transitions.length} transition{transitions.length !== 1 ? 's' : ''}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {transitions.map((t, i) => (
        <div key={t.id} className="flex gap-3 py-2">
          {/* Timeline dot + line */}
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-gray-500 mt-1.5 shrink-0" />
            {i < transitions.length - 1 && (
              <div className="w-px flex-1 bg-panel-border" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-2 text-xs">
              {t.fromStageName ? (
                <span className="text-gray-400">
                  <span className="text-gray-500">{t.fromStageName}</span>
                  {' '}
                  <span className="text-gray-600">-&gt;</span>
                  {' '}
                  <span className="text-gray-200">{t.toStageName}</span>
                </span>
              ) : (
                <span className="text-gray-400">
                  Created at{' '}
                  <span className="text-gray-200">{t.toStageName}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-600">
              <span>
                {formatRelativeTime(new Date(t.transitionedAt))}
              </span>
              {t.transitionedByName && (
                <>
                  <span>by</span>
                  <span className="text-gray-500">{t.transitionedByName}</span>
                </>
              )}
              {t.automated && (
                <span className="text-vhs-400/60">auto</span>
              )}
            </div>

            {t.reason && (
              <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                {t.reason}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
