-- Alter projects to make owner_id reference public.profiles instead of auth.users directly
-- This enables PostgREST to resolve relationships for select joins
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_owner_id_fkey,
  ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
