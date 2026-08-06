-- Alter support_tickets to make user_id reference public.profiles instead of auth.users directly
-- This enables PostgREST to resolve relationships for select joins
ALTER TABLE support_tickets
  DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey,
  ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
