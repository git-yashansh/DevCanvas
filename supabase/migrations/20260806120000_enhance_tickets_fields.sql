-- Create sequence for ticket numbers starting from 1001
CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START WITH 1001;

-- Alter support_tickets table to add missing fields
ALTER TABLE support_tickets 
  ADD COLUMN IF NOT EXISTS ticket_number text DEFAULT ('DC-' || nextval('support_ticket_number_seq')),
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_reply_at timestamptz DEFAULT now();

-- Ensure ticket_number is unique
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_ticket_number_key;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_ticket_number_key UNIQUE (ticket_number);

-- Alter ticket_messages table to add missing fields
ALTER TABLE ticket_messages 
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

-- Create trigger to update last_reply_at on support_tickets
CREATE OR REPLACE FUNCTION update_ticket_last_reply()
RETURNS trigger AS $$
BEGIN
  UPDATE support_tickets
  SET last_reply_at = NEW.created_at
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_ticket_last_reply ON ticket_messages;
CREATE TRIGGER trg_update_ticket_last_reply
  AFTER INSERT ON ticket_messages
  FOR EACH ROW EXECUTE FUNCTION update_ticket_last_reply();
