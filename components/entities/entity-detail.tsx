'use client';

import { useState, useEffect } from 'react';
import { cn, formatDate, capitalize } from '@/lib/utils';
import { EntityTypeBadge } from './entity-type-badge';
import { RelationshipTypeBadge } from '@/components/relationships/relationship-type-badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, X, ChevronDown, ChevronUp, Link2, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import type { Entity, RelationshipWithEntities } from '@/types';

interface EntityDetailProps {
  entity: Entity;
  onEdit: (entity: Entity) => void;
  onDelete: (entity: Entity) => void;
  onClose: () => void;
  onSelectRelatedEntity?: (entity: Entity) => void;
  className?: string;
}

export function EntityDetail({
  entity,
  onEdit,
  onDelete,
  onClose,
  onSelectRelatedEntity,
  className,
}: EntityDetailProps) {
  const [relationships, setRelationships] = useState<RelationshipWithEntities[]>([]);
  const [loadingRelationships, setLoadingRelationships] = useState(false);
  const [relationshipError, setRelationshipError] = useState<string | null>(null);
  const [showRelationships, setShowRelationships] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch relationships when entity changes
  useEffect(() => {
    const controller = new AbortController();

    async function fetchRelationships() {
      setLoadingRelationships(true);
      setRelationshipError(null);
      try {
        const response = await fetch(`/api/relationships?entityId=${entity.id}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (data.success) {
          setRelationships(data.data.items || data.data || []);
        } else {
          setRelationshipError(data.error?.message || 'Failed to load relationships');
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setRelationshipError('Failed to load relationships');
      } finally {
        setLoadingRelationships(false);
      }
    }

    fetchRelationships();
    return () => controller.abort();
  }, [entity.id, retryCount]);

  const handleRetryRelationships = () => setRetryCount((c) => c + 1);

  // Get the "other" entity in a relationship
  const getConnectedEntity = (rel: RelationshipWithEntities): Entity | null => {
    if (rel.sourceId === entity.id) {
      return rel.target;
    }
    return rel.source;
  };

  // Get relationship direction label
  const getDirectionLabel = (rel: RelationshipWithEntities): string => {
    if (rel.sourceId === entity.id) {
      return '→';
    }
    return '←';
  };

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

        {/* Relationships Section */}
        <div>
          <button
            onClick={() => setShowRelationships(!showRelationships)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2 hover:text-foreground transition-colors w-full"
          >
            <Link2 className="h-4 w-4" />
            <span>Relationships</span>
            {loadingRelationships ? (
              <Loader2 className="h-3 w-3 animate-spin ml-auto" />
            ) : (
              <>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {relationships.length}
                </span>
                {showRelationships ? (
                  <ChevronUp className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                )}
              </>
            )}
          </button>

          {showRelationships && !loadingRelationships && (
            <div className="space-y-2">
              {relationshipError ? (
                <div className="flex items-center gap-2 p-2 text-sm text-destructive bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{relationshipError}</span>
                  <button
                    onClick={handleRetryRelationships}
                    className="p-1 hover:bg-destructive/20 rounded"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>
              ) : relationships.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No relationships yet
                </p>
              ) : (
                relationships.map((rel) => {
                  const connected = getConnectedEntity(rel);
                  if (!connected) return null;

                  return (
                    <div
                      key={rel.id}
                      onClick={() => onSelectRelatedEntity?.(connected)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border bg-card text-sm',
                        onSelectRelatedEntity && 'cursor-pointer hover:bg-muted/50 transition-colors'
                      )}
                    >
                      <span className="text-muted-foreground text-xs">
                        {getDirectionLabel(rel)}
                      </span>
                      <RelationshipTypeBadge type={rel.type} size="sm" />
                      <span className="text-muted-foreground text-xs">
                        {getDirectionLabel(rel) === '→' ? '→' : '←'}
                      </span>
                      <EntityTypeBadge type={connected.type} size="sm" />
                      <span className="font-medium truncate flex-1">
                        {connected.name}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
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
