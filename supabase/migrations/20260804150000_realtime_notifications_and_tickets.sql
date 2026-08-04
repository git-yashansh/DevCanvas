-- =========================================================
-- MIGRATION: Real-time Notifications, Ticket System & Profile Enhancements
-- =========================================================

-- 1. Enhance Profiles Table with Status & Last Seen
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();

-- Create trigger for auto-profile creation upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status, last_seen)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'user',
    'active',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    last_seen = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Enhanced Notifications Table (Broadcast & Personal)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for broadcast
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_broadcast boolean NOT NULL DEFAULT false,
  is_read boolean NOT NULL DEFAULT false
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper check functions for roles
CREATE OR REPLACE FUNCTION is_support_or_admin()
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'support', 'moderator')
  );
END;
$$ LANGUAGE plpgsql;

-- Notification Policies
DROP POLICY IF EXISTS "user_select_notifications" ON notifications;
CREATE POLICY "user_select_notifications" ON notifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR is_broadcast = true 
    OR is_support_or_admin()
  );

DROP POLICY IF EXISTS "user_update_notifications" ON notifications;
CREATE POLICY "user_update_notifications" ON notifications FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR is_broadcast = true 
    OR is_support_or_admin()
  );

DROP POLICY IF EXISTS "user_delete_notifications" ON notifications;
CREATE POLICY "user_delete_notifications" ON notifications FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR is_support_or_admin()
  );

DROP POLICY IF EXISTS "admin_insert_notifications" ON notifications;
CREATE POLICY "admin_insert_notifications" ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    is_support_or_admin() OR auth.uid() = created_by
  );


-- 3. Support Tickets Table Adjustments
ALTER TABLE support_tickets
  DROP CONSTRAINT IF EXISTS support_tickets_priority_check;

ALTER TABLE support_tickets
  ADD CONSTRAINT support_tickets_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE support_tickets
  DROP CONSTRAINT IF EXISTS support_tickets_status_check;

ALTER TABLE support_tickets
  ADD CONSTRAINT support_tickets_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));


-- 4. Enable Supabase Realtime for Tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'support_tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'ticket_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END $$;
