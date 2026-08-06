import { supabase } from "@/lib/supabase";
import type { DBTicket } from "@/lib/types/tickets";
import type { DBNotification } from "@/lib/types/notifications";

export interface AdminUserListItem {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
  created_at: string;
  last_seen: string;
  projectsCount: number;
  ticketsCount: number;
}

export interface UserDetails {
  profile: any;
  tickets: DBTicket[];
  notifications: DBNotification[];
  projectsCount: number;
}

export class UserService {
  static async getUsers(options?: {
    sortBy?: "created_at" | "full_name" | "last_seen";
    sortOrder?: "asc" | "desc";
  }): Promise<AdminUserListItem[]> {
    const sortBy = options?.sortBy || "created_at";
    const sortOrder = options?.sortOrder || "desc";

    const [
      { data: profilesData, error: profilesError },
      { data: projectsData },
      { data: ticketsData }
    ] = await Promise.all([
      supabase.from("profiles").select("*").order(sortBy, { ascending: sortOrder === "asc" }),
      supabase.from("projects").select("owner_id"),
      supabase.from("support_tickets").select("user_id")
    ]);

    if (profilesError) throw profilesError;

    const projectCounts: Record<string, number> = {};
    if (projectsData) {
      projectsData.forEach((p) => {
        projectCounts[p.owner_id] = (projectCounts[p.owner_id] || 0) + 1;
      });
    }

    const ticketCounts: Record<string, number> = {};
    if (ticketsData) {
      ticketsData.forEach((t) => {
        ticketCounts[t.user_id] = (ticketCounts[t.user_id] || 0) + 1;
      });
    }

    return (profilesData || []).map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      role: user.role || "user",
      status: user.status || "active",
      created_at: user.created_at,
      last_seen: user.last_seen || user.created_at,
      projectsCount: projectCounts[user.id] || 0,
      ticketsCount: ticketCounts[user.id] || 0,
    }));
  }

  static async getUserDetails(id: string): Promise<UserDetails> {
    const [
      { data: profile, error: profileErr },
      { data: ticketsData },
      { data: notifData },
      { count: projectsCount }
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("support_tickets").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").or(`user_id.eq.${id},is_broadcast.eq.true`).order("created_at", { ascending: false }),
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("owner_id", id)
    ]);

    if (profileErr) throw profileErr;
    if (!profile) throw new Error("User profile not found");

    return {
      profile,
      tickets: (ticketsData as DBTicket[]) || [],
      notifications: (notifData as DBNotification[]) || [],
      projectsCount: projectsCount || 0,
    };
  }

  static async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) throw error;
  }
}
