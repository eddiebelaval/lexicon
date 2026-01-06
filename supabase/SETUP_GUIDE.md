# Lexicon Supabase Setup Guide

Quick start guide to get your Supabase database configured for Lexicon.

## Prerequisites

- Supabase account (free tier is fine)
- Node.js 18+ installed
- Access to Supabase project credentials

## Step 1: Create/Access Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Either:
   - **Use existing:** Select your ID8Labs project
   - **Create new:** Click "New Project" and name it "Lexicon"

## Step 2: Get Your Credentials

From your Supabase project dashboard:

1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...`, keep this SECRET)

## Step 3: Update Environment Variables

Edit `/Users/eddiebelaval/Development/id8/lexicon/.env.local`:

```env
# Supabase (Auth + Storage)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

## Step 4: Apply Database Migration

### Option A: Supabase Dashboard (Easiest)

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of:
   ```
   /Users/eddiebelaval/Development/id8/lexicon/supabase/migrations/20260106_create_universes_table.sql
   ```
4. Paste into the SQL Editor
5. Click **Run** (or press Cmd+Enter)
6. You should see: "Success. No rows returned"

### Option B: Supabase CLI

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login
supabase login

# Link to your project
cd /Users/eddiebelaval/Development/id8/lexicon
supabase link --project-ref YOUR_PROJECT_ID

# Apply migration
supabase db push
```

## Step 5: Verify Migration

1. In Supabase Dashboard, go to **Table Editor**
2. You should see a new table: `universes`
3. Click on it to view the schema
4. Go to **Authentication** > **Policies**
5. You should see 5 RLS policies for the `universes` table

Expected policies:
- Users can read their own universes
- Users can read public universes
- Users can insert their own universes
- Users can update their own universes
- Users can delete their own universes

## Step 6: Test the Setup

### Test 1: Manual Insert (via SQL Editor)

In SQL Editor, run:

```sql
-- This will fail because no user is authenticated (expected!)
INSERT INTO universes (name, description, owner_id)
VALUES ('Test Universe', 'Just testing', gen_random_uuid());
```

You should see an RLS policy violation. This confirms RLS is working.

### Test 2: Via API Route

Create a test API route or run:

```bash
cd /Users/eddiebelaval/Development/id8/lexicon
npm run dev
```

Then test the universe creation via your application once auth is set up.

## Step 7: Set Up Authentication (Optional but Recommended)

### Enable Email Auth

1. In Supabase Dashboard: **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates if desired

### Test Auth Flow

```typescript
import { supabase } from '@/lib/supabase';

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'your-password',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'your-password',
});
```

## Troubleshooting

### "Missing environment variables"

- Check that `.env.local` is in the project root
- Restart your dev server after changing `.env.local`
- Ensure variable names match exactly (including `NEXT_PUBLIC_` prefix)

### "Row level security policy violation"

This is expected when:
- Not authenticated and trying to insert/update/delete
- Trying to access another user's private universe

To fix:
- Ensure user is signed in via `supabase.auth.signIn()`
- Check that `owner_id` matches the authenticated user's ID

### "relation 'universes' does not exist"

- Migration wasn't applied successfully
- Double-check you ran the SQL in the correct project
- Try re-running the migration

### "Cannot read properties of undefined (reading 'from')"

- Supabase client not initialized properly
- Check environment variables are loaded
- Ensure you're importing from `@/lib/supabase`

## Next Steps

After Supabase is set up:

1. **Set up Neo4j** - for graph data storage
2. **Configure Claude API** - for search synthesis
3. **Run seed script** - `npm run seed` (Three Musketeers example)
4. **Build features** - entities, relationships, search

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Lexicon Project README](/Users/eddiebelaval/Development/id8/lexicon/README.md)
- [Lexicon Claude Instructions](/Users/eddiebelaval/Development/id8/lexicon/CLAUDE.md)

## Support

For issues:
- Supabase-specific: [Supabase Discord](https://discord.supabase.com)
- Lexicon-specific: Check `/Users/eddiebelaval/Development/id8/lexicon/CLAUDE.md`
