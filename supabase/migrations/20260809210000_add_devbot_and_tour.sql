-- ── Onboarding Tour Profiles Enhancements ─────────────────────────
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS tour_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tour_skipped boolean NOT NULL DEFAULT false;

-- ── DevBot Messages History Table ──────────────────────────────
CREATE TABLE IF NOT EXISTS devbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE devbot_messages ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can select their own conversations
DROP POLICY IF EXISTS "select_own_devbot_messages" ON devbot_messages;
CREATE POLICY "select_own_devbot_messages" ON devbot_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- INSERT policy: Users can insert their own messages
DROP POLICY IF EXISTS "insert_own_devbot_messages" ON devbot_messages;
CREATE POLICY "insert_own_devbot_messages" ON devbot_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy: Users can delete/clear their history
DROP POLICY IF EXISTS "delete_own_devbot_messages" ON devbot_messages;
CREATE POLICY "delete_own_devbot_messages" ON devbot_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
