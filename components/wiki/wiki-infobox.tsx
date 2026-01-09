'use client';

/**
 * Wiki Infobox - Wikipedia-style information panel
 *
 * Displays universe stats and key information in a
 * visually appealing sidebar panel.
 */

import { Users, Sparkles, TrendingUp } from 'lucide-react';
import type { EntityType } from '@/types';
import { cn } from '@/lib/utils';

interface WikiInfoboxProps {
  title: string;
  imageUrl?: string;
  stats: {
    totalEntities: number;
    totalRelationships: number;
    entityBreakdown: Record<EntityType, number>;
    recentEntity: { name: string; type: EntityType; updatedAt: Date } | null;
  } | null;
  entityTypeConfig: Record<EntityType, {
    icon: typeof Users;
    label: string;
    pluralLabel: string;
    color: string;
    bgColor: string;
  }>;
}

export function WikiInfobox({ title, imageUrl, stats, entityTypeConfig }: WikiInfoboxProps) {
  if (!stats) return null;

  // Calculate percentages for the breakdown chart
  const maxCount = Math.max(...Object.values(stats.entityBreakdown));

  return (
    <div className="p-4">
      {/* Infobox Header */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-vhs-900 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-vhs-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Universe Stats</h3>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>

        {/* Hero Image (if available) */}
        {imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-40 object-cover"
            />
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-tertiary rounded-lg p-3 text-center border border-[hsl(240,4%,12%)]">
            <div className="text-2xl font-bold text-foreground">{stats.totalEntities}</div>
            <div className="text-xs text-muted-foreground">Entities</div>
          </div>
          <div className="bg-surface-tertiary rounded-lg p-3 text-center border border-[hsl(240,4%,12%)]">
            <div className="text-2xl font-bold text-foreground">{stats.totalRelationships}</div>
            <div className="text-xs text-muted-foreground">Connections</div>
          </div>
        </div>
      </div>

      {/* Entity Breakdown */}
      <div className="glass-card p-4 mb-4">
        <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-vhs-400" />
          Entity Breakdown
        </h4>

        <div className="space-y-3">
          {(Object.keys(entityTypeConfig) as EntityType[]).map(type => {
            const count = stats.entityBreakdown[type];
            if (count === 0) return null;

            const config = entityTypeConfig[type];
            const Icon = config.icon;
            const percentage = (count / maxCount) * 100;

            return (
              <div key={type}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <Icon className={cn("w-3.5 h-3.5", config.color)} />
                    <span className="text-muted-foreground">{config.pluralLabel}</span>
                  </span>
                  <span className="text-foreground font-medium">{count}</span>
                </div>
                <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      type === 'character' && 'bg-graph-character',
                      type === 'location' && 'bg-graph-location',
                      type === 'event' && 'bg-graph-event',
                      type === 'object' && 'bg-graph-object',
                      type === 'faction' && 'bg-graph-faction'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recentEntity && (
        <div className="glass-card p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h4>
          <div className="flex items-center gap-3 p-2 bg-surface-tertiary rounded-lg border border-[hsl(240,4%,12%)]">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              entityTypeConfig[stats.recentEntity.type].bgColor
            )}>
              {(() => {
                const Icon = entityTypeConfig[stats.recentEntity.type].icon;
                return <Icon className={cn("w-4 h-4", entityTypeConfig[stats.recentEntity.type].color)} />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {stats.recentEntity.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Updated {new Date(stats.recentEntity.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
