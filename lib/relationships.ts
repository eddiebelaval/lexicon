/**
 * Relationship Database Operations
 *
 * Neo4j operations for managing relationships in the knowledge graph.
 * Relationships are edges between Entity nodes with properties like type, strength, etc.
 */

import { readQuery, writeQuery } from './neo4j';
import { generateId } from './utils';
import type {
  RelationshipType,
  RelationshipWithEntities,
  CreateRelationshipInput,
  Entity,
  PaginatedResponse,
} from '@/types';

/**
 * Create a new relationship between two entities in Neo4j
 */
export async function createRelationship(
  input: CreateRelationshipInput
): Promise<RelationshipWithEntities> {
  const id = generateId();
  const now = new Date().toISOString();

  const results = await writeQuery<{
    r: Record<string, unknown>;
    source: Record<string, unknown>;
    target: Record<string, unknown>;
  }>(
    `
    MATCH (source:Entity {id: $sourceId})
    MATCH (target:Entity {id: $targetId})
    CREATE (source)-[r:RELATES_TO {
      id: $id,
      type: $type,
      context: $context,
      strength: $strength,
      startDate: $startDate,
      endDate: $endDate,
      ongoing: $ongoing,
      metadata: $metadata,
      createdAt: datetime($createdAt),
      updatedAt: datetime($updatedAt)
    }]->(target)
    RETURN r, source, target
    `,
    {
      id,
      sourceId: input.sourceId,
      targetId: input.targetId,
      type: input.type,
      context: input.context || '',
      strength: input.strength || 3,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
      ongoing: input.ongoing ?? true,
      metadata: JSON.stringify(input.metadata || {}),
      createdAt: now,
      updatedAt: now,
    }
  );

  if (results.length === 0) {
    throw new Error(
      'Failed to create relationship. Ensure both source and target entities exist.'
    );
  }

  const { r, source, target } = results[0];
  return parseRelationshipWithEntitiesFromNeo4j(r, source, target);
}

/**
 * Get a single relationship by ID with source and target entities
 */
export async function getRelationship(
  id: string
): Promise<RelationshipWithEntities | null> {
  const results = await readQuery<{
    r: Record<string, unknown>;
    source: Record<string, unknown>;
    target: Record<string, unknown>;
  }>(
    `
    MATCH (source:Entity)-[r:RELATES_TO {id: $id}]->(target:Entity)
    RETURN r, source, target
    `,
    { id }
  );

  if (results.length === 0) {
    return null;
  }

  const { r, source, target } = results[0];
  return parseRelationshipWithEntitiesFromNeo4j(r, source, target);
}

/**
 * List relationships for a universe, optionally filtered by entity
 */
export async function listRelationships(
  universeId: string,
  options: {
    entityId?: string;
    type?: RelationshipType;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'strength';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<PaginatedResponse<RelationshipWithEntities>> {
  const {
    entityId,
    type,
    limit = 50,
    offset = 0,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  // Build WHERE conditions dynamically
  const conditions: string[] = ['source.universeId = $universeId'];
  const params: Record<string, unknown> = { universeId, limit, offset };

  if (entityId) {
    // Get relationships where the entity is either source or target
    conditions.push('(source.id = $entityId OR target.id = $entityId)');
    params.entityId = entityId;
  }

  if (type) {
    conditions.push('r.type = $type');
    params.type = type;
  }

  const whereClause = conditions.join(' AND ');
  const orderClause = `r.${sortBy} ${sortOrder.toUpperCase()}`;

  // Get total count
  const countResult = await readQuery<{ count: number }>(
    `
    MATCH (source:Entity)-[r:RELATES_TO]->(target:Entity)
    WHERE ${whereClause}
    RETURN count(r) as count
    `,
    params
  );

  const total = countResult[0]?.count || 0;

  // Get paginated results
  const results = await readQuery<{
    r: Record<string, unknown>;
    source: Record<string, unknown>;
    target: Record<string, unknown>;
  }>(
    `
    MATCH (source:Entity)-[r:RELATES_TO]->(target:Entity)
    WHERE ${whereClause}
    RETURN r, source, target
    ORDER BY ${orderClause}
    SKIP toInteger($offset)
    LIMIT toInteger($limit)
    `,
    params
  );

  const items = results.map(({ r, source, target }) =>
    parseRelationshipWithEntitiesFromNeo4j(r, source, target)
  );

  return {
    items,
    total,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    hasMore: offset + items.length < total,
  };
}

/**
 * Update an existing relationship
 */
export async function updateRelationship(
  id: string,
  input: Partial<Omit<CreateRelationshipInput, 'sourceId' | 'targetId'>>
): Promise<RelationshipWithEntities | null> {
  // Build SET clause dynamically based on provided fields
  const setClauses: string[] = ['r.updatedAt = datetime()'];
  const params: Record<string, unknown> = { id };

  if (input.type !== undefined) {
    setClauses.push('r.type = $type');
    params.type = input.type;
  }

  if (input.context !== undefined) {
    setClauses.push('r.context = $context');
    params.context = input.context;
  }

  if (input.strength !== undefined) {
    setClauses.push('r.strength = $strength');
    params.strength = input.strength;
  }

  if (input.startDate !== undefined) {
    setClauses.push('r.startDate = $startDate');
    params.startDate = input.startDate;
  }

  if (input.endDate !== undefined) {
    setClauses.push('r.endDate = $endDate');
    params.endDate = input.endDate;
  }

  if (input.ongoing !== undefined) {
    setClauses.push('r.ongoing = $ongoing');
    params.ongoing = input.ongoing;
  }

  if (input.metadata !== undefined) {
    setClauses.push('r.metadata = $metadata');
    params.metadata = JSON.stringify(input.metadata);
  }

  const results = await writeQuery<{
    r: Record<string, unknown>;
    source: Record<string, unknown>;
    target: Record<string, unknown>;
  }>(
    `
    MATCH (source:Entity)-[r:RELATES_TO {id: $id}]->(target:Entity)
    SET ${setClauses.join(', ')}
    RETURN r, source, target
    `,
    params
  );

  if (results.length === 0) {
    return null;
  }

  const { r, source, target } = results[0];
  return parseRelationshipWithEntitiesFromNeo4j(r, source, target);
}

/**
 * Delete a relationship by ID
 */
export async function deleteRelationship(id: string): Promise<boolean> {
  const results = await writeQuery<{ deleted: number }>(
    `
    MATCH ()-[r:RELATES_TO {id: $id}]-()
    WITH r, r.id as deletedId
    DELETE r
    RETURN count(deletedId) as deleted
    `,
    { id }
  );

  return results[0]?.deleted > 0;
}

/**
 * Get relationships for an entity (both incoming and outgoing)
 */
export async function getEntityRelationships(
  entityId: string
): Promise<RelationshipWithEntities[]> {
  const results = await readQuery<{
    r: Record<string, unknown>;
    source: Record<string, unknown>;
    target: Record<string, unknown>;
  }>(
    `
    MATCH (source:Entity)-[r:RELATES_TO]->(target:Entity)
    WHERE source.id = $entityId OR target.id = $entityId
    RETURN r, source, target
    ORDER BY r.createdAt DESC
    `,
    { entityId }
  );

  return results.map(({ r, source, target }) =>
    parseRelationshipWithEntitiesFromNeo4j(r, source, target)
  );
}

/**
 * Get relationship counts by type for a universe
 */
export async function getRelationshipCounts(
  universeId: string
): Promise<Record<RelationshipType, number>> {
  const results = await readQuery<{ type: RelationshipType; count: number }>(
    `
    MATCH (source:Entity {universeId: $universeId})-[r:RELATES_TO]->()
    RETURN r.type as type, count(r) as count
    `,
    { universeId }
  );

  const counts: Record<RelationshipType, number> = {
    knows: 0,
    loves: 0,
    opposes: 0,
    works_for: 0,
    family_of: 0,
    located_at: 0,
    participated_in: 0,
    possesses: 0,
    member_of: 0,
  };

  for (const row of results) {
    if (row.type in counts) {
      counts[row.type] = row.count;
    }
  }

  return counts;
}

/**
 * Check if a relationship exists between two entities
 */
export async function relationshipExists(
  sourceId: string,
  targetId: string,
  type?: RelationshipType
): Promise<boolean> {
  const params: Record<string, unknown> = { sourceId, targetId };
  let query = `
    MATCH (source:Entity {id: $sourceId})-[r:RELATES_TO]->(target:Entity {id: $targetId})
  `;

  if (type) {
    query += ' WHERE r.type = $type';
    params.type = type;
  }

  query += ' RETURN count(r) > 0 as exists';

  const results = await readQuery<{ exists: boolean }>(query, params);
  return results[0]?.exists || false;
}

/**
 * Parse Neo4j relationship result into RelationshipWithEntities type
 */
function parseRelationshipWithEntitiesFromNeo4j(
  raw: Record<string, unknown>,
  source: Record<string, unknown>,
  target: Record<string, unknown>
): RelationshipWithEntities {
  return {
    id: raw.id as string,
    type: raw.type as RelationshipType,
    sourceId: source.id as string,
    targetId: target.id as string,
    context: (raw.context as string) || '',
    strength: (raw.strength as 1 | 2 | 3 | 4 | 5) || 3,
    startDate: raw.startDate as string | undefined,
    endDate: raw.endDate as string | undefined,
    ongoing: (raw.ongoing as boolean) ?? true,
    metadata: parseMetadata(raw.metadata),
    source: parseEntityFromNeo4j(source),
    target: parseEntityFromNeo4j(target),
  };
}

/**
 * Parse Neo4j entity result into Entity type
 */
function parseEntityFromNeo4j(raw: Record<string, unknown>): Entity {
  return {
    id: raw.id as string,
    type: raw.type as Entity['type'],
    name: raw.name as string,
    aliases: (raw.aliases as string[]) || [],
    description: raw.description as string,
    status: (raw.status as Entity['status']) || 'active',
    imageUrl: raw.imageUrl as string | undefined,
    metadata: parseMetadata(raw.metadata),
    universeId: raw.universeId as string,
    createdAt: parseNeo4jDate(raw.createdAt),
    updatedAt: parseNeo4jDate(raw.updatedAt),
  };
}

/**
 * Parse Neo4j datetime to JS Date
 */
function parseNeo4jDate(value: unknown): Date {
  if (!value) {
    return new Date();
  }

  // Neo4j DateTime object
  if (typeof value === 'object' && 'toString' in value) {
    return new Date((value as { toString: () => string }).toString());
  }

  // ISO string
  if (typeof value === 'string') {
    return new Date(value);
  }

  return new Date();
}

/**
 * Parse metadata from JSON string or object
 */
function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  return {};
}
