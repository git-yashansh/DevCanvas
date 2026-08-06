import { supabase } from "@/lib/supabase";
import type { AuditLog } from "./types";

export class AuditService {
  static async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        id,
        created_at,
        action,
        entity,
        details,
        ip_address,
        user_agent,
        result,
        profiles:actor_id (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as any[]) || [];
  }

  static async createAuditLog(payload: {
    actor_id: string;
    action: string;
    entity: string;
    details?: any;
    result: string;
    ip_address?: string;
  }): Promise<AuditLog> {
    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        actor_id: payload.actor_id,
        action: payload.action,
        entity: payload.entity,
        details: payload.details || {},
        result: payload.result,
        ip_address: payload.ip_address || null
      })
      .select()
      .single();

    if (error) throw error;
    return data as AuditLog;
  }
}
