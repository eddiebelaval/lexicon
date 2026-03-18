-- Telegram integration + Activity Log
-- Adds telegram_user_id to crew_members for bot identity mapping
-- Creates activity_log for full audit trail of all Lexi actions

-- ============================================
-- Add Telegram identity to crew members
-- ============================================

ALTER TABLE crew_members
  ADD COLUMN IF NOT EXISTS telegram_user_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT;

CREATE INDEX IF NOT EXISTS idx_crew_telegram_user_id
  ON crew_members (telegram_user_id)
  WHERE telegram_user_id IS NOT NULL;

-- ============================================
-- Activity Log — WHO did WHAT, WHEN, via WHERE
-- ============================================

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  actor_role TEXT,
  actor_crew_id UUID REFERENCES crew_members(id),
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'web', 'system', 'api')),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_log_production ON activity_log (production_id, created_at DESC);
CREATE INDEX idx_activity_log_actor ON activity_log (actor_crew_id) WHERE actor_crew_id IS NOT NULL;
CREATE INDEX idx_activity_log_channel ON activity_log (channel);

-- RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_read_all"
  ON activity_log FOR SELECT
  USING (true);

CREATE POLICY "activity_log_insert_service"
  ON activity_log FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Telegram bot registration codes (one-time use)
-- ============================================

CREATE TABLE IF NOT EXISTS telegram_registration_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_member_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telegram_reg_code ON telegram_registration_codes (code) WHERE used_at IS NULL;
