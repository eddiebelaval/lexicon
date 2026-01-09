-- ============================================================================
-- ID8Labs Creator Core - Phase 1 Migration
-- SAFE: Creates new enums and core tables that don't conflict with existing
-- Date: 2026-01-08
-- ============================================================================

-- ============================================================================
-- CUSTOM TYPES (ENUMS)
-- ============================================================================

-- Subscription tiers for billing
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'creator', 'professional', 'studio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Entity types for Lexicon knowledge graph
DO $$ BEGIN
    CREATE TYPE entity_type AS ENUM ('character', 'location', 'event', 'object', 'faction', 'concept', 'timeline');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Content types for Composer
DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('article', 'blog_post', 'social_post', 'email', 'script', 'story', 'documentation', 'marketing_copy', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Content status for workflow
DO $$ BEGIN
    CREATE TYPE content_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Research status for Scout
DO $$ BEGIN
    CREATE TYPE research_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Agent types for Scout
DO $$ BEGIN
    CREATE TYPE scout_agent_type AS ENUM ('market_analyst', 'competitor_tracker', 'trend_watcher');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Task priority for MILO
DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Task status for MILO
DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'blocked', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Activity type for unified activity log
DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('create', 'update', 'delete', 'view', 'share', 'export', 'import', 'generate', 'research', 'sync');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tool identifier
DO $$ BEGIN
    CREATE TYPE tool_type AS ENUM ('lexicon', 'composer', 'scout', 'milo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- CORE TABLES - Shared Across All Tools
-- ============================================================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    monthly_ai_tokens_used INTEGER NOT NULL DEFAULT 0,
    monthly_ai_tokens_limit INTEGER NOT NULL DEFAULT 10000,
    monthly_storage_used_mb NUMERIC(10,2) NOT NULL DEFAULT 0,
    monthly_storage_limit_mb NUMERIC(10,2) NOT NULL DEFAULT 100,
    beta_features_enabled BOOLEAN NOT NULL DEFAULT false,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON user_profiles(subscription_tier);

-- Projects - Central organizing concept across all tools
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    is_universe BOOLEAN NOT NULL DEFAULT false,
    is_campaign BOOLEAN NOT NULL DEFAULT false,
    is_research BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    entity_count INTEGER NOT NULL DEFAULT 0,
    content_count INTEGER NOT NULL DEFAULT 0,
    research_count INTEGER NOT NULL DEFAULT 0,
    task_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT unique_project_slug_per_user UNIQUE (owner_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_public ON projects(is_public) WHERE is_public = true;

-- Project Collaborators
CREATE TABLE IF NOT EXISTS project_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    can_read BOOLEAN NOT NULL DEFAULT true,
    can_write BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    can_manage BOOLEAN NOT NULL DEFAULT false,
    invited_by UUID REFERENCES user_profiles(id),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_collaborator UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON project_collaborators(user_id);

-- Tags - Shared tagging system
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tag_per_user UNIQUE (owner_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_owner ON tags(owner_id);

-- Taggings - Junction table for tags
CREATE TABLE IF NOT EXISTS taggings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    taggable_type TEXT NOT NULL,
    taggable_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tagging UNIQUE (tag_id, taggable_type, taggable_id)
);

CREATE INDEX IF NOT EXISTS idx_taggings_tag ON taggings(tag_id);
CREATE INDEX IF NOT EXISTS idx_taggings_taggable ON taggings(taggable_type, taggable_id);

-- ============================================================================
-- UNIFIED TABLES - Cross-tool features
-- ============================================================================

-- Unified Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    tool tool_type NOT NULL,
    activity_type activity_type NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    entity_name TEXT,
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_project ON activity_feed(project_id);
CREATE INDEX IF NOT EXISTS idx_feed_tool ON activity_feed(tool);
CREATE INDEX IF NOT EXISTS idx_feed_created ON activity_feed(created_at DESC);

-- Cross-references - Links between entities across tools
CREATE TABLE IF NOT EXISTS cross_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_tool tool_type NOT NULL,
    source_entity_type TEXT NOT NULL,
    source_entity_id UUID NOT NULL,
    target_tool tool_type NOT NULL,
    target_entity_type TEXT NOT NULL,
    target_entity_id UUID NOT NULL,
    reference_type TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    CONSTRAINT unique_cross_reference UNIQUE (
        source_tool, source_entity_id,
        target_tool, target_entity_id,
        reference_type
    )
);

CREATE INDEX IF NOT EXISTS idx_xref_source ON cross_references(source_tool, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_xref_target ON cross_references(target_tool, target_entity_id);

-- API Keys - For MCP and external integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    scopes JSONB NOT NULL DEFAULT '["read"]'::jsonb,
    allowed_tools JSONB NOT NULL DEFAULT '["lexicon", "composer", "scout", "milo"]'::jsonb,
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- Webhooks - For real-time integrations
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    events JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    last_status_code INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active) WHERE is_active = true;

-- ============================================================================
-- Enable RLS on all new tables
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE taggings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- User Profiles
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Projects
CREATE POLICY "Users can view own projects" ON projects FOR SELECT
    USING (owner_id = auth.uid() OR is_public = true OR EXISTS (
        SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid() AND can_read = true
    ));
CREATE POLICY "Users can create own projects" ON projects FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE
    USING (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM project_collaborators WHERE project_id = projects.id AND user_id = auth.uid() AND can_write = true
    ));
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (owner_id = auth.uid());

-- Project Collaborators
CREATE POLICY "Collaborators can view their collaborations" ON project_collaborators FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM projects WHERE id = project_collaborators.project_id AND owner_id = auth.uid()));
CREATE POLICY "Project owners can manage collaborators" ON project_collaborators FOR ALL
    USING (EXISTS (SELECT 1 FROM projects WHERE id = project_collaborators.project_id AND owner_id = auth.uid()));

-- Tags
CREATE POLICY "Users can manage own tags" ON tags FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Taggings
CREATE POLICY "Users can view own taggings" ON taggings FOR SELECT
    USING (EXISTS (SELECT 1 FROM tags WHERE id = taggings.tag_id AND owner_id = auth.uid()));
CREATE POLICY "Users can manage own taggings" ON taggings FOR ALL
    USING (EXISTS (SELECT 1 FROM tags WHERE id = taggings.tag_id AND owner_id = auth.uid()));

-- Activity Feed
CREATE POLICY "Users can view own and public activity" ON activity_feed FOR SELECT USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY "Users can create own activity" ON activity_feed FOR INSERT WITH CHECK (user_id = auth.uid());

-- Cross References
CREATE POLICY "Users can view own cross references" ON cross_references FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can manage own cross references" ON cross_references FOR ALL USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- API Keys
CREATE POLICY "Users can manage own API keys" ON api_keys FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Webhooks
CREATE POLICY "Users can manage own webhooks" ON webhooks FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (create profile on signup)
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'Extended user profiles for ID8Labs Creator Core - linked to Supabase auth.users';
COMMENT ON TABLE projects IS 'Central organizing concept - all ID8Labs tools reference projects';
COMMENT ON TABLE activity_feed IS 'Unified activity log across all ID8Labs tools';
COMMENT ON TABLE api_keys IS 'API keys for MCP bridge and external integrations';
