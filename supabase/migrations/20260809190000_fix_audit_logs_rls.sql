-- ── Update audit_logs INSERT policy to support standard user logs ──
DROP POLICY IF EXISTS "admin_insert_audit_logs" ON audit_logs;
CREATE POLICY "admin_insert_audit_logs" ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    is_support_or_admin() 
    OR auth.uid() = actor_id
  );
