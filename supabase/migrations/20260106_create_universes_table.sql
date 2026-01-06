-- Migration: Create universes table for Lexicon
-- Purpose: Store story universe metadata in PostgreSQL (graph data lives in Neo4j)
-- Date: 2026-01-06

-- Create the universes table
CREATE TABLE IF NOT EXISTS universes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_count INTEGER NOT NULL DEFAULT 0,
    relationship_count INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_universes_owner_id ON universes(owner_id);
CREATE INDEX IF NOT EXISTS idx_universes_is_public ON universes(is_public);
CREATE INDEX IF NOT EXISTS idx_universes_created_at ON universes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE universes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent migration)
DROP POLICY IF EXISTS "Users can read their own universes" ON universes;
DROP POLICY IF EXISTS "Users can read public universes" ON universes;
DROP POLICY IF EXISTS "Users can insert their own universes" ON universes;
DROP POLICY IF EXISTS "Users can update their own universes" ON universes;
DROP POLICY IF EXISTS "Users can delete their own universes" ON universes;

-- RLS Policy: Users can read their own universes
CREATE POLICY "Users can read their own universes"
ON universes
FOR SELECT
USING (auth.uid() = owner_id);

-- RLS Policy: Users can read public universes
CREATE POLICY "Users can read public universes"
ON universes
FOR SELECT
USING (is_public = true);

-- RLS Policy: Users can insert their own universes
CREATE POLICY "Users can insert their own universes"
ON universes
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- RLS Policy: Users can update their own universes
CREATE POLICY "Users can update their own universes"
ON universes
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- RLS Policy: Users can delete their own universes
CREATE POLICY "Users can delete their own universes"
ON universes
FOR DELETE
USING (auth.uid() = owner_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_universes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS set_universes_updated_at ON universes;
CREATE TRIGGER set_universes_updated_at
    BEFORE UPDATE ON universes
    FOR EACH ROW
    EXECUTE FUNCTION update_universes_updated_at();

-- Add comments to table for documentation
COMMENT ON TABLE universes IS 'Story universe metadata - graph data (entities/relationships) stored in Neo4j';
COMMENT ON COLUMN universes.entity_count IS 'Cached count of entities in Neo4j graph';
COMMENT ON COLUMN universes.relationship_count IS 'Cached count of relationships in Neo4j graph';
COMMENT ON COLUMN universes.is_public IS 'Whether universe is visible to all users';
