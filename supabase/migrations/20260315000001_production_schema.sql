-- Production Management Schema for Lexi
-- Extends Lexicon with production scheduling, crew management, and cast tracking
-- for unscripted TV production (strategic anchor: Diaries S8)

-- =============================================================================
-- PRODUCTIONS TABLE
-- Top-level container for a production season
-- =============================================================================

CREATE TABLE IF NOT EXISTS productions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    universe_id UUID NOT NULL REFERENCES universes(id) ON DELETE CASCADE,

    -- Production metadata
    name TEXT NOT NULL,
    season TEXT,                                    -- e.g., "Season 8"
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pre_production', 'active', 'post_production', 'wrapped')),

    -- Date range
    start_date DATE,
    end_date DATE,

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

CREATE INDEX idx_productions_universe ON productions(universe_id);
CREATE INDEX idx_productions_status ON productions(status);

-- =============================================================================
-- CREW_MEMBERS TABLE
-- Production crew (ACs, producers, fixers, staff)
-- =============================================================================

CREATE TABLE IF NOT EXISTS crew_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

    -- Identity
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('staff', 'ac', 'producer', 'fixer', 'editor', 'coordinator')),
    contact_email TEXT,
    contact_phone TEXT,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crew_production ON crew_members(production_id);
CREATE INDEX idx_crew_role ON crew_members(role);
CREATE INDEX idx_crew_active ON crew_members(is_active) WHERE is_active = true;

-- =============================================================================
-- SCENES TABLE
-- Individual shoot scenes linked to cast (Neo4j entity IDs)
-- =============================================================================

CREATE TABLE IF NOT EXISTS scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

    -- Scene identification
    scene_number TEXT,                              -- e.g., "Scene 1", "Scene 2.5"
    title TEXT NOT NULL,                            -- e.g., "Chantel & Ashley Picnic"
    description TEXT,                               -- Full scene description

    -- Cast linkage (references Neo4j entity IDs)
    cast_entity_ids JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Scheduling
    scheduled_date DATE,
    scheduled_time TEXT,                            -- e.g., "10:30 AM PST" — kept as text for flexibility
    location TEXT,                                  -- e.g., "Lawrenceville, GA"
    location_details TEXT,                          -- e.g., "Hotel Isley: 2:30-3pm"

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'shot', 'cancelled', 'postponed', 'self_shot')),

    -- Equipment and logistics
    equipment_notes TEXT,                           -- e.g., "will need 2 kits and 1 mic"
    is_self_shot BOOLEAN NOT NULL DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scenes_production ON scenes(production_id);
CREATE INDEX idx_scenes_date ON scenes(scheduled_date);
CREATE INDEX idx_scenes_status ON scenes(status);
CREATE INDEX idx_scenes_cast ON scenes USING gin(cast_entity_ids);
CREATE INDEX idx_scenes_upcoming ON scenes(scheduled_date)
    WHERE status = 'scheduled' AND scheduled_date >= CURRENT_DATE;

-- =============================================================================
-- SCENE_ASSIGNMENTS TABLE
-- Links crew members to scenes
-- =============================================================================

CREATE TABLE IF NOT EXISTS scene_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    crew_member_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,

    -- Assignment details
    role TEXT NOT NULL DEFAULT 'ac' CHECK (role IN ('ac', 'producer', 'fixer', 'coordinator', 'backup')),
    notes TEXT,                                     -- e.g., "holding", "pickup only"

    -- Status
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'completed', 'cancelled')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate assignments
    CONSTRAINT unique_scene_crew UNIQUE (scene_id, crew_member_id)
);

CREATE INDEX idx_assignments_scene ON scene_assignments(scene_id);
CREATE INDEX idx_assignments_crew ON scene_assignments(crew_member_id);

-- =============================================================================
-- CAST_CONTRACTS TABLE
-- Tracks contract and completion status for cast members
-- =============================================================================

CREATE TABLE IF NOT EXISTS cast_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

    -- Cast linkage (references Neo4j entity ID)
    cast_entity_id TEXT NOT NULL,                   -- Neo4j entity ID

    -- Contract status
    contract_status TEXT NOT NULL DEFAULT 'pending' CHECK (contract_status IN ('signed', 'pending', 'offer_sent', 'dnc', 'email_sent', 'declined')),
    payment_type TEXT CHECK (payment_type IN ('daily', 'flat')),

    -- Completion tracking (mirrors the CSV columns)
    shoot_done BOOLEAN NOT NULL DEFAULT false,
    interview_done BOOLEAN NOT NULL DEFAULT false,
    pickup_done BOOLEAN NOT NULL DEFAULT false,
    payment_done BOOLEAN NOT NULL DEFAULT false,

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One contract per cast member per production
    CONSTRAINT unique_cast_production UNIQUE (production_id, cast_entity_id)
);

CREATE INDEX idx_contracts_production ON cast_contracts(production_id);
CREATE INDEX idx_contracts_cast ON cast_contracts(cast_entity_id);
CREATE INDEX idx_contracts_status ON cast_contracts(contract_status);
CREATE INDEX idx_contracts_incomplete ON cast_contracts(production_id)
    WHERE NOT (shoot_done AND interview_done AND pickup_done AND payment_done);

-- =============================================================================
-- CREW_AVAILABILITY TABLE
-- Daily availability status for crew members
-- =============================================================================

CREATE TABLE IF NOT EXISTS crew_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_member_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,

    -- Availability
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'ooo', 'dark', 'holding', 'booked')),
    notes TEXT,                                     -- e.g., "afternoon only", "hard out at 5pm"

    -- Prevent duplicate entries per crew per date
    CONSTRAINT unique_crew_date UNIQUE (crew_member_id, date)
);

CREATE INDEX idx_availability_crew ON crew_availability(crew_member_id);
CREATE INDEX idx_availability_date ON crew_availability(date);
CREATE INDEX idx_availability_status ON crew_availability(status);

-- =============================================================================
-- UPLOAD_TASKS TABLE
-- Tracks footage pickup and upload logistics
-- =============================================================================

CREATE TABLE IF NOT EXISTS upload_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,

    -- Assignment
    crew_member_id UUID REFERENCES crew_members(id) ON DELETE SET NULL,

    -- Scheduling
    scheduled_date DATE,
    scheduled_time TEXT,                            -- e.g., "10am pickup"

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'complete', 'cancelled')),
    notes TEXT,                                     -- e.g., "will upload next day"

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_uploads_scene ON upload_tasks(scene_id);
CREATE INDEX idx_uploads_crew ON upload_tasks(crew_member_id);
CREATE INDEX idx_uploads_date ON upload_tasks(scheduled_date);
CREATE INDEX idx_uploads_pending ON upload_tasks(status) WHERE status = 'pending';

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_production_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_productions_updated_at
    BEFORE UPDATE ON productions
    FOR EACH ROW EXECUTE FUNCTION update_production_timestamp();

CREATE TRIGGER trigger_crew_members_updated_at
    BEFORE UPDATE ON crew_members
    FOR EACH ROW EXECUTE FUNCTION update_production_timestamp();

CREATE TRIGGER trigger_scenes_updated_at
    BEFORE UPDATE ON scenes
    FOR EACH ROW EXECUTE FUNCTION update_production_timestamp();

CREATE TRIGGER trigger_cast_contracts_updated_at
    BEFORE UPDATE ON cast_contracts
    FOR EACH ROW EXECUTE FUNCTION update_production_timestamp();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cast_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_tasks ENABLE ROW LEVEL SECURITY;

-- Productions: accessible if user has access to the parent universe
CREATE POLICY productions_select ON productions
    FOR SELECT USING (
        universe_id IN (
            SELECT id FROM universes WHERE owner_id = auth.uid() OR is_public = true
        )
    );

CREATE POLICY productions_insert ON productions
    FOR INSERT WITH CHECK (
        universe_id IN (
            SELECT id FROM universes WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY productions_update ON productions
    FOR UPDATE USING (
        universe_id IN (
            SELECT id FROM universes WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY productions_delete ON productions
    FOR DELETE USING (
        universe_id IN (
            SELECT id FROM universes WHERE owner_id = auth.uid()
        )
    );

-- Crew: accessible via production -> universe chain
CREATE POLICY crew_members_select ON crew_members
    FOR SELECT USING (
        production_id IN (
            SELECT id FROM productions WHERE universe_id IN (
                SELECT id FROM universes WHERE owner_id = auth.uid() OR is_public = true
            )
        )
    );

CREATE POLICY crew_members_modify ON crew_members
    FOR ALL USING (
        production_id IN (
            SELECT id FROM productions WHERE universe_id IN (
                SELECT id FROM universes WHERE owner_id = auth.uid()
            )
        )
    );

-- Scenes: accessible via production -> universe chain
CREATE POLICY scenes_select ON scenes
    FOR SELECT USING (
        production_id IN (
            SELECT id FROM productions WHERE universe_id IN (
                SELECT id FROM universes WHERE owner_id = auth.uid() OR is_public = true
            )
        )
    );

CREATE POLICY scenes_modify ON scenes
    FOR ALL USING (
        production_id IN (
            SELECT id FROM productions WHERE universe_id IN (
                SELECT id FROM universes WHERE owner_id = auth.uid()
            )
        )
    );

-- Scene assignments: accessible via scene -> production -> universe chain
CREATE POLICY scene_assignments_select ON scene_assignments
    FOR SELECT USING (
        scene_id IN (
            SELECT id FROM scenes WHERE production_id IN (
                SELECT id FROM productions WHERE universe_id IN (
                    SELECT id FROM universes WHERE owner_id = auth.uid() OR is_public = true
                )
            )
        )
    );

CREATE POLICY scene_assignments_modify ON scene_assignments
    FOR ALL USING (
        scene_id IN (
            SELECT id FROM scenes WHERE production_id IN (
                SELECT id FROM productions WHERE universe_id IN (
                    SELECT id FROM universes WHERE owner_id = auth.uid()
                )
            )
        )
    );

-- Cast contracts: accessible via production -> universe chain
CREATE POLICY cast_contracts_select ON cast_contracts
    FOR SELECT USING (
        production_id IN (
            SELECT id FROM productions WHERE universe_id IN (
                SELECT id FROM universes WHERE owner_id = auth.uid() OR is_public = true
            )
        )
    );

CREATE POLICY cast_contracts_modify ON cast_contracts
    FOR ALL USING (
        production_id IN (
            SELECT id FROM productions WHERE universe_id IN (
                SELECT id FROM universes WHERE owner_id = auth.uid()
            )
        )
    );

-- Crew availability: accessible via crew -> production -> universe chain
CREATE POLICY crew_availability_select ON crew_availability
    FOR SELECT USING (
        crew_member_id IN (
            SELECT id FROM crew_members WHERE production_id IN (
                SELECT id FROM productions WHERE universe_id IN (
                    SELECT id FROM universes WHERE owner_id = auth.uid() OR is_public = true
                )
            )
        )
    );

CREATE POLICY crew_availability_modify ON crew_availability
    FOR ALL USING (
        crew_member_id IN (
            SELECT id FROM crew_members WHERE production_id IN (
                SELECT id FROM productions WHERE universe_id IN (
                    SELECT id FROM universes WHERE owner_id = auth.uid()
                )
            )
        )
    );

-- Upload tasks: accessible via scene -> production -> universe chain
CREATE POLICY upload_tasks_select ON upload_tasks
    FOR SELECT USING (
        scene_id IN (
            SELECT id FROM scenes WHERE production_id IN (
                SELECT id FROM productions WHERE universe_id IN (
                    SELECT id FROM universes WHERE owner_id = auth.uid() OR is_public = true
                )
            )
        )
    );

CREATE POLICY upload_tasks_modify ON upload_tasks
    FOR ALL USING (
        scene_id IN (
            SELECT id FROM scenes WHERE production_id IN (
                SELECT id FROM productions WHERE universe_id IN (
                    SELECT id FROM universes WHERE owner_id = auth.uid()
                )
            )
        )
    );

-- =============================================================================
-- GRANT PERMISSIONS (for service role)
-- =============================================================================

GRANT ALL ON productions TO service_role;
GRANT ALL ON crew_members TO service_role;
GRANT ALL ON scenes TO service_role;
GRANT ALL ON scene_assignments TO service_role;
GRANT ALL ON cast_contracts TO service_role;
GRANT ALL ON crew_availability TO service_role;
GRANT ALL ON upload_tasks TO service_role;
