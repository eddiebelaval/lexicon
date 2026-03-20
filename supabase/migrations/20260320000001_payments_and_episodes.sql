-- Payment fields on cast_contracts + Episodes table
-- Bridges the gap from contract status tracking to full financial visibility
-- and adds episode-level organization to scene scheduling.

-- =============================================================================
-- PAYMENT FIELDS ON CAST_CONTRACTS
-- =============================================================================

ALTER TABLE cast_contracts
    ADD COLUMN daily_rate NUMERIC(10, 2),          -- $/day for daily-rate cast
    ADD COLUMN flat_fee NUMERIC(10, 2),            -- flat fee for flat-rate cast
    ADD COLUMN total_payment NUMERIC(10, 2),       -- computed or manually entered total
    ADD COLUMN paid_amount NUMERIC(10, 2) DEFAULT 0, -- how much has been paid so far
    ADD COLUMN paid_date TIMESTAMPTZ;              -- when payment was completed

COMMENT ON COLUMN cast_contracts.daily_rate IS 'Per-day rate for daily-rate cast members';
COMMENT ON COLUMN cast_contracts.flat_fee IS 'One-time flat fee for flat-rate cast members';
COMMENT ON COLUMN cast_contracts.total_payment IS 'Total payment amount (manual or computed from rate x days)';
COMMENT ON COLUMN cast_contracts.paid_amount IS 'Amount paid so far (for partial payments)';
COMMENT ON COLUMN cast_contracts.paid_date IS 'Date payment was completed';

-- =============================================================================
-- EPISODES TABLE
-- Links productions to episodes, scenes to episodes
-- =============================================================================

CREATE TABLE IF NOT EXISTS episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

    -- Episode metadata
    episode_number INTEGER NOT NULL,
    title TEXT,
    description TEXT,

    -- Dates
    air_date DATE,
    premiere_date DATE,

    -- Status
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_production', 'in_post', 'delivered', 'aired')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One episode number per production
    CONSTRAINT unique_episode_production UNIQUE (production_id, episode_number)
);

CREATE INDEX idx_episodes_production ON episodes(production_id);
CREATE INDEX idx_episodes_status ON episodes(status);
CREATE INDEX idx_episodes_air_date ON episodes(air_date);

-- Add episode linkage to scenes
ALTER TABLE scenes
    ADD COLUMN episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL;

CREATE INDEX idx_scenes_episode ON scenes(episode_id) WHERE episode_id IS NOT NULL;

-- Updated_at trigger for episodes
CREATE TRIGGER trigger_episodes_updated_at
    BEFORE UPDATE ON episodes
    FOR EACH ROW EXECUTE FUNCTION update_production_timestamp();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY episodes_select ON episodes
    FOR SELECT USING (
        production_id IN (
            SELECT id FROM productions WHERE universe_id IN (
                SELECT id FROM universes WHERE owner_id = auth.uid() OR is_public = true
            )
        )
    );

CREATE POLICY episodes_modify ON episodes
    FOR ALL USING (
        production_id IN (
            SELECT id FROM productions WHERE universe_id IN (
                SELECT id FROM universes WHERE owner_id = auth.uid()
            )
        )
    );

-- Service role access
GRANT ALL ON episodes TO service_role;
