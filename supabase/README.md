# Lexicon - Supabase Database Setup

This directory contains database migrations and setup scripts for the Lexicon PostgreSQL database (user data and metadata). Graph data (entities and relationships) are stored in Neo4j.

## Database Architecture

**PostgreSQL (Supabase):**
- User accounts and authentication
- Universe metadata (name, description, owner, stats)
- Future: billing, subscriptions, usage tracking

**Neo4j (Aura):**
- Entity nodes (characters, locations, events, objects, factions)
- Relationships between entities
- Graph traversal and pathfinding

## Schema Overview

### `universes` Table

Stores metadata about story universes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `name` | TEXT | Universe name (required) |
| `description` | TEXT | Description of the story world |
| `owner_id` | UUID | References auth.users(id), CASCADE delete |
| `entity_count` | INTEGER | Cached count from Neo4j graph |
| `relationship_count` | INTEGER | Cached count from Neo4j graph |
| `is_public` | BOOLEAN | Whether universe is publicly visible |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update (auto-updated via trigger) |

### Row Level Security (RLS)

All policies are enabled for multi-tenant security:

- **Read own:** Users can SELECT their own universes (`owner_id = auth.uid()`)
- **Read public:** Users can SELECT any public universe (`is_public = true`)
- **Insert own:** Users can INSERT universes they own
- **Update own:** Users can UPDATE their own universes
- **Delete own:** Users can DELETE their own universes

### Indexes

- `idx_universes_owner_id` - Fast lookups by owner
- `idx_universes_is_public` - Fast filtering of public universes
- `idx_universes_created_at` - Chronological sorting

## Migration Files

### `20260106_create_universes_table.sql`

Initial schema for universes table with:
- Full table definition
- Indexes for performance
- RLS policies for security
- Auto-update trigger for `updated_at`
- Inline documentation via comments

## Applying Migrations

### Option 1: Supabase Dashboard (Recommended for First Time)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (ID8Labs or create new)
3. Navigate to **SQL Editor**
4. Copy the contents of `migrations/20260106_create_universes_table.sql`
5. Paste and click **Run**
6. Verify in **Table Editor** that `universes` table exists

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Apply migration
supabase db push --include-all
```

### Option 3: Direct SQL Connection

```bash
# Set your project ID
export SUPABASE_PROJECT_ID=your-project-id

# Run the helper script
./apply-migration.sh
```

## Environment Variables

Add these to your `/Users/eddiebelaval/Development/id8/lexicon/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Neo4j (for graph data)
NEO4J_URI=neo4j+s://YOUR_INSTANCE.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
```

## Testing the Migration

After applying the migration, test it:

```sql
-- Test 1: Insert a test universe (as authenticated user)
INSERT INTO universes (name, description, owner_id)
VALUES ('Test Universe', 'A test story world', auth.uid());

-- Test 2: Verify RLS policies
SELECT * FROM universes; -- Should only show your universes + public ones

-- Test 3: Check trigger
UPDATE universes SET name = 'Updated Name' WHERE id = 'some-id';
SELECT updated_at FROM universes WHERE id = 'some-id'; -- Should be recent timestamp
```

## Future Migrations

When creating new migrations:

1. Create file: `migrations/YYYYMMDD_description.sql`
2. Use `IF NOT EXISTS` for idempotency
3. Drop policies before recreating
4. Add comments for documentation
5. Test locally before applying to production

## Data Synchronization

The `entity_count` and `relationship_count` columns are caches of Neo4j data. Keep them in sync:

```typescript
// After creating entities in Neo4j
await updateUniverseStats(universeId, {
  entityCount: newCount,
  relationshipCount: newRelCount
});
```

## Backup and Recovery

Supabase provides automatic backups. For additional safety:

```bash
# Export schema
supabase db dump --schema public > backup-schema.sql

# Export data
supabase db dump --data-only > backup-data.sql
```

## Support

For issues with:
- **Supabase setup:** [Supabase Docs](https://supabase.com/docs)
- **RLS policies:** [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- **Lexicon specifics:** Check `/Users/eddiebelaval/Development/id8/lexicon/CLAUDE.md`
