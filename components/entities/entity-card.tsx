'use client';

import { cn, truncate, formatDate } from '@/lib/utils';
import { EntityTypeBadge } from './entity-type-badge';
import type { Entity } from '@/types';

interface EntityCardProps {
  entity: Entity;
  isSelected?: boolean;
  onClick?: (entity: Entity) => void;
  className?: string;
}

export function EntityCard({
  entity,
  isSelected = false,
  onClick,
  className,
}: EntityCardProps) {
  return (
    <div
      onClick={() => onClick?.(entity)}
      className={cn(
        'bg-card rounded-xl border p-4 transition-all cursor-pointer',
        'hover:shadow-lg hover:border-lexicon-300',
        isSelected && 'ring-2 ring-lexicon-500 border-lexicon-500',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-lg leading-tight">{entity.name}</h3>
        <EntityTypeBadge type={entity.type} showLabel size="sm" />
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {truncate(entity.description, 120)}
      </p>

      {entity.aliases.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {entity.aliases.slice(0, 3).map((alias, idx) => (
            <span
              key={idx}
              className="text-xs bg-muted px-2 py-0.5 rounded-full"
            >
              {alias}
            </span>
          ))}
          {entity.aliases.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{entity.aliases.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span
          className={cn(
            'px-1.5 py-0.5 rounded',
            entity.status === 'active' && 'bg-green-100 text-green-700',
            entity.status === 'inactive' && 'bg-gray-100 text-gray-700',
            entity.status === 'deceased' && 'bg-red-100 text-red-700'
          )}
        >
          {entity.status}
        </span>
        <span>Updated {formatDate(entity.updatedAt)}</span>
      </div>
    </div>
  );
}
