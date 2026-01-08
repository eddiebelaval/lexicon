-- ============================================================================
-- ID8Labs Creator Core - Phase 2 Migration (MILO Tables)
-- Creates MILO productivity tables for cloud sync
-- Date: 2026-01-08
-- Depends on: Phase 1 (user_profiles, projects must exist)
-- ============================================================================

-- ============================================================================
-- MILO TABLES - Desktop Productivity (Synced via MCP)
-- ============================================================================

-- Goals - High-level objectives
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    title TEXT NOT NULL,
    description TEXT,

    -- Goal type
    goal_type TEXT NOT NULL DEFAULT 'personal',  -- personal, project, team

    -- Hierarchy (for quarterly → monthly → weekly breakdown)
    parent_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    timeframe TEXT,  -- yearly, quarterly, monthly, weekly

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
    sync_source TEXT DEFAULT 'web',  -- 'web' or 'milo'
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_project ON goals(project_id);
CREATE INDEX IF NOT EXISTS idx_goals_parent ON goals(parent_id);
CREATE INDEX IF NOT EXISTS idx_goals_milo ON goals(milo_id) WHERE milo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date) WHERE target_date IS NOT NULL;

-- Tasks - Individual work items
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

    -- Category (maps to MILO categories)
    category_id UUID,
    category_name TEXT,

    -- Time tracking
    estimated_minutes INTEGER,
    actual_minutes INTEGER,

    -- Multi-day task support (from MILO)
    start_date DATE,
    end_date DATE,
    estimated_days INTEGER DEFAULT 1,
    days_worked INTEGER DEFAULT 0,
    last_worked_date DATE,

    -- Scheduling
    due_date TIMESTAMPTZ,
    scheduled_date DATE,
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
    sync_source TEXT DEFAULT 'web',  -- 'web' or 'milo'
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milo ON tasks(milo_id) WHERE milo_id IS NOT NULL;

-- Focus Sessions - Pomodoro/deep work tracking
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
    sync_source TEXT DEFAULT 'web',
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_task ON focus_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON focus_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_milo ON focus_sessions(milo_id) WHERE milo_id IS NOT NULL;

-- Activity Log - App/website usage tracking from MILO
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Activity details
    app_name TEXT NOT NULL,
    bundle_id TEXT,
    window_title TEXT,
    url TEXT,

    -- State classification (green/amber/red from MILO)
    state TEXT CHECK (state IN ('green', 'amber', 'red')),

    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    duration_seconds INTEGER NOT NULL,

    -- Categorization
    category TEXT,  -- e.g., "coding", "writing", "communication", "distraction"
    is_productive BOOLEAN,

    -- MILO sync
    milo_id TEXT,
    sync_source TEXT DEFAULT 'milo',
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_started ON activity_log(started_at);
CREATE INDEX IF NOT EXISTS idx_activity_app ON activity_log(app_name);
CREATE INDEX IF NOT EXISTS idx_activity_state ON activity_log(state);
CREATE INDEX IF NOT EXISTS idx_activity_milo ON activity_log(milo_id) WHERE milo_id IS NOT NULL;

-- App Classifications - How apps are categorized (synced from MILO defaults + user customizations)
CREATE TABLE IF NOT EXISTS app_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    app_name TEXT NOT NULL,
    bundle_id TEXT,
    default_state TEXT CHECK (default_state IN ('green', 'amber', 'red')),
    keywords JSONB DEFAULT '[]'::jsonb,
    is_custom BOOLEAN NOT NULL DEFAULT false,

    -- MILO sync
    milo_id TEXT,
    sync_source TEXT DEFAULT 'web',
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_app_per_user UNIQUE (user_id, app_name)
);

CREATE INDEX IF NOT EXISTS idx_app_class_user ON app_classifications(user_id);
CREATE INDEX IF NOT EXISTS idx_app_class_milo ON app_classifications(milo_id) WHERE milo_id IS NOT NULL;

-- Daily Scores - Aggregated daily metrics from MILO
CREATE TABLE IF NOT EXISTS daily_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    date DATE NOT NULL,

    -- Time tracking (in minutes)
    signal_minutes INTEGER NOT NULL DEFAULT 0,
    noise_minutes INTEGER NOT NULL DEFAULT 0,
    adjacent_minutes INTEGER NOT NULL DEFAULT 0,

    -- Task metrics
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    tasks_total INTEGER NOT NULL DEFAULT 0,

    -- Score
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    streak_day INTEGER NOT NULL DEFAULT 0,

    -- AI insights
    insights TEXT,

    -- MILO sync
    milo_id TEXT,
    sync_source TEXT DEFAULT 'milo',
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_score_per_day UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_scores_user ON daily_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_date ON daily_scores(date);
CREATE INDEX IF NOT EXISTS idx_scores_milo ON daily_scores(milo_id) WHERE milo_id IS NOT NULL;

-- Sync Queue - Pending sync operations for offline support
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    tool tool_type NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    payload JSONB NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_sync_queue_tool ON sync_queue(tool);

-- ============================================================================
-- Enable RLS on MILO tables
-- ============================================================================

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - All MILO tables are user-owned
-- ============================================================================

-- Goals
CREATE POLICY "Users can manage own goals" ON goals FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Tasks
CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Focus Sessions
CREATE POLICY "Users can manage own focus sessions" ON focus_sessions FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Activity Log
CREATE POLICY "Users can manage own activity log" ON activity_log FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- App Classifications
CREATE POLICY "Users can manage own app classifications" ON app_classifications FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Daily Scores
CREATE POLICY "Users can manage own daily scores" ON daily_scores FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Sync Queue
CREATE POLICY "Users can manage own sync queue" ON sync_queue FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_classifications_updated_at ON app_classifications;
CREATE TRIGGER update_app_classifications_updated_at BEFORE UPDATE ON app_classifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_scores_updated_at ON daily_scores;
CREATE TRIGGER update_daily_scores_updated_at BEFORE UPDATE ON daily_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update project task count
CREATE OR REPLACE FUNCTION update_project_task_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.project_id IS NOT NULL THEN
        UPDATE projects SET task_count = task_count + 1 WHERE id = NEW.project_id;
    ELSIF TG_OP = 'DELETE' AND OLD.project_id IS NOT NULL THEN
        UPDATE projects SET task_count = task_count - 1 WHERE id = OLD.project_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.project_id IS DISTINCT FROM NEW.project_id THEN
            IF OLD.project_id IS NOT NULL THEN
                UPDATE projects SET task_count = task_count - 1 WHERE id = OLD.project_id;
            END IF;
            IF NEW.project_id IS NOT NULL THEN
                UPDATE projects SET task_count = task_count + 1 WHERE id = NEW.project_id;
            END IF;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_task_count ON tasks;
CREATE TRIGGER update_task_count
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_project_task_count();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE goals IS 'MILO goals - synced from desktop app via MCP bridge';
COMMENT ON TABLE tasks IS 'MILO tasks - work items synced from desktop app';
COMMENT ON TABLE focus_sessions IS 'MILO focus sessions - pomodoro/deep work tracking';
COMMENT ON TABLE activity_log IS 'MILO activity log - app usage tracking from desktop';
COMMENT ON TABLE app_classifications IS 'MILO app classifications - how apps are categorized (green/amber/red)';
COMMENT ON TABLE daily_scores IS 'MILO daily scores - signal-to-noise metrics';
COMMENT ON TABLE sync_queue IS 'Offline sync queue for MILO desktop app';
