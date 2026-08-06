-- Create Security tables
CREATE TABLE IF NOT EXISTS blocked_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL UNIQUE,
  reason text NOT NULL,
  blocked_by text NOT NULL,
  blocked_time timestamptz NOT NULL DEFAULT now(),
  expiry timestamptz,
  permanent boolean NOT NULL DEFAULT true,
  notes text
);

CREATE TABLE IF NOT EXISTS login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  username text,
  login_time timestamptz NOT NULL DEFAULT now(),
  logout_time timestamptz,
  browser text,
  operating_system text,
  device_type text,
  ip_address text,
  country text,
  city text,
  session_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL UNIQUE,
  device text,
  browser text,
  os text,
  ip_address text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'terminated'))
);

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  country text,
  browser text,
  os text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  attempt_count integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS account_lockouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  locked_at timestamptz NOT NULL DEFAULT now(),
  unlock_at timestamptz NOT NULL,
  reason text
);

CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  description text NOT NULL,
  risk_score integer NOT NULL DEFAULT 0,
  detected_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  is_resolved boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY,
  name text NOT NULL,
  priority integer NOT NULL DEFAULT 10,
  description text NOT NULL,
  permissions text[] NOT NULL DEFAULT '{}'
);

-- Seed default enterprise roles
INSERT INTO roles (id, name, priority, description, permissions)
VALUES
  ('owner', 'Owner', 1, 'Full system and billing owner permissions', '{"*"}'),
  ('super_admin', 'Super Admin', 2, 'Total management access excluding owner settings', '{"admin:all"}'),
  ('admin', 'Admin', 3, 'Administrative access to system functions', '{"admin:read", "admin:write"}'),
  ('moderator', 'Moderator', 4, 'User content moderation authority', '{"moderate:all"}'),
  ('support', 'Support', 5, 'Customer care and ticket handling access', '{"support:tickets"}'),
  ('developer', 'Developer', 6, 'Framework development access parameters', '{"dev:all"}'),
  ('premium', 'Premium User', 9, 'Premium account client level', '{"user:premium"}'),
  ('user', 'User', 10, 'Standard registered client profile', '{"user:standard"}')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Add RLS select policies matching admin check helpers
DROP POLICY IF EXISTS "admin_all_blocked_ips" ON blocked_ips;
CREATE POLICY "admin_all_blocked_ips" ON blocked_ips FOR ALL TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_select_login_history" ON login_history;
CREATE POLICY "admin_select_login_history" ON login_history FOR SELECT TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_all_active_sessions" ON active_sessions;
CREATE POLICY "admin_all_active_sessions" ON active_sessions FOR ALL TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_all_failed_logins" ON failed_login_attempts;
CREATE POLICY "admin_all_failed_logins" ON failed_login_attempts FOR ALL TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_all_lockouts" ON account_lockouts;
CREATE POLICY "admin_all_lockouts" ON account_lockouts FOR ALL TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_all_security_alerts" ON security_alerts;
CREATE POLICY "admin_all_security_alerts" ON security_alerts FOR ALL TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_select_roles" ON roles;
CREATE POLICY "admin_select_roles" ON roles FOR SELECT TO authenticated USING (true);
