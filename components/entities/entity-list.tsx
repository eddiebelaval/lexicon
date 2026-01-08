'use client';

import { useState, useEffect } from 'react';
import { cn, getEntityColor, capitalize } from '@/lib/utils';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Entity, EntityType } from '@/types';

interface EntityListProps {
  universeId: string;
  onSelectEntity: (entity: Entity) => void;
  onCreateEntity: () => void;
  selectedEntityId?: string;
  className?: string;
}

const entityTypes: (EntityType | 'all')[] = [
  'all',
  'character',
  'location',
  'event',
  'object',
  'faction',
];

export function EntityList({
  universeId,
  onSelectEntity,
  onCreateEntity,
  selectedEntityId,
  className,
}: EntityListProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EntityType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadEntities() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ universeId });
        if (filter !== 'all') {
          params.append('type', filter);
        }

        const response = await fetch(`/api/entities?${params}`);
        const data = await response.json();

        if (data.success) {
          setEntities(data.data.items || data.data);
        } else {
          setError(data.error?.message || 'Failed to load entities');
        }
      } catch {
        setError('Failed to load entities');
      } finally {
        setLoading(false);
      }
    }

    loadEntities();
  }, [universeId, filter]);

  // Filter entities by search query locally
  const filteredEntities = searchQuery
    ? entities.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.aliases.some((a) =>
            a.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : entities;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Entities</h2>
          <Button size="sm" variant="outline" onClick={onCreateEntity}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1 p-2 border-b overflow-x-auto">
        {entityTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              'px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors',
              filter === type
                ? 'bg-lexicon-600 text-white'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            )}
          >
            {capitalize(type)}
          </button>
        ))}
      </div>

      {/* Entity List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-destructive">
            {error}
          </div>
        ) : filteredEntities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
            <p>No entities found</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-lexicon-600 hover:underline mt-1"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          filteredEntities.map((entity) => (
            <button
              key={entity.id}
              onClick={() => onSelectEntity(entity)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors',
                'hover:bg-muted',
                selectedEntityId === entity.id && 'bg-lexicon-100 text-lexicon-900'
              )}
            >
              <span
                className={cn('w-2 h-2 rounded-full', getEntityColor(entity.type))}
              />
              <span className="truncate text-sm">{entity.name}</span>
            </button>
          ))
        )}
      </nav>

      {/* Entity Count */}
      <div className="p-2 border-t text-xs text-muted-foreground text-center">
        {filteredEntities.length} {filteredEntities.length === 1 ? 'entity' : 'entities'}
      </div>
    </div>
  );
}
