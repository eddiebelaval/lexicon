'use client';

import { cn, formatDate } from '@/lib/utils';
import { ArrowRight, Calendar } from 'lucide-react';
import { RelationshipTypeBadge } from './relationship-type-badge';
import { EntityTypeBadge } from '@/components/entities/entity-type-badge';
import type { RelationshipWithEntities } from '@/types';

interface RelationshipCardProps {
  relationship: RelationshipWithEntities;
  isSelected?: boolean;
  onClick?: (relationship: RelationshipWithEntities) => void;
  className?: string;
}

/**
 * Strength indicator component
 */
function StrengthIndicator({ strength }: { strength: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex items-center gap-0.5" title={`Strength: ${strength}/5`}>
      {[1, 2, 3, 4, 5].map((level) => (
        <div
          key={level}
          className={cn(
            'w-1.5 h-3 rounded-sm',
            level <= strength ? 'bg-lexicon-500' : 'bg-gray-200'
          )}
        />
      ))}
    </div>
  );
}

export function RelationshipCard({
  relationship,
  isSelected = false,
  onClick,
  className,
}: RelationshipCardProps) {
  const { source, target, type, context, strength, ongoing, startDate, endDate } =
    relationship;

  return (
    <div
      onClick={() => onClick?.(relationship)}
      className={cn(
        'bg-card rounded-xl border p-4 transition-all cursor-pointer',
        'hover:shadow-lg hover:border-lexicon-300',
        isSelected && 'ring-2 ring-lexicon-500 border-lexicon-500',
        className
      )}
    >
      {/* Source -> Target with Relationship Type */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Source Entity */}
        <div className="flex items-center gap-1.5 min-w-0">
          <EntityTypeBadge type={source.type} size="sm" />
          <span className="font-medium text-sm truncate max-w-[120px]">
            {source.name}
          </span>
        </div>

        {/* Arrow and Type */}
        <div className="flex items-center gap-1.5">
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <RelationshipTypeBadge type={type} size="sm" />
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>

        {/* Target Entity */}
        <div className="flex items-center gap-1.5 min-w-0">
          <EntityTypeBadge type={target.type} size="sm" />
          <span className="font-medium text-sm truncate max-w-[120px]">
            {target.name}
          </span>
        </div>
      </div>

      {/* Context/Description */}
      {context && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{context}</p>
      )}

      {/* Metadata Row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {/* Strength */}
          <StrengthIndicator strength={strength} />

          {/* Ongoing Status */}
          <span
            className={cn(
              'px-1.5 py-0.5 rounded',
              ongoing
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            )}
          >
            {ongoing ? 'Ongoing' : 'Ended'}
          </span>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {startDate && endDate ? (
            <span>
              {startDate} - {endDate}
            </span>
          ) : startDate ? (
            <span>Since {startDate}</span>
          ) : (
            <span>{formatDate(relationship.source.createdAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
