-- ── Update audit_logs SELECT policy to support standard user read on their own logs ──
DROP POLICY IF EXISTS "admin_select_audit_logs" ON audit_logs;
CREATE POLICY "admin_select_audit_logs" ON audit_logs FOR SELECT
  TO authenticated
  USING (
    is_support_or_admin() 
    OR auth.uid() = actor_id
  );
