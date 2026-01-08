'use client';

import { useState, useEffect } from 'react';
import { cn, capitalize } from '@/lib/utils';
import { Plus, Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EntityTypeBadge } from '@/components/entities/entity-type-badge';
import { RelationshipTypeBadge } from './relationship-type-badge';
import type { RelationshipWithEntities, RelationshipType } from '@/types';

interface RelationshipListProps {
  universeId: string;
  entityId?: string; // Optional: filter to relationships for a specific entity
  onSelectRelationship: (relationship: RelationshipWithEntities) => void;
  onCreateRelationship: () => void;
  selectedRelationshipId?: string;
  className?: string;
}

const relationshipTypes: (RelationshipType | 'all')[] = [
  'all',
  'knows',
  'loves',
  'opposes',
  'works_for',
  'family_of',
  'located_at',
  'participated_in',
  'possesses',
  'member_of',
];

export function RelationshipList({
  universeId,
  entityId,
  onSelectRelationship,
  onCreateRelationship,
  selectedRelationshipId,
  className,
}: RelationshipListProps) {
  const [relationships, setRelationships] = useState<RelationshipWithEntities[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RelationshipType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadRelationships() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ universeId });
        if (entityId) {
          params.append('entityId', entityId);
        }
        if (filter !== 'all') {
          params.append('type', filter);
        }

        const response = await fetch(`/api/relationships?${params}`);
        const data = await response.json();

        if (data.success) {
          setRelationships(data.data.items || data.data);
        } else {
          setError(data.error?.message || 'Failed to load relationships');
        }
      } catch {
        setError('Failed to load relationships');
      } finally {
        setLoading(false);
      }
    }

    loadRelationships();
  }, [universeId, entityId, filter]);

  // Filter relationships by search query locally (search entity names)
  const filteredRelationships = searchQuery
    ? relationships.filter(
        (r) =>
          r.source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.target.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.context?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : relationships;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Relationships</h2>
          <Button size="sm" variant="outline" onClick={onCreateRelationship}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search relationships..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Filter Pills - Scrollable */}
      <div className="flex gap-1 p-2 border-b overflow-x-auto">
        {relationshipTypes.map((type) => (
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
            {type === 'all' ? 'All' : capitalize(type.replace('_', ' '))}
          </button>
        ))}
      </div>

      {/* Relationship List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-destructive">
            {error}
          </div>
        ) : filteredRelationships.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
            <p>No relationships found</p>
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
          filteredRelationships.map((relationship) => (
            <button
              key={relationship.id}
              onClick={() => onSelectRelationship(relationship)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors',
                'hover:bg-muted',
                selectedRelationshipId === relationship.id &&
                  'bg-lexicon-100 text-lexicon-900'
              )}
            >
              {/* Source */}
              <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                <EntityTypeBadge type={relationship.source.type} size="sm" />
                <span className="truncate text-sm max-w-[80px]">
                  {relationship.source.name}
                </span>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />

              {/* Target */}
              <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                <EntityTypeBadge type={relationship.target.type} size="sm" />
                <span className="truncate text-sm max-w-[80px]">
                  {relationship.target.name}
                </span>
              </div>

              {/* Type Badge (hidden on small screens) */}
              <RelationshipTypeBadge
                type={relationship.type}
                size="sm"
                className="ml-auto flex-shrink-0 hidden sm:inline-flex"
              />
            </button>
          ))
        )}
      </nav>

      {/* Relationship Count */}
      <div className="p-2 border-t text-xs text-muted-foreground text-center">
        {filteredRelationships.length}{' '}
        {filteredRelationships.length === 1 ? 'relationship' : 'relationships'}
      </div>
    </div>
  );
}
