'use client';

/**
 * ProductionAlerts — Collapsible alert banner for the production dashboard
 *
 * Fetches alerts from /api/production-alerts, displays them grouped by
 * severity with colored left borders and Lucide icons.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduction } from './production-context';

interface ProductionAlert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  entityId?: string;
  entityName?: string;
  actionUrl?: string;
}

const SEVERITY_CONFIG = {
  critical: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/5',
    icon: AlertTriangle,
    iconColor: 'text-red-400',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/5',
    icon: AlertCircle,
    iconColor: 'text-amber-400',
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/5',
    icon: Info,
    iconColor: 'text-blue-400',
  },
} as const;

export function ProductionAlerts() {
  const { production } = useProduction();
  const [alerts, setAlerts] = useState<ProductionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!production) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/production-alerts?productionId=${production.id}`
      );
      const data = await res.json();

      if (data.success) {
        setAlerts(data.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch production alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [production]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Don't render anything while loading or if no production
  if (loading || !production) return null;

  // Empty state: all clear
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
        <span className="text-sm text-emerald-400">
          No alerts — production is on track
        </span>
      </div>
    );
  }

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const totalCount = alerts.length;

  const summaryParts: string[] = [];
  if (criticalCount > 0) {
    summaryParts.push(`${criticalCount} critical`);
  }
  const summaryText = `${totalCount} alert${totalCount !== 1 ? 's' : ''}${
    summaryParts.length > 0 ? ` (${summaryParts.join(', ')})` : ''
  }`;

  return (
    <div className="rounded-lg border border-panel-border bg-surface-secondary overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
          'hover:bg-surface-tertiary',
          criticalCount > 0 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-amber-500'
        )}
      >
        <div className="flex items-center gap-2">
          {criticalCount > 0 ? (
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          )}
          <span className="text-sm font-medium text-gray-200">
            {summaryText}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Alert list */}
      {expanded && (
        <div className="border-t border-panel-border divide-y divide-panel-border">
          {alerts.map((alert) => {
            const config = SEVERITY_CONFIG[alert.severity];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 border-l-4',
                  config.border,
                  config.bg
                )}
              >
                <Icon
                  className={cn('h-4 w-4 mt-0.5 shrink-0', config.iconColor)}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200">
                    {alert.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {alert.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
