'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { EntityCard } from '@/components/entities/entity-card';
import { Loader2, Search as SearchIcon, Sparkles } from 'lucide-react';
import type { Entity, RelationshipWithEntities, SynthesizedAnswer, SearchSource } from '@/types';
import { ArrowRight } from 'lucide-react';
import { EntityTypeBadge } from '@/components/entities/entity-type-badge';
import { RelationshipTypeBadge } from '@/components/relationships/relationship-type-badge';
import { AIAnswer } from './ai-answer';

/**
 * Simple relationship type from graph search
 * (before enrichment with full entity data)
 */
interface GraphRelationship {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  type: string;
  context?: string;
}

interface SearchResultsProps {
  entities: Entity[];
  relationships: GraphRelationship[];
  query: string;
  onSelectEntity: (entity: Entity) => void;
  onSelectRelationship: (relationship: RelationshipWithEntities) => void;
  loading: boolean;
  className?: string;
  // AI search props
  aiMode?: boolean;
  aiAnswer?: SynthesizedAnswer | null;
  aiLoading?: boolean;
  aiError?: string | null;
  onSourceClick?: (source: SearchSource) => void;
}

/**
 * Compact relationship card for search results
 * Shows simple relationship without requiring full entity data
 */
function CompactRelationshipCard({
  relationship,
  source,
  target,
  onClick,
}: {
  relationship: GraphRelationship;
  source: Entity | undefined;
  target: Entity | undefined;
  onClick: (relationship: RelationshipWithEntities) => void;
}) {
  // If we don't have both entities, don't render
  if (!source || !target) return null;

  const enrichedRelationship: RelationshipWithEntities = {
    id: relationship.id,
    type: relationship.type as RelationshipWithEntities['type'],
    sourceId: relationship.from,
    targetId: relationship.to,
    context: relationship.context || '',
    strength: 3, // Default strength since we don't have it from simple search
    ongoing: true, // Default to true
    metadata: {},
    source,
    target,
  };

  return (
    <div
      onClick={() => onClick(enrichedRelationship)}
      className="bg-card rounded-lg border p-3 cursor-pointer hover:shadow-md hover:border-lexicon-300 transition-all"
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap text-sm">
        {/* Source Entity */}
        <div className="flex items-center gap-1.5">
          <EntityTypeBadge type={source.type} size="sm" />
          <span className="font-medium truncate max-w-[120px]">
            {source.name}
          </span>
        </div>

        {/* Arrow and Type */}
        <div className="flex items-center gap-1.5">
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <RelationshipTypeBadge type={relationship.type as RelationshipWithEntities['type']} size="sm" />
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
        </div>

        {/* Target Entity */}
        <div className="flex items-center gap-1.5">
          <EntityTypeBadge type={target.type} size="sm" />
          <span className="font-medium truncate max-w-[120px]">
            {target.name}
          </span>
        </div>
      </div>

      {relationship.context && (
        <p className="text-xs text-muted-foreground line-clamp-1">
          {relationship.context}
        </p>
      )}
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <SearchIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      {query ? (
        <>
          <h3 className="font-semibold text-lg mb-2">No results found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            No entities or relationships match &quot;{query}&quot;. Try a different search term
            or add more content to your universe.
          </p>
        </>
      ) : (
        <>
          <h3 className="font-semibold text-lg mb-2">Search your universe</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Type to search for entities by name, alias, or description. Results appear as you type.
          </p>
        </>
      )}
    </div>
  );
}

/**
 * SearchResults - Display search results with entities and relationships
 *
 * Features:
 * - AI answer display (when enabled)
 * - Sectioned display (entities, relationships)
 * - Result counts
 * - Empty/loading states
 * - Compact scrollable design
 */
export function SearchResults({
  entities,
  relationships,
  query,
  onSelectEntity,
  onSelectRelationship,
  loading,
  className,
  // AI props
  aiMode = false,
  aiAnswer,
  aiLoading = false,
  aiError,
  onSourceClick,
}: SearchResultsProps) {
  const hasResults = entities.length > 0 || relationships.length > 0;
  const showAISection = aiMode && (aiAnswer || aiLoading || aiError);

  // Create entity lookup map for enriching relationships
  const entityMap = useMemo(() => {
    const map = new Map<string, Entity>();
    entities.forEach((entity) => {
      map.set(entity.id, entity);
    });
    return map;
  }, [entities]);

  // Loading state (only show full loading spinner if not in AI mode)
  // In AI mode, we show the AI loading skeleton separately
  if (loading && !aiMode) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-12 text-muted-foreground',
          className
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Empty state (but still show AI answer if available)
  if (!hasResults && !showAISection) {
    return (
      <div className={className}>
        <EmptyState query={query} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* AI Answer Section */}
      {showAISection && (
        <section>
          <AIAnswer
            answer={aiAnswer ?? null}
            loading={aiLoading}
            error={aiError ?? null}
            onSourceClick={onSourceClick}
          />
        </section>
      )}

      {/* AI Mode Badge (when results are shown below AI answer) */}
      {aiMode && hasResults && !aiLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-lexicon-500" />
          <span>Related entities and relationships from your universe</span>
        </div>
      )}

      {/* Loading state for graph results in AI mode */}
      {loading && aiMode && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Entities Section */}
      {!loading && entities.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {entities.length} {entities.length === 1 ? 'Entity' : 'Entities'}
          </h2>
          <div className="grid gap-3">
            {entities.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                onClick={onSelectEntity}
              />
            ))}
          </div>
        </section>
      )}

      {/* Relationships Section */}
      {!loading && relationships.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {relationships.length}{' '}
            {relationships.length === 1 ? 'Relationship' : 'Relationships'}
          </h2>
          <div className="grid gap-3">
            {relationships.map((relationship) => (
              <CompactRelationshipCard
                key={relationship.id}
                relationship={relationship}
                source={entityMap.get(relationship.from)}
                target={entityMap.get(relationship.to)}
                onClick={onSelectRelationship}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
