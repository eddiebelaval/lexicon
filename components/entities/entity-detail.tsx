'use client';

import { cn, formatDate, capitalize } from '@/lib/utils';
import { EntityTypeBadge } from './entity-type-badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, X } from 'lucide-react';
import type { Entity } from '@/types';

interface EntityDetailProps {
  entity: Entity;
  onEdit: (entity: Entity) => void;
  onDelete: (entity: Entity) => void;
  onClose: () => void;
  className?: string;
}

export function EntityDetail({
  entity,
  onEdit,
  onDelete,
  onClose,
  className,
}: EntityDetailProps) {
  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <EntityTypeBadge type={entity.type} size="md" />
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded',
                entity.status === 'active' && 'bg-green-100 text-green-700',
                entity.status === 'inactive' && 'bg-gray-100 text-gray-700',
                entity.status === 'deceased' && 'bg-red-100 text-red-700'
              )}
            >
              {capitalize(entity.status)}
            </span>
          </div>
          <h2 className="text-xl font-bold truncate">{entity.name}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Aliases */}
        {entity.aliases.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Also known as
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {entity.aliases.map((alias, idx) => (
                <span
                  key={idx}
                  className="text-sm bg-muted px-2 py-1 rounded-full"
                >
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Description
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {entity.description}
          </p>
        </div>

        {/* Image */}
        {entity.imageUrl && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Image
            </h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entity.imageUrl}
              alt={entity.name}
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        )}

        {/* Metadata */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Details
          </h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Type</dt>
            <dd>{capitalize(entity.type)}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{capitalize(entity.status)}</dd>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatDate(entity.createdAt)}</dd>
            <dt className="text-muted-foreground">Updated</dt>
            <dd>{formatDate(entity.updatedAt)}</dd>
          </dl>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-4 border-t">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onEdit(entity)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={() => onDelete(entity)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}
