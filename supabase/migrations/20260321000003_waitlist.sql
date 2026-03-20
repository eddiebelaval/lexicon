-- Waitlist table for landing page signups
CREATE TABLE IF NOT EXISTS waitlist (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS (public insert, admin read)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist_insert" ON waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "waitlist_select" ON waitlist FOR SELECT USING (true);
