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
import {
  getUpcomingScenes,
  getCastCompletionStatus,
  getCrewAvailabilityForDate,
  getScenesForCastMember,
  getIncompleteContracts,
  getScenesByStatus,
} from './production-queries';
import { createScene, updateScene, getScene, deleteScene } from './scenes';
import { updateCastContract, createCastContract, getCastContract, deleteCastContract } from './cast-contracts';
import { createCrewMember, updateCrewMember, getCrewMember, listCrewMembers, deleteCrewMember } from './crew';
import { generateCallSheet } from './call-sheet';
import { getAllAlerts } from './production-alerts';
import { updateProduction } from './productions';
import {
  createCrewAvailability,
  updateCrewAvailability,
  listCrewAvailability,
} from './crew-availability';
import { advanceStage, createAssetInstance, updateAssetInstance, deleteAssetInstance, listAssetInstances, listAssetTypes, listLifecycleStages, getAssetInstance } from './lifecycle';
import { listProductions, createProduction } from './productions';
import { generateRegistrationCode } from './telegram';
import { getServiceSupabase } from './supabase';
import { createEpisode, getEpisode, listEpisodes, updateEpisode, deleteEpisode } from './episodes';
import type { EpisodeStatus, CreateEpisodeInput, UpdateEpisodeInput } from '@/types';
import type {
  CreateProdSceneInput,
  UpdateProdSceneInput,
  ProdSceneStatus,
  ContractStatus,
  PaymentType,
  AvailabilityStatus,
  AssignmentRole,
  CrewRole,
  ProductionStatus,
  CreateCrewMemberInput,
  UpdateCrewMemberInput,
  CreateCastContractInput,
  UpdateProductionInput,
} from '@/types';
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

  // ----------------------------------------
  // Production Operations (Lexi)
  // ----------------------------------------
  {
    name: 'query_scenes',
    description:
      'Query production scenes with filters. Use to find upcoming shoots, scenes by status, or scenes for a specific cast member. Returns scheduled dates, locations, cast, and crew assignments.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID to query scenes for',
        },
        status: {
          type: 'string',
          enum: ['scheduled', 'shot', 'cancelled', 'postponed', 'self_shot'],
          description: 'Filter by scene status',
        },
        castEntityId: {
          type: 'string',
          description: 'Filter scenes by a specific cast member entity ID',
        },
        days: {
          type: 'number',
          description: 'Show scenes in the next N days (default: 7)',
        },
      },
      required: ['productionId'],
    },
  },
  {
    name: 'query_cast_status',
    description:
      'Get the contract and completion status for all cast members in a production. Shows signed status, payment type, and whether shoot/interview/pickup/payment are done.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID to query cast status for',
        },
        incompleteOnly: {
          type: 'boolean',
          description: 'If true, only return cast members with incomplete items',
        },
      },
      required: ['productionId'],
    },
  },
  {
    name: 'query_crew_availability',
    description:
      'Check crew availability for a specific date. Shows which crew members are available, OOO, dark, holding, or booked.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID to query crew for',
        },
        date: {
          type: 'string',
          description: 'Date to check availability for (YYYY-MM-DD format)',
        },
      },
      required: ['productionId', 'date'],
    },
  },
  {
    name: 'get_production_summary',
    description:
      'Get a high-level summary of a production: total cast, signed percentage, total scenes, scenes shot, crew count, upcoming scenes, and incomplete contracts.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID to summarize',
        },
      },
      required: ['productionId'],
    },
  },
  {
    name: 'search_schedule',
    description:
      'Search the production schedule by date range, cast member, or location. Use when someone asks "what\'s happening this week" or "when is Chantel shooting next".',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID to search',
        },
        startDate: {
          type: 'string',
          description: 'Start of date range (YYYY-MM-DD)',
        },
        endDate: {
          type: 'string',
          description: 'End of date range (YYYY-MM-DD)',
        },
        castEntityId: {
          type: 'string',
          description: 'Filter by cast member entity ID',
        },
      },
      required: ['productionId'],
    },
  },

  // ----------------------------------------
  // Production Write Operations (Lexi)
  // ----------------------------------------
  {
    name: 'schedule_scene',
    description:
      'Schedule a new scene or update an existing one. Use to add shoots to the calendar.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID for the scene',
        },
        title: {
          type: 'string',
          description: 'Scene title or description',
        },
        scheduledDate: {
          type: 'string',
          description: 'Scheduled shoot date (YYYY-MM-DD)',
        },
        scheduledTime: {
          type: 'string',
          description: 'Scheduled shoot time (HH:MM)',
        },
        location: {
          type: 'string',
          description: 'Shoot location name',
        },
        locationDetails: {
          type: 'string',
          description: 'Additional location details (address, room, etc.)',
        },
        castEntityIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of cast member entity IDs appearing in this scene',
        },
        sceneNumber: {
          type: 'string',
          description: 'Scene number identifier',
        },
        status: {
          type: 'string',
          enum: ['scheduled', 'shot', 'cancelled', 'postponed', 'self_shot'],
          description: 'Scene status (default: scheduled)',
        },
        equipmentNotes: {
          type: 'string',
          description: 'Notes about equipment needed',
        },
        isSelfShot: {
          type: 'boolean',
          description: 'Whether this is a self-shot scene (no crew needed)',
        },
        sceneId: {
          type: 'string',
          description: 'If provided, updates an existing scene instead of creating a new one',
        },
      },
      required: ['productionId', 'title'],
    },
  },
  {
    name: 'assign_crew',
    description:
      'Assign a crew member to a scene with a specific role.',
    input_schema: {
      type: 'object' as const,
      properties: {
        sceneId: {
          type: 'string',
          description: 'The scene ID to assign crew to',
        },
        crewMemberId: {
          type: 'string',
          description: 'The crew member ID to assign',
        },
        role: {
          type: 'string',
          enum: ['ac', 'producer', 'fixer', 'coordinator', 'backup'],
          description: 'Role for this assignment (default: ac)',
        },
        notes: {
          type: 'string',
          description: 'Additional notes for the assignment',
        },
      },
      required: ['sceneId', 'crewMemberId'],
    },
  },
  {
    name: 'mark_contract',
    description:
      "Update a cast contract's status or completion fields. Use to mark contracts as signed, mark shoot/interview/pickup/payment as done.",
    input_schema: {
      type: 'object' as const,
      properties: {
        contractId: {
          type: 'string',
          description: 'The contract ID to update',
        },
        contractStatus: {
          type: 'string',
          enum: ['signed', 'pending', 'offer_sent', 'dnc', 'email_sent', 'declined'],
          description: 'New contract status',
        },
        paymentType: {
          type: 'string',
          enum: ['daily', 'flat'],
          description: 'Payment type for the contract',
        },
        shootDone: {
          type: 'boolean',
          description: 'Mark shoot as completed',
        },
        interviewDone: {
          type: 'boolean',
          description: 'Mark interview as completed',
        },
        pickupDone: {
          type: 'boolean',
          description: 'Mark pickup as completed',
        },
        paymentDone: {
          type: 'boolean',
          description: 'Mark payment as completed',
        },
        dailyRate: {
          type: 'number',
          description: 'Per-day rate in dollars (for daily-rate cast)',
        },
        flatFee: {
          type: 'number',
          description: 'Flat fee in dollars (for flat-rate cast)',
        },
        totalPayment: {
          type: 'number',
          description: 'Total payment amount in dollars',
        },
        paidAmount: {
          type: 'number',
          description: 'Amount paid so far in dollars',
        },
        notes: {
          type: 'string',
          description: 'Additional notes for the contract',
        },
      },
      required: ['contractId'],
    },
  },
  {
    name: 'advance_asset_stage',
    description:
      'Advance an asset to its next lifecycle stage. Use when a contract moves from Sent to Signed, a shoot moves from Scheduled to Shot, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        assetInstanceId: {
          type: 'string',
          description: 'The asset instance ID to advance',
        },
        toStageId: {
          type: 'string',
          description: 'The target stage ID to advance to',
        },
        reason: {
          type: 'string',
          description: 'Reason for the stage transition',
        },
        transitionedByName: {
          type: 'string',
          description: 'Name of who triggered the transition (default: Lexi)',
        },
      },
      required: ['assetInstanceId', 'toStageId'],
    },
  },
  {
    name: 'update_crew_availability',
    description:
      "Set a crew member's availability for a specific date.",
    input_schema: {
      type: 'object' as const,
      properties: {
        crewMemberId: {
          type: 'string',
          description: 'The crew member ID',
        },
        date: {
          type: 'string',
          description: 'Date to set availability for (YYYY-MM-DD)',
        },
        status: {
          type: 'string',
          enum: ['available', 'ooo', 'dark', 'holding', 'booked'],
          description: 'Availability status',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about availability',
        },
      },
      required: ['crewMemberId', 'date', 'status'],
    },
  },
  {
    name: 'create_crew_member',
    description:
      'Add a new crew member to a production.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production to add the crew member to',
        },
        name: {
          type: 'string',
          description: 'Full name of the crew member',
        },
        role: {
          type: 'string',
          enum: ['staff', 'ac', 'producer', 'fixer', 'editor', 'coordinator', 'field_producer', 'post_supervisor'],
          description: 'Crew member role',
        },
        contactEmail: {
          type: 'string',
          description: 'Contact email address',
        },
        contactPhone: {
          type: 'string',
          description: 'Contact phone number',
        },
      },
      required: ['productionId', 'name', 'role'],
    },
  },
  {
    name: 'update_crew_member',
    description:
      'Edit crew member details or deactivate a crew member.',
    input_schema: {
      type: 'object' as const,
      properties: {
        crewMemberId: {
          type: 'string',
          description: 'The crew member ID to update',
        },
        name: {
          type: 'string',
          description: 'Updated full name',
        },
        role: {
          type: 'string',
          enum: ['staff', 'ac', 'producer', 'fixer', 'editor', 'coordinator', 'field_producer', 'post_supervisor'],
          description: 'Updated crew role',
        },
        contactEmail: {
          type: 'string',
          description: 'Updated contact email',
        },
        contactPhone: {
          type: 'string',
          description: 'Updated contact phone',
        },
        isActive: {
          type: 'boolean',
          description: 'Set to false to deactivate the crew member',
        },
      },
      required: ['crewMemberId'],
    },
  },
  {
    name: 'delete_scene',
    description:
      'Remove a scene from the schedule. Requires explicit confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        sceneId: {
          type: 'string',
          description: 'The scene ID to delete',
        },
        confirm: {
          type: 'boolean',
          description: 'Must be true to confirm deletion',
        },
      },
      required: ['sceneId', 'confirm'],
    },
  },
  {
    name: 'create_cast_contract',
    description:
      'Add a cast member contract to a production.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID',
        },
        castEntityId: {
          type: 'string',
          description: 'The cast member entity ID',
        },
        castName: {
          type: 'string',
          description: 'Human-readable display name for the cast member',
        },
        contractStatus: {
          type: 'string',
          enum: ['signed', 'pending', 'offer_sent', 'dnc', 'email_sent', 'declined'],
          description: 'Contract status',
        },
        paymentType: {
          type: 'string',
          enum: ['daily', 'flat'],
          description: 'Payment type',
        },
        dailyRate: {
          type: 'number',
          description: 'Per-day rate in dollars (for daily-rate cast)',
        },
        flatFee: {
          type: 'number',
          description: 'Flat fee in dollars (for flat-rate cast)',
        },
        totalPayment: {
          type: 'number',
          description: 'Total payment amount in dollars',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about the contract',
        },
      },
      required: ['productionId', 'castEntityId'],
    },
  },
  {
    name: 'delete_cast_contract',
    description:
      'Remove a cast contract. Requires explicit confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contractId: {
          type: 'string',
          description: 'The contract ID to delete',
        },
        confirm: {
          type: 'boolean',
          description: 'Must be true to confirm deletion',
        },
      },
      required: ['contractId', 'confirm'],
    },
  },
  {
    name: 'generate_call_sheet',
    description:
      'Generate a call sheet for a specific production date, including all scenes, crew assignments, and cast.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID',
        },
        date: {
          type: 'string',
          description: 'Date to generate the call sheet for (YYYY-MM-DD)',
        },
      },
      required: ['productionId', 'date'],
    },
  },
  {
    name: 'get_production_alerts',
    description:
      'Check for production issues and blockers such as unsigned contracts, double-booked crew, overdue scenes, and stuck assets.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID to check alerts for',
        },
      },
      required: ['productionId'],
    },
  },
  {
    name: 'update_production',
    description:
      'Edit production details such as name, season, status, dates, or notes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID to update',
        },
        name: {
          type: 'string',
          description: 'Updated production name',
        },
        season: {
          type: 'string',
          description: 'Updated season identifier',
        },
        status: {
          type: 'string',
          enum: ['pre_production', 'active', 'post_production', 'wrapped'],
          description: 'Updated production status',
        },
        startDate: {
          type: 'string',
          description: 'Updated start date (YYYY-MM-DD)',
        },
        endDate: {
          type: 'string',
          description: 'Updated end date (YYYY-MM-DD)',
        },
        notes: {
          type: 'string',
          description: 'Updated production notes',
        },
      },
      required: ['productionId'],
    },
  },

  // ----------------------------------------
  // Document & Email Operations (Lexi)
  // ----------------------------------------
  {
    name: 'email_call_sheet',
    description:
      'Generate a call sheet for a specific date and email it to crew. If no recipients specified, sends to all active crew with email addresses.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID',
        },
        date: {
          type: 'string',
          description: 'Date for the call sheet (YYYY-MM-DD)',
        },
        recipients: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional specific email addresses to send to. If omitted, sends to all active crew.',
        },
      },
      required: ['productionId', 'date'],
    },
  },
  {
    name: 'email_production_report',
    description:
      'Generate a production report with stats, alerts, upcoming scenes, and incomplete contracts, then email it to producers/EPs.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID',
        },
        recipients: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional specific email addresses. If omitted, sends to all producers and EPs.',
        },
      },
      required: ['productionId'],
    },
  },
  {
    name: 'email_contract_summary',
    description:
      'Generate a contract summary showing all cast contract statuses and completion tracking, then email it.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID',
        },
        productionName: {
          type: 'string',
          description: 'Production name for the document header',
        },
        recipients: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional specific email addresses. If omitted, sends to producers and EPs.',
        },
      },
      required: ['productionId', 'productionName'],
    },
  },
  // ----------------------------------------
  // Asset Instance Management (Gear, Footage, etc.)
  // ----------------------------------------
  {
    name: 'create_asset',
    description:
      'Create a new tracked asset (equipment, footage, document). Use for registering gear kits, logging new footage, tracking cast documents (scripts, releases, NDAs), or creating any lifecycle-tracked item.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID',
        },
        assetTypeSlug: {
          type: 'string',
          description: 'Asset type slug: "equipment", "footage", "document", "contract", "shoot", "deliverable"',
        },
        name: {
          type: 'string',
          description: 'Asset name (e.g., "Kit 3", "Chantel B-roll 03/18", "Chantel Release Form", "Episode 4 Script")',
        },
        description: {
          type: 'string',
          description: 'Optional description or notes',
        },
        ownerName: {
          type: 'string',
          description: 'Who currently has custody (crew member name)',
        },
        location: {
          type: 'string',
          description: 'Current physical location',
        },
        castMember: {
          type: 'string',
          description: 'Associated cast member name (for footage, documents, or on-location gear)',
        },
        dueDate: {
          type: 'string',
          description: 'When this asset is due back or due at next stage (YYYY-MM-DD)',
        },
        documentType: {
          type: 'string',
          description: 'For document assets: script, release, nda, interview_guide, contract_amendment',
        },
        sceneTitle: {
          type: 'string',
          description: 'For footage: which scene this footage is from',
        },
        camera: {
          type: 'string',
          description: 'For footage: camera name/number',
        },
        card: {
          type: 'string',
          description: 'For footage: memory card identifier',
        },
        acNotes: {
          type: 'string',
          description: 'For footage: AC field notes about the shoot',
        },
        shotDate: {
          type: 'string',
          description: 'For footage: when it was shot (YYYY-MM-DD)',
        },
      },
      required: ['productionId', 'assetTypeSlug', 'name'],
    },
  },
  {
    name: 'update_asset',
    description:
      'Update an existing asset — change who has it, where it is, due date, or notes. Use when gear changes hands, footage gets new metadata, or custody transfers.',
    input_schema: {
      type: 'object' as const,
      properties: {
        assetInstanceId: {
          type: 'string',
          description: 'The asset instance ID',
        },
        ownerName: {
          type: 'string',
          description: 'New custody holder (crew member name)',
        },
        location: {
          type: 'string',
          description: 'New location',
        },
        castMember: {
          type: 'string',
          description: 'New associated cast member',
        },
        description: {
          type: 'string',
          description: 'Updated notes/description',
        },
        dueDate: {
          type: 'string',
          description: 'Updated due date (YYYY-MM-DD)',
        },
      },
      required: ['assetInstanceId'],
    },
  },
  {
    name: 'list_assets',
    description:
      'List tracked assets for a production. Filter by type (equipment, footage, etc.) to see where everything is. Returns current stage, owner, location, and how long since last transition.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID',
        },
        assetTypeSlug: {
          type: 'string',
          description: 'Filter by asset type: "equipment", "footage", "contract", "shoot", "deliverable". Omit for all types.',
        },
        stageName: {
          type: 'string',
          description: 'Filter by current stage name (e.g., "Checked Out", "On Location")',
        },
      },
      required: ['productionId'],
    },
  },
  // ----------------------------------------
  // Production & Administration Tools
  // ----------------------------------------
  {
    name: 'create_production',
    description:
      'Create a new production within the current universe. Use when someone says "set up a new show" or "create a new season."',
    input_schema: {
      type: 'object' as const,
      properties: {
        universeId: {
          type: 'string',
          description: 'The universe ID to create the production in',
        },
        name: {
          type: 'string',
          description: 'Production name (e.g., "Diaries Season 8")',
        },
        season: {
          type: 'string',
          description: 'Season number or cycle name',
        },
        startDate: {
          type: 'string',
          description: 'Production start date (YYYY-MM-DD)',
        },
        endDate: {
          type: 'string',
          description: 'Production end date (YYYY-MM-DD)',
        },
        notes: {
          type: 'string',
          description: 'Production notes',
        },
      },
      required: ['universeId', 'name'],
    },
  },
  {
    name: 'list_productions',
    description:
      'List all productions for a universe. Returns production name, season, status, and date range.',
    input_schema: {
      type: 'object' as const,
      properties: {
        universeId: {
          type: 'string',
          description: 'The universe ID',
        },
      },
      required: ['universeId'],
    },
  },
  {
    name: 'delete_asset',
    description:
      'Delete a tracked asset instance. Use when an asset was created in error or is no longer relevant.',
    input_schema: {
      type: 'object' as const,
      properties: {
        assetInstanceId: {
          type: 'string',
          description: 'The asset instance ID to delete',
        },
      },
      required: ['assetInstanceId'],
    },
  },
  {
    name: 'generate_registration_code',
    description:
      'Generate a Telegram registration code for a crew member. The crew member uses /start <code> in Telegram to link their account.',
    input_schema: {
      type: 'object' as const,
      properties: {
        crewMemberId: {
          type: 'string',
          description: 'The crew member ID to generate a code for',
        },
      },
      required: ['crewMemberId'],
    },
  },

  // ----------------------------------------
  // Crew & Assignment Discovery Tools (Lexi)
  // ----------------------------------------
  {
    name: 'list_crew',
    description:
      'List all crew members in a production. Shows name, role, contact info, and active status. Use when someone asks "who\'s on the crew" or "show me the team".',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID',
        },
        role: {
          type: 'string',
          enum: ['staff', 'ac', 'producer', 'fixer', 'editor', 'coordinator', 'field_producer', 'post_supervisor'],
          description: 'Optional filter by crew role',
        },
        isActive: {
          type: 'boolean',
          description: 'If true, only return active crew members (default: true)',
        },
      },
      required: ['productionId'],
    },
  },
  {
    name: 'get_crew_member',
    description:
      'Get full details of a specific crew member by ID, including contact info, role, Telegram status, and active status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        crewMemberId: {
          type: 'string',
          description: 'The crew member ID',
        },
      },
      required: ['crewMemberId'],
    },
  },
  {
    name: 'delete_crew_member',
    description:
      'Remove a crew member from the production. Requires explicit confirmation. This will also remove their scene assignments.',
    input_schema: {
      type: 'object' as const,
      properties: {
        crewMemberId: {
          type: 'string',
          description: 'The crew member ID to delete',
        },
        confirm: {
          type: 'boolean',
          description: 'Must be true to confirm deletion',
        },
      },
      required: ['crewMemberId', 'confirm'],
    },
  },
  {
    name: 'remove_crew_assignment',
    description:
      'Remove a crew member from a scene assignment. Use when someone needs to be pulled off a shoot or reassigned.',
    input_schema: {
      type: 'object' as const,
      properties: {
        assignmentId: {
          type: 'string',
          description: 'The assignment ID to remove. Use list_scene_assignments to find it.',
        },
        confirm: {
          type: 'boolean',
          description: 'Must be true to confirm removal',
        },
      },
      required: ['assignmentId', 'confirm'],
    },
  },
  {
    name: 'list_scene_assignments',
    description:
      'List all crew assigned to a specific scene. Shows crew name, role, and assignment status. Use before removing or reassigning crew.',
    input_schema: {
      type: 'object' as const,
      properties: {
        sceneId: {
          type: 'string',
          description: 'The scene ID to list assignments for',
        },
      },
      required: ['sceneId'],
    },
  },
  {
    name: 'get_scene',
    description:
      'Get full details of a specific scene by ID, including title, date, location, cast, crew assignments, equipment notes, and status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        sceneId: {
          type: 'string',
          description: 'The scene ID',
        },
      },
      required: ['sceneId'],
    },
  },
  {
    name: 'find_available_crew',
    description:
      'Find crew members available on a specific date, optionally filtered by role. Use when staffing a scene: "who can shoot on Friday?" or "any ACs available March 25?".',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID',
        },
        date: {
          type: 'string',
          description: 'Date to check availability (YYYY-MM-DD)',
        },
        role: {
          type: 'string',
          enum: ['staff', 'ac', 'producer', 'fixer', 'editor', 'coordinator', 'field_producer', 'post_supervisor'],
          description: 'Optional filter by crew role',
        },
      },
      required: ['productionId', 'date'],
    },
  },
  {
    name: 'batch_update_availability',
    description:
      'Set a crew member\'s availability for multiple dates at once. Use when someone says "I\'m OOO Monday through Friday" or "mark me available for the whole week".',
    input_schema: {
      type: 'object' as const,
      properties: {
        crewMemberId: {
          type: 'string',
          description: 'The crew member ID',
        },
        dates: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of dates (YYYY-MM-DD format)',
        },
        status: {
          type: 'string',
          enum: ['available', 'ooo', 'dark', 'holding', 'booked'],
          description: 'Availability status to set for all dates',
        },
        notes: {
          type: 'string',
          description: 'Optional notes for all dates',
        },
      },
      required: ['crewMemberId', 'dates', 'status'],
    },
  },

  // ----------------------------------------
  // Export Operations (Lexi)
  // ----------------------------------------
  {
    name: 'export_csv',
    description:
      'Generate a CSV download link for production data. Use when someone asks to "export the cast list", "download the schedule", or "get me a spreadsheet of crew".',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID',
        },
        type: {
          type: 'string',
          enum: ['cast', 'crew', 'scenes', 'callsheet'],
          description: 'What to export: cast (contracts + payments), crew (roster), scenes (schedule), callsheet (daily call sheet)',
        },
        date: {
          type: 'string',
          description: 'Required for callsheet export: the date (YYYY-MM-DD)',
        },
      },
      required: ['productionId', 'type'],
    },
  },

  // ----------------------------------------
  // Episode Management (Lexi)
  // ----------------------------------------
  {
    name: 'list_episodes',
    description:
      'List all episodes for a production. Shows episode number, title, air date, and status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID',
        },
        status: {
          type: 'string',
          enum: ['planned', 'in_production', 'in_post', 'delivered', 'aired'],
          description: 'Optional filter by episode status',
        },
      },
      required: ['productionId'],
    },
  },
  {
    name: 'create_episode',
    description:
      'Create a new episode for a production. Use when someone says "add episode 5" or "set up the next episode".',
    input_schema: {
      type: 'object' as const,
      properties: {
        productionId: {
          type: 'string',
          description: 'The production ID',
        },
        episodeNumber: {
          type: 'number',
          description: 'Episode number (e.g., 1, 2, 3)',
        },
        title: {
          type: 'string',
          description: 'Episode title',
        },
        description: {
          type: 'string',
          description: 'Episode description or synopsis',
        },
        airDate: {
          type: 'string',
          description: 'Scheduled air date (YYYY-MM-DD)',
        },
        status: {
          type: 'string',
          enum: ['planned', 'in_production', 'in_post', 'delivered', 'aired'],
          description: 'Episode status (default: planned)',
        },
      },
      required: ['productionId', 'episodeNumber'],
    },
  },
  {
    name: 'update_episode',
    description:
      'Update episode details such as title, air date, or status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        episodeId: {
          type: 'string',
          description: 'The episode ID to update',
        },
        title: {
          type: 'string',
          description: 'Updated title',
        },
        description: {
          type: 'string',
          description: 'Updated description',
        },
        airDate: {
          type: 'string',
          description: 'Updated air date (YYYY-MM-DD)',
        },
        status: {
          type: 'string',
          enum: ['planned', 'in_production', 'in_post', 'delivered', 'aired'],
          description: 'Updated status',
        },
      },
      required: ['episodeId'],
    },
  },
  {
    name: 'assign_scene_to_episode',
    description:
      'Link a scene to an episode. Use when someone says "that shoot is for episode 3" or "assign this scene to episode 5".',
    input_schema: {
      type: 'object' as const,
      properties: {
        sceneId: {
          type: 'string',
          description: 'The scene ID to link',
        },
        episodeId: {
          type: 'string',
          description: 'The episode ID to link to. Set to null to unlink.',
        },
      },
      required: ['sceneId'],
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

      // ----------------------------------------
      // Production Operations (Lexi)
      // ----------------------------------------
      case 'query_scenes': {
        const productionId = input.productionId as string;
        const castEntityId = input.castEntityId as string | undefined;
        const status = input.status as import('@/types').ProdSceneStatus | undefined;
        const days = (input.days as number) || 7;

        let scenes;
        if (castEntityId) {
          scenes = await getScenesForCastMember(castEntityId);
        } else if (status) {
          scenes = await getScenesByStatus(productionId, status);
        } else {
          scenes = await getUpcomingScenes(productionId, days);
        }

        return {
          success: true,
          result: {
            scenes,
            count: scenes.length,
          },
          shouldContinue: true,
        };
      }

      case 'query_cast_status': {
        const productionId = input.productionId as string;
        const incompleteOnly = input.incompleteOnly as boolean;

        const contracts = incompleteOnly
          ? await getIncompleteContracts(productionId)
          : await getCastCompletionStatus(productionId);

        return {
          success: true,
          result: {
            contracts,
            count: contracts.length,
          },
          shouldContinue: true,
        };
      }

      case 'query_crew_availability': {
        const productionId = input.productionId as string;
        const date = input.date as string;

        const availability = await getCrewAvailabilityForDate(productionId, date);

        return {
          success: true,
          result: {
            date,
            crew: availability,
            count: availability.length,
          },
          shouldContinue: true,
        };
      }

      case 'get_production_summary': {
        const productionId = input.productionId as string;
        const { buildProductionSummary } = await import('./lexi');
        const summary = await buildProductionSummary(productionId);

        return {
          success: true,
          result: summary,
          shouldContinue: true,
        };
      }

      case 'search_schedule': {
        const productionId = input.productionId as string;
        const days = 30; // default to 30 days for schedule search
        const scenes = await getUpcomingScenes(productionId, days);

        // Filter by cast if specified
        const castEntityId = input.castEntityId as string | undefined;
        const filtered = castEntityId
          ? scenes.filter((s) => {
              const castIds = (s as unknown as { castEntityIds?: string[] }).castEntityIds;
              return Array.isArray(castIds) && castIds.includes(castEntityId);
            })
          : scenes;

        return {
          success: true,
          result: {
            scenes: filtered,
            count: filtered.length,
          },
          shouldContinue: true,
        };
      }

      // ----------------------------------------
      // Production Write Operations (Lexi)
      // ----------------------------------------
      case 'schedule_scene': {
        const sceneId = input.sceneId as string | undefined;

        if (sceneId) {
          // Update existing scene
          const updateInput: UpdateProdSceneInput = {};
          if (input.title !== undefined) updateInput.title = input.title as string;
          if (input.scheduledDate !== undefined) updateInput.scheduledDate = input.scheduledDate as string;
          if (input.scheduledTime !== undefined) updateInput.scheduledTime = input.scheduledTime as string;
          if (input.location !== undefined) updateInput.location = input.location as string;
          if (input.locationDetails !== undefined) updateInput.locationDetails = input.locationDetails as string;
          if (input.castEntityIds !== undefined) updateInput.castEntityIds = input.castEntityIds as string[];
          if (input.sceneNumber !== undefined) updateInput.sceneNumber = input.sceneNumber as string;
          if (input.status !== undefined) updateInput.status = input.status as ProdSceneStatus;
          if (input.equipmentNotes !== undefined) updateInput.equipmentNotes = input.equipmentNotes as string;
          if (input.isSelfShot !== undefined) updateInput.isSelfShot = input.isSelfShot as boolean;

          const scene = await updateScene(sceneId, updateInput);
          if (!scene) {
            return {
              success: false,
              result: null,
              error: `Scene not found with ID: ${sceneId}`,
              shouldContinue: true,
            };
          }

          return {
            success: true,
            result: {
              scene,
              action: 'updated' as const,
            },
            shouldContinue: true,
          };
        } else {
          // Create new scene
          const createInput: CreateProdSceneInput = {
            productionId: input.productionId as string,
            title: input.title as string,
            scheduledDate: input.scheduledDate as string | undefined,
            scheduledTime: input.scheduledTime as string | undefined,
            location: input.location as string | undefined,
            locationDetails: input.locationDetails as string | undefined,
            castEntityIds: input.castEntityIds as string[] | undefined,
            sceneNumber: input.sceneNumber as string | undefined,
            status: input.status as ProdSceneStatus | undefined,
            equipmentNotes: input.equipmentNotes as string | undefined,
            isSelfShot: input.isSelfShot as boolean | undefined,
          };

          const scene = await createScene(createInput);
          return {
            success: true,
            result: {
              scene,
              action: 'created' as const,
            },
            shouldContinue: true,
          };
        }
      }

      case 'assign_crew': {
        const sceneId = input.sceneId as string;
        const crewMemberId = input.crewMemberId as string;
        const role = (input.role as AssignmentRole) || 'ac';
        const notes = (input.notes as string) || null;

        // Use dynamic import to get Supabase client (same pattern as lexi.ts)
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
          throw new Error('Missing Supabase environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: assignment, error: assignError } = await supabase
          .from('scene_assignments')
          .insert({
            scene_id: sceneId,
            crew_member_id: crewMemberId,
            role,
            notes,
            status: 'assigned',
          })
          .select()
          .single();

        if (assignError) {
          throw new Error(`Failed to assign crew: ${assignError.message}`);
        }

        return {
          success: true,
          result: {
            assignment,
          },
          shouldContinue: true,
        };
      }

      case 'mark_contract': {
        const contractId = input.contractId as string;

        const contractUpdate: import('@/types').UpdateCastContractInput = {};
        if (input.contractStatus !== undefined)
          contractUpdate.contractStatus = input.contractStatus as ContractStatus;
        if (input.paymentType !== undefined)
          contractUpdate.paymentType = input.paymentType as PaymentType;
        if (input.shootDone !== undefined)
          contractUpdate.shootDone = input.shootDone as boolean;
        if (input.interviewDone !== undefined)
          contractUpdate.interviewDone = input.interviewDone as boolean;
        if (input.pickupDone !== undefined)
          contractUpdate.pickupDone = input.pickupDone as boolean;
        if (input.paymentDone !== undefined)
          contractUpdate.paymentDone = input.paymentDone as boolean;
        if (input.notes !== undefined)
          contractUpdate.notes = input.notes as string;
        if (input.dailyRate !== undefined)
          contractUpdate.dailyRate = input.dailyRate as number;
        if (input.flatFee !== undefined)
          contractUpdate.flatFee = input.flatFee as number;
        if (input.totalPayment !== undefined)
          contractUpdate.totalPayment = input.totalPayment as number;
        if (input.paidAmount !== undefined)
          contractUpdate.paidAmount = input.paidAmount as number;

        if (Object.keys(contractUpdate).length === 0) {
          return {
            success: false,
            result: null,
            error: 'No fields provided to update. Specify at least one of: contractStatus, paymentType, dailyRate, flatFee, totalPayment, paidAmount, shootDone, interviewDone, pickupDone, paymentDone, notes.',
            shouldContinue: true,
          };
        }

        const contract = await updateCastContract(contractId, contractUpdate);
        if (!contract) {
          return {
            success: false,
            result: null,
            error: `Contract not found with ID: ${contractId}`,
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: {
            contract,
          },
          shouldContinue: true,
        };
      }

      case 'advance_asset_stage': {
        const assetInstanceId = input.assetInstanceId as string;
        const toStageId = input.toStageId as string;
        const reason = input.reason as string | undefined;
        const transitionedByName = (input.transitionedByName as string) || 'Lexi';

        const asset = await advanceStage(assetInstanceId, {
          toStageId,
          reason,
          transitionedByName,
        });

        return {
          success: true,
          result: {
            asset,
            transition: {
              toStageId,
              reason,
              transitionedByName,
            },
          },
          shouldContinue: true,
        };
      }

      case 'update_crew_availability': {
        const crewMemberId = input.crewMemberId as string;
        const date = input.date as string;
        const status = (input.status as AvailabilityStatus) || 'available';
        const notes = input.notes as string | undefined;

        // Check if availability already exists for this crew+date
        const existing = await listCrewAvailability({
          crewMemberId,
          date,
        });

        let availability;
        if (existing.length > 0) {
          // Update existing
          availability = await updateCrewAvailability(existing[0].id, {
            status,
            notes: notes ?? null,
          });
        } else {
          // Create new
          availability = await createCrewAvailability({
            crewMemberId,
            date,
            status,
            notes,
          });
        }

        return {
          success: true,
          result: {
            availability,
          },
          shouldContinue: true,
        };
      }

      case 'create_crew_member': {
        const crewInput: CreateCrewMemberInput = {
          productionId: input.productionId as string,
          name: input.name as string,
          role: input.role as CrewRole,
          contactEmail: input.contactEmail as string | undefined,
          contactPhone: input.contactPhone as string | undefined,
        };

        const newCrewMember = await createCrewMember(crewInput);

        return {
          success: true,
          result: {
            crewMember: newCrewMember,
            action: 'created' as const,
          },
          shouldContinue: true,
        };
      }

      case 'update_crew_member': {
        const crewMemberId = input.crewMemberId as string;
        const crewUpdate: UpdateCrewMemberInput = {};
        if (input.name !== undefined) crewUpdate.name = input.name as string;
        if (input.role !== undefined) crewUpdate.role = input.role as CrewRole;
        if (input.contactEmail !== undefined) crewUpdate.contactEmail = input.contactEmail as string;
        if (input.contactPhone !== undefined) crewUpdate.contactPhone = input.contactPhone as string;
        if (input.isActive !== undefined) crewUpdate.isActive = input.isActive as boolean;

        if (Object.keys(crewUpdate).length === 0) {
          return {
            success: false,
            result: null,
            error: 'No fields provided to update. Specify at least one of: name, role, contactEmail, contactPhone, isActive.',
            shouldContinue: true,
          };
        }

        const updatedCrewMember = await updateCrewMember(crewMemberId, crewUpdate);
        if (!updatedCrewMember) {
          return {
            success: false,
            result: null,
            error: `Crew member not found with ID: ${crewMemberId}`,
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: {
            crewMember: updatedCrewMember,
            action: 'updated' as const,
          },
          shouldContinue: true,
        };
      }

      case 'delete_scene': {
        const sceneId = input.sceneId as string;
        const confirm = input.confirm as boolean;

        if (!confirm) {
          return {
            success: false,
            result: null,
            error: 'Deletion not confirmed. Set confirm=true to delete the scene.',
            shouldContinue: false,
          };
        }

        const existingScene = await getScene(sceneId);
        if (!existingScene) {
          return {
            success: false,
            result: null,
            error: `Scene not found with ID: ${sceneId}`,
            shouldContinue: false,
          };
        }

        const deleted = await deleteScene(sceneId);
        if (!deleted) {
          return {
            success: false,
            result: null,
            error: `Failed to delete scene: ${sceneId}`,
            shouldContinue: false,
          };
        }

        return {
          success: true,
          result: {
            deletedSceneId: sceneId,
            title: existingScene.title,
            action: 'deleted' as const,
          },
          shouldContinue: false,
        };
      }

      case 'create_cast_contract': {
        const contractInput: CreateCastContractInput = {
          productionId: input.productionId as string,
          castEntityId: input.castEntityId as string,
          castName: input.castName as string | undefined,
          contractStatus: input.contractStatus as ContractStatus | undefined,
          paymentType: input.paymentType as PaymentType | undefined,
          dailyRate: input.dailyRate as number | undefined,
          flatFee: input.flatFee as number | undefined,
          totalPayment: input.totalPayment as number | undefined,
          notes: input.notes as string | undefined,
        };

        const newContract = await createCastContract(contractInput);

        return {
          success: true,
          result: {
            contract: newContract,
            action: 'created' as const,
          },
          shouldContinue: true,
        };
      }

      case 'delete_cast_contract': {
        const contractId = input.contractId as string;
        const confirmDelete = input.confirm as boolean;

        if (!confirmDelete) {
          return {
            success: false,
            result: null,
            error: 'Deletion not confirmed. Set confirm=true to delete the contract.',
            shouldContinue: false,
          };
        }

        const existingContract = await getCastContract(contractId);
        if (!existingContract) {
          return {
            success: false,
            result: null,
            error: `Contract not found with ID: ${contractId}`,
            shouldContinue: false,
          };
        }

        const contractDeleted = await deleteCastContract(contractId);
        if (!contractDeleted) {
          return {
            success: false,
            result: null,
            error: `Failed to delete contract: ${contractId}`,
            shouldContinue: false,
          };
        }

        return {
          success: true,
          result: {
            deletedContractId: contractId,
            action: 'deleted' as const,
          },
          shouldContinue: false,
        };
      }

      case 'generate_call_sheet': {
        const productionId = input.productionId as string;
        const date = input.date as string;

        const callSheet = await generateCallSheet(productionId, date);

        return {
          success: true,
          result: {
            callSheet,
          },
          shouldContinue: true,
        };
      }

      case 'get_production_alerts': {
        const productionId = input.productionId as string;

        const alerts = await getAllAlerts(productionId);

        return {
          success: true,
          result: {
            alerts,
            count: alerts.length,
          },
          shouldContinue: true,
        };
      }

      case 'update_production': {
        const productionId = input.productionId as string;
        const prodUpdate: UpdateProductionInput = {};
        if (input.name !== undefined) prodUpdate.name = input.name as string;
        if (input.season !== undefined) prodUpdate.season = input.season as string;
        if (input.status !== undefined) prodUpdate.status = input.status as ProductionStatus;
        if (input.startDate !== undefined) prodUpdate.startDate = input.startDate as string;
        if (input.endDate !== undefined) prodUpdate.endDate = input.endDate as string;
        if (input.notes !== undefined) prodUpdate.notes = input.notes as string;

        if (Object.keys(prodUpdate).length === 0) {
          return {
            success: false,
            result: null,
            error: 'No fields provided to update. Specify at least one of: name, season, status, startDate, endDate, notes.',
            shouldContinue: true,
          };
        }

        const updatedProduction = await updateProduction(productionId, prodUpdate);
        if (!updatedProduction) {
          return {
            success: false,
            result: null,
            error: `Production not found with ID: ${productionId}`,
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: {
            production: updatedProduction,
            action: 'updated' as const,
          },
          shouldContinue: true,
        };
      }

      // ----------------------------------------
      // Document & Email Operations (Lexi)
      // ----------------------------------------
      case 'email_call_sheet': {
        const { emailCallSheet } = await import('./production-email');
        const productionId = input.productionId as string;
        const date = input.date as string;
        const recipients = input.recipients as string[] | undefined;

        const result = await emailCallSheet(productionId, date, recipients);

        return {
          success: result.success,
          result: {
            sentTo: result.sentTo,
            failed: result.failed,
            message: result.success
              ? `Call sheet for ${date} sent to ${result.sentTo.length} recipient${result.sentTo.length !== 1 ? 's' : ''}`
              : result.error,
          },
          error: result.error,
          shouldContinue: false,
        };
      }

      case 'email_production_report': {
        const { emailProductionReport } = await import('./production-email');
        const productionId = input.productionId as string;
        const recipients = input.recipients as string[] | undefined;

        const result = await emailProductionReport(productionId, recipients);

        return {
          success: result.success,
          result: {
            sentTo: result.sentTo,
            failed: result.failed,
            message: result.success
              ? `Production report sent to ${result.sentTo.length} recipient${result.sentTo.length !== 1 ? 's' : ''}`
              : result.error,
          },
          error: result.error,
          shouldContinue: false,
        };
      }

      case 'email_contract_summary': {
        const { emailContractSummary } = await import('./production-email');
        const productionId = input.productionId as string;
        const productionName = input.productionName as string;
        const recipients = input.recipients as string[] | undefined;

        const result = await emailContractSummary(productionId, productionName, recipients);

        return {
          success: result.success,
          result: {
            sentTo: result.sentTo,
            failed: result.failed,
            message: result.success
              ? `Contract summary sent to ${result.sentTo.length} recipient${result.sentTo.length !== 1 ? 's' : ''}`
              : result.error,
          },
          error: result.error,
          shouldContinue: false,
        };
      }

      // ----------------------------------------
      // Asset Instance Management (Gear, Footage, etc.)
      // ----------------------------------------

      case 'create_asset': {
        const productionId = input.productionId as string;
        const assetTypeSlug = input.assetTypeSlug as string;
        const name = input.name as string;
        const description = input.description as string | undefined;
        const ownerName = input.ownerName as string | undefined;
        const location = input.location as string | undefined;
        const castMember = input.castMember as string | undefined;
        const dueDate = input.dueDate as string | undefined;

        // Look up asset type by slug
        const assetTypes = await listAssetTypes(productionId);
        const assetType = assetTypes.items.find((t) => t.slug === assetTypeSlug);
        if (!assetType) {
          return {
            success: false,
            result: null,
            error: `Asset type "${assetTypeSlug}" not found for this production. Available types: ${assetTypes.items.map((t) => t.slug).join(', ')}`,
            shouldContinue: true,
          };
        }

        // Get initial stage
        const stages = await listLifecycleStages(assetType.id);
        const initialStage = stages.find((s) => s.isInitial);
        if (!initialStage) {
          return {
            success: false,
            result: null,
            error: `No initial stage defined for asset type "${assetTypeSlug}"`,
            shouldContinue: true,
          };
        }

        const metadata: Record<string, unknown> = {};
        if (location) metadata.location = location;
        if (castMember) metadata.castMember = castMember;
        // Footage-specific metadata
        if (input.sceneTitle) metadata.sceneTitle = input.sceneTitle;
        if (input.camera) metadata.camera = input.camera;
        if (input.card) metadata.card = input.card;
        if (input.acNotes) metadata.acNotes = input.acNotes;
        if (input.shotDate) metadata.shotDate = input.shotDate;
        // Document-specific metadata
        if (input.documentType) metadata.documentType = input.documentType;

        const asset = await createAssetInstance({
          productionId,
          assetTypeId: assetType.id,
          name,
          description,
          currentStageId: initialStage.id,
          ownerName,
          metadata,
          dueDate,
        });

        return {
          success: true,
          result: {
            asset,
            assetType: assetType.name,
            currentStage: initialStage.name,
            message: `Created ${assetType.name} "${name}"${ownerName ? ` — custody: ${ownerName}` : ''}${location ? ` — location: ${location}` : ''}`,
          },
          shouldContinue: true,
        };
      }

      case 'update_asset': {
        const assetInstanceId = input.assetInstanceId as string;
        const ownerName = input.ownerName as string | undefined;
        const location = input.location as string | undefined;
        const castMember = input.castMember as string | undefined;
        const description = input.description as string | undefined;
        const dueDate = input.dueDate as string | undefined;

        const updateData: Record<string, unknown> = {};
        if (ownerName !== undefined) updateData.ownerName = ownerName;
        if (description !== undefined) updateData.description = description;
        if (dueDate !== undefined) updateData.dueDate = dueDate;

        // Merge metadata with existing — fetch current asset to preserve other keys
        if (location !== undefined || castMember !== undefined) {
          const existing = await getAssetInstance(assetInstanceId);
          const existingMeta = (existing?.metadata as Record<string, unknown>) || {};
          const mergedMeta = { ...existingMeta };
          if (location !== undefined) mergedMeta.location = location;
          if (castMember !== undefined) mergedMeta.castMember = castMember;
          updateData.metadata = mergedMeta;
        }

        const updated = await updateAssetInstance(assetInstanceId, updateData as Parameters<typeof updateAssetInstance>[1]);

        return {
          success: true,
          result: {
            asset: updated,
            message: `Updated "${updated.name}"${ownerName ? ` — custody: ${ownerName}` : ''}${location ? ` — location: ${location}` : ''}`,
          },
          shouldContinue: true,
        };
      }

      case 'list_assets': {
        const productionId = input.productionId as string;
        const assetTypeSlug = input.assetTypeSlug as string | undefined;
        const stageName = input.stageName as string | undefined;

        // Resolve asset type ID from slug if provided
        let assetTypeId: string | undefined;
        const stageCache = new Map<string, string>();

        if (assetTypeSlug) {
          const types = await listAssetTypes(productionId);
          const found = types.items.find((t) => t.slug === assetTypeSlug);
          if (found) assetTypeId = found.id;
        }

        // Pre-fetch stages for the resolved type (reuse for both filtering and enrichment)
        let stageId: string | undefined;
        if (assetTypeId) {
          const stages = await listLifecycleStages(assetTypeId);
          for (const s of stages) {
            stageCache.set(s.id, s.name);
          }
          if (stageName) {
            const found = stages.find((s) => s.name.toLowerCase() === stageName.toLowerCase());
            if (found) stageId = found.id;
          }
        }

        const assets = await listAssetInstances(productionId, {
          assetTypeId,
          stageId,
          limit: 50,
        });

        // Fetch stages for any asset types not yet cached (when listing all types)
        const uncachedTypeIds = new Set<string>();
        for (const asset of assets.items) {
          if (!stageCache.has(asset.currentStageId)) {
            uncachedTypeIds.add(asset.assetTypeId);
          }
        }
        if (uncachedTypeIds.size > 0) {
          const stageFetches = await Promise.all(
            [...uncachedTypeIds].map((typeId) => listLifecycleStages(typeId))
          );
          for (const stages of stageFetches) {
            for (const s of stages) {
              stageCache.set(s.id, s.name);
            }
          }
        }

        const now = Date.now();
        const enriched = assets.items.map((a) => ({
          id: a.id,
          name: a.name,
          stage: stageCache.get(a.currentStageId) || 'Unknown',
          owner: a.ownerName || 'Unassigned',
          location: (a.metadata as Record<string, unknown>)?.location || '',
          castMember: (a.metadata as Record<string, unknown>)?.castMember || '',
          dueDate: a.dueDate || '',
          stageEnteredAt: a.stageEnteredAt,
          hoursInStage: Math.round((now - new Date(a.stageEnteredAt).getTime()) / (1000 * 60 * 60)),
        }));

        return {
          success: true,
          result: {
            assets: enriched,
            total: assets.total,
            message: `${assets.total} asset${assets.total !== 1 ? 's' : ''} found${assetTypeSlug ? ` (${assetTypeSlug})` : ''}${stageName ? ` in stage "${stageName}"` : ''}`,
          },
          shouldContinue: true,
        };
      }

      // ----------------------------------------
      // Production & Administration
      // ----------------------------------------

      case 'create_production': {
        const production = await createProduction({
          universeId: input.universeId as string,
          name: input.name as string,
          season: input.season as string | undefined,
          startDate: input.startDate as string | undefined,
          endDate: input.endDate as string | undefined,
          notes: input.notes as string | undefined,
        });

        return {
          success: true,
          result: {
            production,
            message: `Created production "${production.name}"${production.season ? ` (${production.season})` : ''}`,
          },
          shouldContinue: true,
        };
      }

      case 'list_productions': {
        const result = await listProductions(input.universeId as string);

        return {
          success: true,
          result: {
            productions: result.items.map((p) => ({
              id: p.id,
              name: p.name,
              season: p.season,
              status: p.status,
              startDate: p.startDate,
              endDate: p.endDate,
            })),
            total: result.total,
          },
          shouldContinue: true,
        };
      }

      case 'delete_asset': {
        const deleted = await deleteAssetInstance(input.assetInstanceId as string);

        return {
          success: deleted,
          result: { deleted, message: deleted ? 'Asset deleted.' : 'Asset not found.' },
          error: deleted ? undefined : 'Asset not found',
          shouldContinue: false,
        };
      }

      case 'generate_registration_code': {
        const code = await generateRegistrationCode(input.crewMemberId as string);

        if (!code) {
          return {
            success: false,
            result: null,
            error: 'Failed to generate registration code',
            shouldContinue: false,
          };
        }

        return {
          success: true,
          result: {
            code,
            message: `Registration code: ${code} — crew member uses /start ${code} in Telegram to connect.`,
          },
          shouldContinue: false,
        };
      }

      // ----------------------------------------
      // Export Operations (Lexi)
      // ----------------------------------------

      case 'export_csv': {
        const productionId = input.productionId as string;
        const exportType = input.type as string;
        const date = input.date as string | undefined;

        if (exportType === 'callsheet' && !date) {
          return {
            success: false,
            result: null,
            error: 'Date is required for callsheet export. Provide a date in YYYY-MM-DD format.',
            shouldContinue: true,
          };
        }

        // Build the download URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'https://lexicon.id8labs.app';
        const params = new URLSearchParams({ productionId, type: exportType });
        if (date) params.set('date', date);
        const downloadUrl = `${baseUrl}/api/export?${params.toString()}`;

        return {
          success: true,
          result: {
            downloadUrl,
            type: exportType,
            message: `CSV export ready. Download: ${downloadUrl}`,
          },
          shouldContinue: false,
        };
      }

      // ----------------------------------------
      // Episode Management (Lexi)
      // ----------------------------------------

      case 'list_episodes': {
        const productionId = input.productionId as string;
        const status = input.status as EpisodeStatus | undefined;

        const result = await listEpisodes(productionId, { status });

        return {
          success: true,
          result: {
            episodes: result.items.map((e) => ({
              id: e.id,
              episodeNumber: e.episodeNumber,
              title: e.title,
              airDate: e.airDate,
              status: e.status,
            })),
            total: result.total,
          },
          shouldContinue: true,
        };
      }

      case 'create_episode': {
        const episodeInput: CreateEpisodeInput = {
          productionId: input.productionId as string,
          episodeNumber: input.episodeNumber as number,
          title: input.title as string | undefined,
          description: input.description as string | undefined,
          airDate: input.airDate as string | undefined,
          status: input.status as EpisodeStatus | undefined,
        };

        const newEpisode = await createEpisode(episodeInput);

        return {
          success: true,
          result: {
            episode: newEpisode,
            action: 'created' as const,
          },
          shouldContinue: true,
        };
      }

      case 'update_episode': {
        const episodeId = input.episodeId as string;
        const episodeUpdate: UpdateEpisodeInput = {};
        if (input.title !== undefined) episodeUpdate.title = input.title as string;
        if (input.description !== undefined) episodeUpdate.description = input.description as string;
        if (input.airDate !== undefined) episodeUpdate.airDate = input.airDate as string;
        if (input.status !== undefined) episodeUpdate.status = input.status as EpisodeStatus;

        if (Object.keys(episodeUpdate).length === 0) {
          return {
            success: false,
            result: null,
            error: 'No fields provided to update.',
            shouldContinue: true,
          };
        }

        const updatedEpisode = await updateEpisode(episodeId, episodeUpdate);
        if (!updatedEpisode) {
          return {
            success: false,
            result: null,
            error: `Episode not found with ID: ${episodeId}`,
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: {
            episode: updatedEpisode,
            action: 'updated' as const,
          },
          shouldContinue: true,
        };
      }

      case 'assign_scene_to_episode': {
        const sceneId = input.sceneId as string;
        const episodeId = (input.episodeId as string | null) || null;

        const scene = await updateScene(sceneId, { episodeId });
        if (!scene) {
          return {
            success: false,
            result: null,
            error: `Scene not found with ID: ${sceneId}`,
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: {
            scene,
            episodeId,
            action: episodeId ? 'linked' : 'unlinked',
          },
          shouldContinue: true,
        };
      }

      // ----------------------------------------
      // Crew & Assignment Discovery (Lexi)
      // ----------------------------------------

      case 'list_crew': {
        const productionId = input.productionId as string;
        const role = input.role as CrewRole | undefined;
        const isActive = input.isActive !== false ? true : undefined; // default true

        const result = await listCrewMembers(productionId, { role, isActive });

        return {
          success: true,
          result: {
            crew: result.items.map((c) => ({
              id: c.id,
              name: c.name,
              role: c.role,
              contactEmail: c.contactEmail,
              contactPhone: c.contactPhone,
              isActive: c.isActive,
            })),
            total: result.total,
          },
          shouldContinue: true,
        };
      }

      case 'get_crew_member': {
        const crewMemberId = input.crewMemberId as string;
        const crew = await getCrewMember(crewMemberId);

        if (!crew) {
          return {
            success: false,
            result: null,
            error: `Crew member not found with ID: ${crewMemberId}`,
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: {
            crewMember: {
              id: crew.id,
              name: crew.name,
              role: crew.role,
              contactEmail: crew.contactEmail,
              contactPhone: crew.contactPhone,
              isActive: crew.isActive,
              createdAt: crew.createdAt,
            },
          },
          shouldContinue: true,
        };
      }

      case 'delete_crew_member': {
        const crewMemberId = input.crewMemberId as string;
        const confirmDeletion = input.confirm as boolean;

        if (!confirmDeletion) {
          return {
            success: false,
            result: null,
            error: 'Deletion not confirmed. Set confirm=true to delete the crew member.',
            shouldContinue: false,
          };
        }

        const existingCrew = await getCrewMember(crewMemberId);
        if (!existingCrew) {
          return {
            success: false,
            result: null,
            error: `Crew member not found with ID: ${crewMemberId}`,
            shouldContinue: false,
          };
        }

        const crewDeleted = await deleteCrewMember(crewMemberId);
        if (!crewDeleted) {
          return {
            success: false,
            result: null,
            error: `Failed to delete crew member: ${crewMemberId}`,
            shouldContinue: false,
          };
        }

        return {
          success: true,
          result: {
            deletedCrewMemberId: crewMemberId,
            name: existingCrew.name,
            action: 'deleted' as const,
          },
          shouldContinue: false,
        };
      }

      case 'remove_crew_assignment': {
        const assignmentId = input.assignmentId as string;
        const confirmRemoval = input.confirm as boolean;

        if (!confirmRemoval) {
          return {
            success: false,
            result: null,
            error: 'Removal not confirmed. Set confirm=true to remove the assignment.',
            shouldContinue: false,
          };
        }

        const supabase = getServiceSupabase();

        // Get assignment details before deleting
        const { data: existing } = await supabase
          .from('scene_assignments')
          .select('*, crew_members(name)')
          .eq('id', assignmentId)
          .single();

        if (!existing) {
          return {
            success: false,
            result: null,
            error: `Assignment not found with ID: ${assignmentId}`,
            shouldContinue: false,
          };
        }

        const { error: deleteError } = await supabase
          .from('scene_assignments')
          .delete()
          .eq('id', assignmentId);

        if (deleteError) {
          throw new Error(`Failed to remove assignment: ${deleteError.message}`);
        }

        return {
          success: true,
          result: {
            removedAssignmentId: assignmentId,
            crewMemberName: (existing.crew_members as { name: string } | null)?.name || 'Unknown',
            action: 'removed' as const,
          },
          shouldContinue: true,
        };
      }

      case 'list_scene_assignments': {
        const sceneId = input.sceneId as string;

        const supabase = getServiceSupabase();
        const { data: assignments, error: listError } = await supabase
          .from('scene_assignments')
          .select('*, crew_members(id, name, role, contact_email)')
          .eq('scene_id', sceneId)
          .order('created_at', { ascending: true });

        if (listError) {
          throw new Error(`Failed to list assignments: ${listError.message}`);
        }

        return {
          success: true,
          result: {
            assignments: (assignments || []).map((a) => ({
              assignmentId: a.id,
              crewMemberId: a.crew_member_id,
              crewMemberName: (a.crew_members as { name: string } | null)?.name || 'Unknown',
              crewMemberRole: (a.crew_members as { role: string } | null)?.role || 'Unknown',
              assignmentRole: a.role,
              status: a.status,
              notes: a.notes,
            })),
            count: (assignments || []).length,
          },
          shouldContinue: true,
        };
      }

      case 'get_scene': {
        const sceneId = input.sceneId as string;
        const scene = await getScene(sceneId);

        if (!scene) {
          return {
            success: false,
            result: null,
            error: `Scene not found with ID: ${sceneId}`,
            shouldContinue: true,
          };
        }

        return {
          success: true,
          result: { scene },
          shouldContinue: true,
        };
      }

      case 'find_available_crew': {
        const productionId = input.productionId as string;
        const date = input.date as string;
        const roleFilter = input.role as CrewRole | undefined;

        // Get all active crew for this production (single fetch for both roster + availability)
        const allCrew = await listCrewMembers(productionId, {
          isActive: true,
          role: roleFilter,
          limit: 100,
        });

        // Get only the availability records for the date (skip crew re-fetch by querying directly)
        const crewIds = allCrew.items.map((c) => c.id);
        const supabase = getServiceSupabase();
        const { data: availData } = crewIds.length > 0
          ? await supabase
              .from('crew_availability')
              .select('crew_member_id, status')
              .in('crew_member_id', crewIds)
              .eq('date', date)
          : { data: [] };

        // Build a lookup of crew who have an explicit non-available status
        const unavailableIds = new Set<string>();
        for (const record of availData || []) {
          if (record.status && record.status !== 'available') {
            unavailableIds.add(record.crew_member_id as string);
          }
        }

        // Crew are available if: no record (implicit available) OR explicit "available"
        const availableCrew = allCrew.items.filter(
          (c) => !unavailableIds.has(c.id)
        );

        return {
          success: true,
          result: {
            date,
            availableCrew: availableCrew.map((c) => ({
              crewMemberId: c.id,
              name: c.name,
              role: c.role,
              contactEmail: c.contactEmail,
            })),
            count: availableCrew.length,
            totalCrew: allCrew.total,
          },
          shouldContinue: true,
        };
      }

      case 'batch_update_availability': {
        const crewMemberId = input.crewMemberId as string;
        const dates = input.dates as string[];
        const status = (input.status as AvailabilityStatus) || 'available';
        const notes = input.notes as string | undefined;

        // Single fetch: get all existing availability for this crew member across all requested dates
        const allExisting = await listCrewAvailability({ crewMemberId });
        const existingByDate = new Map(
          allExisting
            .filter((a) => dates.includes(a.date))
            .map((a) => [a.date, a.id])
        );

        // Parallel mutations
        const mutations = dates.map(async (date): Promise<{ date: string; action: string }> => {
          const existingId = existingByDate.get(date);
          if (existingId) {
            await updateCrewAvailability(existingId, {
              status,
              notes: notes ?? null,
            });
            return { date, action: 'updated' };
          } else {
            await createCrewAvailability({
              crewMemberId,
              date,
              status,
              notes,
            });
            return { date, action: 'created' };
          }
        });

        const results = await Promise.all(mutations);

        return {
          success: true,
          result: {
            crewMemberId,
            status,
            dates: results,
            count: results.length,
            message: `Set ${results.length} date${results.length !== 1 ? 's' : ''} to "${status}"`,
          },
          shouldContinue: true,
        };
      }

      default:
        return {
          success: false,
          result: null,
          error: `Unknown tool: ${toolName}`,
          shouldContinue: true,
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
