-- =============================================================================
-- LIFECYCLE ENGINE SCHEMA
-- =============================================================================
-- The core of Lexicon as a production operating system.
-- Every production asset moves through typed stages with transitions,
-- timestamps, owners, and blockers.
--
-- Design:
--   asset_types      = what kinds of assets a show tracks (per-production)
--   lifecycle_stages  = ordered stages within an asset type
--   asset_instances   = actual assets with current stage + metadata
--   stage_transitions = audit log of every stage change
--
-- The system ships with default asset types for unscripted TV, but each
-- show defines its own during intake.
-- =============================================================================

-- =============================================================================
-- ASSET TYPES TABLE
-- Defines what categories of assets a production tracks.
-- Each production gets its own set (copied from defaults during intake).
-- =============================================================================

CREATE TABLE IF NOT EXISTS asset_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

    -- Identity
    name TEXT NOT NULL,                             -- e.g., "Contract", "Shoot", "Deliverable"
    slug TEXT NOT NULL,                             -- e.g., "contract", "shoot", "deliverable"
    description TEXT,                               -- What this asset type represents
    icon TEXT,                                      -- Lucide icon name for UI

    -- Linking to existing tables (optional)
    -- When an asset type maps to an existing table, source_table tells us which one.
    -- This enables lifecycle tracking on top of existing data without migration.
    source_table TEXT,                              -- e.g., "cast_contracts", "scenes", "upload_tasks"

    -- Display
    color TEXT NOT NULL DEFAULT '#6b7280',          -- Hex color for UI badges
    sort_order INT NOT NULL DEFAULT 0,              -- Display order in UI

    -- Meta
    is_default BOOLEAN NOT NULL DEFAULT false,      -- Was this created from system defaults?
    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One asset type per slug per production
    CONSTRAINT unique_asset_type_slug UNIQUE (production_id, slug)
);

CREATE INDEX idx_asset_types_production ON asset_types(production_id);
CREATE INDEX idx_asset_types_slug ON asset_types(slug);

-- =============================================================================
-- LIFECYCLE STAGES TABLE
-- Ordered stages within an asset type. An asset moves through these.
-- =============================================================================

CREATE TABLE IF NOT EXISTS lifecycle_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_type_id UUID NOT NULL REFERENCES asset_types(id) ON DELETE CASCADE,

    -- Identity
    name TEXT NOT NULL,                             -- e.g., "Draft", "Signed", "Shot"
    slug TEXT NOT NULL,                             -- e.g., "draft", "signed", "shot"
    description TEXT,                               -- What this stage means

    -- Position in lifecycle
    stage_order INT NOT NULL,                       -- 0-indexed order in the lifecycle
    is_initial BOOLEAN NOT NULL DEFAULT false,      -- Is this the starting stage?
    is_terminal BOOLEAN NOT NULL DEFAULT false,     -- Is this a final/completed stage?

    -- Display
    color TEXT NOT NULL DEFAULT '#6b7280',          -- Hex color for stage pill
    bg_color TEXT,                                  -- Optional background color (CSS class or hex)

    -- Behavior
    auto_advance_after_days INT,                    -- Auto-advance if stuck (null = manual only)
    requires_confirmation BOOLEAN NOT NULL DEFAULT false, -- Needs explicit "confirm" before advancing

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One stage per slug per asset type
    CONSTRAINT unique_stage_slug UNIQUE (asset_type_id, slug),
    -- One stage per order per asset type
    CONSTRAINT unique_stage_order UNIQUE (asset_type_id, stage_order)
);

CREATE INDEX idx_stages_asset_type ON lifecycle_stages(asset_type_id);
CREATE INDEX idx_stages_order ON lifecycle_stages(asset_type_id, stage_order);

-- =============================================================================
-- ASSET INSTANCES TABLE
-- The actual tracked assets. Each links to an asset_type and has a current stage.
-- Optionally links back to a source record (contract, scene, etc.) via polymorphic ref.
-- =============================================================================

CREATE TABLE IF NOT EXISTS asset_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
    asset_type_id UUID NOT NULL REFERENCES asset_types(id) ON DELETE CASCADE,

    -- Identity
    name TEXT NOT NULL,                             -- e.g., "Chantel Contract", "D7-001 Chantel apartment move-in"
    description TEXT,

    -- Current lifecycle state
    current_stage_id UUID NOT NULL REFERENCES lifecycle_stages(id),
    stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- When it entered current stage

    -- Ownership
    owner_id UUID REFERENCES user_profiles(id),     -- Who is responsible for this asset
    owner_name TEXT,                                 -- Denormalized for display (crew/cast name)

    -- Polymorphic source link (connects to existing tables)
    source_type TEXT,                               -- e.g., "cast_contract", "scene", "upload_task"
    source_id TEXT,                                 -- UUID or ID of the source record

    -- Flexible metadata (show-specific fields)
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Blocking
    blocked_by TEXT,                                -- Free-text description of what's blocking
    is_blocked BOOLEAN NOT NULL DEFAULT false,

    -- Priority (for sorting/alerts)
    priority INT NOT NULL DEFAULT 0,                -- 0=normal, 1=high, 2=urgent
    due_date DATE,                                  -- When this asset should reach terminal stage

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,                       -- Set when reaching a terminal stage

    -- One asset instance per source record (prevents double-tracking)
    CONSTRAINT unique_source UNIQUE (source_type, source_id)
);

CREATE INDEX idx_instances_production ON asset_instances(production_id);
CREATE INDEX idx_instances_type ON asset_instances(asset_type_id);
CREATE INDEX idx_instances_stage ON asset_instances(current_stage_id);
CREATE INDEX idx_instances_source ON asset_instances(source_type, source_id);
CREATE INDEX idx_instances_blocked ON asset_instances(production_id) WHERE is_blocked = true;
CREATE INDEX idx_instances_overdue ON asset_instances(due_date) WHERE completed_at IS NULL;
CREATE INDEX idx_instances_priority ON asset_instances(production_id, priority DESC);

-- =============================================================================
-- STAGE TRANSITIONS TABLE
-- Audit log of every stage change. Immutable history.
-- =============================================================================

CREATE TABLE IF NOT EXISTS stage_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_instance_id UUID NOT NULL REFERENCES asset_instances(id) ON DELETE CASCADE,

    -- Transition
    from_stage_id UUID REFERENCES lifecycle_stages(id),  -- NULL for initial creation
    to_stage_id UUID NOT NULL REFERENCES lifecycle_stages(id),

    -- Context
    transitioned_by UUID REFERENCES user_profiles(id),
    transitioned_by_name TEXT,                       -- Denormalized (could be Lexi, a crew member, etc.)
    reason TEXT,                                      -- Why the transition happened
    automated BOOLEAN NOT NULL DEFAULT false,         -- Was this an auto-advance?

    -- Timestamp
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transitions_instance ON stage_transitions(asset_instance_id);
CREATE INDEX idx_transitions_time ON stage_transitions(transitioned_at DESC);

-- =============================================================================
-- ALLOWED TRANSITIONS TABLE (optional — enforces valid stage paths)
-- If populated, only these from->to transitions are allowed.
-- If empty for an asset type, any forward transition is allowed.
-- =============================================================================

CREATE TABLE IF NOT EXISTS allowed_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_type_id UUID NOT NULL REFERENCES asset_types(id) ON DELETE CASCADE,
    from_stage_id UUID NOT NULL REFERENCES lifecycle_stages(id) ON DELETE CASCADE,
    to_stage_id UUID NOT NULL REFERENCES lifecycle_stages(id) ON DELETE CASCADE,

    -- Prevent duplicates
    CONSTRAINT unique_transition UNIQUE (asset_type_id, from_stage_id, to_stage_id)
);

CREATE INDEX idx_allowed_from ON allowed_transitions(from_stage_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- updated_at triggers
CREATE TRIGGER trigger_asset_types_updated_at
    BEFORE UPDATE ON asset_types
    FOR EACH ROW EXECUTE FUNCTION update_production_timestamp();

CREATE TRIGGER trigger_asset_instances_updated_at
    BEFORE UPDATE ON asset_instances
    FOR EACH ROW EXECUTE FUNCTION update_production_timestamp();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifecycle_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_transitions ENABLE ROW LEVEL SECURITY;

-- Asset types: accessible via production -> universe chain
CREATE POLICY asset_types_select ON asset_types
    FOR SELECT USING (
        production_id IN (
            SELECT id FROM productions WHERE universe_id IN (
                SELECT id FROM universes WHERE owner_id = auth.uid() OR is_public = true
            )
        )
    );

CREATE POLICY asset_types_modify ON asset_types
    FOR ALL USING (
        production_id IN (
            SELECT id FROM productions WHERE universe_id IN (
                SELECT id FROM universes WHERE owner_id = auth.uid()
            )
        )
    );

-- Lifecycle stages: accessible via asset_type -> production -> universe chain
CREATE POLICY lifecycle_stages_select ON lifecycle_stages
    FOR SELECT USING (
        asset_type_id IN (
            SELECT id FROM asset_types WHERE production_id IN (
                SELECT id FROM productions WHERE universe_id IN (
                    SELECT id FROM universes WHERE owner_id = auth.uid() OR is_public = true
                )
            )
        )
    );

CREATE POLICY lifecycle_stages_modify ON lifecycle_stages
    FOR ALL USING (
        asset_type_id IN (
            SELECT id FROM asset_types WHERE production_id IN (
                SELECT id FROM productions WHERE universe_id IN (
                    SELECT id FROM universes WHERE owner_id = auth.uid()
                )
            )
        )
    );

-- Asset instances: accessible via production -> universe chain
CREATE POLICY asset_instances_select ON asset_instances
    FOR SELECT USING (
        production_id IN (
            SELECT id FROM productions WHERE universe_id IN (
                SELECT id FROM universes WHERE owner_id = auth.uid() OR is_public = true
            )
        )
    );

CREATE POLICY asset_instances_modify ON asset_instances
    FOR ALL USING (
        production_id IN (
            SELECT id FROM productions WHERE universe_id IN (
                SELECT id FROM universes WHERE owner_id = auth.uid()
            )
        )
    );

-- Stage transitions: accessible via asset_instance -> production -> universe chain
CREATE POLICY stage_transitions_select ON stage_transitions
    FOR SELECT USING (
        asset_instance_id IN (
            SELECT id FROM asset_instances WHERE production_id IN (
                SELECT id FROM productions WHERE universe_id IN (
                    SELECT id FROM universes WHERE owner_id = auth.uid() OR is_public = true
                )
            )
        )
    );

CREATE POLICY stage_transitions_modify ON stage_transitions
    FOR ALL USING (
        asset_instance_id IN (
            SELECT id FROM asset_instances WHERE production_id IN (
                SELECT id FROM productions WHERE universe_id IN (
                    SELECT id FROM universes WHERE owner_id = auth.uid()
                )
            )
        )
    );

-- Allowed transitions: accessible via asset_type -> production -> universe chain
CREATE POLICY allowed_transitions_select ON allowed_transitions
    FOR SELECT USING (
        asset_type_id IN (
            SELECT id FROM asset_types WHERE production_id IN (
                SELECT id FROM productions WHERE universe_id IN (
                    SELECT id FROM universes WHERE owner_id = auth.uid() OR is_public = true
                )
            )
        )
    );

CREATE POLICY allowed_transitions_modify ON allowed_transitions
    FOR ALL USING (
        asset_type_id IN (
            SELECT id FROM asset_types WHERE production_id IN (
                SELECT id FROM productions WHERE universe_id IN (
                    SELECT id FROM universes WHERE owner_id = auth.uid()
                )
            )
        )
    );

-- =============================================================================
-- GRANTS (service role)
-- =============================================================================

GRANT ALL ON asset_types TO service_role;
GRANT ALL ON lifecycle_stages TO service_role;
GRANT ALL ON asset_instances TO service_role;
GRANT ALL ON stage_transitions TO service_role;
GRANT ALL ON allowed_transitions TO service_role;
