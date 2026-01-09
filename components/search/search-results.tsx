'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { EntityCard, type DisplayEntity } from '@/components/entities/entity-card';
import { Loader2, Search as SearchIcon, Sparkles } from 'lucide-react';
import type { RelationshipWithEntities, SynthesizedAnswer, SearchSource } from '@/types';
import type { GraphEntity, GraphRelationship } from '@/lib/search';
import { ArrowRight } from 'lucide-react';
import { EntityTypeBadge } from '@/components/entities/entity-type-badge';
import { RelationshipTypeBadge } from '@/components/relationships/relationship-type-badge';
import { AIAnswer } from './ai-answer';

interface SearchResultsProps {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
  query: string;
  onSelectEntity: (entity: DisplayEntity) => void;
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
  source: GraphEntity | undefined;
  target: GraphEntity | undefined;
  onClick: (relationship: RelationshipWithEntities) => void;
}) {
  // If we don't have both entities, don't render
  if (!source || !target) return null;

  // Convert GraphEntity to Entity format for RelationshipWithEntities
  const toEntity = (ge: GraphEntity) => ({
    ...ge,
    createdAt: new Date(ge.createdAt),
    updatedAt: new Date(ge.updatedAt),
  });

  const enrichedRelationship: RelationshipWithEntities = {
    id: relationship.id,
    type: relationship.type as RelationshipWithEntities['type'],
    sourceId: relationship.from,
    targetId: relationship.to,
    context: relationship.context || '',
    strength: 3, // Default strength since we don't have it from simple search
    ongoing: true, // Default to true
    metadata: {},
    source: toEntity(source),
    target: toEntity(target),
  };

  return (
    <div
      onClick={() => onClick(enrichedRelationship)}
      className="bg-[#141414] rounded-lg border border-[#1f1f1f] p-3 cursor-pointer hover:bg-[#1a1a1a] hover:border-[#38bdf8]/30 transition-all"
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap text-sm">
        {/* Source Entity */}
        <div className="flex items-center gap-1.5">
          <EntityTypeBadge type={source.type} size="sm" />
          <span className="font-medium truncate max-w-[120px] text-white">
            {source.name}
          </span>
        </div>

        {/* Arrow and Type */}
        <div className="flex items-center gap-1.5">
          <ArrowRight className="h-3 w-3 text-[#666]" />
          <RelationshipTypeBadge type={relationship.type as RelationshipWithEntities['type']} size="sm" />
          <ArrowRight className="h-3 w-3 text-[#666]" />
        </div>

        {/* Target Entity */}
        <div className="flex items-center gap-1.5">
          <EntityTypeBadge type={target.type} size="sm" />
          <span className="font-medium truncate max-w-[120px] text-white">
            {target.name}
          </span>
        </div>
      </div>

      {relationship.context && (
        <p className="text-xs text-[#888] line-clamp-1">
          {relationship.context}
        </p>
      )}
    </div>
  );
}

/**
 * Loading skeleton for search results
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Entities skeleton */}
      <section>
        <div className="h-4 w-24 bg-[#1f1f1f] rounded mb-3" />
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#141414] rounded-lg border border-[#1f1f1f] p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#1f1f1f]" />
                <div className="h-5 bg-[#1f1f1f] rounded flex-1" style={{ width: `${50 + i * 10}%` }} />
              </div>
              <div className="h-4 bg-[#1f1f1f] rounded w-3/4" />
            </div>
          ))}
        </div>
      </section>
      {/* Relationships skeleton */}
      <section>
        <div className="h-4 w-32 bg-[#1f1f1f] rounded mb-3" />
        <div className="grid gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#141414] rounded-lg border border-[#1f1f1f] p-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#1f1f1f]" />
                <div className="h-4 bg-[#1f1f1f] rounded w-20" />
                <div className="w-4 h-4 bg-[#1f1f1f] rounded" />
                <div className="w-16 h-5 bg-[#1f1f1f] rounded-full" />
                <div className="w-4 h-4 bg-[#1f1f1f] rounded" />
                <div className="w-6 h-6 rounded-full bg-[#1f1f1f]" />
                <div className="h-4 bg-[#1f1f1f] rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <SearchIcon className="h-12 w-12 text-[#444] mb-4" />
      {query ? (
        <>
          <h3 className="font-semibold text-lg mb-2 text-white">No results found</h3>
          <p className="text-sm text-[#888] max-w-sm">
            No entities or relationships match &quot;{query}&quot;. Try a different search term
            or add more content to your universe.
          </p>
        </>
      ) : (
        <>
          <h3 className="font-semibold text-lg mb-2 text-white">Search your universe</h3>
          <p className="text-sm text-[#888] max-w-sm">
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
    const map = new Map<string, GraphEntity>();
    entities.forEach((entity) => {
      map.set(entity.id, entity);
    });
    return map;
  }, [entities]);

  // Loading state (only show full loading skeleton if not in AI mode)
  // In AI mode, we show the AI loading skeleton separately
  if (loading && !aiMode) {
    return (
      <div className={className}>
        <LoadingSkeleton />
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
        <div className="flex items-center gap-2 text-sm text-[#888]">
          <Sparkles className="h-4 w-4 text-[#38bdf8]" />
          <span>Related entities and relationships from your universe</span>
        </div>
      )}

      {/* Loading state for graph results in AI mode */}
      {loading && aiMode && (
        <div className="flex items-center justify-center py-8 text-[#666]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Entities Section */}
      {!loading && entities.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#888] mb-3">
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
          <h2 className="text-sm font-semibold text-[#888] mb-3">
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
