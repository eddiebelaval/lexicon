'use client';

/**
 * Web Data Badge - Status indicator for web enrichment
 *
 * Shows whether the wiki is displaying offline-only data
 * or enriched with web search results.
 */

import { WifiOff, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebDataBadgeProps {
  enabled: boolean;
  loading?: boolean;
  className?: string;
}

export function WebDataBadge({ enabled, loading, className }: WebDataBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300",
        enabled
          ? "bg-vhs-900 border border-vhs-700"
          : "bg-surface-tertiary border border-[hsl(0,0%,18%)]",
        className
      )}
    >
      {/* Status Icon */}
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center",
        enabled
          ? "bg-vhs-800"
          : "bg-surface-elevated"
      )}>
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin text-vhs-400" />
        ) : enabled ? (
          <Sparkles className="w-3 h-3 text-vhs-400" />
        ) : (
          <WifiOff className="w-3 h-3 text-muted-foreground/60" />
        )}
      </div>

      {/* Status Text */}
      <div className="flex flex-col">
        <span className={cn(
          "font-semibold",
          enabled ? "text-vhs-400" : "text-muted-foreground"
        )}>
          {loading
            ? 'Enriching...'
            : enabled
              ? 'Web Enhanced'
              : 'Offline Mode'
          }
        </span>
        <span className={cn(
          "text-[10px]",
          enabled ? "text-vhs-400/60" : "text-muted-foreground/50"
        )}>
          {loading
            ? 'Fetching web data'
            : enabled
              ? 'Live web data included'
              : 'Knowledge base only'
          }
        </span>
      </div>

      {/* Pulse Animation when Enabled */}
      {enabled && !loading && (
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-vhs-400" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-vhs-400 animate-ping opacity-75" />
        </div>
      )}
    </div>
  );
}
