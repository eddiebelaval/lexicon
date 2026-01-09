'use client';

/**
 * Wiki Entity Section - Newspaper-style entity cards
 *
 * Displays entities in an editorial grid layout with
 * clean typography and visual hierarchy.
 */

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  ExternalLink,
  ImageOff,
  Sparkles,
  User
} from 'lucide-react';
import type { Entity } from '@/types';
import { cn, capitalize } from '@/lib/utils';

interface WebEnrichment {
  summary?: string;
  imageUrl?: string;
  facts?: string[];
  source?: string;
}

interface WikiEntitySectionProps {
  id: string;
  title: string;
  icon: typeof User;
  iconColor: string;
  entities: Entity[];
  webEnrichments?: Record<string, WebEnrichment>;
  onEntityClick?: (entity: Entity) => void;
}

export function WikiEntitySection({
  id,
  title,
  icon: Icon,
  iconColor,
  entities,
  webEnrichments = {},
  onEntityClick
}: WikiEntitySectionProps) {
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const toggleExpanded = (entityId: string) => {
    setExpandedEntities(prev => {
      const next = new Set(prev);
      if (next.has(entityId)) {
        next.delete(entityId);
      } else {
        next.add(entityId);
      }
      return next;
    });
  };

  const handleImageError = (entityId: string) => {
    setFailedImages(prev => new Set(prev).add(entityId));
  };

  // Get entity status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'deceased':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <section id={id} className="mb-10 scroll-mt-20">
      {/* Section Header */}
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3 group">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
          "bg-surface-tertiary group-hover:bg-surface-elevated"
        )}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        <span>{title}</span>
        <span className="text-sm font-normal text-muted-foreground ml-2">
          ({entities.length})
        </span>
      </h2>

      {/* Entity Cards Grid - Newspaper Style */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {entities.map((entity) => {
          const isExpanded = expandedEntities.has(entity.id);
          const enrichment = webEnrichments[entity.id];
          const imageUrl = enrichment?.imageUrl || entity.imageUrl;
          const hasImage = imageUrl && !failedImages.has(entity.id);

          return (
            <article
              key={entity.id}
              className={cn(
                "glass-card overflow-hidden transition-all duration-300 hover:border-[hsl(0,0%,24%)] hover:shadow-card-hover",
                isExpanded && "md:col-span-2"
              )}
            >
              <div className="flex">
                {/* Entity Image */}
                {hasImage ? (
                  <div className={cn(
                    "flex-shrink-0 bg-surface-tertiary",
                    isExpanded ? "w-48 h-48" : "w-24 h-24"
                  )}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={entity.name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(entity.id)}
                    />
                  </div>
                ) : (
                  <div className={cn(
                    "flex-shrink-0 bg-surface-tertiary flex items-center justify-center",
                    isExpanded ? "w-48 h-48" : "w-24 h-24"
                  )}>
                    <ImageOff className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}

                {/* Entity Content */}
                <div className="flex-1 p-4 min-w-0">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3
                        onClick={() => onEntityClick?.(entity)}
                        className={cn(
                          "text-lg font-semibold text-foreground truncate",
                          onEntityClick && "cursor-pointer hover:text-vhs-400 transition-colors"
                        )}
                      >
                        {entity.name}
                      </h3>
                      {/* Aliases */}
                      {entity.aliases.length > 0 && (
                        <p className="text-xs text-muted-foreground/60 truncate">
                          aka {entity.aliases.slice(0, 2).join(', ')}
                          {entity.aliases.length > 2 && ` +${entity.aliases.length - 2}`}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full border flex-shrink-0",
                      getStatusColor(entity.status)
                    )}>
                      {capitalize(entity.status)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className={cn(
                    "text-sm text-muted-foreground leading-relaxed",
                    !isExpanded && "line-clamp-2"
                  )}>
                    {enrichment?.summary || entity.description}
                  </p>

                  {/* Web Enrichment Facts */}
                  {isExpanded && enrichment?.facts && enrichment.facts.length > 0 && (
                    <div className="mt-4 p-3 bg-surface-tertiary rounded-lg border border-[hsl(240,4%,12%)]">
                      <div className="flex items-center gap-2 mb-2 text-xs text-vhs-400">
                        <Sparkles className="w-3 h-3" />
                        <span>Web Enriched Data</span>
                      </div>
                      <ul className="space-y-1">
                        {enrichment.facts.map((fact, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-vhs-400 mt-1">•</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                      {enrichment.source && (
                        <a
                          href={enrichment.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-vhs-400 hover:text-vhs-300 mt-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate">{new URL(enrichment.source).hostname}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Expand/Collapse */}
                  <button
                    onClick={() => toggleExpanded(entity.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-foreground mt-3 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-3 h-3" />
                        Read more
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
