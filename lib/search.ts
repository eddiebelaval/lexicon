/**
 * Search Orchestration
 *
 * Coordinates the three-layer search:
 * 1. Graph Search (Neo4j)
 * 2. Web Search (optional)
 * 3. Synthesis (Claude)
 */

import { readQuery } from './neo4j';
import {
  parseQuery,
  synthesizeAnswer,
  type QueryUnderstanding,
  type SynthesizedAnswer,
} from './claude';
import { searchStorylines } from './storylines';
import type { EntityType, EntityStatus, StorylineSearchResult } from '@/types';

export interface SearchOptions {
  universeId: string;
  includeWebSearch?: boolean;
  maxEntities?: number;
  maxRelationships?: number;
}

export interface SearchResult {
  query: string;
  understanding: QueryUnderstanding;
  answer: SynthesizedAnswer;
  rawGraphData: {
    entities: GraphEntity[];
    relationships: GraphRelationship[];
  };
  storylines?: StorylineSearchResult[];
  webResults?: WebResult[];
  timing: {
    parseMs: number;
    graphMs: number;
    storylineMs?: number;
    webMs?: number;
    synthesisMs: number;
    totalMs: number;
  };
}

/**
 * Entity as returned from Neo4j graph queries
 * Compatible with Entity type for UI display
 */
export interface GraphEntity {
  id: string;
  name: string;
  type: EntityType;
  description: string;
  aliases: string[];
  status: EntityStatus;
  imageUrl?: string;
  metadata: Record<string, unknown>;
  universeId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Relationship as returned from Neo4j graph queries
 * Simplified version with entity names for display
 */
export interface GraphRelationship {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  type: string;
  context?: string;
}

interface WebResult {
  title: string;
  snippet: string;
  url: string;
}

/**
 * Main search function - orchestrates the full search flow
 */
export async function search(
  query: string,
  options: SearchOptions
): Promise<SearchResult> {
  const startTime = Date.now();
  const timing: SearchResult['timing'] = {
    parseMs: 0,
    graphMs: 0,
    synthesisMs: 0,
    totalMs: 0,
  };

  // Step 1: Parse query with Claude
  const parseStart = Date.now();
  const understanding = await parseQuery(query);
  timing.parseMs = Date.now() - parseStart;

  // Step 2: Execute graph search
  const graphStart = Date.now();
  const graphData = await executeAdvancedGraphSearch(
    understanding,
    options.universeId,
    options.maxEntities ?? 20,
    options.maxRelationships ?? 50
  );
  timing.graphMs = Date.now() - graphStart;

  // Step 2.5: Search storylines (run in parallel with web if enabled)
  const storylineStart = Date.now();
  let storylines: StorylineSearchResult[] = [];
  try {
    storylines = await searchStorylines(options.universeId, query, 5);
    timing.storylineMs = Date.now() - storylineStart;
  } catch (error) {
    console.error('Storyline search error:', error);
    timing.storylineMs = Date.now() - storylineStart;
  }

  // Step 3: Optional web search
  let webResults: WebResult[] | undefined;
  if (options.includeWebSearch && understanding.webSearchRecommended) {
    const webStart = Date.now();
    webResults = await executeWebSearch(query, understanding.entities);
    timing.webMs = Date.now() - webStart;
  }

  // Step 4: Synthesize answer (now includes storylines)
  const synthesisStart = Date.now();
  const answer = await synthesizeAnswer(
    query,
    {
      entities: graphData.entities.map((e) => ({
        name: e.name,
        description: e.description,
        type: e.type,
      })),
      relationships: graphData.relationships.map((r) => ({
        from: r.fromName,
        to: r.toName,
        type: r.type,
        context: r.context,
      })),
    },
    webResults,
    storylines
  );
  timing.synthesisMs = Date.now() - synthesisStart;

  timing.totalMs = Date.now() - startTime;

  return {
    query,
    understanding,
    answer,
    rawGraphData: graphData,
    storylines: storylines.length > 0 ? storylines : undefined,
    webResults,
    timing,
  };
}

/**
 * Execute Neo4j graph search based on query understanding
 * (Used by advanced search with Claude parsing)
 */
async function executeAdvancedGraphSearch(
  understanding: QueryUnderstanding,
  universeId: string,
  maxEntities: number,
  maxRelationships: number
): Promise<{ entities: GraphEntity[]; relationships: GraphRelationship[] }> {
  const entities: GraphEntity[] = [];
  const relationships: GraphRelationship[] = [];

  // Search for mentioned entities
  if (understanding.entities.length > 0) {
    for (const entityName of understanding.entities) {
      const entityResults = await readQuery<{ e: GraphEntity }>(
        `
        MATCH (e:Entity {universeId: $universeId})
        WHERE e.name =~ '(?i).*' + $search + '.*'
           OR ANY(alias IN e.aliases WHERE alias =~ '(?i).*' + $search + '.*')
        RETURN e
        LIMIT $limit
        `,
        { universeId, search: entityName, limit: maxEntities }
      );

      entities.push(...entityResults.map((r) => r.e));
    }
  }

  // Get relationships between found entities
  if (entities.length > 0) {
    const entityIds = entities.map((e) => e.id);

    const relResults = await readQuery<{
      r: GraphRelationship;
      fromName: string;
      toName: string;
    }>(
      `
      MATCH (a:Entity)-[r]->(b:Entity)
      WHERE a.id IN $entityIds OR b.id IN $entityIds
      RETURN r, a.name as fromName, b.name as toName
      LIMIT $limit
      `,
      { entityIds, limit: maxRelationships }
    );

    relationships.push(
      ...relResults.map((result) => ({
        ...result.r,
        fromName: result.fromName,
        toName: result.toName,
      }))
    );
  }

  // If no specific entities mentioned, do a general search
  if (understanding.intent === 'general' && entities.length === 0) {
    const generalResults = await readQuery<{ e: GraphEntity }>(
      `
      MATCH (e:Entity {universeId: $universeId})
      RETURN e
      ORDER BY e.updatedAt DESC
      LIMIT $limit
      `,
      { universeId, limit: 10 }
    );

    entities.push(...generalResults.map((r) => r.e));
  }

  return { entities, relationships };
}

/**
 * Execute web search for additional context
 * TODO: Implement actual web search integration
 */
async function executeWebSearch(
  _query: string,
  _entities: string[]
): Promise<WebResult[]> {
  // TODO: Integrate with a web search API (Serper, Tavily, etc.)
  // For now, return empty array
  console.log('Web search not yet implemented');
  return [];
}

/**
 * Simple entity lookup by name
 */
export async function findEntity(
  name: string,
  universeId: string
): Promise<GraphEntity | null> {
  const results = await readQuery<{ e: GraphEntity }>(
    `
    MATCH (e:Entity {universeId: $universeId})
    WHERE e.name =~ '(?i)^' + $name + '$'
       OR $name IN e.aliases
    RETURN e
    LIMIT 1
    `,
    { universeId, name }
  );

  return results[0]?.e || null;
}

/**
 * Get all entities in a universe
 */
export async function getUniverseEntities(
  universeId: string,
  type?: string,
  limit = 100
): Promise<GraphEntity[]> {
  const typeClause = type ? 'AND e.type = $type' : '';

  const results = await readQuery<{ e: GraphEntity }>(
    `
    MATCH (e:Entity {universeId: $universeId})
    WHERE true ${typeClause}
    RETURN e
    ORDER BY e.name
    LIMIT $limit
    `,
    { universeId, type, limit }
  );

  return results.map((r) => r.e);
}

/**
 * Simple graph search result type
 * Returns GraphEntity and GraphRelationship (not full Entity types)
 * For UI display, these need to be compatible with Entity type
 */
export interface GraphSearchResult {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
}

/**
 * Simple graph search - just searches entity names/aliases
 * Does NOT use Claude for parsing - this is a lightweight search
 */
export async function executeGraphSearch(
  universeId: string,
  query: string
): Promise<GraphSearchResult> {
  const entities: GraphEntity[] = [];
  const relationships: GraphRelationship[] = [];

  // If query is empty, return empty results
  if (!query || query.trim().length === 0) {
    return { entities, relationships };
  }

  const searchTerm = query.trim();

  // Search for entities by name, alias, or description
  // Return all entity properties to match GraphEntity interface
  const entityResults = await readQuery<{ e: GraphEntity }>(
    `
    MATCH (e:Entity {universeId: $universeId})
    WHERE e.name =~ '(?i).*' + $search + '.*'
       OR ANY(alias IN e.aliases WHERE alias =~ '(?i).*' + $search + '.*')
       OR e.description =~ '(?i).*' + $search + '.*'
    RETURN e
    LIMIT 20
    `,
    { universeId, search: searchTerm }
  );

  entities.push(...entityResults.map((r) => r.e));

  // Get relationships between found entities
  // Note: For now, we only return relationships WHERE BOTH entities were found
  // This keeps the result set clean and relevant
  if (entities.length > 0) {
    const entityIds = entities.map((e) => e.id);

    const relResults = await readQuery<{
      r: {
        id: string;
        from: string;
        to: string;
        type: string;
        context?: string;
      };
      fromName: string;
      toName: string;
    }>(
      `
      MATCH (a:Entity)-[r]->(b:Entity)
      WHERE a.id IN $entityIds AND b.id IN $entityIds
      RETURN r, a.name as fromName, b.name as toName
      LIMIT 50
      `,
      { entityIds }
    );

    relationships.push(
      ...relResults.map((result) => ({
        ...result.r,
        fromName: result.fromName,
        toName: result.toName,
      }))
    );
  }

  return { entities, relationships };
}
