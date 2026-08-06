export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "critical";

export interface DBTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  description: string;
  status: TicketStatus;
  assigned_admin?: string | null;
  ticket_number?: string;
  closed_at?: string | null;
  resolved_at?: string | null;
  last_reply_at?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  };
  assigned_admin_profile?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface DBTicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  attachment?: string | null;
  is_read?: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  };
}
