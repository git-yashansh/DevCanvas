-- Seed users in auth.users
INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role, created_at, updated_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'alpha@example.com', '{"full_name":"Alpha Architect"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated', now() - interval '20 days', now() - interval '20 days'),
  ('a0000000-0000-0000-0000-000000000002', 'beta@example.com', '{"full_name":"Beta Developer"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated', now() - interval '15 days', now() - interval '15 days'),
  ('a0000000-0000-0000-0000-000000000003', 'gamma@example.com', '{"full_name":"Gamma Designer"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated', now() - interval '10 days', now() - interval '10 days'),
  ('a0000000-0000-0000-0000-000000000004', 'delta@example.com', '{"full_name":"Delta Operator"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated', now() - interval '5 days', now() - interval '5 days'),
  ('a0000000-0000-0000-0000-000000000005', 'epsilon@example.com', '{"full_name":"Epsilon Integrator"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated', now() - interval '2 days', now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000006', 'inactive@example.com', '{"full_name":"Inactive User"}'::jsonb, '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated', now() - interval '45 days', now() - interval '45 days')
ON CONFLICT (id) DO NOTHING;

-- Update the profiles columns that were auto-created by the trigger
UPDATE public.profiles SET role = 'user', status = 'active', last_seen = now() - interval '1 hour', created_at = now() - interval '20 days' WHERE id = 'a0000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET role = 'user', status = 'active', last_seen = now() - interval '2 hours', created_at = now() - interval '15 days' WHERE id = 'a0000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET role = 'user', status = 'active', last_seen = now() - interval '5 hours', created_at = now() - interval '10 days' WHERE id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET role = 'user', status = 'active', last_seen = now() - interval '1 day', created_at = now() - interval '5 days' WHERE id = 'a0000000-0000-0000-0000-000000000004';
UPDATE public.profiles SET role = 'user', status = 'active', last_seen = now() - interval '3 days', created_at = now() - interval '2 days' WHERE id = 'a0000000-0000-0000-0000-000000000005';
UPDATE public.profiles SET role = 'user', status = 'active', last_seen = now() - interval '40 days', created_at = now() - interval '45 days' WHERE id = 'a0000000-0000-0000-0000-000000000006';

-- Seed projects (using valid hex UUID prefix b0000000-...)
INSERT INTO public.projects (id, name, description, owner_id, status, created_at, updated_at)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Cloud Mesh Engine', 'A distributed mesh networks designer', 'a0000000-0000-0000-0000-000000000001', 'active', now() - interval '19 days', now() - interval '19 days'),
  ('b0000000-0000-0000-0000-000000000002', 'SQL Stream Store', 'A reactive stream pipeline storage', 'a0000000-0000-0000-0000-000000000002', 'active', now() - interval '14 days', now() - interval '14 days'),
  ('b0000000-0000-0000-0000-000000000003', 'Figma Wireframe Exporter', 'Exports designs directly to React Native code', 'a0000000-0000-0000-0000-000000000003', 'active', now() - interval '9 days', now() - interval '9 days'),
  ('b0000000-0000-0000-0000-000000000004', 'Neo Graph Analytics', 'Graph database visualizer for Neo4j', 'a0000000-0000-0000-0000-000000000001', 'active', now() - interval '5 days', now() - interval '5 days'),
  ('b0000000-0000-0000-0000-000000000005', 'Micro API Gateway', 'A zero-config lightweight API routing proxy', 'a0000000-0000-0000-0000-000000000005', 'active', now() - interval '1 day', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- Seed support tickets (using valid hex UUID prefix e0000000-...)
INSERT INTO public.support_tickets (id, user_id, subject, category, priority, description, status, created_at, updated_at, closed_at, resolved_at)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Billing issue with Premium', 'billing', 'high', 'I was billed twice for my subscription this month. Please refund.', 'closed', now() - interval '18 days', now() - interval '17 days', now() - interval '17 days', now() - interval '17 days'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Database generator throws 500 error', 'bug', 'critical', 'When trying to compile tables for ER design, a 500 error is thrown.', 'resolved', now() - interval '12 days', now() - interval '11 days', null, now() - interval '11 days'),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'API documentation missing endpoints', 'other', 'low', 'Where is the documentation for the endpoints generated?', 'open', now() - interval '8 days', now() - interval '8 days', null, null),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'UI editor custom font upload', 'feature', 'medium', 'Can we support uploading custom TTF or WOFF2 fonts?', 'open', now() - interval '4 days', now() - interval '4 days', null, null)
ON CONFLICT (id) DO NOTHING;

-- Seed analytics events (AI generations, logins, session durations)
INSERT INTO public.analytics_events (user_id, event_type, details, device, browser, country, created_at)
VALUES
  -- Login events
  ('a0000000-0000-0000-0000-000000000001', 'user_login', '{}'::jsonb, 'Windows Workstation', 'Chrome', 'US', now() - interval '19 days'),
  ('a0000000-0000-0000-0000-000000000001', 'user_login', '{}'::jsonb, 'Windows Workstation', 'Chrome', 'US', now() - interval '18 days'),
  ('a0000000-0000-0000-0000-000000000002', 'user_login', '{}'::jsonb, 'Macbook Pro', 'Safari', 'CA', now() - interval '14 days'),
  ('a0000000-0000-0000-0000-000000000003', 'user_login', '{}'::jsonb, 'Macbook Pro', 'Chrome', 'GB', now() - interval '9 days'),
  ('a0000000-0000-0000-0000-000000000001', 'user_login', '{}'::jsonb, 'Windows Workstation', 'Chrome', 'US', now() - interval '5 days'),
  ('a0000000-0000-0000-0000-000000000005', 'user_login', '{}'::jsonb, 'Windows Workstation', 'Chrome', 'DE', now() - interval '1 day'),
  -- Session durations
  ('a0000000-0000-0000-0000-000000000001', 'session_duration', '{"duration_seconds": 960}'::jsonb, 'Windows Workstation', 'Chrome', 'US', now() - interval '19 days'),
  ('a0000000-0000-0000-0000-000000000002', 'session_duration', '{"duration_seconds": 1200}'::jsonb, 'Macbook Pro', 'Safari', 'CA', now() - interval '14 days'),
  ('a0000000-0000-0000-0000-000000000003', 'session_duration', '{"duration_seconds": 600}'::jsonb, 'Macbook Pro', 'Chrome', 'GB', now() - interval '9 days'),
  ('a0000000-0000-0000-0000-000000000005', 'session_duration', '{"duration_seconds": 450}'::jsonb, 'Windows Workstation', 'Chrome', 'DE', now() - interval '1 day'),
  -- AI generations
  ('a0000000-0000-0000-0000-000000000001', 'ai_generation', '{"generator": "architecture"}'::jsonb, 'Windows Workstation', 'Chrome', 'US', now() - interval '19 days'),
  ('a0000000-0000-0000-0000-000000000001', 'ai_generation', '{"generator": "database"}'::jsonb, 'Windows Workstation', 'Chrome', 'US', now() - interval '19 days'),
  ('a0000000-0000-0000-0000-000000000002', 'ai_generation', '{"generator": "api"}'::jsonb, 'Macbook Pro', 'Safari', 'CA', now() - interval '14 days'),
  ('a0000000-0000-0000-0000-000000000002', 'ai_generation', '{"generator": "database"}'::jsonb, 'Macbook Pro', 'Safari', 'CA', now() - interval '13 days'),
  ('a0000000-0000-0000-0000-000000000003', 'ai_generation', '{"generator": "ui"}'::jsonb, 'Macbook Pro', 'Chrome', 'GB', now() - interval '9 days'),
  ('a0000000-0000-0000-0000-000000000003', 'ai_generation', '{"generator": "er-diagram"}'::jsonb, 'Macbook Pro', 'Chrome', 'GB', now() - interval '8 days'),
  ('a0000000-0000-0000-0000-000000000001', 'ai_generation', '{"generator": "wireframe"}'::jsonb, 'Windows Workstation', 'Chrome', 'US', now() - interval '5 days'),
  ('a0000000-0000-0000-0000-000000000005', 'ai_generation', '{"generator": "prompt"}'::jsonb, 'Windows Workstation', 'Chrome', 'DE', now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000005', 'ai_generation', '{"generator": "ui"}'::jsonb, 'Windows Workstation', 'Chrome', 'DE', now() - interval '12 hours')
;
