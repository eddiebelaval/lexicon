/**
 * Lexicon Type Definitions
 *
 * Central location for all TypeScript interfaces used across the application.
 */

// ============================================
// Entity Types
// ============================================

export type EntityType =
  | 'character'
  | 'location'
  | 'event'
  | 'object'
  | 'faction';

export type EntityStatus = 'active' | 'inactive' | 'deceased';

/**
 * Entity - A node in the knowledge graph
 *
 * Stored in Neo4j as a Node with label :Entity
 */
export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  aliases: string[];
  description: string;
  status: EntityStatus;
  imageUrl?: string;
  metadata: Record<string, unknown>;
  universeId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entity creation input
 */
export interface CreateEntityInput {
  type: EntityType;
  name: string;
  aliases?: string[];
  description: string;
  status?: EntityStatus;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  universeId: string;
}

/**
 * Entity update input
 */
export interface UpdateEntityInput {
  name?: string;
  aliases?: string[];
  description?: string;
  status?: EntityStatus;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// Relationship Types
// ============================================

export type RelationshipType =
  | 'knows'
  | 'loves'
  | 'opposes'
  | 'works_for'
  | 'family_of'
  | 'located_at'
  | 'participated_in'
  | 'possesses'
  | 'member_of';

/**
 * Relationship - An edge in the knowledge graph
 *
 * Stored in Neo4j as a Relationship between two :Entity nodes
 */
export interface Relationship {
  id: string;
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  context: string;
  strength: 1 | 2 | 3 | 4 | 5;
  startDate?: string;
  endDate?: string;
  ongoing: boolean;
  metadata: Record<string, unknown>;
}

/**
 * Relationship with populated entity references
 */
export interface RelationshipWithEntities extends Relationship {
  source: Entity;
  target: Entity;
}

/**
 * Relationship creation input
 */
export interface CreateRelationshipInput {
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  context?: string;
  strength?: 1 | 2 | 3 | 4 | 5;
  startDate?: string;
  endDate?: string;
  ongoing?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================
// Universe Types
// ============================================

/**
 * Universe - A story world container
 *
 * Stored in PostgreSQL (Supabase)
 */
export interface Universe {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  entityCount: number;
  relationshipCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Universe creation input
 */
export interface CreateUniverseInput {
  name: string;
  description?: string;
  isPublic?: boolean;
}

/**
 * Universe with stats
 */
export interface UniverseWithStats extends Universe {
  entityBreakdown: {
    characters: number;
    locations: number;
    events: number;
    objects: number;
    factions: number;
  };
  recentActivity: {
    lastEntityAdded?: Date;
    lastSearchQuery?: string;
  };
}

// ============================================
// User Types
// ============================================

export type SubscriptionTier = 'free' | 'creator' | 'professional' | 'studio';

/**
 * User - Account holder
 *
 * Stored in PostgreSQL (Supabase Auth)
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  subscriptionTier: SubscriptionTier;
  createdAt: Date;
}

// ============================================
// Search Types
// ============================================

export type SearchIntent =
  | 'entity_lookup'
  | 'relationship_query'
  | 'path_finding'
  | 'general';

/**
 * Search query understanding result
 */
export interface QueryUnderstanding {
  intent: SearchIntent;
  entities: string[];
  relationshipType?: RelationshipType;
  webSearchRecommended: boolean;
}

/**
 * Search source citation
 */
export interface SearchSource {
  type: 'entity' | 'relationship' | 'web';
  name: string;
  url?: string;
}

/**
 * Synthesized search answer
 */
export interface SynthesizedAnswer {
  answer: string;
  sources: SearchSource[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Complete search result
 */
export interface SearchResult {
  query: string;
  understanding: QueryUnderstanding;
  answer: SynthesizedAnswer;
  rawGraphData: {
    entities: Entity[];
    relationships: Relationship[];
  };
  webResults?: {
    title: string;
    snippet: string;
    url: string;
  }[];
  timing: {
    parseMs: number;
    graphMs: number;
    webMs?: number;
    synthesisMs: number;
    totalMs: number;
  };
}

// ============================================
// Graph Visualization Types
// ============================================

/**
 * Graph node for D3.js visualization
 */
export interface GraphNode {
  id: string;
  name: string;
  type: EntityType;
  x?: number;
  y?: number;
  fx?: number | null; // Fixed x position
  fy?: number | null; // Fixed y position
}

/**
 * Graph link for D3.js visualization
 */
export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: RelationshipType;
  strength: number;
}

/**
 * Complete graph data for visualization
 */
export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ============================================
// Import Types
// ============================================

/**
 * CSV import row for entities
 */
export interface EntityImportRow {
  name: string;
  type: EntityType;
  aliases?: string;
  description?: string;
  status?: EntityStatus;
}

/**
 * CSV import row for relationships
 */
export interface RelationshipImportRow {
  sourceName: string;
  targetName: string;
  type: RelationshipType;
  context?: string;
  strength?: string;
}

/**
 * Import result summary
 */
export interface ImportResult {
  success: boolean;
  entitiesCreated: number;
  relationshipsCreated: number;
  errors: {
    row: number;
    message: string;
  }[];
}

// ============================================
// API Response Types
// ============================================

/**
 * Standard API success response
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Standard API error response
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Combined API response type
 */
export type ApiResult<T> = ApiResponse<T> | ApiError;

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
