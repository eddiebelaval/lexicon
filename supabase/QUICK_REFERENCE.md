# Lexicon Supabase Quick Reference

Cheat sheet for common database operations.

## Import Client

```typescript
import { supabase } from '@/lib/supabase';
import {
  getUserUniverses,
  getUniverse,
  createUniverse,
  updateUniverse,
  deleteUniverse,
  updateUniverseStats,
} from '@/lib/supabase';
```

## Authentication

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
});
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
});
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current User

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();
```

## Universe Operations

### Create Universe

```typescript
const universe = await createUniverse(
  {
    name: 'My Story World',
    description: 'An epic fantasy realm',
    isPublic: false, // optional, defaults to false
  },
  userId
);
```

### Get User's Universes

```typescript
const universes = await getUserUniverses(userId);
```

### Get Public Universes

```typescript
import { getPublicUniverses } from '@/lib/supabase';

const publicUniverses = await getPublicUniverses();
```

### Get Single Universe

```typescript
const universe = await getUniverse(universeId);
// Returns null if not found or user doesn't have access
```

### Update Universe

```typescript
const updated = await updateUniverse(universeId, {
  name: 'New Name',
  description: 'Updated description',
  is_public: true,
});
```

### Update Counts from Neo4j

```typescript
// Call this after adding/removing entities or relationships in Neo4j
await updateUniverseStats(universeId, {
  entityCount: 42,
  relationshipCount: 87,
});
```

### Delete Universe

```typescript
const success = await deleteUniverse(universeId);

// IMPORTANT: This only deletes the Supabase record
// You must also clean up Neo4j nodes/relationships!

// After deleting from Supabase:
await neo4jDriver.executeQuery(
  'MATCH (e:Entity {universeId: $universeId}) DETACH DELETE e',
  { universeId }
);
```

### Toggle Public/Private

```typescript
import { toggleUniverseVisibility } from '@/lib/supabase';

const updated = await toggleUniverseVisibility(universeId);
```

## Raw Queries

If you need more control, use the Supabase client directly:

### Insert

```typescript
const { data, error } = await supabase
  .from('universes')
  .insert({
    name: 'My Universe',
    description: 'Description here',
    owner_id: userId,
  })
  .select()
  .single();
```

### Select with Filters

```typescript
const { data, error } = await supabase
  .from('universes')
  .select('*')
  .eq('owner_id', userId)
  .eq('is_public', true)
  .order('created_at', { ascending: false })
  .limit(10);
```

### Update

```typescript
const { data, error } = await supabase
  .from('universes')
  .update({ name: 'New Name' })
  .eq('id', universeId)
  .select()
  .single();
```

### Delete

```typescript
const { error } = await supabase.from('universes').delete().eq('id', universeId);
```

### Count

```typescript
const { count, error } = await supabase
  .from('universes')
  .select('*', { count: 'exact', head: true })
  .eq('owner_id', userId);
```

## API Routes

For server-side operations (Next.js API routes):

```typescript
// app/api/universes/route.ts
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createAdminClient();

  // Admin client bypasses RLS - use carefully!
  const { data, error } = await supabase.from('universes').select('*');

  return Response.json({ data });
}
```

## Error Handling

```typescript
import { isApiError } from '@/lib/supabase';

const result = await createUniverse(input, userId);

if (!result) {
  // Handle error
  console.error('Failed to create universe');
  return;
}

// Success
console.log('Created:', result);
```

## TypeScript Types

```typescript
import type { Universe, CreateUniverseInput } from '@/types';
import type { Database } from '@/types/supabase';

// Universe type is fully typed
const universe: Universe = await getUniverse(id);

// Database type for Supabase client
const client = createClient<Database>(url, key);
```

## Common Patterns

### Check if User Owns Universe

```typescript
const universe = await getUniverse(universeId);
const isOwner = universe?.owner_id === userId;
```

### List All Accessible Universes

```typescript
const [ownUniverses, publicUniverses] = await Promise.all([
  getUserUniverses(userId),
  getPublicUniverses(),
]);

// Combine and deduplicate
const allUniverses = [
  ...ownUniverses,
  ...publicUniverses.filter((u) => u.owner_id !== userId),
];
```

### Sync Neo4j Counts

```typescript
// After bulk operations in Neo4j
async function syncUniverseCounts(universeId: string) {
  const entityCount = await neo4jDriver.executeQuery(
    'MATCH (e:Entity {universeId: $universeId}) RETURN count(e) as count',
    { universeId }
  );

  const relationshipCount = await neo4jDriver.executeQuery(
    'MATCH ()-[r]->() WHERE r.universeId = $universeId RETURN count(r) as count',
    { universeId }
  );

  await updateUniverseStats(universeId, {
    entityCount: entityCount.records[0].get('count').toNumber(),
    relationshipCount: relationshipCount.records[0].get('count').toNumber(),
  });
}
```

## Testing Queries

### Via Supabase Dashboard

1. Go to SQL Editor
2. Run test queries:

```sql
-- See all universes (as admin)
SELECT * FROM universes ORDER BY created_at DESC;

-- Count by owner
SELECT owner_id, count(*) as universe_count
FROM universes
GROUP BY owner_id;

-- Public universes
SELECT * FROM universes WHERE is_public = true;

-- Universes with stats
SELECT
  name,
  entity_count,
  relationship_count,
  entity_count + relationship_count as total_items
FROM universes
ORDER BY total_items DESC;
```

## Debugging

### Enable Query Logging

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  auth: {
    debug: true, // Log auth events
  },
});
```

### Check RLS Policies

```sql
-- View all policies for universes table
SELECT * FROM pg_policies WHERE tablename = 'universes';
```

### Test RLS as User

```sql
-- In SQL Editor, set user context (admin only)
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims.sub = 'user-id-here';

-- Now queries run as that user
SELECT * FROM universes; -- Should only show user's universes + public
```

## Environment Variables Reference

```env
# Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Server-only (NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Resources

- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [RLS Examples](https://supabase.com/docs/guides/auth/row-level-security)
