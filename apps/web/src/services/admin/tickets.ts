import { supabase } from "@/lib/supabase";
import type { DBTicket, DBTicketMessage } from "@/lib/types/tickets";

export class SupportTicketService {
  static async getTickets(): Promise<DBTicket[]> {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(`
        id,
        ticket_number,
        user_id,
        subject,
        category,
        priority,
        status,
        description,
        assigned_admin,
        closed_at,
        resolved_at,
        last_reply_at,
        created_at,
        updated_at,
        profiles:user_id (id, full_name, email, avatar_url, role),
        assigned_admin_profile:assigned_admin (id, full_name, email, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as any[]) || [];
  }

  static async getAdminUsers(): Promise<{ id: string; full_name: string | null; email: string }[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("role", ["admin", "support"]);

    if (error) throw error;
    return data || [];
  }

  static async getTicketMessages(ticketId: string): Promise<DBTicketMessage[]> {
    const { data, error } = await supabase
      .from("ticket_messages")
      .select(`
        id,
        ticket_id,
        sender_id,
        message,
        is_internal,
        created_at,
        profiles:sender_id (id, full_name, email, avatar_url, role)
      `)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data as any[]) || [];
  }

  static async createTicketMessage(payload: {
    ticket_id: string;
    sender_id: string;
    message: string;
    is_internal: boolean;
    attachment?: string | null;
  }): Promise<DBTicketMessage> {
    const { data, error } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: payload.ticket_id,
        sender_id: payload.sender_id,
        message: payload.message,
        is_internal: payload.is_internal,
        attachment: payload.attachment || null
      })
      .select(`
        id,
        ticket_id,
        sender_id,
        message,
        is_internal,
        created_at,
        profiles:sender_id (id, full_name, email, avatar_url, role)
      `)
      .single();

    if (error) throw error;
    return data as any;
  }

  static async updateTicket(id: string, patch: Partial<DBTicket>): Promise<DBTicket> {
    const { data, error } = await supabase
      .from("support_tickets")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as DBTicket;
  }

  static async deleteTicket(id: string): Promise<void> {
    const { error } = await supabase.from("support_tickets").delete().eq("id", id);
    if (error) throw error;
  }

  static async getUserTickets(userId: string): Promise<DBTicket[]> {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(`
        *,
        assigned_admin_profile:assigned_admin (id, full_name, email, avatar_url)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as DBTicket[]) || [];
  }

  static async createTicket(payload: {
    user_id: string;
    subject: string;
    category: string;
    priority: string;
    description: string;
  }): Promise<DBTicket> {
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: payload.user_id,
        subject: payload.subject,
        category: payload.category,
        priority: payload.priority,
        description: payload.description,
        status: "open",
      })
      .select()
      .single();

    if (error) throw error;
    return data as DBTicket;
  }

  static async getUserTicketMessages(ticketId: string): Promise<DBTicketMessage[]> {
    const { data, error } = await supabase
      .from("ticket_messages")
      .select(`
        id,
        ticket_id,
        sender_id,
        message,
        is_internal,
        created_at,
        sender:sender_id (id, full_name, email, avatar_url, role)
      `)
      .eq("ticket_id", ticketId)
      .eq("is_internal", false)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data as any[]) || [];
  }
}
