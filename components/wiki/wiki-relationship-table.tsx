'use client';

/**
 * Wiki Relationship Table - Editorial-style relationship display
 *
 * Shows relationships in a clean, sortable table format
 * with visual hierarchy and connection strength indicators.
 */

import { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Heart,
  Swords,
  Users,
  Briefcase,
  Home,
  Calendar,
  Package,
  Shield
} from 'lucide-react';
import type { Entity, RelationshipWithEntities, RelationshipType } from '@/types';
import { cn } from '@/lib/utils';

interface WikiRelationshipTableProps {
  relationships: RelationshipWithEntities[];
  onEntityClick?: (entity: Entity) => void;
}

// Relationship type configuration
const relationshipConfig: Record<RelationshipType, {
  icon: typeof Heart;
  label: string;
  color: string;
  bgColor: string;
}> = {
  loves: {
    icon: Heart,
    label: 'Loves',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10'
  },
  opposes: {
    icon: Swords,
    label: 'Opposes',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10'
  },
  knows: {
    icon: Users,
    label: 'Knows',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10'
  },
  works_for: {
    icon: Briefcase,
    label: 'Works For',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10'
  },
  family_of: {
    icon: Home,
    label: 'Family Of',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10'
  },
  located_at: {
    icon: Home,
    label: 'Located At',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10'
  },
  participated_in: {
    icon: Calendar,
    label: 'Participated In',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10'
  },
  possesses: {
    icon: Package,
    label: 'Possesses',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10'
  },
  member_of: {
    icon: Shield,
    label: 'Member Of',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10'
  }
};

type SortField = 'source' | 'target' | 'type' | 'strength';
type SortDirection = 'asc' | 'desc';

export function WikiRelationshipTable({
  relationships,
  onEntityClick
}: WikiRelationshipTableProps) {
  const [sortField, setSortField] = useState<SortField>('source');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filter, setFilter] = useState<RelationshipType | 'all'>('all');

  // Sort and filter relationships
  const sortedRelationships = [...relationships]
    .filter(rel => filter === 'all' || rel.type === filter)
    .sort((a, b) => {
      let compare = 0;

      switch (sortField) {
        case 'source':
          compare = a.source.name.localeCompare(b.source.name);
          break;
        case 'target':
          compare = a.target.name.localeCompare(b.target.name);
          break;
        case 'type':
          compare = a.type.localeCompare(b.type);
          break;
        case 'strength':
          compare = a.strength - b.strength;
          break;
      }

      return sortDirection === 'asc' ? compare : -compare;
    });

  // Handle sort column click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort indicator
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3" />;
  };

  // Render strength indicator
  const StrengthIndicator = ({ strength }: { strength: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(level => (
        <div
          key={level}
          className={cn(
            "w-1.5 h-3 rounded-sm",
            level <= strength
              ? "bg-vhs-400"
              : "bg-surface-elevated"
          )}
        />
      ))}
    </div>
  );

  // Get unique relationship types for filter
  const uniqueTypes = [...new Set(relationships.map(r => r.type))];

  return (
    <div className="glass-card overflow-hidden">
      {/* Filter Row */}
      <div className="flex items-center gap-2 p-3 border-b border-panel-border flex-wrap">
        <span className="text-xs text-muted-foreground/60">Filter:</span>
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "text-xs px-2 py-1 rounded transition-colors",
            filter === 'all'
              ? "bg-vhs-900 text-vhs-400"
              : "bg-surface-tertiary text-muted-foreground hover:bg-surface-elevated"
          )}
        >
          All ({relationships.length})
        </button>
        {uniqueTypes.map(type => {
          const config = relationshipConfig[type];
          const count = relationships.filter(r => r.type === type).length;
          const Icon = config.icon;

          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors",
                filter === type
                  ? cn(config.bgColor, config.color)
                  : "bg-surface-tertiary text-muted-foreground hover:bg-surface-elevated"
              )}
            >
              <Icon className="w-3 h-3" />
              <span>{config.label}</span>
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-panel-border bg-panel-header">
              <th
                onClick={() => handleSort('source')}
                className="text-left text-xs font-medium text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1">
                  Source
                  <SortIndicator field="source" />
                </span>
              </th>
              <th
                onClick={() => handleSort('type')}
                className="text-left text-xs font-medium text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1">
                  Relationship
                  <SortIndicator field="type" />
                </span>
              </th>
              <th
                onClick={() => handleSort('target')}
                className="text-left text-xs font-medium text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1">
                  Target
                  <SortIndicator field="target" />
                </span>
              </th>
              <th
                onClick={() => handleSort('strength')}
                className="text-left text-xs font-medium text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1">
                  Strength
                  <SortIndicator field="strength" />
                </span>
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                Context
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRelationships.map((rel) => {
              const config = relationshipConfig[rel.type];
              const Icon = config.icon;

              return (
                <tr
                  key={rel.id}
                  className="border-b border-panel-border hover:bg-surface-tertiary/50 transition-colors"
                >
                  {/* Source */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onEntityClick?.(rel.source)}
                      className={cn(
                        "text-sm font-medium text-foreground",
                        onEntityClick && "hover:text-vhs-400 transition-colors"
                      )}
                    >
                      {rel.source.name}
                    </button>
                  </td>

                  {/* Relationship Type */}
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded",
                      config.bgColor,
                      config.color
                    )}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </td>

                  {/* Target */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onEntityClick?.(rel.target)}
                      className={cn(
                        "text-sm font-medium text-foreground",
                        onEntityClick && "hover:text-vhs-400 transition-colors"
                      )}
                    >
                      {rel.target.name}
                    </button>
                  </td>

                  {/* Strength */}
                  <td className="px-4 py-3">
                    <StrengthIndicator strength={rel.strength} />
                  </td>

                  {/* Context */}
                  <td className="px-4 py-3">
                    <p className="text-xs text-muted-foreground max-w-xs truncate">
                      {rel.context || '-'}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {sortedRelationships.length === 0 && (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No relationships match the current filter.
        </div>
      )}
    </div>
  );
}
