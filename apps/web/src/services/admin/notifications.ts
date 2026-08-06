import { supabase } from "@/lib/supabase";
import type { DBNotification } from "@/lib/types/notifications";

export class NotificationService {
  static async getNotifications(): Promise<DBNotification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as DBNotification[]) || [];
  }

  static async getUserOptions(): Promise<{ id: string; email: string; full_name: string | null }[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .order("email", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async createNotification(payload: {
    title: string;
    message: string;
    type: string;
    is_broadcast: boolean;
    user_id?: string | null;
    recipient_user_id?: string | null;
    created_by?: string;
  }): Promise<DBNotification> {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        title: payload.title,
        message: payload.message,
        type: payload.type,
        is_broadcast: payload.is_broadcast,
        user_id: payload.user_id || null,
        recipient_user_id: payload.recipient_user_id || null,
        created_by: payload.created_by || null,
        sender_user_id: payload.created_by || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as DBNotification;
  }

  static async createNotificationsBulk(inserts: any[]): Promise<void> {
    const { error } = await supabase.from("notifications").insert(inserts);
    if (error) throw error;
  }

  static async updateNotification(id: string, patch: Partial<DBNotification>): Promise<DBNotification> {
    const { data, error } = await supabase
      .from("notifications")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as DBNotification;
  }

  static async deleteNotification(id: string): Promise<void> {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) throw error;
  }
}
