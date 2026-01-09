'use client';

import { cn, truncate, formatDate } from '@/lib/utils';
import { EntityTypeBadge } from './entity-type-badge';
import type { EntityType, EntityStatus } from '@/types';

/**
 * Entity-like object that can be displayed in a card
 * Works with both Entity (Date) and GraphEntity (string) date formats
 */
export interface DisplayEntity {
  id: string;
  name: string;
  type: EntityType;
  description: string;
  aliases: string[];
  status: EntityStatus;
  imageUrl?: string;
  metadata: Record<string, unknown>;
  universeId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface EntityCardProps {
  entity: DisplayEntity;
  isSelected?: boolean;
  onClick?: (entity: DisplayEntity) => void;
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
        'bg-[#141414] rounded-xl border border-[#1f1f1f] p-4 transition-all cursor-pointer',
        'hover:bg-[#1a1a1a] hover:border-[#38bdf8]/30',
        isSelected && 'ring-2 ring-[#38bdf8] border-[#38bdf8]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-lg leading-tight text-white">{entity.name}</h3>
        <EntityTypeBadge type={entity.type} showLabel size="sm" />
      </div>

      <p className="text-sm text-[#888] mb-3">
        {truncate(entity.description, 120)}
      </p>

      {entity.aliases.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {entity.aliases.slice(0, 3).map((alias, idx) => (
            <span
              key={idx}
              className="text-xs bg-[#1f1f1f] text-[#aaa] px-2 py-0.5 rounded-full"
            >
              {alias}
            </span>
          ))}
          {entity.aliases.length > 3 && (
            <span className="text-xs text-[#666]">
              +{entity.aliases.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-[#666]">
        <span
          className={cn(
            'px-1.5 py-0.5 rounded',
            entity.status === 'active' && 'bg-green-900/30 text-green-400',
            entity.status === 'inactive' && 'bg-[#1f1f1f] text-[#888]',
            entity.status === 'deceased' && 'bg-red-900/30 text-red-400'
          )}
        >
          {entity.status}
        </span>
        <span>Updated {formatDate(entity.updatedAt)}</span>
      </div>
    </div>
  );
}
