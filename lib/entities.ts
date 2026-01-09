/**
 * Entity Database Operations
 *
 * Neo4j operations for managing entities in the knowledge graph.
 * Entities are nodes with properties like name, type, description, etc.
 */

import { readQuery, writeQuery } from './neo4j';
import { generateId } from './utils';
import type {
  Entity,
  EntityType,
  EntityStatus,
  CreateEntityInput,
  UpdateEntityInput,
  PaginatedResponse,
} from '@/types';

/**
 * Create a new entity in Neo4j
 */
export async function createEntity(input: CreateEntityInput): Promise<Entity> {
  const id = generateId();
  const now = new Date().toISOString();

  const results = await writeQuery<{ e: Record<string, unknown> }>(
    `
    CREATE (e:Entity {
      id: $id,
      type: $type,
      name: $name,
      aliases: $aliases,
      description: $description,
      status: $status,
      imageUrl: $imageUrl,
      metadata: $metadata,
      universeId: $universeId,
      createdAt: datetime($createdAt),
      updatedAt: datetime($updatedAt)
    })
    RETURN e
    `,
    {
      id,
      type: input.type,
      name: input.name,
      aliases: input.aliases || [],
      description: input.description,
      status: input.status || 'active',
      imageUrl: input.imageUrl || null,
      metadata: JSON.stringify(input.metadata || {}),
      universeId: input.universeId,
      createdAt: now,
      updatedAt: now,
    }
  );

  if (results.length === 0) {
    throw new Error('Failed to create entity');
  }

  return parseEntityFromNeo4j(results[0].e);
}

/**
 * Get a single entity by ID
 */
export async function getEntity(id: string): Promise<Entity | null> {
  const results = await readQuery<{ e: Record<string, unknown> }>(
    `
    MATCH (e:Entity {id: $id})
    RETURN e
    `,
    { id }
  );

  if (results.length === 0) {
    return null;
  }

  return parseEntityFromNeo4j(results[0].e);
}

/**
 * Get multiple entities by IDs
 */
export async function getEntitiesByIds(ids: string[]): Promise<Entity[]> {
  if (ids.length === 0) {
    return [];
  }

  const results = await readQuery<{ e: Record<string, unknown> }>(
    `
    MATCH (e:Entity)
    WHERE e.id IN $ids
    RETURN e
    `,
    { ids }
  );

  return results.map((r) => parseEntityFromNeo4j(r.e));
}

/**
 * List entities for a universe with optional filtering
 */
export async function listEntities(
  universeId: string,
  options: {
    type?: EntityType;
    status?: EntityStatus;
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<PaginatedResponse<Entity>> {
  const {
    type,
    status,
    limit = 50,
    offset = 0,
    sortBy = 'name',
    sortOrder = 'asc',
  } = options;

  // Build WHERE clause dynamically
  const conditions: string[] = ['e.universeId = $universeId'];
  const params: Record<string, unknown> = { universeId, limit, offset };

  if (type) {
    conditions.push('e.type = $type');
    params.type = type;
  }

  if (status) {
    conditions.push('e.status = $status');
    params.status = status;
  }

  const whereClause = conditions.join(' AND ');
  const orderClause = `e.${sortBy} ${sortOrder.toUpperCase()}`;

  // Get total count
  const countResult = await readQuery<{ count: number }>(
    `
    MATCH (e:Entity)
    WHERE ${whereClause}
    RETURN count(e) as count
    `,
    params
  );

  const total = countResult[0]?.count || 0;

  // Get paginated results
  const results = await readQuery<{ e: Record<string, unknown> }>(
    `
    MATCH (e:Entity)
    WHERE ${whereClause}
    RETURN e
    ORDER BY ${orderClause}
    SKIP toInteger($offset)
    LIMIT toInteger($limit)
    `,
    params
  );

  const items = results.map((r) => parseEntityFromNeo4j(r.e));

  return {
    items,
    total,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    hasMore: offset + items.length < total,
  };
}

/**
 * Update an existing entity
 */
export async function updateEntity(
  id: string,
  input: UpdateEntityInput
): Promise<Entity | null> {
  // Build SET clause dynamically based on provided fields
  const setClauses: string[] = ['e.updatedAt = datetime()'];
  const params: Record<string, unknown> = { id };

  if (input.name !== undefined) {
    setClauses.push('e.name = $name');
    params.name = input.name;
  }

  if (input.aliases !== undefined) {
    setClauses.push('e.aliases = $aliases');
    params.aliases = input.aliases;
  }

  if (input.description !== undefined) {
    setClauses.push('e.description = $description');
    params.description = input.description;
  }

  if (input.status !== undefined) {
    setClauses.push('e.status = $status');
    params.status = input.status;
  }

  if (input.imageUrl !== undefined) {
    setClauses.push('e.imageUrl = $imageUrl');
    params.imageUrl = input.imageUrl;
  }

  if (input.metadata !== undefined) {
    setClauses.push('e.metadata = $metadata');
    params.metadata = JSON.stringify(input.metadata);
  }

  const results = await writeQuery<{ e: Record<string, unknown> }>(
    `
    MATCH (e:Entity {id: $id})
    SET ${setClauses.join(', ')}
    RETURN e
    `,
    params
  );

  if (results.length === 0) {
    return null;
  }

  return parseEntityFromNeo4j(results[0].e);
}

/**
 * Delete an entity and all its relationships
 */
export async function deleteEntity(id: string): Promise<boolean> {
  const results = await writeQuery<{ deleted: number }>(
    `
    MATCH (e:Entity {id: $id})
    WITH e, e.id as deletedId
    DETACH DELETE e
    RETURN count(deletedId) as deleted
    `,
    { id }
  );

  return results[0]?.deleted > 0;
}

/**
 * Search entities by name or aliases (fuzzy match)
 */
export async function searchEntities(
  universeId: string,
  query: string,
  options: {
    type?: EntityType;
    limit?: number;
  } = {}
): Promise<Entity[]> {
  const { type, limit = 20 } = options;

  // Case-insensitive regex search on name and aliases
  const searchPattern = `(?i).*${escapeRegex(query)}.*`;

  const conditions: string[] = [
    'e.universeId = $universeId',
    '(e.name =~ $pattern OR ANY(alias IN e.aliases WHERE alias =~ $pattern))',
  ];
  const params: Record<string, unknown> = {
    universeId,
    pattern: searchPattern,
    limit,
  };

  if (type) {
    conditions.push('e.type = $type');
    params.type = type;
  }

  const results = await readQuery<{ e: Record<string, unknown> }>(
    `
    MATCH (e:Entity)
    WHERE ${conditions.join(' AND ')}
    RETURN e
    ORDER BY
      CASE WHEN e.name =~ $pattern THEN 0 ELSE 1 END,
      e.name
    LIMIT toInteger($limit)
    `,
    params
  );

  return results.map((r) => parseEntityFromNeo4j(r.e));
}

/**
 * Get entity counts by type for a universe
 */
export async function getEntityCounts(
  universeId: string
): Promise<Record<EntityType, number>> {
  const results = await readQuery<{ type: EntityType; count: number }>(
    `
    MATCH (e:Entity {universeId: $universeId})
    RETURN e.type as type, count(e) as count
    `,
    { universeId }
  );

  const counts: Record<EntityType, number> = {
    character: 0,
    location: 0,
    event: 0,
    object: 0,
    faction: 0,
  };

  for (const row of results) {
    if (row.type in counts) {
      counts[row.type] = row.count;
    }
  }

  return counts;
}

/**
 * Check if an entity exists
 */
export async function entityExists(id: string): Promise<boolean> {
  const results = await readQuery<{ exists: boolean }>(
    `
    MATCH (e:Entity {id: $id})
    RETURN count(e) > 0 as exists
    `,
    { id }
  );

  return results[0]?.exists || false;
}

/**
 * Parse Neo4j entity result into Entity type
 * Handles date conversion and metadata parsing
 */
function parseEntityFromNeo4j(raw: Record<string, unknown>): Entity {
  return {
    id: raw.id as string,
    type: raw.type as EntityType,
    name: raw.name as string,
    aliases: (raw.aliases as string[]) || [],
    description: raw.description as string,
    status: (raw.status as EntityStatus) || 'active',
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

/**
 * Escape special regex characters for safe pattern matching
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
