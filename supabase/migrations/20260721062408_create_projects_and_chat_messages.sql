/*
# Create projects and chat_messages tables

1. Purpose
- Sprint 2 introduces the dashboard, project workspace, and AI chat.
- `projects` stores each DevCanvas project owned by a user.
- `chat_messages` stores the conversation history between a user and the
  AI assistant within a project's context.

2. New Tables

## projects
- `id` (uuid, primary key, default gen_random_uuid())
- `owner_id` (uuid, not null, default auth.uid()) — references auth.users.
  Owner-scoped: each user only sees and manages their own projects.
- `name` (text, not null) — project display name.
- `description` (text, nullable) — optional longer description.
- `status` (text, not null, default 'draft') — one of: draft, active, archived.
- `visibility` (text, not null, default 'private') — private, workspace, public.
- `tags` (text[], default '{}') — optional tag array for filtering.
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

## chat_messages
- `id` (uuid, primary key, default gen_random_uuid())
- `project_id` (uuid, not null) — references projects(id) ON DELETE CASCADE.
- `role` (text, not null) — one of: user, assistant, system.
- `content` (text, not null) — message body.
- `created_at` (timestamptz, default now())

3. Security

## projects RLS
- SELECT: authenticated users read only their own projects.
- INSERT: authenticated users can insert rows where owner_id = auth.uid().
  The DEFAULT auth.uid() on owner_id makes .insert({ name }) succeed without
  the client passing owner_id.
- UPDATE: owner can update their own projects.
- DELETE: owner can delete their own projects.

## chat_messages RLS
- SELECT: authenticated users can read messages for projects they own.
- INSERT: authenticated users can insert messages for projects they own.
- UPDATE: blocked (USING false) — messages are immutable once sent.
- DELETE: owner can delete messages for projects they own.

4. Important Notes
1. owner_id defaults to auth.uid() so the frontend insert omits it safely.
2. chat_messages INSERT policy uses an EXISTS subquery against projects to
   verify ownership rather than a direct user_id column.
3. Both tables have an updated_at trigger (projects) and indexes on
   frequently queried columns.
4. Policies are dropped before creation for idempotency.
*/

-- ── projects ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'workspace', 'public')),
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS projects_owner_id_idx ON projects(owner_id);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at DESC);

-- ── chat_messages ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chat_messages" ON chat_messages;
CREATE POLICY "select_own_chat_messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_messages.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_chat_messages" ON chat_messages;
CREATE POLICY "insert_own_chat_messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_messages.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "no_update_chat_messages" ON chat_messages;
CREATE POLICY "no_update_chat_messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "delete_own_chat_messages" ON chat_messages;
CREATE POLICY "delete_own_chat_messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_messages.project_id AND projects.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS chat_messages_project_id_idx ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);

-- ── updated_at trigger (reuses handle_updated_at from profiles migration) ──

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
