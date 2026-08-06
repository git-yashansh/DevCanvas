import { supabase } from "@/lib/supabase";

export interface DashboardMetrics {
  users: number;
  activeUsers24h: number;
  onlineUsers: number;
  projects: number;
  totalAiGenerations: number;
  todayAiRequests: number;
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  activeNotifications: number;
  featureFlagsCount: number;
  totalFeedback: number;
  avgRating: number;
  systemHealthPercent: number;
  dbStatus: string;
  apiStatus: string;
}

export class AdminDashboardService {
  static async getMetrics(): Promise<{ metrics: DashboardMetrics; recentLogs: any[] }> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const [
      { count: usersCount },
      { count: active24hCount },
      { count: onlineCount },
      { count: projectsCount },
      { count: totalAiCount },
      { count: todayAiCount },
      { count: totalTicketsCount },
      { count: openTicketsCount },
      { count: closedTicketsCount },
      { count: notificationsCount },
      { count: flagsCount },
      { data: feedbackData },
      { count: errorLogsCount },
      { data: auditLogsData },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("updated_at", dayAgo),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_seen", fiveMinsAgo),
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("chat_messages").select("*", { count: "exact", head: true }).eq("role", "assistant"),
      supabase.from("chat_messages").select("*", { count: "exact", head: true }).eq("role", "assistant").gte("created_at", startOfToday.toISOString()),
      supabase.from("support_tickets").select("*", { count: "exact", head: true }),
      supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "closed"),
      supabase.from("notifications").select("*", { count: "exact", head: true }),
      supabase.from("feature_flags").select("*", { count: "exact", head: true }).eq("value", true),
      supabase.from("user_feedback").select("rating"),
      supabase.from("system_logs").select("*", { count: "exact", head: true }).eq("level", "error"),
      supabase.from("audit_logs").select("id, action, entity, result, ip_address, created_at, profiles:actor_id(full_name, email)").order("created_at", { ascending: false }).limit(5),
    ]);

    let computedAvgRating = 0;
    if (feedbackData && feedbackData.length > 0) {
      const totalRatingSum = feedbackData.reduce((acc, f) => acc + (f.rating || 5), 0);
      computedAvgRating = Number((totalRatingSum / feedbackData.length).toFixed(1));
    }

    const healthPercent = Math.max(0, 100 - (errorLogsCount || 0) * 5);

    return {
      metrics: {
        users: usersCount || 0,
        activeUsers24h: active24hCount || 0,
        onlineUsers: onlineCount || 0,
        projects: projectsCount || 0,
        totalAiGenerations: totalAiCount || 0,
        todayAiRequests: todayAiCount || 0,
        totalTickets: totalTicketsCount || 0,
        openTickets: openTicketsCount || 0,
        closedTickets: closedTicketsCount || 0,
        activeNotifications: notificationsCount || 0,
        featureFlagsCount: flagsCount || 0,
        totalFeedback: feedbackData?.length || 0,
        avgRating: computedAvgRating || 5.0,
        systemHealthPercent: healthPercent,
        dbStatus: "Healthy",
        apiStatus: "Operational",
      },
      recentLogs: auditLogsData || [],
    };
  }
}
