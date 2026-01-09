-- ===========================================
-- Lexicon: Notifications & Digests Migration
-- Phase 4: Living Universe Notification System
-- ===========================================

-- -----------------------------
-- User Preferences Table
-- -----------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email_digests BOOLEAN NOT NULL DEFAULT true,
    email_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (email_frequency IN ('daily', 'weekly', 'never')),
    show_confidence_scores BOOLEAN NOT NULL DEFAULT true,
    auto_expand_updates BOOLEAN NOT NULL DEFAULT false,
    monitoring_enabled BOOLEAN NOT NULL DEFAULT true,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_email ON user_preferences(email_digests, email_frequency) WHERE email_digests = true;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- RLS for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role bypass for cron jobs
CREATE POLICY "Service role full access to preferences" ON user_preferences
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- -----------------------------
-- Notifications Table
-- -----------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('digest_ready', 'cast_news', 'storyline_update', 'system', 'enrichment_complete')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_label TEXT,
    digest_id UUID REFERENCES digests(id) ON DELETE SET NULL,
    storyline_id UUID REFERENCES storylines(id) ON DELETE SET NULL,
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL AND dismissed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage notifications" ON notifications
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- -----------------------------
-- Digests Table
-- -----------------------------
CREATE TABLE IF NOT EXISTS digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    universe_id UUID REFERENCES universes(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    full_content TEXT NOT NULL,
    updates_count INTEGER NOT NULL DEFAULT 0,
    storylines_count INTEGER NOT NULL DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    update_ids UUID[] DEFAULT '{}',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    emailed_at TIMESTAMPTZ
);

-- Indexes for digest queries
CREATE INDEX IF NOT EXISTS idx_digests_user_generated ON digests(user_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_digests_user_unviewed ON digests(user_id, viewed_at) WHERE viewed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_digests_universe ON digests(universe_id) WHERE universe_id IS NOT NULL;

-- RLS for digests
ALTER TABLE digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own digests" ON digests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own digests" ON digests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage digests" ON digests
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- -----------------------------
-- Add included_in_digest to storyline_updates if not exists
-- -----------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'storyline_updates'
        AND column_name = 'included_in_digest'
    ) THEN
        ALTER TABLE storyline_updates ADD COLUMN included_in_digest BOOLEAN NOT NULL DEFAULT false;
        CREATE INDEX idx_storyline_updates_digest ON storyline_updates(included_in_digest) WHERE included_in_digest = false;
    END IF;
END $$;

-- -----------------------------
-- Helper Functions
-- -----------------------------

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications
        WHERE user_id = p_user_id
        AND read_at IS NULL
        AND dismissed_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE notifications
    SET read_at = NOW()
    WHERE user_id = p_user_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE dismissed_at IS NOT NULL
    AND created_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------
-- Grant Permissions
-- -----------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_preferences TO authenticated;
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT SELECT, UPDATE ON digests TO authenticated;

GRANT ALL ON user_preferences TO service_role;
GRANT ALL ON notifications TO service_role;
GRANT ALL ON digests TO service_role;

GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications TO service_role;

-- -----------------------------
-- Comments
-- -----------------------------
COMMENT ON TABLE user_preferences IS 'User notification and display preferences';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE digests IS 'Daily/weekly digest summaries';
COMMENT ON COLUMN notifications.priority IS 'Higher priority = more important (0=system, 1=digest, 2=cast_news)';
COMMENT ON COLUMN digests.update_ids IS 'Array of storyline_update IDs included in this digest';
