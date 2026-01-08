'use client';

import { cn, capitalize } from '@/lib/utils';
import type { RelationshipType } from '@/types';

interface RelationshipTypeBadgeProps {
  type: RelationshipType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Color and label mappings for relationship types
 */
const relationshipTypeConfig: Record<
  RelationshipType,
  { color: string; label: string }
> = {
  knows: { color: 'bg-blue-100 text-blue-800', label: 'Knows' },
  loves: { color: 'bg-pink-100 text-pink-800', label: 'Loves' },
  opposes: { color: 'bg-red-100 text-red-800', label: 'Opposes' },
  works_for: { color: 'bg-amber-100 text-amber-800', label: 'Works For' },
  family_of: { color: 'bg-purple-100 text-purple-800', label: 'Family Of' },
  located_at: { color: 'bg-green-100 text-green-800', label: 'Located At' },
  participated_in: { color: 'bg-cyan-100 text-cyan-800', label: 'Participated In' },
  possesses: { color: 'bg-orange-100 text-orange-800', label: 'Possesses' },
  member_of: { color: 'bg-indigo-100 text-indigo-800', label: 'Member Of' },
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
  lg: 'text-base px-2.5 py-1',
};

export function RelationshipTypeBadge({
  type,
  size = 'md',
  className,
}: RelationshipTypeBadgeProps) {
  const config = relationshipTypeConfig[type] || {
    color: 'bg-gray-100 text-gray-800',
    label: capitalize(type.replace('_', ' ')),
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}

/**
 * Get the display label for a relationship type
 */
export function getRelationshipTypeLabel(type: RelationshipType): string {
  return relationshipTypeConfig[type]?.label || capitalize(type.replace('_', ' '));
}
