'use client';

/**
 * Universe Wiki - Wikipedia-style view of the story universe
 *
 * Features:
 * - Wikipedia-style article layout with editorial typography
 * - Left sidebar with table of contents
 * - Right infobox with key universe stats
 * - Web data integration with offline toggle
 * - Newspaper meets dashboard aesthetic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wifi,
  WifiOff,
  Users,
  MapPin,
  Calendar,
  Package,
  Shield,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { WikiInfobox } from './wiki-infobox';
import { WikiTableOfContents } from './wiki-toc';
import { WikiEntitySection } from './wiki-entity-section';
import { WikiRelationshipTable } from './wiki-relationship-table';
import { WebDataBadge } from './web-data-badge';
import type { Entity, RelationshipWithEntities, EntityType } from '@/types';
import { cn } from '@/lib/utils';

interface UniverseWikiProps {
  universeId: string;
  universeName?: string;
  universeDescription?: string;
  onEntityClick?: (entity: Entity) => void;
}

interface UniverseData {
  entities: Entity[];
  relationships: RelationshipWithEntities[];
}

// Entity type configuration for consistent styling
const entityTypeConfig: Record<EntityType, {
  icon: typeof Users;
  label: string;
  pluralLabel: string;
  color: string;
  bgColor: string;
}> = {
  character: {
    icon: Users,
    label: 'Character',
    pluralLabel: 'Characters',
    color: 'text-graph-character',
    bgColor: 'bg-graph-character/10'
  },
  location: {
    icon: MapPin,
    label: 'Location',
    pluralLabel: 'Locations',
    color: 'text-graph-location',
    bgColor: 'bg-graph-location/10'
  },
  event: {
    icon: Calendar,
    label: 'Event',
    pluralLabel: 'Events',
    color: 'text-graph-event',
    bgColor: 'bg-graph-event/10'
  },
  object: {
    icon: Package,
    label: 'Object',
    pluralLabel: 'Objects',
    color: 'text-graph-object',
    bgColor: 'bg-graph-object/10'
  },
  faction: {
    icon: Shield,
    label: 'Faction',
    pluralLabel: 'Factions',
    color: 'text-graph-faction',
    bgColor: 'bg-graph-faction/10'
  },
};

export function UniverseWiki({
  universeId,
  universeName = 'Universe',
  universeDescription,
  onEntityClick
}: UniverseWikiProps) {
  // Data state
  const [data, setData] = useState<UniverseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Web data toggle
  const [useWebData, setUseWebData] = useState(false);
  const [webDataLoading, setWebDataLoading] = useState(false);
  const [webEnrichments, setWebEnrichments] = useState<Record<string, {
    summary?: string;
    imageUrl?: string;
    facts?: string[];
    source?: string;
  }>>({});

  // Active section for TOC highlighting
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Fetch universe data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch entities and relationships in parallel
      // API max limit is 100, so we respect that constraint
      const [entitiesRes, relationshipsRes] = await Promise.all([
        fetch(`/api/entities?universeId=${universeId}&limit=100`),
        fetch(`/api/relationships?universeId=${universeId}&limit=100`)
      ]);

      const [entitiesData, relationshipsData] = await Promise.all([
        entitiesRes.json(),
        relationshipsRes.json()
      ]);

      if (!entitiesData.success) {
        throw new Error(entitiesData.error?.message || 'Failed to load entities');
      }

      setData({
        entities: entitiesData.data.items || entitiesData.data || [],
        relationships: relationshipsData.data?.items || relationshipsData.data || []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load universe data');
    } finally {
      setLoading(false);
    }
  }, [universeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group entities by type
  const entitiesByType = useMemo((): Record<EntityType, Entity[]> => {
    const grouped: Record<EntityType, Entity[]> = {
      character: [],
      location: [],
      event: [],
      object: [],
      faction: []
    };

    if (!data) return grouped;

    data.entities.forEach(entity => {
      if (grouped[entity.type]) {
        grouped[entity.type].push(entity);
      }
    });

    // Sort each group alphabetically
    (Object.keys(grouped) as EntityType[]).forEach(type => {
      grouped[type].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [data]);

  // Generate TOC sections
  const tocSections = useMemo(() => {
    const sections: { id: string; label: string; count: number | null }[] = [
      { id: 'overview', label: 'Overview', count: null }
    ];

    // Add entity type sections
    (Object.keys(entityTypeConfig) as EntityType[]).forEach(type => {
      const count = entitiesByType[type]?.length || 0;
      if (count > 0) {
        sections.push({
          id: type,
          label: entityTypeConfig[type].pluralLabel,
          count
        });
      }
    });

    // Add relationships section if we have any
    if (data?.relationships && data.relationships.length > 0) {
      sections.push({
        id: 'relationships',
        label: 'Relationships',
        count: data.relationships.length
      });
    }

    return sections;
  }, [entitiesByType, data?.relationships]);

  // Universe stats for infobox
  const universeStats = useMemo(() => {
    if (!data) return null;

    return {
      totalEntities: data.entities.length,
      totalRelationships: data.relationships.length,
      entityBreakdown: Object.fromEntries(
        (Object.keys(entityTypeConfig) as EntityType[]).map(type => [
          type,
          entitiesByType[type]?.length || 0
        ])
      ) as Record<EntityType, number>,
      recentEntity: data.entities.reduce((latest, entity) => {
        const entityDate = new Date(entity.updatedAt);
        const latestDate = latest ? new Date(latest.updatedAt) : new Date(0);
        return entityDate > latestDate ? entity : latest;
      }, null as Entity | null)
    };
  }, [data, entitiesByType]);

  // Handle web data toggle
  const handleWebDataToggle = async () => {
    if (!useWebData && data) {
      // Turning on - fetch enrichments from web
      setWebDataLoading(true);
      setUseWebData(true);

      try {
        // Prepare entities for enrichment (prioritize characters, limit total)
        const entitiesToEnrich = [...data.entities]
          .sort((a, b) => {
            // Prioritize characters, then by name
            const typePriority: Record<string, number> = {
              character: 0,
              location: 1,
              event: 2,
              faction: 3,
              object: 4,
            };
            const aPriority = typePriority[a.type] ?? 5;
            const bPriority = typePriority[b.type] ?? 5;
            if (aPriority !== bPriority) return aPriority - bPriority;
            return a.name.localeCompare(b.name);
          })
          .slice(0, 15) // Limit to top 15 entities for performance
          .map((e) => ({
            id: e.id,
            name: e.name,
            type: e.type,
            description: e.description,
          }));

        // Build universe context from name
        const context = universeName !== 'Universe'
          ? universeName
          : undefined;

        const response = await fetch('/api/wiki/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entities: entitiesToEnrich,
            universeContext: context,
            maxEntities: 15,
          }),
        });

        const result = await response.json();

        if (result.success && result.data?.enrichments) {
          setWebEnrichments(result.data.enrichments);
          console.log(
            `Enriched ${result.data.enrichedCount} entities in ${result.data.timing.totalMs}ms`
          );
        } else {
          console.warn('Web enrichment returned no data');
        }
      } catch (error) {
        console.error('Failed to fetch web enrichments:', error);
      } finally {
        setWebDataLoading(false);
      }
    } else {
      // Turning off - clear enrichments
      setUseWebData(false);
      setWebEnrichments({});
    }
  };

  // Scroll spy for TOC
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    tocSections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [tocSections]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-surface-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-vhs-400" />
          <p className="text-muted-foreground text-sm">Loading universe data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-surface-primary">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-foreground font-medium">{error}</p>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-surface-tertiary hover:bg-surface-elevated text-foreground rounded-lg transition-colors border border-[hsl(0,0%,18%)]"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.entities.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-surface-primary">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-vhs-400" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">No Content Yet</h3>
          <p className="text-muted-foreground">
            This universe is empty. Add some entities to see them displayed here in the wiki view.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-surface-primary overflow-hidden">
      {/* Left Sidebar - Table of Contents */}
      <aside className="w-56 flex-shrink-0 border-r border-sidebar-border bg-sidebar-bg overflow-y-auto">
        <WikiTableOfContents
          sections={tocSections}
          activeSection={activeSection}
          onSectionClick={(id) => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </aside>

      {/* Main Content - Article */}
      <main className="flex-1 overflow-y-auto">
        <article className="max-w-4xl mx-auto px-8 py-8">
          {/* Article Header */}
          <header id="overview" className="mb-10 pb-6 border-b border-panel-border">
            {/* Web Data Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <WebDataBadge enabled={useWebData} loading={webDataLoading} />
              </div>
              <button
                onClick={handleWebDataToggle}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                  useWebData
                    ? "bg-vhs-900 text-vhs-400 border border-vhs-700"
                    : "bg-surface-tertiary text-muted-foreground border border-[hsl(0,0%,18%)] hover:border-[hsl(0,0%,24%)]"
                )}
              >
                {webDataLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : useWebData ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
                {useWebData ? 'Web Enriched' : 'Offline Mode'}
              </button>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
              {universeName}
            </h1>

            {/* Description / Lead */}
            {universeDescription && (
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {universeDescription}
              </p>
            )}

            {/* Quick Stats Bar */}
            {universeStats && (
              <div className="flex flex-wrap gap-4 mt-6">
                {(Object.keys(entityTypeConfig) as EntityType[]).map(type => {
                  const count = universeStats.entityBreakdown[type];
                  if (count === 0) return null;

                  const config = entityTypeConfig[type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={type}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                        config.bgColor
                      )}
                    >
                      <Icon className={cn("w-4 h-4", config.color)} />
                      <span className="text-sm font-medium text-foreground">
                        {count}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {count === 1 ? config.label : config.pluralLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </header>

          {/* Entity Sections */}
          {(Object.keys(entityTypeConfig) as EntityType[]).map(type => {
            const entities = entitiesByType[type] || [];
            if (entities.length === 0) return null;

            const config = entityTypeConfig[type];

            return (
              <WikiEntitySection
                key={type}
                id={type}
                title={config.pluralLabel}
                icon={config.icon}
                iconColor={config.color}
                entities={entities}
                webEnrichments={webEnrichments}
                onEntityClick={onEntityClick}
              />
            );
          })}

          {/* Relationships Section */}
          {data.relationships.length > 0 && (
            <section id="relationships" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <ChevronRight className="w-6 h-6 text-vhs-400" />
                Relationships
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({data.relationships.length})
                </span>
              </h2>
              <WikiRelationshipTable
                relationships={data.relationships}
                onEntityClick={onEntityClick}
              />
            </section>
          )}

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-panel-border text-center">
            <p className="text-sm text-muted-foreground/60">
              Last updated {universeStats?.recentEntity
                ? new Date(universeStats.recentEntity.updatedAt).toLocaleDateString()
                : 'recently'}
            </p>
          </footer>
        </article>
      </main>

      {/* Right Sidebar - Infobox */}
      <aside className="w-80 flex-shrink-0 border-l border-sidebar-border bg-sidebar-bg overflow-y-auto hidden xl:block">
        <WikiInfobox
          title={universeName}
          stats={universeStats}
          entityTypeConfig={entityTypeConfig}
        />
      </aside>
    </div>
  );
}
