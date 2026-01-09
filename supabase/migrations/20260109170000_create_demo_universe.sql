-- Create Demo Universe
-- The Three Musketeers demo universe for anonymous users to explore

-- First, make owner_id nullable to support demo/public universes without an owner
ALTER TABLE universes ALTER COLUMN owner_id DROP NOT NULL;

-- Now create the demo universe with no owner (public demo)
INSERT INTO universes (
  id,
  name,
  description,
  owner_id,
  is_public,
  entity_count,
  relationship_count
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Three Musketeers',
  'Demo universe based on Alexandre Dumas'' classic novel. Explore the adventures of D''Artagnan and the Three Musketeers.',
  NULL,
  true,
  30,
  45
)
ON CONFLICT (id) DO NOTHING;

-- Update RLS policies to allow viewing universes with null owner (public demos)
DROP POLICY IF EXISTS "Users can view own or public universes" ON universes;
CREATE POLICY "Users can view own or public universes" ON universes
  FOR SELECT USING (
    owner_id = auth.uid()
    OR is_public = true
    OR owner_id IS NULL
  );

-- Add comment explaining this is a demo universe
COMMENT ON COLUMN universes.owner_id IS 'Owner of the universe. NULL for public demo universes.';
