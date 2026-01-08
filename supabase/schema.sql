-- ============================================================================
-- ID8Labs Creator Core - Unified Database Schema
-- ============================================================================
-- Version: 1.0.0
-- Date: 2026-01-08
--
-- This schema provides unified data storage for the ID8Labs Creator Core
-- ecosystem, connecting all 4 tools:
--   1. Lexicon - Central knowledge brain (graph data in Neo4j, metadata here)
--   2. ID8Composer - Content generation at scale
--   3. Scout - Market validation with AI agents
--   4. MILO - Desktop productivity (synced via MCP bridge)
--
-- Design Principles:
--   - Single users table shared across all tools
--   - Projects/Universes as central organizing concept
--   - Each tool has its own domain tables with FK relationships
--   - RLS policies enforce multi-tenant security
--   - Soft deletes for data recovery
--   - Comprehensive audit trails
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CUSTOM TYPES (ENUMS)
-- ============================================================================

-- Subscription tiers for billing
CREATE TYPE subscription_tier AS ENUM (
    'free',
    'creator',
    'professional',
    'studio'
);

-- Entity types for Lexicon knowledge graph
CREATE TYPE entity_type AS ENUM (
    'character',
    'location',
    'event',
    'object',
    'faction',
    'concept',
    'timeline'
);

-- Content types for Composer
CREATE TYPE content_type AS ENUM (
    'article',
    'blog_post',
    'social_post',
    'email',
    'script',
    'story',
    'documentation',
    'marketing_copy',
    'custom'
);

-- Content status for workflow
CREATE TYPE content_status AS ENUM (
    'draft',
    'in_review',
    'approved',
    'published',
    'archived'
);

-- Research status for Scout
CREATE TYPE research_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed'
);

-- Agent types for Scout
CREATE TYPE scout_agent_type AS ENUM (
    'market_analyst',
    'competitor_tracker',
    'trend_watcher'
);

-- Task priority for MILO
CREATE TYPE task_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

-- Task status for MILO
CREATE TYPE task_status AS ENUM (
    'todo',
    'in_progress',
    'blocked',
    'completed',
    'cancelled'
);

-- Activity type for unified activity log
CREATE TYPE activity_type AS ENUM (
    'create',
    'update',
    'delete',
    'view',
    'share',
    'export',
    'import',
    'generate',
    'research',
    'sync'
);

-- Tool identifier
CREATE TYPE tool_type AS ENUM (
    'lexicon',
    'composer',
    'scout',
    'milo'
);

-- ============================================================================
-- CORE TABLES - Shared Across All Tools
-- ============================================================================

-- ----------------------------------------------------------------------------
-- User Profiles (extends Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,

    -- Usage quotas (reset monthly)
    monthly_ai_tokens_used INTEGER NOT NULL DEFAULT 0,
    monthly_ai_tokens_limit INTEGER NOT NULL DEFAULT 10000,
    monthly_storage_used_mb NUMERIC(10,2) NOT NULL DEFAULT 0,
    monthly_storage_limit_mb NUMERIC(10,2) NOT NULL DEFAULT 100,

    -- Feature flags
    beta_features_enabled BOOLEAN NOT NULL DEFAULT false,

    -- Preferences (JSON for flexibility)
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,

    -- Soft delete
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_subscription ON user_profiles(subscription_tier);
CREATE INDEX idx_user_profiles_deleted ON user_profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Projects - Central organizing concept across all tools
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,

    -- Project type hints
    is_universe BOOLEAN NOT NULL DEFAULT false,  -- Lexicon creative universe
    is_campaign BOOLEAN NOT NULL DEFAULT false,  -- Composer content campaign
    is_research BOOLEAN NOT NULL DEFAULT false,  -- Scout research project

    -- Visibility
    is_public BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,

    -- Settings (JSON for tool-specific config)
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Cached counts (updated via triggers)
    entity_count INTEGER NOT NULL DEFAULT 0,
    content_count INTEGER NOT NULL DEFAULT 0,
    research_count INTEGER NOT NULL DEFAULT 0,
    task_count INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Unique slug per user
    CONSTRAINT unique_project_slug_per_user UNIQUE (owner_id, slug)
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_public ON projects(is_public) WHERE is_public = true;
CREATE INDEX idx_projects_archived ON projects(is_archived);
CREATE INDEX idx_projects_deleted ON projects(deleted_at) WHERE deleted_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Project Collaborators - Multi-user access
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Permission levels
    can_read BOOLEAN NOT NULL DEFAULT true,
    can_write BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    can_manage BOOLEAN NOT NULL DEFAULT false,  -- Can add/remove collaborators

    -- Invitation tracking
    invited_by UUID REFERENCES user_profiles(id),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_collaborator UNIQUE (project_id, user_id)
);

CREATE INDEX idx_collaborators_project ON project_collaborators(project_id);
CREATE INDEX idx_collaborators_user ON project_collaborators(user_id);

-- ----------------------------------------------------------------------------
-- Tags - Shared tagging system across all tools
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',  -- Default indigo

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_tag_per_user UNIQUE (owner_id, name)
);

CREATE INDEX idx_tags_owner ON tags(owner_id);

-- ============================================================================
-- LEXICON TABLES - Knowledge Graph Metadata
-- Note: Actual graph data (nodes, edges) stored in Neo4j
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Universes - Lexicon's creative worlds (extends projects)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS universes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Universe-specific metadata
    genre TEXT,
    setting_period TEXT,  -- e.g., "Medieval", "Modern", "Sci-Fi Future"

    -- Neo4j reference
    neo4j_database TEXT,  -- If using multiple Neo4j databases

    -- Stats (synced from Neo4j)
    character_count INTEGER NOT NULL DEFAULT 0,
    location_count INTEGER NOT NULL DEFAULT 0,
    event_count INTEGER NOT NULL DEFAULT 0,
    object_count INTEGER NOT NULL DEFAULT 0,
    faction_count INTEGER NOT NULL DEFAULT 0,
    relationship_count INTEGER NOT NULL DEFAULT 0,

    -- Settings
    default_entity_type entity_type NOT NULL DEFAULT 'character',
    ai_context_prompt TEXT,  -- Custom prompt for AI search synthesis

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT one_universe_per_project UNIQUE (project_id)
);

CREATE INDEX idx_universes_project ON universes(project_id);

-- ----------------------------------------------------------------------------
-- Entity Metadata - Supplementary data for Neo4j entities
-- The core entity data (name, type, relationships) is in Neo4j
-- This stores data that's better suited to SQL (audit, permissions, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entity_metadata (
    id UUID PRIMARY KEY,  -- Same UUID as Neo4j entity
    universe_id UUID NOT NULL REFERENCES universes(id) ON DELETE CASCADE,

    entity_type entity_type NOT NULL,

    -- Permissions (beyond universe-level)
    is_locked BOOLEAN NOT NULL DEFAULT false,  -- Prevent accidental edits
    locked_by UUID REFERENCES user_profiles(id),
    locked_at TIMESTAMPTZ,

    -- AI features
    ai_generated BOOLEAN NOT NULL DEFAULT false,
    ai_generation_prompt TEXT,

    -- Version tracking
    version INTEGER NOT NULL DEFAULT 1,

    -- Source tracking
    imported_from TEXT,  -- e.g., "csv", "notion", "manual"

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id)
);

CREATE INDEX idx_entity_metadata_universe ON entity_metadata(universe_id);
CREATE INDEX idx_entity_metadata_type ON entity_metadata(entity_type);

-- ----------------------------------------------------------------------------
-- Documents - Rich documents attached to universes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS universe_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    universe_id UUID NOT NULL REFERENCES universes(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    content TEXT,  -- Markdown/HTML content
    content_type TEXT NOT NULL DEFAULT 'markdown',

    -- Document organization
    parent_id UUID REFERENCES universe_documents(id),  -- For nested docs
    sort_order INTEGER NOT NULL DEFAULT 0,

    -- Linked entities (JSON array of entity UUIDs)
    linked_entities JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Search optimization
    search_vector TSVECTOR,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id)
);

CREATE INDEX idx_universe_docs_universe ON universe_documents(universe_id);
CREATE INDEX idx_universe_docs_parent ON universe_documents(parent_id);
CREATE INDEX idx_universe_docs_search ON universe_documents USING gin(search_vector);

-- ============================================================================
-- COMPOSER TABLES - Content Generation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Content Templates - Reusable content structures
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    name TEXT NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,

    -- Template structure
    template_body TEXT NOT NULL,  -- With {{placeholders}}
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Variable definitions

    -- AI generation settings
    ai_prompt TEXT,
    ai_model TEXT DEFAULT 'claude-3-opus',
    ai_temperature NUMERIC(2,1) DEFAULT 0.7,

    -- Usage stats
    usage_count INTEGER NOT NULL DEFAULT 0,

    -- Sharing
    is_public BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_owner ON content_templates(owner_id);
CREATE INDEX idx_templates_project ON content_templates(project_id);
CREATE INDEX idx_templates_type ON content_templates(content_type);
CREATE INDEX idx_templates_public ON content_templates(is_public) WHERE is_public = true;

-- ----------------------------------------------------------------------------
-- Content Items - Generated content pieces
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    template_id UUID REFERENCES content_templates(id) ON DELETE SET NULL,

    title TEXT NOT NULL,
    content_type content_type NOT NULL,
    status content_status NOT NULL DEFAULT 'draft',

    -- Content body (supports versions)
    body TEXT,
    body_html TEXT,  -- Rendered HTML if applicable

    -- Generation context
    variables_used JSONB,  -- Template variables that were filled
    ai_generation_id TEXT,  -- Reference to AI generation request

    -- Linked universe (for Lexicon integration)
    universe_id UUID REFERENCES universes(id) ON DELETE SET NULL,
    linked_entities JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Entity UUIDs used

    -- Publishing
    published_at TIMESTAMPTZ,
    published_url TEXT,

    -- Word counts for stats
    word_count INTEGER NOT NULL DEFAULT 0,

    -- Scheduling
    scheduled_publish_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id)
);

CREATE INDEX idx_content_project ON content_items(project_id);
CREATE INDEX idx_content_status ON content_items(status);
CREATE INDEX idx_content_universe ON content_items(universe_id);
CREATE INDEX idx_content_scheduled ON content_items(scheduled_publish_at)
    WHERE scheduled_publish_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Content Versions - Version history for content items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,

    version_number INTEGER NOT NULL,
    body TEXT NOT NULL,

    -- Change tracking
    change_summary TEXT,
    changed_by UUID REFERENCES user_profiles(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_content_version UNIQUE (content_id, version_number)
);

CREATE INDEX idx_content_versions_content ON content_versions(content_id);

-- ----------------------------------------------------------------------------
-- Generation Queue - Batch content generation jobs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS generation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Job definition
    template_id UUID REFERENCES content_templates(id),
    batch_config JSONB NOT NULL,  -- Array of variable sets

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, processing, completed, failed
    total_items INTEGER NOT NULL DEFAULT 0,
    completed_items INTEGER NOT NULL DEFAULT 0,
    failed_items INTEGER NOT NULL DEFAULT 0,

    -- Results
    result_content_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    error_log JSONB,

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

CREATE INDEX idx_gen_queue_project ON generation_queue(project_id);
CREATE INDEX idx_gen_queue_status ON generation_queue(status);

-- ============================================================================
-- SCOUT TABLES - Market Validation & Research
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Research Projects - Scout research initiatives
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,

    -- Research focus
    target_market TEXT,
    target_audience TEXT,
    keywords JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Status
    status research_status NOT NULL DEFAULT 'pending',

    -- Agent configuration
    enabled_agents JSONB NOT NULL DEFAULT '["market_analyst", "competitor_tracker", "trend_watcher"]'::jsonb,
    agent_config JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Schedule
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurring_cron TEXT,  -- Cron expression for recurring research
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_research_project ON research_projects(project_id);
CREATE INDEX idx_research_status ON research_projects(status);
CREATE INDEX idx_research_next_run ON research_projects(next_run_at)
    WHERE is_recurring = true;

-- ----------------------------------------------------------------------------
-- Research Runs - Individual research execution instances
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS research_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,

    -- Run status
    status research_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Trigger
    triggered_by TEXT NOT NULL DEFAULT 'manual',  -- manual, schedule, webhook
    triggered_by_user UUID REFERENCES user_profiles(id),

    -- Agent results
    agent_results JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Summary (AI-generated)
    summary TEXT,
    key_insights JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Error tracking
    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_runs_research_project ON research_runs(research_project_id);
CREATE INDEX idx_runs_status ON research_runs(status);

-- ----------------------------------------------------------------------------
-- Research Findings - Individual data points discovered
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS research_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_run_id UUID NOT NULL REFERENCES research_runs(id) ON DELETE CASCADE,

    -- Finding details
    agent_type scout_agent_type NOT NULL,
    finding_type TEXT NOT NULL,  -- e.g., "competitor", "trend", "market_size"
    title TEXT NOT NULL,
    description TEXT,

    -- Source
    source_url TEXT,
    source_name TEXT,

    -- Data payload (flexible JSON)
    data JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Relevance scoring
    relevance_score NUMERIC(3,2),  -- 0.00 to 1.00
    confidence_score NUMERIC(3,2),

    -- User feedback
    is_bookmarked BOOLEAN NOT NULL DEFAULT false,
    is_dismissed BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_findings_run ON research_findings(research_run_id);
CREATE INDEX idx_findings_agent ON research_findings(agent_type);
CREATE INDEX idx_findings_bookmarked ON research_findings(is_bookmarked)
    WHERE is_bookmarked = true;

-- ----------------------------------------------------------------------------
-- Competitors - Tracked competitor entities
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    website TEXT,
    description TEXT,

    -- Tracking config
    social_handles JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {"twitter": "@handle", ...}
    keywords_to_track JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Latest intel
    latest_intel JSONB NOT NULL DEFAULT '{}'::jsonb,
    intel_updated_at TIMESTAMPTZ,

    -- Notes
    notes TEXT,

    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_competitor_per_project UNIQUE (project_id, name)
);

CREATE INDEX idx_competitors_project ON competitors(project_id);
CREATE INDEX idx_competitors_active ON competitors(is_active) WHERE is_active = true;

-- ============================================================================
-- MILO TABLES - Desktop Productivity (Synced via MCP)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Goals - High-level objectives
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    title TEXT NOT NULL,
    description TEXT,

    -- Goal type
    goal_type TEXT NOT NULL DEFAULT 'personal',  -- personal, project, team

    -- Progress
    target_value NUMERIC,
    current_value NUMERIC NOT NULL DEFAULT 0,
    unit TEXT,  -- e.g., "words", "tasks", "hours"

    -- Timeframe
    start_date DATE,
    target_date DATE,

    -- Status
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,

    -- MILO sync
    milo_id TEXT,  -- Local MILO SQLite ID for sync
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_goals_project ON goals(project_id);
CREATE INDEX idx_goals_milo ON goals(milo_id) WHERE milo_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Tasks - Individual work items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,

    title TEXT NOT NULL,
    description TEXT,

    -- Task metadata
    priority task_priority NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'todo',

    -- Time tracking
    estimated_minutes INTEGER,
    actual_minutes INTEGER,

    -- Scheduling
    due_date TIMESTAMPTZ,
    reminder_at TIMESTAMPTZ,

    -- Recurrence
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurrence_pattern TEXT,  -- RRULE format

    -- Completion
    completed_at TIMESTAMPTZ,

    -- Parent task (for subtasks)
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,

    -- Context (what app/activity was this created from)
    context_app TEXT,
    context_url TEXT,

    -- MILO sync
    milo_id TEXT,  -- Local MILO SQLite ID
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_goal ON tasks(goal_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_milo ON tasks(milo_id) WHERE milo_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Focus Sessions - Pomodoro/deep work tracking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Session details
    session_type TEXT NOT NULL DEFAULT 'focus',  -- focus, break, meeting
    duration_minutes INTEGER NOT NULL,

    -- Activity
    description TEXT,

    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,

    -- Quality metrics
    interruption_count INTEGER NOT NULL DEFAULT 0,
    focus_score NUMERIC(3,2),  -- 0.00 to 1.00

    -- MILO sync
    milo_id TEXT,
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON focus_sessions(user_id);
CREATE INDEX idx_sessions_task ON focus_sessions(task_id);
CREATE INDEX idx_sessions_started ON focus_sessions(started_at);
CREATE INDEX idx_sessions_milo ON focus_sessions(milo_id) WHERE milo_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Activity Log - App/website usage tracking from MILO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Activity details
    app_name TEXT NOT NULL,
    window_title TEXT,
    url TEXT,

    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    duration_seconds INTEGER NOT NULL,

    -- Categorization
    category TEXT,  -- e.g., "coding", "writing", "communication", "distraction"
    is_productive BOOLEAN,

    -- MILO sync
    milo_id TEXT,
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_started ON activity_log(started_at);
CREATE INDEX idx_activity_app ON activity_log(app_name);
CREATE INDEX idx_activity_category ON activity_log(category);
CREATE INDEX idx_activity_milo ON activity_log(milo_id) WHERE milo_id IS NOT NULL;

-- Partition by month for large activity tables (optional, manual setup)
-- CREATE TABLE activity_log_2026_01 PARTITION OF activity_log
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- ============================================================================
-- UNIFIED TABLES - Cross-tool features
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Unified Activity Feed - All actions across all tools
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

    -- Activity details
    tool tool_type NOT NULL,
    activity_type activity_type NOT NULL,

    -- What was affected
    entity_type TEXT NOT NULL,  -- e.g., "entity", "content", "task", "research"
    entity_id UUID NOT NULL,
    entity_name TEXT,

    -- Description
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Visibility
    is_public BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feed_user ON activity_feed(user_id);
CREATE INDEX idx_feed_project ON activity_feed(project_id);
CREATE INDEX idx_feed_tool ON activity_feed(tool);
CREATE INDEX idx_feed_created ON activity_feed(created_at DESC);

-- ----------------------------------------------------------------------------
-- Cross-references - Links between entities across tools
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cross_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source entity
    source_tool tool_type NOT NULL,
    source_entity_type TEXT NOT NULL,
    source_entity_id UUID NOT NULL,

    -- Target entity
    target_tool tool_type NOT NULL,
    target_entity_type TEXT NOT NULL,
    target_entity_id UUID NOT NULL,

    -- Reference type
    reference_type TEXT NOT NULL,  -- e.g., "uses", "inspired_by", "generated_from"

    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),

    CONSTRAINT unique_cross_reference UNIQUE (
        source_tool, source_entity_id,
        target_tool, target_entity_id,
        reference_type
    )
);

CREATE INDEX idx_xref_source ON cross_references(source_tool, source_entity_id);
CREATE INDEX idx_xref_target ON cross_references(target_tool, target_entity_id);

-- ----------------------------------------------------------------------------
-- Taggings - Junction table for tags
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS taggings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

    -- What is tagged
    taggable_type TEXT NOT NULL,  -- e.g., "project", "content", "task"
    taggable_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_tagging UNIQUE (tag_id, taggable_type, taggable_id)
);

CREATE INDEX idx_taggings_tag ON taggings(tag_id);
CREATE INDEX idx_taggings_taggable ON taggings(taggable_type, taggable_id);

-- ----------------------------------------------------------------------------
-- API Keys - For MCP and external integrations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,  -- Store hash, not plain key
    key_prefix TEXT NOT NULL,  -- First 8 chars for identification

    -- Permissions
    scopes JSONB NOT NULL DEFAULT '["read"]'::jsonb,
    allowed_tools JSONB NOT NULL DEFAULT '["lexicon", "composer", "scout", "milo"]'::jsonb,

    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER NOT NULL DEFAULT 0,

    -- Expiration
    expires_at TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- ----------------------------------------------------------------------------
-- Webhooks - For real-time integrations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,  -- For signature verification

    -- Events to trigger on
    events JSONB NOT NULL DEFAULT '[]'::jsonb,  -- e.g., ["content.created", "task.completed"]

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Delivery stats
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    last_status_code INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user ON webhooks(user_id);
CREATE INDEX idx_webhooks_active ON webhooks(is_active) WHERE is_active = true;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: Update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'updated_at'
        AND table_name NOT LIKE 'pg_%'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: Update project counts
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_project_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update content count
    IF TG_TABLE_NAME = 'content_items' THEN
        UPDATE projects
        SET content_count = (
            SELECT COUNT(*) FROM content_items WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        )
        WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    END IF;

    -- Update task count
    IF TG_TABLE_NAME = 'tasks' THEN
        UPDATE projects
        SET task_count = (
            SELECT COUNT(*) FROM tasks WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        )
        WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for count updates
CREATE TRIGGER update_content_count
    AFTER INSERT OR DELETE ON content_items
    FOR EACH ROW
    EXECUTE FUNCTION update_project_counts();

CREATE TRIGGER update_task_count
    AFTER INSERT OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_project_counts();

-- ----------------------------------------------------------------------------
-- Function: Create user profile on auth signup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE universes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE universe_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE taggings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- User Profiles Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Projects Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (
        owner_id = auth.uid()
        OR is_public = true
        OR EXISTS (
            SELECT 1 FROM project_collaborators
            WHERE project_id = projects.id
            AND user_id = auth.uid()
            AND can_read = true
        )
    );

CREATE POLICY "Users can create own projects"
    ON projects FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (
        owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM project_collaborators
            WHERE project_id = projects.id
            AND user_id = auth.uid()
            AND can_write = true
        )
    );

CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (owner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Project Collaborators Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Collaborators can view their collaborations"
    ON project_collaborators FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM projects
            WHERE id = project_collaborators.project_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can manage collaborators"
    ON project_collaborators FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = project_collaborators.project_id
            AND owner_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Tags Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own tags"
    ON tags FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Universes Policies (inherit from projects)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view universes in accessible projects"
    ON universes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = universes.project_id
            AND (
                owner_id = auth.uid()
                OR is_public = true
                OR EXISTS (
                    SELECT 1 FROM project_collaborators
                    WHERE project_id = projects.id
                    AND user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can manage universes in own projects"
    ON universes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = universes.project_id
            AND owner_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Entity Metadata Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view entity metadata in accessible universes"
    ON entity_metadata FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM universes u
            JOIN projects p ON u.project_id = p.id
            WHERE u.id = entity_metadata.universe_id
            AND (
                p.owner_id = auth.uid()
                OR p.is_public = true
                OR EXISTS (
                    SELECT 1 FROM project_collaborators
                    WHERE project_id = p.id
                    AND user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can manage entity metadata in own universes"
    ON entity_metadata FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM universes u
            JOIN projects p ON u.project_id = p.id
            WHERE u.id = entity_metadata.universe_id
            AND p.owner_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Content Items Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view content in accessible projects"
    ON content_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = content_items.project_id
            AND (
                owner_id = auth.uid()
                OR is_public = true
                OR EXISTS (
                    SELECT 1 FROM project_collaborators
                    WHERE project_id = projects.id
                    AND user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can manage content in own projects"
    ON content_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = content_items.project_id
            AND owner_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Tasks Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own tasks"
    ON tasks FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Goals Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own goals"
    ON goals FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Focus Sessions Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own focus sessions"
    ON focus_sessions FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Activity Log Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own activity log"
    ON activity_log FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Activity Feed Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own and public activity"
    ON activity_feed FOR SELECT
    USING (
        user_id = auth.uid()
        OR is_public = true
    );

CREATE POLICY "Users can create own activity"
    ON activity_feed FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- API Keys Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own API keys"
    ON api_keys FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Webhooks Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own webhooks"
    ON webhooks FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Research Projects Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view research in accessible projects"
    ON research_projects FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = research_projects.project_id
            AND (owner_id = auth.uid() OR is_public = true)
        )
    );

CREATE POLICY "Users can manage research in own projects"
    ON research_projects FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = research_projects.project_id
            AND owner_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Research Runs Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view runs in accessible research"
    ON research_runs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM research_projects rp
            JOIN projects p ON rp.project_id = p.id
            WHERE rp.id = research_runs.research_project_id
            AND (p.owner_id = auth.uid() OR p.is_public = true)
        )
    );

CREATE POLICY "Users can manage runs in own research"
    ON research_runs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM research_projects rp
            JOIN projects p ON rp.project_id = p.id
            WHERE rp.id = research_runs.research_project_id
            AND p.owner_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Research Findings Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view findings in accessible runs"
    ON research_findings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM research_runs rr
            JOIN research_projects rp ON rr.research_project_id = rp.id
            JOIN projects p ON rp.project_id = p.id
            WHERE rr.id = research_findings.research_run_id
            AND (p.owner_id = auth.uid() OR p.is_public = true)
        )
    );

CREATE POLICY "Users can manage findings in own runs"
    ON research_findings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM research_runs rr
            JOIN research_projects rp ON rr.research_project_id = rp.id
            JOIN projects p ON rp.project_id = p.id
            WHERE rr.id = research_findings.research_run_id
            AND p.owner_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Competitors Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view competitors in accessible projects"
    ON competitors FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = competitors.project_id
            AND (owner_id = auth.uid() OR is_public = true)
        )
    );

CREATE POLICY "Users can manage competitors in own projects"
    ON competitors FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = competitors.project_id
            AND owner_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Content Templates Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own and public templates"
    ON content_templates FOR SELECT
    USING (
        owner_id = auth.uid()
        OR is_public = true
    );

CREATE POLICY "Users can manage own templates"
    ON content_templates FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Content Versions Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view versions of accessible content"
    ON content_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM content_items ci
            JOIN projects p ON ci.project_id = p.id
            WHERE ci.id = content_versions.content_id
            AND (p.owner_id = auth.uid() OR p.is_public = true)
        )
    );

CREATE POLICY "Users can manage versions of own content"
    ON content_versions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM content_items ci
            JOIN projects p ON ci.project_id = p.id
            WHERE ci.id = content_versions.content_id
            AND p.owner_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Generation Queue Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own generation jobs"
    ON generation_queue FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = generation_queue.project_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own generation jobs"
    ON generation_queue FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = generation_queue.project_id
            AND owner_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Universe Documents Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view docs in accessible universes"
    ON universe_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM universes u
            JOIN projects p ON u.project_id = p.id
            WHERE u.id = universe_documents.universe_id
            AND (p.owner_id = auth.uid() OR p.is_public = true)
        )
    );

CREATE POLICY "Users can manage docs in own universes"
    ON universe_documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM universes u
            JOIN projects p ON u.project_id = p.id
            WHERE u.id = universe_documents.universe_id
            AND p.owner_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Taggings Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own taggings"
    ON taggings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tags
            WHERE id = taggings.tag_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own taggings"
    ON taggings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tags
            WHERE id = taggings.tag_id
            AND owner_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Cross References Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view cross references they created"
    ON cross_references FOR SELECT
    USING (created_by = auth.uid());

CREATE POLICY "Users can manage own cross references"
    ON cross_references FOR ALL
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'Extended user profiles, linked to Supabase auth.users';
COMMENT ON TABLE projects IS 'Central organizing concept - all tools reference projects';
COMMENT ON TABLE universes IS 'Lexicon creative universes - metadata for Neo4j graph';
COMMENT ON TABLE content_items IS 'Composer generated content';
COMMENT ON TABLE research_projects IS 'Scout market research projects';
COMMENT ON TABLE tasks IS 'MILO tasks - synced from desktop app via MCP';
COMMENT ON TABLE activity_feed IS 'Unified activity log across all ID8Labs tools';
COMMENT ON TABLE api_keys IS 'API keys for MCP bridge and external integrations';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
