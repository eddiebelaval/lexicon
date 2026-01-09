'use client';

import { useState, useEffect } from 'react';
import { cn, getEntityColor, capitalize } from '@/lib/utils';
import { Plus, Search, RefreshCw, AlertCircle } from 'lucide-react';
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
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEntities() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ universeId });
        if (filter !== 'all') {
          params.append('type', filter);
        }

        const response = await fetch(`/api/entities?${params}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (data.success) {
          setEntities(data.data.items || data.data);
        } else {
          setError(data.error?.message || 'Failed to load entities');
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError('Failed to load entities. Check your connection.');
      } finally {
        setLoading(false);
      }
    }

    loadEntities();
    return () => controller.abort();
  }, [universeId, filter, retryCount]);

  const handleRetry = () => setRetryCount((c) => c + 1);

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
      <div className="p-4 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">Entities</h2>
          <button
            onClick={onCreateEntity}
            className="flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg bg-[#1f1f1f] text-[#888] border border-[#333] hover:border-[#444] hover:text-white transition-all"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#666]" />
          <input
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder:text-[#666] text-sm focus:outline-none focus:border-[#38bdf8] transition-colors"
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1 p-2 border-b border-[#1a1a1a] overflow-x-auto">
        {entityTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              'px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-all',
              filter === type
                ? 'bg-[#38bdf8] text-[#0a0a0a] font-medium'
                : 'bg-[#1f1f1f] hover:bg-[#252525] text-[#888] hover:text-white'
            )}
          >
            {capitalize(type)}
          </button>
        ))}
      </div>

      {/* Entity List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="space-y-2 py-2">
            {/* Loading skeleton */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-[#1f1f1f]" />
                <div className="h-4 bg-[#1f1f1f] rounded flex-1" style={{ width: `${60 + (i * 7) % 30}%` }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-[#1f1f1f] text-[#888] border border-[#333] hover:border-[#444] hover:text-white transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : filteredEntities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[#666] text-sm">
            <p>No entities found</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-[#38bdf8] hover:underline mt-1"
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
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all',
                'hover:bg-[#1a1a1a]',
                selectedEntityId === entity.id
                  ? 'bg-[#38bdf8]/10 text-white border border-[#38bdf8]/30'
                  : 'text-[#ccc]'
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
      <div className="p-2 border-t border-[#1a1a1a] text-xs text-[#666] text-center">
        {filteredEntities.length} {filteredEntities.length === 1 ? 'entity' : 'entities'}
      </div>
    </div>
  );
}
