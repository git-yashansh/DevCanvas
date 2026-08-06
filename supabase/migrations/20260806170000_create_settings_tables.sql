-- Drop legacy empty feature_flags table to recreate with text statuses
DROP TABLE IF EXISTS feature_flags CASCADE;

-- Create Settings tables
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

CREATE TABLE feature_flags (
  id text PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'disabled' CHECK (status IN ('enabled', 'disabled', 'beta', 'hidden')),
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id text PRIMARY KEY,
  key_name text NOT NULL,
  encrypted_key text,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected')),
  last_used timestamptz,
  health text NOT NULL DEFAULT 'unknown' CHECK (health IN ('healthy', 'unhealthy', 'unknown'))
);

CREATE TABLE IF NOT EXISTS smtp_settings (
  id text PRIMARY KEY,
  host text NOT NULL,
  port integer NOT NULL DEFAULT 587,
  username text,
  encrypted_password text,
  sender_name text,
  sender_email text,
  reply_to text,
  enable_ssl boolean NOT NULL DEFAULT false,
  enable_tls boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id text PRIMARY KEY,
  requests_per_minute integer NOT NULL DEFAULT 60,
  description text
);

CREATE TABLE IF NOT EXISTS storage_settings (
  id text PRIMARY KEY,
  storage_limit_bytes bigint NOT NULL DEFAULT 10737418240, -- 10 GB
  upload_size_limit_bytes bigint NOT NULL DEFAULT 52428800, -- 50 MB
  allowed_extensions text[] NOT NULL DEFAULT '{"zip","tar","gz","png","jpg","pdf","json","md"}'
);

CREATE TABLE IF NOT EXISTS backup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  backup_size bigint NOT NULL,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'running')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  enabled_by text,
  reason text,
  started_at timestamptz NOT NULL DEFAULT now(),
  expected_finish timestamptz
);

-- Seed Default Settings
INSERT INTO system_settings (key, value)
VALUES
  ('global_app', '{"app_name": "DevCanvas Pro", "logo_url": "", "support_email": "support@devcanvas.ai", "support_url": "https://devcanvas.ai/support", "privacy_url": "https://devcanvas.ai/privacy", "terms_url": "https://devcanvas.ai/terms", "default_role": "user", "timezone": "UTC", "language": "en", "theme": "dark", "currency": "USD", "date_format": "YYYY-MM-DD", "time_format": "HH:mm"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO feature_flags (id, name, status, description)
VALUES
  ('ai-chat', 'AI Chat Assistant', 'enabled', 'Interactive generative coding guide'),
  ('projects', 'Projects Manager', 'enabled', 'Source workspaces and configuration maps'),
  ('templates', 'Framework Templates', 'beta', 'Boilerplate project directories'),
  ('marketplace', 'Extension Marketplace', 'disabled', 'Third-party integrations library'),
  ('notifications', 'System Notifications', 'enabled', 'Broadcast notification relays'),
  ('support-tickets', 'Support Helpdesk', 'enabled', 'GH-style issues client interface'),
  ('premium-features', 'Premium features', 'beta', 'Premium license billing blocks'),
  ('analytics', 'SaaS Analytics', 'enabled', 'Database computed telemetries'),
  ('authentication', 'Multi-factor MFA Auth', 'enabled', 'MFA and lockouts modules'),
  ('realtime', 'Websockets Realtime', 'enabled', 'Realtime mutations updates'),
  ('file-uploads', 'S3 File storage', 'enabled', 'Assets attachments uploads')
ON CONFLICT (id) DO NOTHING;

INSERT INTO api_keys (id, key_name, encrypted_key, status, health)
VALUES
  ('openai', 'OpenAI API key', 'sk-proj-••••••••••••', 'connected', 'healthy'),
  ('anthropic', 'Anthropic API key', 'sk-ant-••••••••••••', 'connected', 'healthy'),
  ('gemini', 'Google Gemini API key', 'AIzaSy••••••••••••', 'connected', 'healthy'),
  ('groq', 'Groq API key', 'gsk_••••••••••••', 'disconnected', 'unknown'),
  ('deepseek', 'DeepSeek API key', 'sk-ds-••••••••••••', 'disconnected', 'unknown'),
  ('resend', 'Resend Mail API key', 're_••••••••••••', 'connected', 'healthy'),
  ('supabase', 'Supabase Service key', 'eyJhbGci••••••••••••', 'connected', 'healthy')
ON CONFLICT (id) DO NOTHING;

INSERT INTO smtp_settings (id, host, port, username, encrypted_password, sender_name, sender_email, reply_to, enable_ssl, enable_tls)
VALUES
  ('default', 'smtp.sendgrid.net', 587, 'apikey', 'SG.••••••••••••', 'DevCanvas Operations', 'noreply@devcanvas.ai', 'support@devcanvas.ai', false, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rate_limits (id, requests_per_minute, description)
VALUES
  ('login-requests', 10, 'Sign-in credential attempts'),
  ('api-requests', 120, 'REST API gateway limits'),
  ('ai-requests', 15, 'Generators prompts quota'),
  ('uploads', 5, 'File storage upload attempts'),
  ('project-creation', 10, 'Workspace setups limit'),
  ('ticket-creation', 5, 'Support queries limits'),
  ('notification-broadcast', 2, 'Admin broadcasts limits')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage_settings (id, storage_limit_bytes, upload_size_limit_bytes, allowed_extensions)
VALUES
  ('default', 10737418240, 52428800, '{"zip","tar","gz","png","jpg","pdf","json","md"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO backup_history (filename, backup_size, status)
VALUES
  ('devcanvas_backup_20260805.tar.gz', 48218040, 'success'),
  ('devcanvas_backup_20260806.tar.gz', 49102450, 'success')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE smtp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS select and mutate policies for support/admins
DROP POLICY IF EXISTS "admin_all_system_settings" ON system_settings;
CREATE POLICY "admin_all_system_settings" ON system_settings FOR ALL TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_all_feature_flags" ON feature_flags;
CREATE POLICY "admin_all_feature_flags" ON feature_flags FOR ALL TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_all_api_keys" ON api_keys;
CREATE POLICY "admin_all_api_keys" ON api_keys FOR ALL TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_all_smtp_settings" ON smtp_settings;
CREATE POLICY "admin_all_smtp_settings" ON smtp_settings FOR ALL TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_all_rate_limits" ON rate_limits;
CREATE POLICY "admin_all_rate_limits" ON rate_limits FOR ALL TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_all_storage_settings" ON storage_settings;
CREATE POLICY "admin_all_storage_settings" ON storage_settings FOR ALL TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_all_backup_history" ON backup_history;
CREATE POLICY "admin_all_backup_history" ON backup_history FOR ALL TO authenticated USING (is_support());

DROP POLICY IF EXISTS "admin_all_maintenance_logs" ON maintenance_logs;
CREATE POLICY "admin_all_maintenance_logs" ON maintenance_logs FOR ALL TO authenticated USING (is_support());
