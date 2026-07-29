-- 1. Helper security functions to check roles (bypassing RLS recursion via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_moderator()
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_support()
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator', 'support')
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Add policies to profiles table
DROP POLICY IF EXISTS "admin_select_profiles" ON profiles;
CREATE POLICY "admin_select_profiles" ON profiles FOR SELECT
  TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_profiles" ON profiles;
CREATE POLICY "admin_delete_profiles" ON profiles FOR DELETE
  TO authenticated USING (is_admin());

-- 3. Add policies to projects table
DROP POLICY IF EXISTS "admin_select_projects" ON projects;
CREATE POLICY "admin_select_projects" ON projects FOR SELECT
  TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_update_projects" ON projects;
CREATE POLICY "admin_update_projects" ON projects FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_projects" ON projects;
CREATE POLICY "admin_delete_projects" ON projects FOR DELETE
  TO authenticated USING (is_admin());

-- 4. Add policies to support_tickets table
DROP POLICY IF EXISTS "admin_select_tickets" ON support_tickets;
CREATE POLICY "admin_select_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_mutate_tickets" ON support_tickets;
CREATE POLICY "admin_mutate_tickets" ON support_tickets FOR ALL
  TO authenticated USING (is_support());

-- 5. Update policies for ticket_messages
DROP POLICY IF EXISTS "select_ticket_messages" ON ticket_messages;
CREATE POLICY "select_ticket_messages" ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    is_support() OR EXISTS (
      SELECT 1 FROM support_tickets t WHERE t.id = ticket_messages.ticket_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_ticket_messages" ON ticket_messages;
CREATE POLICY "insert_ticket_messages" ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    is_support() OR EXISTS (
      SELECT 1 FROM support_tickets t 
      WHERE t.id = ticket_messages.ticket_id 
      AND t.user_id = auth.uid() 
      AND NOT ticket_messages.is_internal
    )
  );

-- 6. Update policies for audit_logs
DROP POLICY IF EXISTS "admin_select_audit_logs" ON audit_logs;
CREATE POLICY "admin_select_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (is_moderator());

DROP POLICY IF EXISTS "admin_insert_audit_logs" ON audit_logs;
CREATE POLICY "admin_insert_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (is_moderator());

-- 7. Update policies for analytics_events
DROP POLICY IF EXISTS "admin_select_analytics" ON analytics_events;
CREATE POLICY "admin_select_analytics" ON analytics_events FOR SELECT
  TO authenticated USING (is_support());

-- 8. Update policies for system_logs
DROP POLICY IF EXISTS "admin_select_system_logs" ON system_logs;
CREATE POLICY "admin_select_system_logs" ON system_logs FOR SELECT
  TO authenticated USING (is_support());

-- 9. Update policies for feature_flags
DROP POLICY IF EXISTS "admin_mutate_feature_flags" ON feature_flags;
CREATE POLICY "admin_mutate_feature_flags" ON feature_flags FOR ALL
  TO authenticated USING (is_admin());

-- 10. Update policies for admin_settings
DROP POLICY IF EXISTS "admin_all_settings" ON admin_settings;
CREATE POLICY "admin_all_settings" ON admin_settings FOR ALL
  TO authenticated USING (is_admin());

-- 11. Update policies for system_notifications
DROP POLICY IF EXISTS "admin_select_all_notifications" ON system_notifications;
CREATE POLICY "admin_select_all_notifications" ON system_notifications FOR SELECT
  TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_mutate_notifications" ON system_notifications;
CREATE POLICY "admin_mutate_notifications" ON system_notifications FOR ALL
  TO authenticated USING (is_support());

-- 12. Update policies for user_feedback
DROP POLICY IF EXISTS "select_public_feedback" ON user_feedback;
CREATE POLICY "select_public_feedback" ON user_feedback FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR status IN ('planned', 'completed')
    OR is_support()
  );

DROP POLICY IF EXISTS "admin_all_feedback" ON user_feedback;
CREATE POLICY "admin_all_feedback" ON user_feedback FOR ALL
  TO authenticated USING (is_support());
