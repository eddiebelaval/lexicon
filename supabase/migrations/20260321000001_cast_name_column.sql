-- Add cast_name column for human-readable display names
-- Replaces monospace entity ID display (e.g., "cast-chantel+ashley" -> "Chantel Ashley")

ALTER TABLE cast_contracts ADD COLUMN IF NOT EXISTS cast_name TEXT;

-- Backfill: parse entity ID slug to human name
UPDATE cast_contracts
SET cast_name = INITCAP(REPLACE(REPLACE(cast_entity_id, 'cast-', ''), '+', ' '))
WHERE cast_name IS NULL;

COMMENT ON COLUMN cast_contracts.cast_name IS 'Human-readable display name, backfilled from entity ID slug';
