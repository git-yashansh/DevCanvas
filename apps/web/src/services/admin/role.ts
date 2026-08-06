import { supabase } from "@/lib/supabase";

export interface DBBlockedIp {
  id: string;
  ip: string;
  reason: string;
  blocked_by: string;
  blocked_time: string;
  expiry: string | null;
  permanent: boolean;
  notes: string | null;
}

export interface DBSecurityWarning {
  id: string;
  user_id: string | null;
  alert_type: string;
  description: string;
  risk_score: number;
  detected_at: string;
  metadata: any;
  is_resolved: boolean;
}

export interface DBActiveSession {
  id: string;
  user_id: string;
  session_id: string;
  device: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  country: string | null;
  created_at: string;
  last_activity: string;
  status: string;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

export interface DBLoginHistory {
  id: string;
  user_id: string;
  email: string;
  username: string | null;
  login_time: string;
  logout_time: string | null;
  browser: string | null;
  operating_system: string | null;
  device_type: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  session_id: string;
}

export interface DBFailedAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  country: string | null;
  browser: string | null;
  os: string | null;
  created_at: string;
  reason: string | null;
  attempt_count: number;
}

export interface DBAccountLockout {
  id: string;
  user_id: string;
  locked_at: string;
  unlock_at: string;
  reason: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

export interface DBRole {
  id: string;
  name: string;
  priority: number;
  description: string;
  permissions: string[];
}

export class RoleService {
  // Roles
  static async getSystemRoles(): Promise<DBRole[]> {
    const { data, error } = await supabase.from("roles").select("*").order("priority", { ascending: true });
    if (error) throw error;
    return (data as DBRole[]) || [];
  }

  static async updateUserRole(userId: string, newRole: string): Promise<void> {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    if (error) throw error;
  }

  static async updateUserStatus(userId: string, newStatus: string): Promise<void> {
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", userId);
    if (error) throw error;
  }

  // Blocked IPs
  static async getBlockedIps(): Promise<DBBlockedIp[]> {
    const { data, error } = await supabase.from("blocked_ips").select("*").order("blocked_time", { ascending: false });
    if (error) throw error;
    return (data as DBBlockedIp[]) || [];
  }

  static async blockIp(ip: string, reason: string, blockedBy: string, expiry: string | null, permanent: boolean, notes: string | null): Promise<void> {
    const { error } = await supabase.from("blocked_ips").insert({
      ip,
      reason,
      blocked_by: blockedBy,
      expiry,
      permanent,
      notes
    });
    if (error) throw error;
  }

  static async unblockIp(ip: string): Promise<void> {
    const { error } = await supabase.from("blocked_ips").delete().eq("ip", ip);
    if (error) throw error;
  }

  // Security Warnings/Alerts
  static async getSecurityWarnings(): Promise<DBSecurityWarning[]> {
    const { data, error } = await supabase.from("security_alerts").select("*").order("detected_at", { ascending: false });
    if (error) throw error;
    return (data as DBSecurityWarning[]) || [];
  }

  // Active Sessions
  static async getActiveSessions(): Promise<DBActiveSession[]> {
    const { data, error } = await supabase
      .from("active_sessions")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as any[]) || [];
  }

  static async terminateSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from("active_sessions")
      .update({ status: "terminated" })
      .eq("session_id", sessionId);
    if (error) throw error;
  }

  static async terminateAllSessions(): Promise<void> {
    const { error } = await supabase
      .from("active_sessions")
      .update({ status: "terminated" })
      .neq("status", "terminated");
    if (error) throw error;
  }

  // Login History
  static async getLoginHistory(): Promise<DBLoginHistory[]> {
    const { data, error } = await supabase.from("login_history").select("*").order("login_time", { ascending: false });
    if (error) throw error;
    return (data as DBLoginHistory[]) || [];
  }

  // Failed Attempts
  static async getFailedAttempts(): Promise<DBFailedAttempt[]> {
    const { data, error } = await supabase.from("failed_login_attempts").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data as DBFailedAttempt[]) || [];
  }

  // Lockouts
  static async getAccountLockouts(): Promise<DBAccountLockout[]> {
    const { data, error } = await supabase
      .from("account_lockouts")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order("locked_at", { ascending: false });

    if (error) throw error;
    return (data as any[]) || [];
  }

  static async lockAccount(userId: string, durationMinutes: number, reason: string): Promise<void> {
    const { error } = await supabase.from("account_lockouts").insert({
      user_id: userId,
      locked_at: new Date().toISOString(),
      unlock_at: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
      reason
    });
    if (error) throw error;
  }

  static async unlockAccount(userId: string): Promise<void> {
    const { error } = await supabase.from("account_lockouts").delete().eq("user_id", userId);
    if (error) throw error;
  }
}
