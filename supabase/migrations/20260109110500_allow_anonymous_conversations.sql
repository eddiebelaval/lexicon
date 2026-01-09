-- Allow Anonymous Conversations
-- Makes user_id nullable and adds policies for anonymous access
-- This enables the chat interface to work without requiring authentication

-- 1. Make user_id nullable
ALTER TABLE conversations ALTER COLUMN user_id DROP NOT NULL;

-- 2. Drop existing RLS policies that require user_id
DROP POLICY IF EXISTS "Users can create conversations in own universes" ON conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

-- 3. Create new policies that support both authenticated and anonymous users

-- SELECT: Users can view their own conversations OR anonymous conversations
CREATE POLICY "View own or anonymous conversations" ON conversations
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id IS NULL
  );

-- INSERT: Users can create conversations (authenticated or anonymous)
CREATE POLICY "Create conversations" ON conversations
  FOR INSERT WITH CHECK (
    -- Authenticated users: must match their user_id and own the universe
    (auth.uid() IS NOT NULL AND user_id = auth.uid() AND is_universe_owner(universe_id))
    OR
    -- Anonymous users: user_id must be null
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- UPDATE: Users can update their own conversations OR anonymous conversations
CREATE POLICY "Update own or anonymous conversations" ON conversations
  FOR UPDATE USING (
    user_id = auth.uid()
    OR user_id IS NULL
  );

-- DELETE: Users can delete their own conversations OR anonymous conversations
CREATE POLICY "Delete own or anonymous conversations" ON conversations
  FOR DELETE USING (
    user_id = auth.uid()
    OR user_id IS NULL
  );

-- Add comment explaining the change
COMMENT ON COLUMN conversations.user_id IS 'Owner of the conversation. NULL for anonymous/demo conversations.';
