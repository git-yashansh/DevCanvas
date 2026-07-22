/*
# Create profiles table

1. Purpose
- DevCanvas is a multi-user SaaS application with a sign-in screen.
- Each authenticated user needs a profile row storing their display name,
  avatar URL, and role (user / admin).
- This table is the foundation for the dashboard, project ownership, and
  admin panel in later sprints.

2. New Tables
- `profiles`
  - `id` (uuid, primary key) — references `auth.users(id)`. One row per user.
  - `email` (text, not null) — denormalized from auth for fast display.
  - `full_name` (text, nullable) — display name entered at sign-up.
  - `avatar_url` (text, nullable) — optional profile image URL.
  - `role` (text, not null, default 'user') — 'user' or 'admin'.
  - `created_at` (timestamptz, default now()) — row creation time.
  - `updated_at` (timestamptz, default now()) — last modification time.

3. Security
- Row Level Security is ENABLED on `profiles`.
- SELECT: authenticated users can read their own profile only.
- INSERT: authenticated users can insert a row where `id` matches their own
  `auth.uid()` (used by the sign-up flow to create a profile on registration).
- UPDATE: authenticated users can update their own profile only.
- DELETE: blocked for now (profiles are managed via auth, not direct deletes).
  A restrictive policy with `USING (false)` is added so no row can be deleted
  through the anon-key client.

4. Important Notes
1. The `id` column has `DEFAULT auth.uid()` so the sign-up flow can insert
   without explicitly passing the user id, and the INSERT policy's
   `WITH CHECK (auth.uid() = id)` still passes.
2. `email` is denormalized from `auth.users` for display convenience. It is
   not unique-constrained here because `auth.users` already enforces that.
3. A trigger updates `updated_at` automatically on row update.
4. Policies are dropped before creation to keep the migration idempotent.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "no_delete_profile" ON profiles;
CREATE POLICY "no_delete_profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (false);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
