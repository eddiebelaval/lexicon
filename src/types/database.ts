/**
 * ID8Labs Creator Core - Unified Database Types
 *
 * TypeScript type definitions for the unified Supabase schema.
 * These types are shared across all ID8Labs tools:
 *   - Lexicon (knowledge graphs)
 *   - ID8Composer (content generation)
 *   - Scout (market validation)
 *   - MILO (desktop productivity)
 *
 * Generated: 2026-01-08
 */

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * JSON type for flexible data storage
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * UUID string type
 */
export type UUID = string;

/**
 * ISO timestamp string
 */
export type Timestamp = string;

// ============================================================================
// ENUM TYPES
// ============================================================================

/**
 * User subscription tiers for billing
 */
export type SubscriptionTier = 'free' | 'creator' | 'professional' | 'studio';

/**
 * Entity types for Lexicon knowledge graph
 */
export type EntityType =
  | 'character'
  | 'location'
  | 'event'
  | 'object'
  | 'faction'
  | 'concept'
  | 'timeline';

/**
 * Content types for Composer
 */
export type ContentType =
  | 'article'
  | 'blog_post'
  | 'social_post'
  | 'email'
  | 'script'
  | 'story'
  | 'documentation'
  | 'marketing_copy'
  | 'custom';

/**
 * Content workflow status
 */
export type ContentStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'published'
  | 'archived';

/**
 * Research status for Scout
 */
export type ResearchStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Scout AI agent types
 */
export type ScoutAgentType =
  | 'market_analyst'
  | 'competitor_tracker'
  | 'trend_watcher';

/**
 * Task priority for MILO
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Task status for MILO
 */
export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'cancelled';

/**
 * Activity type for unified activity log
 */
export type ActivityType =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'share'
  | 'export'
  | 'import'
  | 'generate'
  | 'research'
  | 'sync';

/**
 * Tool identifier for the ecosystem
 */
export type ToolType = 'lexicon' | 'composer' | 'scout' | 'milo';

// ============================================================================
// CORE TABLE TYPES
// ============================================================================

/**
 * User profile - extends Supabase auth.users
 */
export interface UserProfile {
  id: UUID;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: Timestamp | null;

  // Usage quotas
  monthly_ai_tokens_used: number;
  monthly_ai_tokens_limit: number;
  monthly_storage_used_mb: number;
  monthly_storage_limit_mb: number;

  // Feature flags
  beta_features_enabled: boolean;

  // Preferences
  preferences: UserPreferences;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
  last_active_at: Timestamp | null;
  deleted_at: Timestamp | null;
}

/**
 * User preferences stored in JSONB
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  default_project_id?: UUID;
  notifications?: {
    email?: boolean;
    push?: boolean;
    research_complete?: boolean;
    task_reminders?: boolean;
  };
  editor?: {
    font_size?: number;
    font_family?: string;
    auto_save?: boolean;
  };
  [key: string]: Json | undefined;
}

/**
 * Project - central organizing concept across all tools
 */
export interface Project {
  id: UUID;
  owner_id: UUID;

  name: string;
  description: string | null;
  slug: string;

  // Project type hints
  is_universe: boolean;
  is_campaign: boolean;
  is_research: boolean;

  // Visibility
  is_public: boolean;
  is_archived: boolean;

  // Settings
  settings: ProjectSettings;

  // Cached counts
  entity_count: number;
  content_count: number;
  research_count: number;
  task_count: number;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

/**
 * Project settings stored in JSONB
 */
export interface ProjectSettings {
  color?: string;
  icon?: string;
  default_content_type?: ContentType;
  ai_context?: string;
  [key: string]: Json | undefined;
}

/**
 * Project collaborator - multi-user access
 */
export interface ProjectCollaborator {
  id: UUID;
  project_id: UUID;
  user_id: UUID;

  // Permissions
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_manage: boolean;

  // Invitation tracking
  invited_by: UUID | null;
  invited_at: Timestamp;
  accepted_at: Timestamp | null;

  created_at: Timestamp;
}

/**
 * Tag for cross-tool tagging system
 */
export interface Tag {
  id: UUID;
  owner_id: UUID;
  name: string;
  color: string;
  created_at: Timestamp;
}

// ============================================================================
// LEXICON TABLE TYPES
// ============================================================================

/**
 * Universe - Lexicon's creative worlds
 */
export interface Universe {
  id: UUID;
  project_id: UUID;

  // Metadata
  genre: string | null;
  setting_period: string | null;

  // Neo4j reference
  neo4j_database: string | null;

  // Stats (synced from Neo4j)
  character_count: number;
  location_count: number;
  event_count: number;
  object_count: number;
  faction_count: number;
  relationship_count: number;

  // Settings
  default_entity_type: EntityType;
  ai_context_prompt: string | null;

  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Entity metadata - supplementary data for Neo4j entities
 */
export interface EntityMetadata {
  id: UUID; // Same as Neo4j entity UUID
  universe_id: UUID;
  entity_type: EntityType;

  // Permissions
  is_locked: boolean;
  locked_by: UUID | null;
  locked_at: Timestamp | null;

  // AI features
  ai_generated: boolean;
  ai_generation_prompt: string | null;

  // Version tracking
  version: number;

  // Source tracking
  imported_from: string | null;

  created_at: Timestamp;
  updated_at: Timestamp;
  created_by: UUID | null;
  updated_by: UUID | null;
}

/**
 * Universe document - rich documents attached to universes
 */
export interface UniverseDocument {
  id: UUID;
  universe_id: UUID;

  title: string;
  content: string | null;
  content_type: string;

  // Organization
  parent_id: UUID | null;
  sort_order: number;

  // Linked entities
  linked_entities: UUID[];

  created_at: Timestamp;
  updated_at: Timestamp;
  created_by: UUID | null;
  updated_by: UUID | null;
}

// ============================================================================
// COMPOSER TABLE TYPES
// ============================================================================

/**
 * Content template - reusable content structures
 */
export interface ContentTemplate {
  id: UUID;
  owner_id: UUID;
  project_id: UUID | null;

  name: string;
  description: string | null;
  content_type: ContentType;

  // Template structure
  template_body: string;
  variables: TemplateVariable[];

  // AI settings
  ai_prompt: string | null;
  ai_model: string;
  ai_temperature: number;

  // Usage
  usage_count: number;
  is_public: boolean;

  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Template variable definition
 */
export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'select' | 'entity';
  description?: string;
  default_value?: string;
  options?: string[]; // For select type
  required?: boolean;
}

/**
 * Content item - generated content piece
 */
export interface ContentItem {
  id: UUID;
  project_id: UUID;
  template_id: UUID | null;

  title: string;
  content_type: ContentType;
  status: ContentStatus;

  // Content body
  body: string | null;
  body_html: string | null;

  // Generation context
  variables_used: Record<string, Json> | null;
  ai_generation_id: string | null;

  // Lexicon integration
  universe_id: UUID | null;
  linked_entities: UUID[];

  // Publishing
  published_at: Timestamp | null;
  published_url: string | null;

  // Stats
  word_count: number;

  // Scheduling
  scheduled_publish_at: Timestamp | null;

  created_at: Timestamp;
  updated_at: Timestamp;
  created_by: UUID | null;
  updated_by: UUID | null;
}

/**
 * Content version - version history
 */
export interface ContentVersion {
  id: UUID;
  content_id: UUID;
  version_number: number;
  body: string;
  change_summary: string | null;
  changed_by: UUID | null;
  created_at: Timestamp;
}

/**
 * Generation queue - batch content jobs
 */
export interface GenerationQueueItem {
  id: UUID;
  project_id: UUID;
  template_id: UUID | null;
  batch_config: GenerationBatchConfig;

  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_items: number;
  completed_items: number;
  failed_items: number;

  // Results
  result_content_ids: UUID[];
  error_log: GenerationError[] | null;

  // Timing
  started_at: Timestamp | null;
  completed_at: Timestamp | null;

  created_at: Timestamp;
  created_by: UUID | null;
}

/**
 * Batch generation configuration
 */
export interface GenerationBatchConfig {
  items: Record<string, Json>[];
  options?: {
    parallel?: boolean;
    stop_on_error?: boolean;
  };
}

/**
 * Generation error log entry
 */
export interface GenerationError {
  index: number;
  message: string;
  timestamp: Timestamp;
}

// ============================================================================
// SCOUT TABLE TYPES
// ============================================================================

/**
 * Research project - Scout research initiative
 */
export interface ResearchProject {
  id: UUID;
  project_id: UUID;

  name: string;
  description: string | null;

  // Research focus
  target_market: string | null;
  target_audience: string | null;
  keywords: string[];

  // Status
  status: ResearchStatus;

  // Agent configuration
  enabled_agents: ScoutAgentType[];
  agent_config: AgentConfig;

  // Schedule
  is_recurring: boolean;
  recurring_cron: string | null;
  last_run_at: Timestamp | null;
  next_run_at: Timestamp | null;

  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Agent configuration settings
 */
export interface AgentConfig {
  market_analyst?: {
    depth?: 'shallow' | 'standard' | 'deep';
    sources?: string[];
  };
  competitor_tracker?: {
    track_pricing?: boolean;
    track_features?: boolean;
    alert_threshold?: number;
  };
  trend_watcher?: {
    platforms?: string[];
    sentiment_analysis?: boolean;
  };
  [key: string]: Json | undefined;
}

/**
 * Research run - individual research execution
 */
export interface ResearchRun {
  id: UUID;
  research_project_id: UUID;

  status: ResearchStatus;
  started_at: Timestamp | null;
  completed_at: Timestamp | null;

  // Trigger
  triggered_by: 'manual' | 'schedule' | 'webhook';
  triggered_by_user: UUID | null;

  // Agent results
  agent_results: Record<ScoutAgentType, AgentResult>;

  // Summary
  summary: string | null;
  key_insights: KeyInsight[];

  error_message: string | null;

  created_at: Timestamp;
}

/**
 * Agent execution result
 */
export interface AgentResult {
  status: 'success' | 'partial' | 'failed';
  findings_count: number;
  execution_time_ms: number;
  error?: string;
}

/**
 * Key insight from research
 */
export interface KeyInsight {
  type: 'opportunity' | 'threat' | 'trend' | 'competitor';
  title: string;
  description: string;
  confidence: number;
  action_recommended?: string;
}

/**
 * Research finding - individual data point
 */
export interface ResearchFinding {
  id: UUID;
  research_run_id: UUID;

  agent_type: ScoutAgentType;
  finding_type: string;
  title: string;
  description: string | null;

  // Source
  source_url: string | null;
  source_name: string | null;

  // Data payload
  data: FindingData;

  // Scoring
  relevance_score: number | null;
  confidence_score: number | null;

  // User feedback
  is_bookmarked: boolean;
  is_dismissed: boolean;

  created_at: Timestamp;
}

/**
 * Finding data payload
 */
export interface FindingData {
  [key: string]: Json | undefined;
}

/**
 * Competitor - tracked competitor entity
 */
export interface Competitor {
  id: UUID;
  project_id: UUID;

  name: string;
  website: string | null;
  description: string | null;

  // Tracking config
  social_handles: SocialHandles;
  keywords_to_track: string[];

  // Latest intel
  latest_intel: CompetitorIntel;
  intel_updated_at: Timestamp | null;

  notes: string | null;
  is_active: boolean;

  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Social media handles
 */
export interface SocialHandles {
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  [key: string]: string | undefined;
}

/**
 * Competitor intelligence data
 */
export interface CompetitorIntel {
  pricing?: {
    tiers?: { name: string; price: number }[];
    last_change?: Timestamp;
  };
  features?: string[];
  traffic_estimate?: number;
  social_followers?: Record<string, number>;
  [key: string]: Json | undefined;
}

// ============================================================================
// MILO TABLE TYPES
// ============================================================================

/**
 * Goal - high-level objective
 */
export interface Goal {
  id: UUID;
  user_id: UUID;
  project_id: UUID | null;

  title: string;
  description: string | null;
  goal_type: 'personal' | 'project' | 'team';

  // Progress
  target_value: number | null;
  current_value: number;
  unit: string | null;

  // Timeframe
  start_date: string | null; // DATE
  target_date: string | null; // DATE

  // Status
  is_completed: boolean;
  completed_at: Timestamp | null;

  // MILO sync
  milo_id: string | null;
  last_synced_at: Timestamp | null;

  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Task - individual work item
 */
export interface Task {
  id: UUID;
  user_id: UUID;
  project_id: UUID | null;
  goal_id: UUID | null;

  title: string;
  description: string | null;

  // Metadata
  priority: TaskPriority;
  status: TaskStatus;

  // Time tracking
  estimated_minutes: number | null;
  actual_minutes: number | null;

  // Scheduling
  due_date: Timestamp | null;
  reminder_at: Timestamp | null;

  // Recurrence
  is_recurring: boolean;
  recurrence_pattern: string | null; // RRULE format

  // Completion
  completed_at: Timestamp | null;

  // Subtasks
  parent_task_id: UUID | null;
  sort_order: number;

  // Context
  context_app: string | null;
  context_url: string | null;

  // MILO sync
  milo_id: string | null;
  last_synced_at: Timestamp | null;

  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Focus session - Pomodoro/deep work tracking
 */
export interface FocusSession {
  id: UUID;
  user_id: UUID;
  task_id: UUID | null;
  project_id: UUID | null;

  session_type: 'focus' | 'break' | 'meeting';
  duration_minutes: number;
  description: string | null;

  // Timing
  started_at: Timestamp;
  ended_at: Timestamp | null;

  // Quality metrics
  interruption_count: number;
  focus_score: number | null;

  // MILO sync
  milo_id: string | null;
  last_synced_at: Timestamp | null;

  created_at: Timestamp;
}

/**
 * Activity log - app/website usage from MILO
 */
export interface ActivityLogEntry {
  id: UUID;
  user_id: UUID;

  app_name: string;
  window_title: string | null;
  url: string | null;

  // Timing
  started_at: Timestamp;
  ended_at: Timestamp;
  duration_seconds: number;

  // Categorization
  category: string | null;
  is_productive: boolean | null;

  // MILO sync
  milo_id: string | null;
  last_synced_at: Timestamp | null;

  created_at: Timestamp;
}

// ============================================================================
// UNIFIED TABLE TYPES
// ============================================================================

/**
 * Activity feed entry - cross-tool activity log
 */
export interface ActivityFeedEntry {
  id: UUID;
  user_id: UUID;
  project_id: UUID | null;

  tool: ToolType;
  activity_type: ActivityType;

  entity_type: string;
  entity_id: UUID;
  entity_name: string | null;

  description: string | null;
  metadata: Record<string, Json>;

  is_public: boolean;

  created_at: Timestamp;
}

/**
 * Cross reference - links between entities across tools
 */
export interface CrossReference {
  id: UUID;

  source_tool: ToolType;
  source_entity_type: string;
  source_entity_id: UUID;

  target_tool: ToolType;
  target_entity_type: string;
  target_entity_id: UUID;

  reference_type: string;
  metadata: Record<string, Json>;

  created_at: Timestamp;
  created_by: UUID | null;
}

/**
 * Tagging - junction table for tags
 */
export interface Tagging {
  id: UUID;
  tag_id: UUID;
  taggable_type: string;
  taggable_id: UUID;
  created_at: Timestamp;
}

/**
 * API key - for MCP and external integrations
 */
export interface ApiKey {
  id: UUID;
  user_id: UUID;

  name: string;
  key_hash: string;
  key_prefix: string;

  // Permissions
  scopes: ApiScope[];
  allowed_tools: ToolType[];

  // Usage
  last_used_at: Timestamp | null;
  usage_count: number;

  // Expiration
  expires_at: Timestamp | null;
  is_revoked: boolean;
  revoked_at: Timestamp | null;

  created_at: Timestamp;
}

/**
 * API permission scope
 */
export type ApiScope =
  | 'read'
  | 'write'
  | 'delete'
  | 'admin'
  | 'milo:sync'
  | 'composer:generate'
  | 'scout:research';

/**
 * Webhook - for real-time integrations
 */
export interface Webhook {
  id: UUID;
  user_id: UUID;
  project_id: UUID | null;

  name: string;
  url: string;
  secret: string;

  events: WebhookEvent[];
  is_active: boolean;

  // Stats
  success_count: number;
  failure_count: number;
  last_triggered_at: Timestamp | null;
  last_status_code: number | null;

  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Webhook event types
 */
export type WebhookEvent =
  | 'content.created'
  | 'content.updated'
  | 'content.published'
  | 'task.created'
  | 'task.completed'
  | 'research.completed'
  | 'entity.created'
  | 'entity.updated';

// ============================================================================
// SUPABASE DATABASE TYPE (for client initialization)
// ============================================================================

/**
 * Complete Supabase Database type for use with supabase-js client
 */
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'> & {
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: Omit<
          Project,
          | 'id'
          | 'created_at'
          | 'updated_at'
          | 'entity_count'
          | 'content_count'
          | 'research_count'
          | 'task_count'
        > & {
          id?: UUID;
          created_at?: Timestamp;
          updated_at?: Timestamp;
          entity_count?: number;
          content_count?: number;
          research_count?: number;
          task_count?: number;
        };
        Update: Partial<Omit<Project, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'projects_owner_id_fkey';
            columns: ['owner_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      project_collaborators: {
        Row: ProjectCollaborator;
        Insert: Omit<ProjectCollaborator, 'id' | 'created_at' | 'invited_at'> & {
          id?: UUID;
          created_at?: Timestamp;
          invited_at?: Timestamp;
        };
        Update: Partial<Omit<ProjectCollaborator, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'project_collaborators_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_collaborators_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, 'id' | 'created_at'> & {
          id?: UUID;
          created_at?: Timestamp;
        };
        Update: Partial<Omit<Tag, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'tags_owner_id_fkey';
            columns: ['owner_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      universes: {
        Row: Universe;
        Insert: Omit<Universe, 'id' | 'created_at' | 'updated_at'> & {
          id?: UUID;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<Universe, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'universes_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      entity_metadata: {
        Row: EntityMetadata;
        Insert: EntityMetadata;
        Update: Partial<Omit<EntityMetadata, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'entity_metadata_universe_id_fkey';
            columns: ['universe_id'];
            referencedRelation: 'universes';
            referencedColumns: ['id'];
          },
        ];
      };
      universe_documents: {
        Row: UniverseDocument;
        Insert: Omit<UniverseDocument, 'id' | 'created_at' | 'updated_at'> & {
          id?: UUID;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<UniverseDocument, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'universe_documents_universe_id_fkey';
            columns: ['universe_id'];
            referencedRelation: 'universes';
            referencedColumns: ['id'];
          },
        ];
      };
      content_templates: {
        Row: ContentTemplate;
        Insert: Omit<ContentTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'> & {
          id?: UUID;
          created_at?: Timestamp;
          updated_at?: Timestamp;
          usage_count?: number;
        };
        Update: Partial<Omit<ContentTemplate, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'content_templates_owner_id_fkey';
            columns: ['owner_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      content_items: {
        Row: ContentItem;
        Insert: Omit<ContentItem, 'id' | 'created_at' | 'updated_at' | 'word_count'> & {
          id?: UUID;
          created_at?: Timestamp;
          updated_at?: Timestamp;
          word_count?: number;
        };
        Update: Partial<Omit<ContentItem, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'content_items_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'content_items_template_id_fkey';
            columns: ['template_id'];
            referencedRelation: 'content_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      content_versions: {
        Row: ContentVersion;
        Insert: Omit<ContentVersion, 'id' | 'created_at'> & {
          id?: UUID;
          created_at?: Timestamp;
        };
        Update: Partial<Omit<ContentVersion, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'content_versions_content_id_fkey';
            columns: ['content_id'];
            referencedRelation: 'content_items';
            referencedColumns: ['id'];
          },
        ];
      };
      generation_queue: {
        Row: GenerationQueueItem;
        Insert: Omit<
          GenerationQueueItem,
          | 'id'
          | 'created_at'
          | 'total_items'
          | 'completed_items'
          | 'failed_items'
          | 'result_content_ids'
        > & {
          id?: UUID;
          created_at?: Timestamp;
          total_items?: number;
          completed_items?: number;
          failed_items?: number;
          result_content_ids?: UUID[];
        };
        Update: Partial<Omit<GenerationQueueItem, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'generation_queue_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      research_projects: {
        Row: ResearchProject;
        Insert: Omit<ResearchProject, 'id' | 'created_at' | 'updated_at'> & {
          id?: UUID;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<ResearchProject, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'research_projects_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      research_runs: {
        Row: ResearchRun;
        Insert: Omit<ResearchRun, 'id' | 'created_at'> & {
          id?: UUID;
          created_at?: Timestamp;
        };
        Update: Partial<Omit<ResearchRun, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'research_runs_research_project_id_fkey';
            columns: ['research_project_id'];
            referencedRelation: 'research_projects';
            referencedColumns: ['id'];
          },
        ];
      };
      research_findings: {
        Row: ResearchFinding;
        Insert: Omit<ResearchFinding, 'id' | 'created_at'> & {
          id?: UUID;
          created_at?: Timestamp;
        };
        Update: Partial<Omit<ResearchFinding, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'research_findings_research_run_id_fkey';
            columns: ['research_run_id'];
            referencedRelation: 'research_runs';
            referencedColumns: ['id'];
          },
        ];
      };
      competitors: {
        Row: Competitor;
        Insert: Omit<Competitor, 'id' | 'created_at' | 'updated_at'> & {
          id?: UUID;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<Competitor, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'competitors_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      goals: {
        Row: Goal;
        Insert: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'current_value'> & {
          id?: UUID;
          created_at?: Timestamp;
          updated_at?: Timestamp;
          current_value?: number;
        };
        Update: Partial<Omit<Goal, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'goals_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'goals_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'sort_order'> & {
          id?: UUID;
          created_at?: Timestamp;
          updated_at?: Timestamp;
          sort_order?: number;
        };
        Update: Partial<Omit<Task, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'tasks_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_goal_id_fkey';
            columns: ['goal_id'];
            referencedRelation: 'goals';
            referencedColumns: ['id'];
          },
        ];
      };
      focus_sessions: {
        Row: FocusSession;
        Insert: Omit<FocusSession, 'id' | 'created_at' | 'interruption_count'> & {
          id?: UUID;
          created_at?: Timestamp;
          interruption_count?: number;
        };
        Update: Partial<Omit<FocusSession, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'focus_sessions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      activity_log: {
        Row: ActivityLogEntry;
        Insert: Omit<ActivityLogEntry, 'id' | 'created_at'> & {
          id?: UUID;
          created_at?: Timestamp;
        };
        Update: Partial<Omit<ActivityLogEntry, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'activity_log_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      activity_feed: {
        Row: ActivityFeedEntry;
        Insert: Omit<ActivityFeedEntry, 'id' | 'created_at'> & {
          id?: UUID;
          created_at?: Timestamp;
        };
        Update: Partial<Omit<ActivityFeedEntry, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'activity_feed_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activity_feed_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      cross_references: {
        Row: CrossReference;
        Insert: Omit<CrossReference, 'id' | 'created_at'> & {
          id?: UUID;
          created_at?: Timestamp;
        };
        Update: Partial<Omit<CrossReference, 'id' | 'created_at'>>;
        Relationships: [];
      };
      taggings: {
        Row: Tagging;
        Insert: Omit<Tagging, 'id' | 'created_at'> & {
          id?: UUID;
          created_at?: Timestamp;
        };
        Update: Partial<Omit<Tagging, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'taggings_tag_id_fkey';
            columns: ['tag_id'];
            referencedRelation: 'tags';
            referencedColumns: ['id'];
          },
        ];
      };
      api_keys: {
        Row: ApiKey;
        Insert: Omit<ApiKey, 'id' | 'created_at' | 'usage_count'> & {
          id?: UUID;
          created_at?: Timestamp;
          usage_count?: number;
        };
        Update: Partial<Omit<ApiKey, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'api_keys_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      webhooks: {
        Row: Webhook;
        Insert: Omit<
          Webhook,
          'id' | 'created_at' | 'updated_at' | 'success_count' | 'failure_count'
        > & {
          id?: UUID;
          created_at?: Timestamp;
          updated_at?: Timestamp;
          success_count?: number;
          failure_count?: number;
        };
        Update: Partial<Omit<Webhook, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'webhooks_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_tier: SubscriptionTier;
      entity_type: EntityType;
      content_type: ContentType;
      content_status: ContentStatus;
      research_status: ResearchStatus;
      scout_agent_type: ScoutAgentType;
      task_priority: TaskPriority;
      task_status: TaskStatus;
      activity_type: ActivityType;
      tool_type: ToolType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Helper to extract Row type from a table
 */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * Helper to extract Insert type from a table
 */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/**
 * Helper to extract Update type from a table
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// ============================================================================
// MILO MCP BRIDGE TYPES
// ============================================================================

/**
 * MILO sync request for pushing data to Supabase
 */
export interface MiloSyncRequest {
  sync_type: 'full' | 'incremental';
  last_sync_at: Timestamp | null;
  data: {
    tasks?: MiloTaskSync[];
    goals?: MiloGoalSync[];
    focus_sessions?: MiloFocusSessionSync[];
    activity_log?: MiloActivitySync[];
  };
}

/**
 * MILO task for sync
 */
export interface MiloTaskSync {
  milo_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: Timestamp | null;
  completed_at: Timestamp | null;
  project_name: string | null; // Will be matched to project_id
  updated_at: Timestamp;
}

/**
 * MILO goal for sync
 */
export interface MiloGoalSync {
  milo_id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  target_date: string | null;
  is_completed: boolean;
  updated_at: Timestamp;
}

/**
 * MILO focus session for sync
 */
export interface MiloFocusSessionSync {
  milo_id: string;
  session_type: 'focus' | 'break' | 'meeting';
  duration_minutes: number;
  started_at: Timestamp;
  ended_at: Timestamp | null;
  task_milo_id: string | null; // Reference to task
  interruption_count: number;
}

/**
 * MILO activity for sync
 */
export interface MiloActivitySync {
  milo_id: string;
  app_name: string;
  window_title: string | null;
  url: string | null;
  started_at: Timestamp;
  ended_at: Timestamp;
  duration_seconds: number;
  category: string | null;
  is_productive: boolean | null;
}

/**
 * MILO sync response
 */
export interface MiloSyncResponse {
  success: boolean;
  synced_at: Timestamp;
  counts: {
    tasks_synced: number;
    goals_synced: number;
    sessions_synced: number;
    activities_synced: number;
  };
  errors: Array<{
    entity_type: string;
    milo_id: string;
    error: string;
  }>;
}

// ============================================================================
// CROSS-TOOL INTEGRATION TYPES
// ============================================================================

/**
 * Unified search result across all tools
 */
export interface UnifiedSearchResult {
  tool: ToolType;
  entity_type: string;
  entity_id: UUID;
  title: string;
  description: string | null;
  relevance_score: number;
  metadata: Record<string, Json>;
}

/**
 * Dashboard statistics for all tools
 */
export interface DashboardStats {
  lexicon: {
    universe_count: number;
    entity_count: number;
    relationship_count: number;
  };
  composer: {
    content_count: number;
    draft_count: number;
    published_count: number;
    words_generated: number;
  };
  scout: {
    research_count: number;
    findings_count: number;
    competitors_tracked: number;
  };
  milo: {
    tasks_total: number;
    tasks_completed: number;
    goals_count: number;
    focus_minutes_today: number;
  };
}
