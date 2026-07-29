-- 1. Update Profiles Role Constraint and Seed Admin Privilege
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin', 'moderator', 'support'));

-- Promote target user to admin
UPDATE profiles SET role = 'admin' WHERE email = 'kr.yashansh123@gmail.com';

-- 2. Support Ticket Messages Table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages for their own tickets, admins/support can read all
DROP POLICY IF EXISTS "select_ticket_messages" ON ticket_messages;
CREATE POLICY "select_ticket_messages" ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_messages.ticket_id
      AND (t.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'support')
      ))
    )
  );

-- Users can insert messages for their own tickets (non-internal only), admins/support can insert any
DROP POLICY IF EXISTS "insert_ticket_messages" ON ticket_messages;
CREATE POLICY "insert_ticket_messages" ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_messages.ticket_id
      AND (
        (t.user_id = auth.uid() AND NOT ticket_messages.is_internal)
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'support'))
      )
    )
  );

-- 3. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  result text NOT NULL
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/moderators can view audit logs
DROP POLICY IF EXISTS "admin_select_audit_logs" ON audit_logs;
CREATE POLICY "admin_select_audit_logs" ON audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator')
  ));

-- Admins/moderators or system triggers can insert audit logs
DROP POLICY IF EXISTS "admin_insert_audit_logs" ON audit_logs;
CREATE POLICY "admin_insert_audit_logs" ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator')
  ));

-- 4. Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  device text,
  browser text,
  country text
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert analytics events
DROP POLICY IF EXISTS "insert_analytics_events" ON analytics_events;
CREATE POLICY "insert_analytics_events" ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Only admins/moderators/support can select all events
DROP POLICY IF EXISTS "admin_select_analytics" ON analytics_events;
CREATE POLICY "admin_select_analytics" ON analytics_events FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator', 'support')
  ));

-- 5. System Logs / Telemetries Table
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  service text NOT NULL,
  status text NOT NULL,
  cpu_usage numeric,
  memory_usage numeric,
  message text,
  level text NOT NULL DEFAULT 'info'
);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/support/moderators can view system logs
DROP POLICY IF EXISTS "admin_select_system_logs" ON system_logs;
CREATE POLICY "admin_select_system_logs" ON system_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'support', 'moderator')
  ));

-- 6. Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  key text PRIMARY KEY,
  value boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read feature flags
DROP POLICY IF EXISTS "select_feature_flags" ON feature_flags;
CREATE POLICY "select_feature_flags" ON feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can mutate feature flags
DROP POLICY IF EXISTS "admin_mutate_feature_flags" ON feature_flags;
CREATE POLICY "admin_mutate_feature_flags" ON feature_flags FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- 7. Admin Settings Table
CREATE TABLE IF NOT EXISTS admin_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write settings
DROP POLICY IF EXISTS "admin_all_settings" ON admin_settings;
CREATE POLICY "admin_all_settings" ON admin_settings FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- 8. System Notifications (Announcements) Table
CREATE TABLE IF NOT EXISTS system_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL DEFAULT 'everyone' CHECK (target_type IN ('everyone', 'specific_user', 'plan')),
  target_value text, -- holds userId or planName if applicable
  title text NOT NULL,
  content text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

-- Users can select active notifications targeting them
DROP POLICY IF EXISTS "select_system_notifications" ON system_notifications;
CREATE POLICY "select_system_notifications" ON system_notifications FOR SELECT
  TO authenticated
  USING (
    is_active AND (
      target_type = 'everyone' 
      OR (target_type = 'specific_user' AND target_value = auth.uid()::text)
    )
  );

-- Admins/support/moderators can view all notifications
DROP POLICY IF EXISTS "admin_select_all_notifications" ON system_notifications;
CREATE POLICY "admin_select_all_notifications" ON system_notifications FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'support', 'moderator')
  ));

-- Only admins/support/moderators can insert/update/delete notifications
DROP POLICY IF EXISTS "admin_mutate_notifications" ON system_notifications;
CREATE POLICY "admin_mutate_notifications" ON system_notifications FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'support', 'moderator')
  ));

-- 9. User Feedback Table
CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('feature_request', 'bug_report', 'rating', 'other')),
  category text,
  rating integer,
  comment text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'planned', 'completed', 'declined')),
  votes integer NOT NULL DEFAULT 0
);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert feedback and read planned/completed feedback
DROP POLICY IF EXISTS "insert_user_feedback" ON user_feedback;
CREATE POLICY "insert_user_feedback" ON user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "select_public_feedback" ON user_feedback;
CREATE POLICY "select_public_feedback" ON user_feedback FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR status IN ('planned', 'completed')
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'support', 'moderator'))
  );

-- Only admins/support/moderators can edit feedback status/votes
DROP POLICY IF EXISTS "admin_all_feedback" ON user_feedback;
CREATE POLICY "admin_all_feedback" ON user_feedback FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'support', 'moderator')
  ));
