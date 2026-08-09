-- ── Idempotent helper role check function ──────────────────────────
CREATE OR REPLACE FUNCTION is_support_or_admin()
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support', 'moderator')
  );
END;
$$ LANGUAGE plpgsql;

-- ── 1. chat_messages policies ──────────────────────────────────────
DROP POLICY IF EXISTS "select_own_chat_messages" ON chat_messages;
CREATE POLICY "select_own_chat_messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    is_support_or_admin() OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_messages.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_chat_messages" ON chat_messages;
CREATE POLICY "insert_own_chat_messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    is_support_or_admin() OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_messages.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_chat_messages" ON chat_messages;
CREATE POLICY "delete_own_chat_messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (
    is_support_or_admin() OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_messages.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_chat_messages" ON chat_messages;
CREATE POLICY "update_own_chat_messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (false);

-- ── 2. chat_messages trigger for ownership validation ───────────────
CREATE OR REPLACE FUNCTION verify_chat_message_ownership()
RETURNS trigger AS $$
BEGIN
  -- Support and admins are allowed to insert messages for helper logs/responses
  IF is_support_or_admin() THEN
    RETURN NEW;
  END IF;

  -- Validate ownership
  IF NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = NEW.project_id 
      AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: You do not own this project.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_verify_chat_message_ownership ON chat_messages;
CREATE TRIGGER trg_verify_chat_message_ownership
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION verify_chat_message_ownership();

-- ── 3. login_history policies ──────────────────────────────────────
DROP POLICY IF EXISTS "user_select_login_history" ON login_history;
CREATE POLICY "user_select_login_history"
  ON login_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_support_or_admin());

DROP POLICY IF EXISTS "user_insert_login_history" ON login_history;
CREATE POLICY "user_insert_login_history"
  ON login_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── 4. active_sessions policies ────────────────────────────────────
DROP POLICY IF EXISTS "user_select_active_sessions" ON active_sessions;
CREATE POLICY "user_select_active_sessions"
  ON active_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_support_or_admin());

DROP POLICY IF EXISTS "user_insert_active_sessions" ON active_sessions;
CREATE POLICY "user_insert_active_sessions"
  ON active_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_active_sessions" ON active_sessions;
CREATE POLICY "user_update_active_sessions"
  ON active_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_delete_active_sessions" ON active_sessions;
CREATE POLICY "user_delete_active_sessions"
  ON active_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── 5. failed_login_attempts policies ──────────────────────────────
DROP POLICY IF EXISTS "public_insert_failed_logins" ON failed_login_attempts;
CREATE POLICY "public_insert_failed_logins"
  ON failed_login_attempts FOR INSERT
  TO public
  WITH CHECK (true);

-- ── 6. account_lockouts policies ───────────────────────────────────
DROP POLICY IF EXISTS "public_insert_account_lockouts" ON account_lockouts;
CREATE POLICY "public_insert_account_lockouts"
  ON account_lockouts FOR INSERT
  TO public
  WITH CHECK (true);

-- ── 7. security_alerts policies ────────────────────────────────────
DROP POLICY IF EXISTS "user_select_security_alerts" ON security_alerts;
CREATE POLICY "user_select_security_alerts"
  ON security_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_support_or_admin());

DROP POLICY IF EXISTS "user_insert_security_alerts" ON security_alerts;
CREATE POLICY "user_insert_security_alerts"
  ON security_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── 8. notifications policies ──────────────────────────────────────
DROP POLICY IF EXISTS "admin_insert_notifications" ON notifications;
CREATE POLICY "admin_insert_notifications"
  ON notifications FOR INSERT
  TO public
  WITH CHECK (
    is_support_or_admin() 
    OR auth.uid() = user_id 
    OR auth.uid() IS NULL
  );
