-- ============================================================================
-- Lexicon Chat Interface & Production Tracking Migration
-- ============================================================================
-- Date: 2026-01-08
-- Description: Adds chat/conversation support and production tracking hierarchy
--   - conversations: Chat sessions linked to universes
--   - messages: Individual chat messages with citations and tool calls
--   - scripts: Production scripts within universes
--   - scenes: Scenes within scripts
--   - deadlines: Production deadlines
--   - deliverables: Items tied to deadlines
--   - saved_searches: User's saved search queries
--
-- Depends on:
--   - universes table (from 20260106_create_universes_table.sql)
--   - user_profiles table (from 20260110000001_unified_schema_phase1.sql)
-- ============================================================================

-- ============================================================================
-- CHAT TABLES - Conversation & Message Support
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Conversations - Chat sessions linked to universes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    universe_id UUID NOT NULL REFERENCES universes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    title TEXT NOT NULL DEFAULT 'New Conversation',
    summary TEXT,  -- AI-generated summary of the conversation

    -- Conversation metadata
    message_count INTEGER NOT NULL DEFAULT 0,
    last_message_at TIMESTAMPTZ,

    -- Archival
    is_archived BOOLEAN NOT NULL DEFAULT false,
    is_pinned BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_universe ON conversations(universe_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_pinned ON conversations(is_pinned) WHERE is_pinned = true;

-- ----------------------------------------------------------------------------
-- Messages - Individual chat messages with rich metadata
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Message content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- Rich metadata for AI responses
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{entity_id, entity_name, type, snippet}]
    tool_calls JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{tool_name, input, output, duration_ms}]

    -- Model information (for assistant messages)
    model TEXT,
    tokens_used INTEGER,

    -- Feedback tracking
    is_helpful BOOLEAN,  -- User feedback on response quality
    feedback_text TEXT,

    -- Linked entities mentioned/referenced in this message
    referenced_entities JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of entity UUIDs

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_citations ON messages USING gin(citations);

-- ============================================================================
-- PRODUCTION TRACKING TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Scripts - Production scripts within universes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    universe_id UUID NOT NULL REFERENCES universes(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    logline TEXT,

    -- Script metadata
    genre TEXT,
    format TEXT,  -- e.g., 'feature', 'pilot', 'short', 'episode'
    target_length TEXT,  -- e.g., '90-120 pages', '30 pages'

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'development'
        CHECK (status IN ('development', 'writing', 'revision', 'complete')),

    -- Progress metrics
    current_page_count INTEGER DEFAULT 0,
    scene_count INTEGER DEFAULT 0,

    -- Story structure elements
    synopsis TEXT,
    treatment TEXT,

    -- Ordering within universe
    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scripts_universe ON scripts(universe_id);
CREATE INDEX IF NOT EXISTS idx_scripts_status ON scripts(status);

-- ----------------------------------------------------------------------------
-- Scenes - Scenes within scripts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,

    -- Scene identification
    number INTEGER NOT NULL,  -- Scene number within script
    title TEXT NOT NULL,

    -- Scene content
    description TEXT,
    content TEXT,  -- Full scene content/pages

    -- Scene metadata
    location TEXT,
    time_of_day TEXT,  -- DAY, NIGHT, CONTINUOUS, etc.

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'outline'
        CHECK (status IN ('outline', 'draft', 'revision', 'locked')),

    -- Progress
    page_count INTEGER DEFAULT 0,

    -- Linked entities in this scene
    characters JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of character entity UUIDs
    locations JSONB NOT NULL DEFAULT '[]'::jsonb,   -- Array of location entity UUIDs

    -- Notes and revisions
    notes TEXT,
    revision_color TEXT,  -- WHITE, BLUE, PINK, YELLOW, etc.

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure unique scene numbers per script
    CONSTRAINT unique_scene_number_per_script UNIQUE (script_id, number)
);

CREATE INDEX IF NOT EXISTS idx_scenes_script ON scenes(script_id);
CREATE INDEX IF NOT EXISTS idx_scenes_status ON scenes(status);
CREATE INDEX IF NOT EXISTS idx_scenes_number ON scenes(script_id, number);

-- ----------------------------------------------------------------------------
-- Deadlines - Production deadlines for universes/scripts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    universe_id UUID NOT NULL REFERENCES universes(id) ON DELETE CASCADE,
    script_id UUID REFERENCES scripts(id) ON DELETE SET NULL,

    title TEXT NOT NULL,
    description TEXT,

    -- Deadline timing
    due_date DATE NOT NULL,
    due_time TIME,  -- Optional specific time

    -- Priority and status
    priority TEXT NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,

    -- Reminder settings
    reminder_days_before INTEGER,  -- Days before to remind
    reminded_at TIMESTAMPTZ,

    -- Recurring deadlines
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurrence_pattern TEXT,  -- RRULE format

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deadlines_universe ON deadlines(universe_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_script ON deadlines(script_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due ON deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_completed ON deadlines(completed) WHERE completed = false;

-- ----------------------------------------------------------------------------
-- Deliverables - Items tied to deadlines
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deadline_id UUID NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    description TEXT,

    -- Type of deliverable
    type TEXT NOT NULL CHECK (type IN ('script', 'outline', 'treatment', 'revision', 'notes', 'other')),

    -- Status
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,

    -- Linked file/content
    file_url TEXT,
    file_name TEXT,
    file_size_bytes INTEGER,

    -- Version tracking
    version INTEGER DEFAULT 1,

    -- Notes
    notes TEXT,

    -- Ordering
    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliverables_deadline ON deliverables(deadline_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_type ON deliverables(type);
CREATE INDEX IF NOT EXISTS idx_deliverables_completed ON deliverables(completed);

-- ----------------------------------------------------------------------------
-- Saved Searches - User's saved search queries
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    universe_id UUID NOT NULL REFERENCES universes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    query TEXT NOT NULL,
    name TEXT,  -- Optional friendly name for the search

    -- Search configuration
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {entity_types: [], date_range: {}, etc.}

    -- Usage stats
    use_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    -- Pinned for quick access
    is_pinned BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_universe ON saved_searches(universe_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_pinned ON saved_searches(is_pinned) WHERE is_pinned = true;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Based on universe ownership
-- ============================================================================

-- Helper function to check universe ownership
CREATE OR REPLACE FUNCTION is_universe_owner(universe_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM universes
        WHERE id = universe_uuid
        AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Conversations Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create conversations in own universes"
    ON conversations FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND is_universe_owner(universe_id)
    );

CREATE POLICY "Users can update own conversations"
    ON conversations FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
    ON conversations FOR DELETE
    USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Messages Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view messages in own conversations"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own conversations"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages in own conversations"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages in own conversations"
    ON messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Scripts Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view scripts in own universes"
    ON scripts FOR SELECT
    USING (is_universe_owner(universe_id));

CREATE POLICY "Users can create scripts in own universes"
    ON scripts FOR INSERT
    WITH CHECK (is_universe_owner(universe_id));

CREATE POLICY "Users can update scripts in own universes"
    ON scripts FOR UPDATE
    USING (is_universe_owner(universe_id))
    WITH CHECK (is_universe_owner(universe_id));

CREATE POLICY "Users can delete scripts in own universes"
    ON scripts FOR DELETE
    USING (is_universe_owner(universe_id));

-- ----------------------------------------------------------------------------
-- Scenes Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view scenes in own scripts"
    ON scenes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM scripts s
            WHERE s.id = scenes.script_id
            AND is_universe_owner(s.universe_id)
        )
    );

CREATE POLICY "Users can create scenes in own scripts"
    ON scenes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM scripts s
            WHERE s.id = scenes.script_id
            AND is_universe_owner(s.universe_id)
        )
    );

CREATE POLICY "Users can update scenes in own scripts"
    ON scenes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM scripts s
            WHERE s.id = scenes.script_id
            AND is_universe_owner(s.universe_id)
        )
    );

CREATE POLICY "Users can delete scenes in own scripts"
    ON scenes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM scripts s
            WHERE s.id = scenes.script_id
            AND is_universe_owner(s.universe_id)
        )
    );

-- ----------------------------------------------------------------------------
-- Deadlines Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view deadlines in own universes"
    ON deadlines FOR SELECT
    USING (is_universe_owner(universe_id));

CREATE POLICY "Users can create deadlines in own universes"
    ON deadlines FOR INSERT
    WITH CHECK (is_universe_owner(universe_id));

CREATE POLICY "Users can update deadlines in own universes"
    ON deadlines FOR UPDATE
    USING (is_universe_owner(universe_id))
    WITH CHECK (is_universe_owner(universe_id));

CREATE POLICY "Users can delete deadlines in own universes"
    ON deadlines FOR DELETE
    USING (is_universe_owner(universe_id));

-- ----------------------------------------------------------------------------
-- Deliverables Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view deliverables in own deadlines"
    ON deliverables FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM deadlines d
            WHERE d.id = deliverables.deadline_id
            AND is_universe_owner(d.universe_id)
        )
    );

CREATE POLICY "Users can create deliverables in own deadlines"
    ON deliverables FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM deadlines d
            WHERE d.id = deliverables.deadline_id
            AND is_universe_owner(d.universe_id)
        )
    );

CREATE POLICY "Users can update deliverables in own deadlines"
    ON deliverables FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM deadlines d
            WHERE d.id = deliverables.deadline_id
            AND is_universe_owner(d.universe_id)
        )
    );

CREATE POLICY "Users can delete deliverables in own deadlines"
    ON deliverables FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM deadlines d
            WHERE d.id = deliverables.deadline_id
            AND is_universe_owner(d.universe_id)
        )
    );

-- ----------------------------------------------------------------------------
-- Saved Searches Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own saved searches"
    ON saved_searches FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create saved searches in own universes"
    ON saved_searches FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND is_universe_owner(universe_id)
    );

CREATE POLICY "Users can update own saved searches"
    ON saved_searches FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own saved searches"
    ON saved_searches FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS - Auto-update timestamps and counts
-- ============================================================================

-- Update conversation timestamp and count when message is added
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversations
        SET
            message_count = message_count + 1,
            last_message_at = NEW.created_at,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE conversations
        SET
            message_count = GREATEST(message_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.conversation_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message
    AFTER INSERT OR DELETE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- Update script scene count when scene is added/removed
CREATE OR REPLACE FUNCTION update_script_scene_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE scripts
        SET
            scene_count = scene_count + 1,
            updated_at = NOW()
        WHERE id = NEW.script_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE scripts
        SET
            scene_count = GREATEST(scene_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.script_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_script_scene_count ON scenes;
CREATE TRIGGER update_script_scene_count
    AFTER INSERT OR DELETE ON scenes
    FOR EACH ROW
    EXECUTE FUNCTION update_script_scene_count();

-- Auto-update updated_at timestamps
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scripts_updated_at ON scripts;
CREATE TRIGGER update_scripts_updated_at
    BEFORE UPDATE ON scripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scenes_updated_at ON scenes;
CREATE TRIGGER update_scenes_updated_at
    BEFORE UPDATE ON scenes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deadlines_updated_at ON deadlines;
CREATE TRIGGER update_deadlines_updated_at
    BEFORE UPDATE ON deadlines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deliverables_updated_at ON deliverables;
CREATE TRIGGER update_deliverables_updated_at
    BEFORE UPDATE ON deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE conversations IS 'Chat sessions for Lexicon AI assistant, linked to universes';
COMMENT ON TABLE messages IS 'Individual messages in chat conversations with AI response metadata';
COMMENT ON COLUMN messages.citations IS 'Array of citation objects: [{entity_id, entity_name, type, snippet}]';
COMMENT ON COLUMN messages.tool_calls IS 'Array of tool call logs: [{tool_name, input, output, duration_ms}]';

COMMENT ON TABLE scripts IS 'Production scripts within story universes';
COMMENT ON TABLE scenes IS 'Individual scenes within scripts with linked entities';
COMMENT ON TABLE deadlines IS 'Production deadlines with optional script linkage';
COMMENT ON TABLE deliverables IS 'Deliverable items tied to deadlines';
COMMENT ON TABLE saved_searches IS 'User saved search queries for quick access';

COMMENT ON FUNCTION is_universe_owner IS 'Helper function to check if current user owns the specified universe';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
