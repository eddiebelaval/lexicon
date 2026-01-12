/**
 * Claude Tool Definitions for Lexicon Chat Interface
 *
 * Provides full CRUD capabilities over the knowledge base (Neo4j) through
 * Claude's tool-use API. The AI can autonomously create, read, update, and
 * delete entities and relationships based on user conversations.
 *
 * Tool Categories:
 * - Entity Operations: search, get, create, update, delete
 * - Relationship Operations: search, create, update, delete
 * - Context Operations: get graph neighborhood
 * - Enrichment: web search for external data
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type {
  Entity,
  EntityType,
  EntityStatus,
  RelationshipType,
  RelationshipWithEntities,
  CreateEntityInput,
  UpdateEntityInput,
  CreateRelationshipInput,
} from '@/types';
import {
  getEntity,
  createEntity,
  updateEntity,
  deleteEntity,
  searchEntities,
} from './entities';
import {
  getRelationship,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  listRelationships,
  getEntityRelationships,
} from './relationships';
import {
  getStoryline,
  getStorylineWithCast,
  searchStorylines,
  listStorylines,
  createStoryline,
  updateStoryline,
  deleteStoryline,
  getStorylinesForEntity,
} from './storylines';
import type { Storyline, StorylineWithCast, StorylineStatus } from '@/types';
import { readQuery } from './neo4j';

// ============================================
// Tool Definitions
// ============================================

/**
 * All available tools for the Lexicon AI assistant
 * These follow Claude's tool-use format with input_schema as JSON Schema
 */
export const lexiconTools: Tool[] = [
  // ----------------------------------------
  // Entity Operations
  // ----------------------------------------
  {
    name: 'search_entities',
    description:
      'Search for entities in the knowledge base by name, alias, or description. Use this to find existing characters, locations, events, objects, or factions before creating new ones or to answer questions about the universe.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Search query to match against entity names, aliases, and descriptions',
        },
        type: {
          type: 'string',
          enum: ['character', 'location', 'event', 'object', 'faction'],
          description: 'Optional filter by entity type',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10, max: 50)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_entity',
    description:
      'Get full details of a specific entity by its ID. Use this when you need complete information about an entity including all properties, aliases, metadata, and timestamps.',
    input_schema: {
      type: 'object' as const,
      properties: {
        entityId: {
          type: 'string',
          description: 'The unique ID of the entity to retrieve',
        },
      },
      required: ['entityId'],
    },
  },
  {
    name: 'create_entity',
    description:
      'Create a new entity in the knowledge base. Use this when the user describes a new character, location, event, object, or faction that should be added to the universe. Always search first to avoid duplicates.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'The primary name of the entity',
        },
        type: {
          type: 'string',
          enum: ['character', 'location', 'event', 'object', 'faction'],
          description: 'The type of entity being created',
        },
        description: {
          type: 'string',
          description:
            'A detailed description of the entity, including relevant backstory, characteristics, or significance',
        },
        aliases: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Alternative names, nicknames, or titles for the entity',
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'deceased'],
          description:
            'Current status of the entity (default: active). Use "deceased" for dead characters.',
        },
        imageUrl: {
          type: 'string',
          description: 'URL to an image representing the entity',
        },
        metadata: {
          type: 'object',
          description:
            'Additional structured data as key-value pairs (e.g., age, birthplace, affiliation)',
        },
      },
      required: ['name', 'type', 'description'],
    },
  },
  {
    name: 'update_entity',
    description:
      'Update an existing entity with new or corrected information. Use this when the user provides additional details about an entity or wants to correct existing information.',
    input_schema: {
      type: 'object' as const,
      properties: {
        entityId: {
          type: 'string',
          description: 'The ID of the entity to update',
        },
        name: {
          type: 'string',
          description: 'New name for the entity (if changing)',
        },
        description: {
          type: 'string',
          description: 'Updated description',
        },
        aliases: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated list of aliases (replaces existing)',
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'deceased'],
          description: 'Updated status',
        },
        imageUrl: {
          type: 'string',
          description: 'Updated image URL',
        },
        metadata: {
          type: 'object',
          description: 'Updated metadata (merges with existing)',
        },
      },
      required: ['entityId'],
    },
  },
  {
    name: 'delete_entity',
    description:
      'Delete an entity and all its relationships from the knowledge base. Use with caution - this is permanent. Only delete when explicitly requested by the user.',
    input_schema: {
      type: 'object' as const,
      properties: {
        entityId: {
          type: 'string',
          description: 'The ID of the entity to delete',
        },
        confirm: {
          type: 'boolean',
          description:
            'Must be true to confirm deletion. This prevents accidental deletions.',
        },
      },
      required: ['entityId', 'confirm'],
    },
  },

  // ----------------------------------------
  // Relationship Operations
  // ----------------------------------------
  {
    name: 'search_relationships',
    description:
      'Search for relationships in the knowledge base. Can filter by source entity, target entity, or relationship type. Use this to understand connections between entities.',
    input_schema: {
      type: 'object' as const,
      properties: {
        entityId: {
          type: 'string',
          description:
            'Find all relationships involving this entity (as source or target)',
        },
        sourceId: {
          type: 'string',
          description: 'Filter to relationships where this entity is the source',
        },
        targetId: {
          type: 'string',
          description: 'Filter to relationships where this entity is the target',
        },
        type: {
          type: 'string',
          enum: [
            'knows',
            'loves',
            'opposes',
            'works_for',
            'family_of',
            'located_at',
            'participated_in',
            'possesses',
            'member_of',
          ],
          description: 'Filter by relationship type',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20, max: 100)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_relationship',
    description:
      'Get full details of a specific relationship by its ID. Use this when you need complete information about a relationship including context, strength, dates, and connected entities.',
    input_schema: {
      type: 'object' as const,
      properties: {
        relationshipId: {
          type: 'string',
          description: 'The unique ID of the relationship to retrieve',
        },
      },
      required: ['relationshipId'],
    },
  },
  {
    name: 'create_relationship',
    description:
      'Create a new relationship between two entities. Use this when the user describes a connection, association, or interaction between entities. The relationship goes from source to target (directional).',
    input_schema: {
      type: 'object' as const,
      properties: {
        sourceId: {
          type: 'string',
          description:
            'ID of the source entity (the one performing the action or having the relationship)',
        },
        targetId: {
          type: 'string',
          description:
            'ID of the target entity (the one receiving the action or being related to)',
        },
        type: {
          type: 'string',
          enum: [
            'knows',
            'loves',
            'opposes',
            'works_for',
            'family_of',
            'located_at',
            'participated_in',
            'possesses',
            'member_of',
          ],
          description: 'The type of relationship',
        },
        context: {
          type: 'string',
          description:
            'Contextual description of the relationship (e.g., "best friends since childhood", "rivals for the throne")',
        },
        strength: {
          type: 'number',
          enum: [1, 2, 3, 4, 5],
          description:
            'Strength/importance of the relationship from 1 (weak) to 5 (very strong). Default: 3',
        },
        startDate: {
          type: 'string',
          description:
            'When the relationship started (can be narrative time like "Year 1" or real dates)',
        },
        endDate: {
          type: 'string',
          description: 'When the relationship ended (if applicable)',
        },
        ongoing: {
          type: 'boolean',
          description: 'Whether the relationship is still active (default: true)',
        },
        metadata: {
          type: 'object',
          description: 'Additional structured data about the relationship',
        },
      },
      required: ['sourceId', 'targetId', 'type'],
    },
  },
  {
    name: 'update_relationship',
    description:
      'Update an existing relationship with new information. Use this to modify the context, strength, or other properties of a relationship.',
    input_schema: {
      type: 'object' as const,
      properties: {
        relationshipId: {
          type: 'string',
          description: 'The ID of the relationship to update',
        },
        type: {
          type: 'string',
          enum: [
            'knows',
            'loves',
            'opposes',
            'works_for',
            'family_of',
            'located_at',
            'participated_in',
            'possesses',
            'member_of',
          ],
          description: 'Updated relationship type',
        },
        context: {
          type: 'string',
          description: 'Updated context description',
        },
        strength: {
          type: 'number',
          enum: [1, 2, 3, 4, 5],
          description: 'Updated strength rating',
        },
        startDate: {
          type: 'string',
          description: 'Updated start date',
        },
        endDate: {
          type: 'string',
          description: 'Updated end date',
        },
        ongoing: {
          type: 'boolean',
          description: 'Updated ongoing status',
        },
        metadata: {
          type: 'object',
          description: 'Updated metadata',
        },
      },
      required: ['relationshipId'],
    },
  },
  {
    name: 'delete_relationship',
    description:
      'Delete a relationship between entities. Use when a relationship no longer exists or was created in error. Only delete when explicitly requested.',
    input_schema: {
      type: 'object' as const,
      properties: {
        relationshipId: {
          type: 'string',
          description: 'The ID of the relationship to delete',
        },
        confirm: {
          type: 'boolean',
          description: 'Must be true to confirm deletion',
        },
      },
      required: ['relationshipId', 'confirm'],
    },
  },

  // ----------------------------------------
  // Context Operations
  // ----------------------------------------
  {
    name: 'get_graph_context',
    description:
      'Get an entity and its 2-hop neighborhood (connected entities and their connections). Use this to understand the broader context around an entity when answering questions about relationships and connections.',
    input_schema: {
      type: 'object' as const,
      properties: {
        entityId: {
          type: 'string',
          description: 'The central entity ID to get context for',
        },
        depth: {
          type: 'number',
          enum: [1, 2, 3],
          description:
            'How many hops of relationships to include (default: 2, max: 3)',
        },
        maxNodes: {
          type: 'number',
          description:
            'Maximum number of connected nodes to return (default: 30, max: 100)',
        },
      },
      required: ['entityId'],
    },
  },

  // ----------------------------------------
  // Enrichment Operations
  // ----------------------------------------
  {
    name: 'web_search',
    description:
      'Search the web for information to enrich the knowledge base. Use this when the user asks about real-world topics, historical events, or when you need external information to supplement the universe data.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The search query for web search',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5, max: 10)',
        },
      },
      required: ['query'],
    },
  },

  // ----------------------------------------
  // Storyline Operations
  // ----------------------------------------
  {
    name: 'search_storylines',
    description:
      'Search storylines by title, synopsis, narrative content, or cast members. Use this to find storylines involving specific characters, themes, or events. Returns matching storylines with titles and synopses.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Search query to match against storyline titles, synopses, narratives, and tags',
        },
        status: {
          type: 'string',
          enum: ['active', 'archived', 'developing'],
          description: 'Optional filter by storyline status',
        },
        season: {
          type: 'string',
          description: 'Optional filter by season (e.g., "Season 4")',
        },
        castEntityId: {
          type: 'string',
          description: 'Optional filter by cast member entity ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10, max: 50)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_storyline',
    description:
      'Get full details of a specific storyline including the complete narrative, cast members, and metadata. Use this when you need the full story content to answer detailed questions about a storyline.',
    input_schema: {
      type: 'object' as const,
      properties: {
        storylineId: {
          type: 'string',
          description: 'The unique ID of the storyline to retrieve',
        },
        includeCast: {
          type: 'boolean',
          description:
            'Whether to include full cast entity details (default: true)',
        },
      },
      required: ['storylineId'],
    },
  },
  {
    name: 'get_storylines_for_cast',
    description:
      'Get all storylines that feature a specific cast member (entity). Use this to find what storylines a character appears in.',
    input_schema: {
      type: 'object' as const,
      properties: {
        entityId: {
          type: 'string',
          description: 'The entity ID of the cast member to find storylines for',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of storylines to return (default: 20)',
        },
      },
      required: ['entityId'],
    },
  },
  {
    name: 'list_storylines',
    description:
      'List all storylines in the universe with optional filtering. Use this to browse storylines without a specific search query.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'archived', 'developing'],
          description: 'Optional filter by storyline status',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20, max: 100)',
        },
        offset: {
          type: 'number',
          description: 'Number of results to skip for pagination (default: 0)',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_storyline',
    description:
      'Create a new storyline in the knowledge base. Use this when the user describes a new narrative arc, story thread, or plot line that should be documented. Storylines connect multiple entities through a narrative.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'The title of the storyline',
        },
        synopsis: {
          type: 'string',
          description: 'Brief summary of the storyline (~300 words)',
        },
        narrative: {
          type: 'string',
          description: 'Full narrative content (can be extensive, 5000+ words)',
        },
        primaryCast: {
          type: 'array',
          items: { type: 'string' },
          description: 'Entity IDs of main characters in this storyline',
        },
        supportingCast: {
          type: 'array',
          items: { type: 'string' },
          description: 'Entity IDs of supporting characters',
        },
        status: {
          type: 'string',
          enum: ['active', 'archived', 'developing'],
          description: 'Status of the storyline (default: developing)',
        },
        season: {
          type: 'string',
          description: 'Season identifier (e.g., "Season 4")',
        },
        episodeRange: {
          type: 'string',
          description: 'Episode range (e.g., "Episodes 1-5")',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization and search',
        },
      },
      required: ['title', 'synopsis'],
    },
  },
  {
    name: 'update_storyline',
    description:
      'Update an existing storyline with new or corrected information. Use this to modify the narrative, synopsis, cast, or other storyline properties based on user input.',
    input_schema: {
      type: 'object' as const,
      properties: {
        storylineId: {
          type: 'string',
          description: 'The ID of the storyline to update',
        },
        title: {
          type: 'string',
          description: 'New title for the storyline (if changing)',
        },
        synopsis: {
          type: 'string',
          description: 'Updated synopsis (brief summary, ~300 words)',
        },
        narrative: {
          type: 'string',
          description: 'Updated full narrative content',
        },
        primaryCast: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated list of primary cast entity IDs',
        },
        supportingCast: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated list of supporting cast entity IDs',
        },
        status: {
          type: 'string',
          enum: ['active', 'archived', 'developing'],
          description: 'Updated storyline status',
        },
        season: {
          type: 'string',
          description: 'Updated season identifier',
        },
        episodeRange: {
          type: 'string',
          description: 'Updated episode range',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated list of tags',
        },
      },
      required: ['storylineId'],
    },
  },
  {
    name: 'delete_storyline',
    description:
      'Delete a storyline from the knowledge base. Use with caution - this is permanent. Only delete when explicitly requested by the user.',
    input_schema: {
      type: 'object' as const,
      properties: {
        storylineId: {
          type: 'string',
          description: 'The ID of the storyline to delete',
        },
        confirm: {
          type: 'boolean',
          description:
            'Must be true to confirm deletion. This prevents accidental deletions.',
        },
      },
      required: ['storylineId', 'confirm'],
    },
  },
];

// ============================================
// Tool Execution Result Type
// ============================================

/**
 * Agent-Native Tool Execution Result
 *
 * Following Pattern 6 (Agent-Native Design), tools return explicit completion signals:
 * - success: Whether the operation succeeded
 * - result: The operation output data
 * - error: Error message if failed
 * - shouldContinue: Whether the agent should continue with more actions
 *   - true: Agent may have more work to do (e.g., after search, may need to get details)
 *   - false: Agent has completed the goal (e.g., after delete confirmation)
 */
export interface ToolExecutionResult {
  success: boolean;
  result: unknown;
  error?: string;
  shouldContinue: boolean;
}

// ============================================
// Tool Executor
// ============================================

/**
 * Execute a tool call and return the result
 *
 * @param toolName - The name of the tool to execute
 * @param input - The input parameters for the tool
 * @param universeId - The universe context for the operation
 * @returns Promise with success status and result or error
 */
export async function executeToolCall(
  toolName: string,
  input: Record<string, unknown>,
  universeId: string
): Promise<ToolExecutionResult> {
  try {
    switch (toolName) {
      // ----------------------------------------
      // Entity Operations
      // ----------------------------------------
      case 'search_entities': {
        const query = input.query as string;
        const type = input.type as EntityType | undefined;
        const limit = Math.min((input.limit as number) || 10, 50);

        const entities = await searchEntities(universeId, query, { type, limit });
        return {
          success: true,
          result: {
            count: entities.length,
            entities: entities.map(formatEntityForResponse),
          },
          shouldContinue: true, // Agent may want to get details on specific entities
        };
      }

      case 'get_entity': {
        const entityId = input.entityId as string;
        const entity = await getEntity(entityId);

        if (!entity) {
          return {
            success: false,
            result: null,
            error: `Entity not found with ID: ${entityId}`,
            shouldContinue: true,
          };
        }

        // Verify entity belongs to the universe
        if (entity.universeId !== universeId) {
          return {
            success: false,
            result: null,
            error: 'Entity belongs to a different universe',
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: formatEntityForResponse(entity),
          shouldContinue: true, // Agent may want to update or create relationships
        };
      }

      case 'create_entity': {
        const createInput: CreateEntityInput = {
          name: input.name as string,
          type: input.type as EntityType,
          description: input.description as string,
          aliases: (input.aliases as string[]) || [],
          status: (input.status as EntityStatus) || 'active',
          imageUrl: input.imageUrl as string | undefined,
          metadata: (input.metadata as Record<string, unknown>) || {},
          universeId,
        };

        const entity = await createEntity(createInput);
        return {
          success: true,
          result: {
            message: `Created new ${entity.type} "${entity.name}"`,
            entity: formatEntityForResponse(entity),
          },
          shouldContinue: true, // Agent may want to create relationships
        };
      }

      case 'update_entity': {
        const entityId = input.entityId as string;

        // Verify entity exists and belongs to universe
        const existing = await getEntity(entityId);
        if (!existing) {
          return {
            success: false,
            result: null,
            error: `Entity not found with ID: ${entityId}`,
            shouldContinue: true,
          };
        }
        if (existing.universeId !== universeId) {
          return {
            success: false,
            result: null,
            error: 'Entity belongs to a different universe',
            shouldContinue: true,
          };
        }

        const updateInput: UpdateEntityInput = {};
        if (input.name !== undefined) updateInput.name = input.name as string;
        if (input.description !== undefined)
          updateInput.description = input.description as string;
        if (input.aliases !== undefined)
          updateInput.aliases = input.aliases as string[];
        if (input.status !== undefined)
          updateInput.status = input.status as EntityStatus;
        if (input.imageUrl !== undefined)
          updateInput.imageUrl = input.imageUrl as string;
        if (input.metadata !== undefined)
          updateInput.metadata = input.metadata as Record<string, unknown>;

        const updated = await updateEntity(entityId, updateInput);
        if (!updated) {
          return {
            success: false,
            result: null,
            error: 'Failed to update entity',
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: {
            message: `Updated entity "${updated.name}"`,
            entity: formatEntityForResponse(updated),
          },
          shouldContinue: true, // Agent may want to continue editing
        };
      }

      case 'delete_entity': {
        const entityId = input.entityId as string;
        const confirm = input.confirm as boolean;

        if (!confirm) {
          return {
            success: false,
            result: null,
            error:
              'Deletion not confirmed. Set confirm: true to delete the entity.',
            shouldContinue: true,
          };
        }

        // Verify entity exists and belongs to universe
        const existing = await getEntity(entityId);
        if (!existing) {
          return {
            success: false,
            result: null,
            error: `Entity not found with ID: ${entityId}`,
            shouldContinue: true,
          };
        }
        if (existing.universeId !== universeId) {
          return {
            success: false,
            result: null,
            error: 'Entity belongs to a different universe',
            shouldContinue: true,
          };
        }

        const deleted = await deleteEntity(entityId);
        if (!deleted) {
          return {
            success: false,
            result: null,
            error: 'Failed to delete entity',
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: {
            message: `Deleted entity "${existing.name}" and all its relationships`,
            deletedEntity: {
              id: existing.id,
              name: existing.name,
              type: existing.type,
            },
          },
          shouldContinue: false, // Terminal operation - deletion complete
        };
      }

      // ----------------------------------------
      // Relationship Operations
      // ----------------------------------------
      case 'search_relationships': {
        const entityId = input.entityId as string | undefined;
        const type = input.type as RelationshipType | undefined;
        const limit = Math.min((input.limit as number) || 20, 100);

        let relationships: RelationshipWithEntities[];

        if (entityId) {
          // Get all relationships for a specific entity
          relationships = await getEntityRelationships(entityId);
          // Filter by type if provided
          if (type) {
            relationships = relationships.filter((r) => r.type === type);
          }
          // Apply limit
          relationships = relationships.slice(0, limit);
        } else {
          // List relationships for the universe
          const result = await listRelationships(universeId, {
            type,
            limit,
          });
          relationships = result.items;
        }

        return {
          success: true,
          result: {
            count: relationships.length,
            relationships: relationships.map(formatRelationshipForResponse),
          },
          shouldContinue: true, // Agent may want to get details on specific relationships
        };
      }

      case 'get_relationship': {
        const relationshipId = input.relationshipId as string;
        const relationship = await getRelationship(relationshipId);

        if (!relationship) {
          return {
            success: false,
            result: null,
            error: `Relationship not found with ID: ${relationshipId}`,
            shouldContinue: true,
          };
        }

        // Verify relationship belongs to the universe (check source entity)
        if (relationship.source.universeId !== universeId) {
          return {
            success: false,
            result: null,
            error: 'Relationship belongs to a different universe',
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: formatRelationshipForResponse(relationship),
          shouldContinue: true, // Agent may want to update or use this relationship
        };
      }

      case 'create_relationship': {
        const sourceId = input.sourceId as string;
        const targetId = input.targetId as string;

        // Verify both entities exist and belong to the universe
        const source = await getEntity(sourceId);
        const target = await getEntity(targetId);

        if (!source) {
          return {
            success: false,
            result: null,
            error: `Source entity not found with ID: ${sourceId}`,
            shouldContinue: true,
          };
        }
        if (!target) {
          return {
            success: false,
            result: null,
            error: `Target entity not found with ID: ${targetId}`,
            shouldContinue: true,
          };
        }
        if (source.universeId !== universeId || target.universeId !== universeId) {
          return {
            success: false,
            result: null,
            error: 'One or both entities belong to a different universe',
            shouldContinue: true,
          };
        }

        const createInput: CreateRelationshipInput = {
          sourceId,
          targetId,
          type: input.type as RelationshipType,
          context: (input.context as string) || '',
          strength: (input.strength as 1 | 2 | 3 | 4 | 5) || 3,
          startDate: input.startDate as string | undefined,
          endDate: input.endDate as string | undefined,
          ongoing: input.ongoing !== false,
          metadata: (input.metadata as Record<string, unknown>) || {},
        };

        const relationship = await createRelationship(createInput);
        return {
          success: true,
          result: {
            message: `Created ${relationship.type} relationship: "${source.name}" -> "${target.name}"`,
            relationship: formatRelationshipForResponse(relationship),
          },
          shouldContinue: true, // Agent may want to create more relationships
        };
      }

      case 'update_relationship': {
        const relationshipId = input.relationshipId as string;

        // Verify relationship exists
        const existing = await getRelationship(relationshipId);
        if (!existing) {
          return {
            success: false,
            result: null,
            error: `Relationship not found with ID: ${relationshipId}`,
            shouldContinue: true,
          };
        }

        // Verify it belongs to the universe (check source entity)
        if (existing.source.universeId !== universeId) {
          return {
            success: false,
            result: null,
            error: 'Relationship belongs to a different universe',
            shouldContinue: true,
          };
        }

        const updateInput: Partial<
          Omit<CreateRelationshipInput, 'sourceId' | 'targetId'>
        > = {};
        if (input.type !== undefined)
          updateInput.type = input.type as RelationshipType;
        if (input.context !== undefined)
          updateInput.context = input.context as string;
        if (input.strength !== undefined)
          updateInput.strength = input.strength as 1 | 2 | 3 | 4 | 5;
        if (input.startDate !== undefined)
          updateInput.startDate = input.startDate as string;
        if (input.endDate !== undefined)
          updateInput.endDate = input.endDate as string;
        if (input.ongoing !== undefined)
          updateInput.ongoing = input.ongoing as boolean;
        if (input.metadata !== undefined)
          updateInput.metadata = input.metadata as Record<string, unknown>;

        const updated = await updateRelationship(relationshipId, updateInput);
        if (!updated) {
          return {
            success: false,
            result: null,
            error: 'Failed to update relationship',
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: {
            message: `Updated relationship: "${updated.source.name}" -> "${updated.target.name}"`,
            relationship: formatRelationshipForResponse(updated),
          },
          shouldContinue: true, // Agent may want to continue editing
        };
      }

      case 'delete_relationship': {
        const relationshipId = input.relationshipId as string;
        const confirm = input.confirm as boolean;

        if (!confirm) {
          return {
            success: false,
            result: null,
            error:
              'Deletion not confirmed. Set confirm: true to delete the relationship.',
            shouldContinue: true,
          };
        }

        // Verify relationship exists
        const existing = await getRelationship(relationshipId);
        if (!existing) {
          return {
            success: false,
            result: null,
            error: `Relationship not found with ID: ${relationshipId}`,
            shouldContinue: true,
          };
        }

        // Verify it belongs to the universe
        if (existing.source.universeId !== universeId) {
          return {
            success: false,
            result: null,
            error: 'Relationship belongs to a different universe',
            shouldContinue: true,
          };
        }

        const deleted = await deleteRelationship(relationshipId);
        if (!deleted) {
          return {
            success: false,
            result: null,
            error: 'Failed to delete relationship',
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: {
            message: `Deleted ${existing.type} relationship between "${existing.source.name}" and "${existing.target.name}"`,
            deletedRelationship: {
              id: existing.id,
              type: existing.type,
              sourceName: existing.source.name,
              targetName: existing.target.name,
            },
          },
          shouldContinue: false, // Terminal operation - deletion complete
        };
      }

      // ----------------------------------------
      // Context Operations
      // ----------------------------------------
      case 'get_graph_context': {
        const entityId = input.entityId as string;
        const depth = Math.min((input.depth as number) || 2, 3);
        const maxNodes = Math.min((input.maxNodes as number) || 30, 100);

        // Verify central entity exists and belongs to universe
        const centralEntity = await getEntity(entityId);
        if (!centralEntity) {
          return {
            success: false,
            result: null,
            error: `Entity not found with ID: ${entityId}`,
            shouldContinue: true,
          };
        }
        if (centralEntity.universeId !== universeId) {
          return {
            success: false,
            result: null,
            error: 'Entity belongs to a different universe',
            shouldContinue: true,
          };
        }

        // Get n-hop neighborhood using variable-length relationship pattern
        const graphContext = await getGraphNeighborhood(
          entityId,
          depth,
          maxNodes
        );

        return {
          success: true,
          result: {
            centralEntity: formatEntityForResponse(centralEntity),
            neighborhood: graphContext,
          },
          shouldContinue: true, // Agent may want to explore specific nodes
        };
      }

      // ----------------------------------------
      // Enrichment Operations
      // ----------------------------------------
      case 'web_search': {
        const query = input.query as string;
        const maxResults = Math.min((input.maxResults as number) || 5, 10);

        // Call the enrichment API endpoint
        const webResults = await performWebSearch(query, maxResults);

        return {
          success: true,
          result: {
            query,
            resultCount: webResults.length,
            results: webResults,
          },
          shouldContinue: true, // Agent may want to use results to update entities
        };
      }

      // ----------------------------------------
      // Storyline Operations
      // ----------------------------------------
      case 'search_storylines': {
        const query = input.query as string;
        const limit = Math.min((input.limit as number) || 10, 50);

        const storylines = await searchStorylines(universeId, query, limit);
        return {
          success: true,
          result: {
            count: storylines.length,
            storylines: storylines.map(formatStorylineSearchResultForResponse),
          },
          shouldContinue: true, // Agent may want to get details on specific storylines
        };
      }

      case 'get_storyline': {
        const storylineId = input.storylineId as string;
        const includeCast = input.includeCast !== false;

        const storyline = includeCast
          ? await getStorylineWithCast(storylineId)
          : await getStoryline(storylineId);

        if (!storyline) {
          return {
            success: false,
            result: null,
            error: `Storyline not found with ID: ${storylineId}`,
            shouldContinue: true,
          };
        }

        // Verify storyline belongs to the universe
        if (storyline.universeId !== universeId) {
          return {
            success: false,
            result: null,
            error: 'Storyline belongs to a different universe',
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: formatStorylineForResponse(storyline, includeCast),
          shouldContinue: true, // Agent may want to update or use storyline
        };
      }

      case 'get_storylines_for_cast': {
        const entityId = input.entityId as string;
        const limit = Math.min((input.limit as number) || 20, 100);

        // Verify entity exists and belongs to universe
        const entity = await getEntity(entityId);
        if (!entity) {
          return {
            success: false,
            result: null,
            error: `Entity not found with ID: ${entityId}`,
            shouldContinue: true,
          };
        }
        if (entity.universeId !== universeId) {
          return {
            success: false,
            result: null,
            error: 'Entity belongs to a different universe',
            shouldContinue: true,
          };
        }

        const storylines = await getStorylinesForEntity(entityId, limit);
        return {
          success: true,
          result: {
            entityName: entity.name,
            count: storylines.length,
            storylines: storylines.map((s) => formatStorylineForResponse(s, false)),
          },
          shouldContinue: true, // Agent may want to get details on specific storylines
        };
      }

      case 'list_storylines': {
        const status = input.status as StorylineStatus | undefined;
        const limit = Math.min((input.limit as number) || 20, 100);
        const offset = (input.offset as number) || 0;

        const result = await listStorylines(universeId, { status, limit, offset });
        return {
          success: true,
          result: {
            count: result.items.length,
            total: result.total,
            hasMore: result.hasMore,
            storylines: result.items.map((s) => formatStorylineForResponse(s, false)),
          },
          shouldContinue: true, // Agent may want to get details or create new
        };
      }

      case 'create_storyline': {
        const storylineInput = {
          universeId,
          title: input.title as string,
          synopsis: input.synopsis as string,
          narrative: (input.narrative as string) || '',
          primaryCast: (input.primaryCast as string[]) || [],
          supportingCast: (input.supportingCast as string[]) || [],
          status: (input.status as StorylineStatus) || 'developing',
          season: input.season as string | undefined,
          episodeRange: input.episodeRange as string | undefined,
          tags: (input.tags as string[]) || [],
        };

        const storyline = await createStoryline(storylineInput);
        return {
          success: true,
          result: {
            message: `Created new storyline "${storyline.title}"`,
            storyline: formatStorylineForResponse(storyline, false),
          },
          shouldContinue: true, // Agent may want to add cast or update narrative
        };
      }

      case 'update_storyline': {
        const storylineId = input.storylineId as string;

        // Verify storyline exists and belongs to universe
        const existing = await getStoryline(storylineId);
        if (!existing) {
          return {
            success: false,
            result: null,
            error: `Storyline not found with ID: ${storylineId}`,
            shouldContinue: true,
          };
        }
        if (existing.universeId !== universeId) {
          return {
            success: false,
            result: null,
            error: 'Storyline belongs to a different universe',
            shouldContinue: true,
          };
        }

        const updateInput: Record<string, unknown> = {};
        if (input.title !== undefined) updateInput.title = input.title as string;
        if (input.synopsis !== undefined) updateInput.synopsis = input.synopsis as string;
        if (input.narrative !== undefined) updateInput.narrative = input.narrative as string;
        if (input.primaryCast !== undefined) updateInput.primaryCast = input.primaryCast as string[];
        if (input.supportingCast !== undefined) updateInput.supportingCast = input.supportingCast as string[];
        if (input.status !== undefined) updateInput.status = input.status as StorylineStatus;
        if (input.season !== undefined) updateInput.season = input.season as string;
        if (input.episodeRange !== undefined) updateInput.episodeRange = input.episodeRange as string;
        if (input.tags !== undefined) updateInput.tags = input.tags as string[];

        const updated = await updateStoryline(storylineId, updateInput);
        if (!updated) {
          return {
            success: false,
            result: null,
            error: 'Failed to update storyline',
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: {
            message: `Updated storyline "${updated.title}"`,
            storyline: formatStorylineForResponse(updated, false),
          },
          shouldContinue: true, // Agent may want to continue editing
        };
      }

      case 'delete_storyline': {
        const storylineId = input.storylineId as string;
        const confirm = input.confirm as boolean;

        if (!confirm) {
          return {
            success: false,
            result: null,
            error: 'Deletion not confirmed. Set confirm: true to delete the storyline.',
            shouldContinue: true,
          };
        }

        // Verify storyline exists and belongs to universe
        const existing = await getStoryline(storylineId);
        if (!existing) {
          return {
            success: false,
            result: null,
            error: `Storyline not found with ID: ${storylineId}`,
            shouldContinue: true,
          };
        }
        if (existing.universeId !== universeId) {
          return {
            success: false,
            result: null,
            error: 'Storyline belongs to a different universe',
            shouldContinue: true,
          };
        }

        const deleted = await deleteStoryline(storylineId);
        if (!deleted) {
          return {
            success: false,
            result: null,
            error: 'Failed to delete storyline',
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: {
            message: `Deleted storyline "${existing.title}"`,
            deletedStoryline: {
              id: existing.id,
              title: existing.title,
            },
          },
          shouldContinue: false, // Terminal operation - deletion complete
        };
      }

      default:
        return {
          success: false,
          result: null,
          error: `Unknown tool: ${toolName}`,
          shouldContinue: true, // Agent may need to try a different tool
        };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Tool execution error [${toolName}]:`, error);
    return {
      success: false,
      result: null,
      error: errorMessage,
      shouldContinue: true, // Agent should recover from errors
    };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format entity for response (clean dates to ISO strings)
 */
function formatEntityForResponse(entity: Entity): Record<string, unknown> {
  return {
    id: entity.id,
    type: entity.type,
    name: entity.name,
    aliases: entity.aliases,
    description: entity.description,
    status: entity.status,
    imageUrl: entity.imageUrl,
    metadata: entity.metadata,
    createdAt: entity.createdAt instanceof Date
      ? entity.createdAt.toISOString()
      : entity.createdAt,
    updatedAt: entity.updatedAt instanceof Date
      ? entity.updatedAt.toISOString()
      : entity.updatedAt,
  };
}

/**
 * Format relationship for response
 */
function formatRelationshipForResponse(
  rel: RelationshipWithEntities
): Record<string, unknown> {
  return {
    id: rel.id,
    type: rel.type,
    source: {
      id: rel.source.id,
      name: rel.source.name,
      type: rel.source.type,
    },
    target: {
      id: rel.target.id,
      name: rel.target.name,
      type: rel.target.type,
    },
    context: rel.context,
    strength: rel.strength,
    startDate: rel.startDate,
    endDate: rel.endDate,
    ongoing: rel.ongoing,
    metadata: rel.metadata,
  };
}

/**
 * Get the n-hop neighborhood of an entity
 */
async function getGraphNeighborhood(
  entityId: string,
  depth: number,
  maxNodes: number
): Promise<{
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    distance: number;
  }>;
  edges: Array<{
    id: string;
    sourceId: string;
    sourceName: string;
    targetId: string;
    targetName: string;
    type: string;
    context: string;
  }>;
}> {
  // Use variable-length pattern to get nodes within n hops
  const results = await readQuery<{
    n: { id: string; name: string; type: string };
    distance: number;
  }>(
    `
    MATCH path = (center:Entity {id: $entityId})-[*1..${depth}]-(connected:Entity)
    WITH connected as n, length(path) as distance
    RETURN DISTINCT {id: n.id, name: n.name, type: n.type} as n, min(distance) as distance
    ORDER BY distance, n.name
    LIMIT toInteger($maxNodes)
    `,
    { entityId, maxNodes }
  );

  const nodeIds = [entityId, ...results.map((r) => r.n.id)];

  // Get all edges between these nodes
  const edgeResults = await readQuery<{
    r: { id: string; type: string; context: string };
    sourceId: string;
    sourceName: string;
    targetId: string;
    targetName: string;
  }>(
    `
    MATCH (a:Entity)-[r]->(b:Entity)
    WHERE a.id IN $nodeIds AND b.id IN $nodeIds
    RETURN r, a.id as sourceId, a.name as sourceName, b.id as targetId, b.name as targetName
    `,
    { nodeIds }
  );

  return {
    nodes: [
      { id: entityId, name: '(center)', type: 'center', distance: 0 },
      ...results.map((r) => ({
        id: r.n.id,
        name: r.n.name,
        type: r.n.type,
        distance: r.distance,
      })),
    ],
    edges: edgeResults.map((r) => ({
      id: r.r.id || '',
      sourceId: r.sourceId,
      sourceName: r.sourceName,
      targetId: r.targetId,
      targetName: r.targetName,
      type: r.r.type || 'unknown',
      context: r.r.context || '',
    })),
  };
}

/**
 * Format storyline search result for response (lightweight)
 */
function formatStorylineSearchResultForResponse(
  result: { id: string; title: string; synopsis: string | null; rank: number }
): Record<string, unknown> {
  return {
    id: result.id,
    title: result.title,
    synopsis: result.synopsis,
    relevance: result.rank,
  };
}

/**
 * Format storyline for response (full details)
 */
function formatStorylineForResponse(
  storyline: Storyline | StorylineWithCast,
  includeCast: boolean
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: storyline.id,
    title: storyline.title,
    slug: storyline.slug,
    synopsis: storyline.synopsis,
    narrative: storyline.narrative,
    status: storyline.status,
    season: storyline.season,
    episodeRange: storyline.episodeRange,
    tags: storyline.tags,
    createdAt: storyline.createdAt instanceof Date
      ? storyline.createdAt.toISOString()
      : storyline.createdAt,
    updatedAt: storyline.updatedAt instanceof Date
      ? storyline.updatedAt.toISOString()
      : storyline.updatedAt,
  };

  if (includeCast && 'primaryCastEntities' in storyline) {
    const withCast = storyline as StorylineWithCast;
    base.primaryCast = withCast.primaryCastEntities?.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
    })) || [];
    base.supportingCast = withCast.supportingCastEntities?.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
    })) || [];
  } else {
    base.primaryCastIds = storyline.primaryCast;
    base.supportingCastIds = storyline.supportingCast;
  }

  return base;
}

/**
 * Perform web search via enrichment API
 * This is a placeholder - implement actual web search integration
 */
async function performWebSearch(
  query: string,
  maxResults: number
): Promise<Array<{ title: string; snippet: string; url: string }>> {
  // TODO: Integrate with actual web search API (Serper, Tavily, Perplexity)
  // For now, return a placeholder indicating the feature
  console.log(`Web search requested: "${query}" (max: ${maxResults})`);

  // Check if we have an enrichment API configured
  const enrichmentApiUrl = process.env.ENRICHMENT_API_URL;
  if (enrichmentApiUrl) {
    try {
      const response = await fetch(`${enrichmentApiUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.ENRICHMENT_API_KEY || ''}`,
        },
        body: JSON.stringify({ query, maxResults }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      }
    } catch (error) {
      console.error('Enrichment API error:', error);
    }
  }

  // Fallback: return empty results with a note
  return [];
}

// ============================================
// Exports for External Use
// ============================================

export type { Tool };
