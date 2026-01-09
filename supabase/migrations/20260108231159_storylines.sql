-- Storylines: Long-form narrative storage for reality TV production
-- Part of the Living Universe system for Lexicon

-- =============================================================================
-- STORYLINES TABLE
-- Stores 5,000+ word narratives for each couple/storyline
-- =============================================================================

CREATE TABLE IF NOT EXISTS storylines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    universe_id UUID NOT NULL REFERENCES universes(id) ON DELETE CASCADE,

    -- Core content
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    synopsis TEXT,                              -- Short summary (300 words max)
    narrative TEXT,                             -- Long-form content (5,000+ words)

    -- Cast linkage (references Neo4j entity IDs)
    primary_cast JSONB NOT NULL DEFAULT '[]'::jsonb,    -- Main characters/couple
    supporting_cast JSONB NOT NULL DEFAULT '[]'::jsonb, -- Secondary characters

    -- Categorization
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'developing')),
    season TEXT,                                -- e.g., "Season 10"
    episode_range TEXT,                         -- e.g., "S10E1-S10E8"
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,    -- Searchable tags

    -- Full-text search
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(synopsis, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(narrative, '')), 'C')
    ) STORED,

    -- AI enrichment tracking
    last_enriched_at TIMESTAMPTZ,
    enrichment_sources JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Timestamps and ownership
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id),

    -- Constraints
    CONSTRAINT unique_storyline_slug UNIQUE (universe_id, slug)
);

-- Indexes for storylines
CREATE INDEX idx_storylines_universe ON storylines(universe_id);
CREATE INDEX idx_storylines_status ON storylines(status);
CREATE INDEX idx_storylines_search ON storylines USING gin(search_vector);
CREATE INDEX idx_storylines_primary_cast ON storylines USING gin(primary_cast);
CREATE INDEX idx_storylines_tags ON storylines USING gin(tags);
CREATE INDEX idx_storylines_updated ON storylines(updated_at DESC);

-- =============================================================================
-- STORYLINE_UPDATES TABLE
-- News and updates from web monitoring
-- =============================================================================

CREATE TABLE IF NOT EXISTS storyline_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storyline_id UUID NOT NULL REFERENCES storylines(id) ON DELETE CASCADE,

    -- Update content
    update_type TEXT NOT NULL CHECK (update_type IN ('news', 'social_media', 'manual', 'ai_enrichment')),
    source_url TEXT,
    source_name TEXT,
    title TEXT,
    content TEXT NOT NULL,
    summary TEXT,

    -- Relevance scoring (0.00 to 1.00)
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Processing state
    processed_at TIMESTAMPTZ,
    included_in_digest BOOLEAN NOT NULL DEFAULT false,

    -- Raw data from source
    raw_data JSONB,

    -- Timestamps
    published_at TIMESTAMPTZ,           -- When the news was originally published
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for storyline_updates
CREATE INDEX idx_updates_storyline ON storyline_updates(storyline_id);
CREATE INDEX idx_updates_type ON storyline_updates(update_type);
CREATE INDEX idx_updates_created ON storyline_updates(created_at DESC);
CREATE INDEX idx_updates_unprocessed ON storyline_updates(included_in_digest) WHERE included_in_digest = false;
CREATE INDEX idx_updates_confidence ON storyline_updates(confidence_score DESC) WHERE confidence_score IS NOT NULL;

-- =============================================================================
-- DIGESTS TABLE
-- Daily digest summaries sent to users
-- =============================================================================

CREATE TABLE IF NOT EXISTS digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    universe_id UUID REFERENCES universes(id) ON DELETE SET NULL,

    -- Digest content
    title TEXT NOT NULL,
    summary TEXT NOT NULL,                      -- Brief overview
    full_content TEXT NOT NULL,                 -- Full markdown content

    -- Stats
    updates_count INTEGER NOT NULL DEFAULT 0,
    storylines_count INTEGER NOT NULL DEFAULT 0,

    -- Period covered
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Delivery tracking
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    emailed_at TIMESTAMPTZ,

    -- Update references (for linking back)
    update_ids JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Indexes for digests
CREATE INDEX idx_digests_user ON digests(user_id);
CREATE INDEX idx_digests_universe ON digests(universe_id);
CREATE INDEX idx_digests_generated ON digests(generated_at DESC);
CREATE INDEX idx_digests_unviewed ON digests(user_id, viewed_at) WHERE viewed_at IS NULL;

-- =============================================================================
-- NOTIFICATIONS TABLE
-- In-app notifications for users
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Notification content
    type TEXT NOT NULL CHECK (type IN ('digest_ready', 'cast_news', 'storyline_update', 'system', 'enrichment_complete')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Action link
    action_url TEXT,
    action_label TEXT,

    -- References
    digest_id UUID REFERENCES digests(id) ON DELETE SET NULL,
    storyline_id UUID REFERENCES storylines(id) ON DELETE SET NULL,

    -- State
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,

    -- Priority (for ordering)
    priority INTEGER NOT NULL DEFAULT 0,        -- Higher = more important

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- =============================================================================
-- USER_PREFERENCES TABLE
-- User notification and monitoring preferences
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Email preferences
    email_digests BOOLEAN NOT NULL DEFAULT true,
    email_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (email_frequency IN ('daily', 'weekly', 'never')),

    -- In-app preferences
    show_confidence_scores BOOLEAN NOT NULL DEFAULT false,
    auto_expand_updates BOOLEAN NOT NULL DEFAULT true,

    -- Monitoring preferences
    monitoring_enabled BOOLEAN NOT NULL DEFAULT true,

    -- Timezone for digest delivery
    timezone TEXT NOT NULL DEFAULT 'America/New_York',

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_storyline_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for storylines updated_at
CREATE TRIGGER trigger_storylines_updated_at
    BEFORE UPDATE ON storylines
    FOR EACH ROW
    EXECUTE FUNCTION update_storyline_timestamp();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_storyline_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    ));
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE storylines ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyline_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Storylines: Users can view storylines in universes they have access to
CREATE POLICY storylines_select ON storylines
    FOR SELECT USING (
        universe_id IN (
            SELECT id FROM universes WHERE is_public = true
            UNION
            SELECT universe_id FROM universe_members WHERE user_id = auth.uid()
        )
    );

-- Storylines: Users can insert/update storylines in universes they own or are members of
CREATE POLICY storylines_insert ON storylines
    FOR INSERT WITH CHECK (
        universe_id IN (
            SELECT universe_id FROM universe_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY storylines_update ON storylines
    FOR UPDATE USING (
        universe_id IN (
            SELECT universe_id FROM universe_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY storylines_delete ON storylines
    FOR DELETE USING (
        universe_id IN (
            SELECT universe_id FROM universe_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Storyline updates: Same access as parent storyline
CREATE POLICY storyline_updates_select ON storyline_updates
    FOR SELECT USING (
        storyline_id IN (
            SELECT id FROM storylines WHERE universe_id IN (
                SELECT id FROM universes WHERE is_public = true
                UNION
                SELECT universe_id FROM universe_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY storyline_updates_insert ON storyline_updates
    FOR INSERT WITH CHECK (
        storyline_id IN (
            SELECT id FROM storylines WHERE universe_id IN (
                SELECT universe_id FROM universe_members WHERE user_id = auth.uid()
            )
        )
    );

-- Digests: Users can only see their own digests
CREATE POLICY digests_select ON digests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY digests_insert ON digests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY digests_update ON digests
    FOR UPDATE USING (user_id = auth.uid());

-- Notifications: Users can only see their own notifications
CREATE POLICY notifications_select ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_insert ON notifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_update ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY notifications_delete ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- User preferences: Users can only access their own preferences
CREATE POLICY user_preferences_all ON user_preferences
    FOR ALL USING (user_id = auth.uid());

-- =============================================================================
-- GRANT PERMISSIONS (for service role)
-- =============================================================================

GRANT ALL ON storylines TO service_role;
GRANT ALL ON storyline_updates TO service_role;
GRANT ALL ON digests TO service_role;
GRANT ALL ON notifications TO service_role;
GRANT ALL ON user_preferences TO service_role;
