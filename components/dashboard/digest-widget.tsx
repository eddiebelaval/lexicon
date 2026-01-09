'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  ChevronRight,
  Calendar,
  TrendingUp,
  BookOpen,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Digest } from '@/types';

interface DigestWidgetProps {
  userId: string;
  className?: string;
}

/**
 * Dashboard Digest Widget
 *
 * Shows the latest digest summary with quick stats
 * and link to view full digest.
 */
export function DigestWidget({ userId, className }: DigestWidgetProps) {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestDigest();
  }, [userId]);

  async function fetchLatestDigest() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/digests?userId=${userId}&limit=1`);
      if (!res.ok) throw new Error('Failed to fetch digest');

      const data = await res.json();
      setDigest(data.digests?.[0] || null);
    } catch (err) {
      console.error('Error fetching digest:', err);
      setError('Failed to load digest');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-xl border border-[#252525] bg-[#141414] p-6',
          className
        )}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'rounded-xl border border-[#252525] bg-[#141414] p-6',
          className
        )}
      >
        <div className="text-center py-4">
          <p className="text-[#666] text-sm mb-3">{error}</p>
          <button
            onClick={fetchLatestDigest}
            className="inline-flex items-center gap-2 text-[#38bdf8] hover:text-[#5ccfff] text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!digest) {
    return (
      <div
        className={cn(
          'rounded-xl border border-[#252525] bg-[#141414] p-6',
          className
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[#1a1a1a]">
            <Newspaper className="w-5 h-5 text-[#38bdf8]" />
          </div>
          <h3 className="text-lg font-semibold text-white">Daily Digest</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-[#666] text-sm mb-2">No digests yet</p>
          <p className="text-[#555] text-xs">
            Digests are generated daily when there are new updates
          </p>
        </div>
      </div>
    );
  }

  const isNew = !digest.viewedAt;
  const formattedDate = new Date(digest.generatedAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={cn(
        'rounded-xl border bg-[#141414] overflow-hidden',
        isNew ? 'border-[#38bdf8]/30' : 'border-[#252525]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#1a1a1a]">
            <Newspaper className="w-5 h-5 text-[#38bdf8]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Daily Digest</h3>
            <div className="flex items-center gap-2 text-xs text-[#666]">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </div>
          </div>
        </div>
        {isNew && (
          <span className="px-2 py-0.5 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] text-xs font-medium">
            New
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h4 className="text-white font-medium mb-3">{digest.title}</h4>

        {/* Summary */}
        <p className="text-[#999] text-sm leading-relaxed mb-4 line-clamp-3">
          {digest.summary}
        </p>

        {/* Stats */}
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#38bdf8]" />
            <span className="text-sm">
              <span className="text-white font-medium">{digest.updatesCount}</span>
              <span className="text-[#666] ml-1">updates</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#38bdf8]" />
            <span className="text-sm">
              <span className="text-white font-medium">{digest.storylinesCount}</span>
              <span className="text-[#666] ml-1">storylines</span>
            </span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/digest/${digest.id}`}
          className={cn(
            'flex items-center justify-between w-full',
            'px-4 py-3 rounded-lg',
            'bg-[#1a1a1a] hover:bg-[#1f1f1f]',
            'border border-[#252525] hover:border-[#333]',
            'transition-all duration-200 group'
          )}
        >
          <span className="text-sm text-white group-hover:text-[#38bdf8] transition-colors">
            Read full digest
          </span>
          <ChevronRight className="w-4 h-4 text-[#666] group-hover:text-[#38bdf8] group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Time period */}
      <div className="px-6 py-3 bg-[#0f0f0f] border-t border-[#1f1f1f]">
        <p className="text-xs text-[#555]">
          Covers {formatTimeRange(digest.periodStart, digest.periodEnd)}
        </p>
      </div>
    </div>
  );
}

function formatTimeRange(start: Date, end: Date): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startStr = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const endStr = endDate.toLocaleDateString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${startStr} - ${endStr}`;
}

export default DigestWidget;
