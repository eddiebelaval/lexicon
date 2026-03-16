'use client';

/**
 * Production Stats — Reusable stat card grid
 *
 * Displays production KPIs in a responsive grid.
 * 4 columns on lg, 2 on sm, 1 on mobile.
 */

import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ProductionStatsProps {
  stats: StatCardProps[];
  className?: string;
}

function StatCard({ label, value, detail, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-surface-tertiary border border-panel-border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-vhs-400/10">
          <Icon className="h-4.5 w-4.5 text-vhs-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-semibold text-gray-100 leading-tight">
            {value}
          </p>
          {detail && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{detail}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductionStats({ stats, className }: ProductionStatsProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
        className
      )}
    >
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
