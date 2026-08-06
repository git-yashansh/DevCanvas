-- Alter notifications table to include missing fields
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS recipient_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sender_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Trigger/Function to sync recipient_user_id & user_id and sender_user_id & created_by for backward compatibility
CREATE OR REPLACE FUNCTION sync_notification_user_ids()
RETURNS trigger AS $$
BEGIN
  IF NEW.recipient_user_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.recipient_user_id := NEW.user_id;
  ELSIF NEW.user_id IS NULL AND NEW.recipient_user_id IS NOT NULL THEN
    NEW.user_id := NEW.recipient_user_id;
  END IF;

  IF NEW.sender_user_id IS NULL AND NEW.created_by IS NOT NULL THEN
    NEW.sender_user_id := NEW.created_by;
  ELSIF NEW.created_by IS NULL AND NEW.sender_user_id IS NOT NULL THEN
    NEW.created_by := NEW.sender_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_notification_user_ids ON notifications;
CREATE TRIGGER trg_sync_notification_user_ids
  BEFORE INSERT OR UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION sync_notification_user_ids();

-- Alter support_tickets table to include assigned_admin
ALTER TABLE support_tickets 
  ADD COLUMN IF NOT EXISTS assigned_admin uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Alter ticket_messages table to include attachment and is_read
ALTER TABLE ticket_messages 
  ADD COLUMN IF NOT EXISTS attachment text,
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

-- Enhance RLS policies to allow proper accesses
DROP POLICY IF EXISTS "select_own_tickets" ON support_tickets;
CREATE POLICY "select_own_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_support_or_admin());

DROP POLICY IF EXISTS "update_own_tickets" ON support_tickets;
CREATE POLICY "update_own_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR is_support_or_admin());

DROP POLICY IF EXISTS "delete_own_tickets" ON support_tickets;
CREATE POLICY "delete_own_tickets" ON support_tickets FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR is_support_or_admin());
