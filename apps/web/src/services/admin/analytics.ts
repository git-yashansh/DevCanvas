import { supabase } from "@/lib/supabase";

export interface AnalyticsDetailedMetrics {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  activeUsersMonth: number;
  newUsersToday: number;
  totalProjects: number;
  projectsToday: number;
  totalAiGenerations: number;
  avgTicketResolutionTime: string;
  totalNotifications: number;
  avgSessionDuration: string;
  dailyLogins: number;
  monthlyLogins: number;
  
  generatorUsage: { generator: string; count: number }[];
  topGenerators: { generator: string; count: number }[];
  leastUsedGenerators: { generator: string; count: number }[];
  
  projectsPerDay: { date: string; count: number }[];
  projectsPerMonth: { month: string; count: number }[];
  projectCategories: { category: string; count: number }[];
  topCreators: { name: string; email: string; count: number }[];
  
  openTickets: number;
  closedTickets: number;
  resolvedTickets: number;
  ticketsByPriority: { priority: string; count: number }[];
  ticketsByCategory: { category: string; count: number }[];
  
  userRegistrations: { date: string; count: number }[];
  retentionRate: string;
  returningUsers: number;
  inactiveUsers: number;
  topActiveUsers: { name: string; email: string; logins: number; generations: number; projects: number }[];

  desktopPercent: number;
  browserPercent: number;
  intlPercent: number;
}

export class AnalyticsService {
  static async getAnalyticsMetrics(): Promise<AnalyticsDetailedMetrics> {
    const [
      profilesRes,
      projectsRes,
      ticketsRes,
      eventsRes,
      notificationsRes
    ] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, role, status, last_seen, created_at"),
      supabase.from("projects").select("id, name, owner_id, status, created_at"),
      supabase.from("support_tickets").select("id, user_id, subject, category, priority, status, created_at, closed_at, resolved_at"),
      supabase.from("analytics_events").select("event_type, details, device, browser, country, created_at, user_id"),
      supabase.from("notifications").select("*", { count: "exact", head: true })
    ]);

    const profiles = profilesRes.data || [];
    const projects = projectsRes.data || [];
    const tickets = ticketsRes.data || [];
    const events = eventsRes.data || [];
    const notificationsCount = notificationsRes.count || 0;

    const nowMs = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    // 1. KPIs
    const activeToday = profiles.filter(p => p.last_seen && (nowMs - new Date(p.last_seen).getTime() <= dayMs)).length;
    const activeWeek = profiles.filter(p => p.last_seen && (nowMs - new Date(p.last_seen).getTime() <= weekMs)).length;
    const activeMonth = profiles.filter(p => p.last_seen && (nowMs - new Date(p.last_seen).getTime() <= monthMs)).length;
    const newToday = profiles.filter(p => p.created_at && (nowMs - new Date(p.created_at).getTime() <= dayMs)).length;
    
    const projectsToday = projects.filter(pr => pr.created_at && (nowMs - new Date(pr.created_at).getTime() <= dayMs)).length;
    const aiGenerations = events.filter(e => e.event_type === "ai_generation");
    
    // Logins
    const loginsToday = events.filter(e => e.event_type === "user_login" && (nowMs - new Date(e.created_at).getTime() <= dayMs)).length;
    const loginsMonth = events.filter(e => e.event_type === "user_login" && (nowMs - new Date(e.created_at).getTime() <= monthMs)).length;

    // Session durations
    const sessionEvents = events.filter(e => e.event_type === "session_duration");
    const avgSec = sessionEvents.length
      ? Math.round(sessionEvents.reduce((acc, curr) => acc + (curr.details?.duration_seconds || 0), 0) / sessionEvents.length)
      : 0;
    const avgSessionStr = avgSec ? `${Math.floor(avgSec / 60)}m ${avgSec % 60}s` : "0m 0s";

    // 2. Hardware/Region breakdown
    let desktopCount = 0;
    let webBrowserCount = 0;
    let intlCount = 0;
    events.forEach((ev) => {
      if (ev.device && (ev.device.includes("Windows") || ev.device.includes("Mac"))) desktopCount++;
      if (ev.browser && (ev.browser.includes("Chrome") || ev.browser.includes("Safari"))) webBrowserCount++;
      if (ev.country && ev.country !== "US") intlCount++;
    });
    const totalEv = events.length || 1;

    // 3. Generator analytics
    const generatorUsageMap: Record<string, number> = {};
    aiGenerations.forEach(ev => {
      const gen = ev.details?.generator || "other";
      generatorUsageMap[gen] = (generatorUsageMap[gen] || 0) + 1;
    });
    const generatorUsage = Object.entries(generatorUsageMap).map(([generator, count]) => ({ generator, count }));
    const sortedGenerators = [...generatorUsage].sort((a, b) => b.count - a.count);
    const topGenerators = sortedGenerators.slice(0, 3);
    const leastUsedGenerators = sortedGenerators.reverse().slice(0, 3);

    // 4. Project metrics
    const projectsPerDayMap: Record<string, number> = {};
    const projectsPerMonthMap: Record<string, number> = {};
    const projectCategoriesMap: Record<string, number> = {};
    projects.forEach(p => {
      const dayKey = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const monthKey = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      projectsPerDayMap[dayKey] = (projectsPerDayMap[dayKey] || 0) + 1;
      projectsPerMonthMap[monthKey] = (projectsPerMonthMap[monthKey] || 0) + 1;
      projectCategoriesMap[p.status] = (projectCategoriesMap[p.status] || 0) + 1;
    });

    const projectsPerDay = Object.entries(projectsPerDayMap).map(([date, count]) => ({ date, count }));
    const projectsPerMonth = Object.entries(projectsPerMonthMap).map(([month, count]) => ({ month, count }));
    const projectCategories = Object.entries(projectCategoriesMap).map(([category, count]) => ({ category, count }));

    // Top project creators
    const userProjectsMap: Record<string, number> = {};
    projects.forEach(p => {
      if (p.owner_id) userProjectsMap[p.owner_id] = (userProjectsMap[p.owner_id] || 0) + 1;
    });
    const topCreators = Object.entries(userProjectsMap)
      .map(([ownerId, count]) => {
        const prof = profiles.find(p => p.id === ownerId);
        return {
          name: prof?.full_name || "User",
          email: prof?.email || "n/a",
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 5. Support analytics
    const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;
    const closedTickets = tickets.filter(t => t.status === "closed").length;
    const resolvedTickets = tickets.filter(t => t.status === "resolved").length;

    const resolvedList = tickets.filter(t => t.status === "resolved" || t.status === "closed");
    const totalResolveMs = resolvedList.reduce((acc, curr) => {
      const end = curr.resolved_at || curr.closed_at;
      if (!end) return acc;
      return acc + (new Date(end).getTime() - new Date(curr.created_at).getTime());
    }, 0);
    const avgTicketResolutionSec = resolvedList.length ? Math.round(totalResolveMs / resolvedList.length / 1000) : 0;
    const avgTicketResolutionTime = avgTicketResolutionSec
      ? `${Math.floor(avgTicketResolutionSec / 3600)}h ${Math.floor((avgTicketResolutionSec % 3600) / 60)}m`
      : "0h 0m";

    const priorityMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};
    tickets.forEach(t => {
      priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1;
      categoryMap[t.category] = (categoryMap[t.category] || 0) + 1;
    });
    const ticketsByPriority = Object.entries(priorityMap).map(([priority, count]) => ({ priority, count }));
    const ticketsByCategory = Object.entries(categoryMap).map(([category, count]) => ({ category, count }));

    // 6. User metrics
    const userRegsMap: Record<string, number> = {};
    profiles.forEach(p => {
      const dayKey = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      userRegsMap[dayKey] = (userRegsMap[dayKey] || 0) + 1;
    });
    const userRegistrations = Object.entries(userRegsMap).map(([date, count]) => ({ date, count }));
    
    // Retention rate (DAU/MAU)
    const retentionRate = activeMonth ? `${Math.min(100, Math.round((activeToday / activeMonth) * 100))}%` : "0%";
    
    // Inactive & returning users
    const inactiveUsers = profiles.filter(p => !p.last_seen || (nowMs - new Date(p.last_seen).getTime() > monthMs)).length;
    
    const userLoginsMap: Record<string, number> = {};
    events.filter(e => e.event_type === "user_login").forEach(e => {
      if (e.user_id) userLoginsMap[e.user_id] = (userLoginsMap[e.user_id] || 0) + 1;
    });
    const returningUsers = Object.values(userLoginsMap).filter(c => c > 1).length;

    // Top active users listing
    const topActiveUsers = Object.entries(userLoginsMap)
      .map(([userId, logins]) => {
        const prof = profiles.find(p => p.id === userId);
        const userGenerations = aiGenerations.filter(e => e.user_id === userId).length;
        const userProjects = projects.filter(p => p.owner_id === userId).length;
        return {
          name: prof?.full_name || "User",
          email: prof?.email || "n/a",
          logins,
          generations: userGenerations,
          projects: userProjects
        };
      })
      .sort((a, b) => b.logins + b.generations + b.projects - (a.logins + a.generations + a.projects))
      .slice(0, 5);

    return {
      totalUsers: profiles.length,
      activeUsersToday: activeToday,
      activeUsersWeek: activeWeek,
      activeUsersMonth: activeMonth,
      newUsersToday: newToday,
      totalProjects: projects.length,
      projectsToday,
      totalAiGenerations: aiGenerations.length,
      avgTicketResolutionTime,
      totalNotifications: notificationsCount || 0,
      avgSessionDuration: avgSessionStr,
      dailyLogins: loginsToday,
      monthlyLogins: loginsMonth,
      
      generatorUsage,
      topGenerators,
      leastUsedGenerators,
      
      projectsPerDay,
      projectsPerMonth,
      projectCategories,
      topCreators,
      
      openTickets,
      closedTickets,
      resolvedTickets,
      ticketsByPriority,
      ticketsByCategory,
      
      userRegistrations,
      retentionRate,
      returningUsers,
      inactiveUsers,
      topActiveUsers,

      desktopPercent: Math.round((desktopCount / totalEv) * 100) || 0,
      browserPercent: Math.round((webBrowserCount / totalEv) * 100) || 0,
      intlPercent: Math.round((intlCount / totalEv) * 100) || 0
    };
  }
}
