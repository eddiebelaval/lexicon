'use client';

import { cn, getEntityColor, capitalize } from '@/lib/utils';
import type { EntityType } from '@/types';

interface EntityTypeBadgeProps {
  type: EntityType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const labelSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function EntityTypeBadge({
  type,
  size = 'md',
  showLabel = false,
  className,
}: EntityTypeBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('rounded-full', sizeClasses[size], getEntityColor(type))} />
      {showLabel && (
        <span className={cn('text-muted-foreground', labelSizeClasses[size])}>
          {capitalize(type)}
        </span>
      )}
    </span>
  );
}
