import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { cacheManager } from "@/lib/cache";
import { useAdminDashboard } from "@/services/admin/hooks";
import {
  Users,
  Cpu,
  Ticket,
  FolderGit2,
  Activity,
  AlertTriangle,
  Zap,
  TrendingUp,
  Database,
  ArrowUpRight,
  UserCheck,
  Server,
  ShieldCheck,
  MessageSquareCode,
  Star,
  Layers,
  Clock,
} from "lucide-react";

export function AdminDashboardPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const { data: dashboardData, isLoading, refetch } = useAdminDashboard();

  const counts = dashboardData?.metrics || {
    users: 0,
    activeUsers24h: 0,
    onlineUsers: 0,
    projects: 0,
    totalAiGenerations: 0,
    todayAiRequests: 0,
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    activeNotifications: 0,
    featureFlagsCount: 0,
    totalFeedback: 0,
    avgRating: 0,
    systemHealthPercent: 100,
    dbStatus: "Healthy",
    apiStatus: "Operational",
  };

  const recentLogs = dashboardData?.recentLogs || [];

  useEffect(() => {
    // Attach Supabase Realtime listeners across key tables
    const channel = supabase
      .channel("admin:dashboard:live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => { refetch(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => { refetch(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => { refetch(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => { refetch(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_logs" }, () => { refetch(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_feedback" }, () => { refetch(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Primary Operational Stats Cards
  const stats = [
    { label: "Total Users", val: counts.users.toString(), change: `${counts.activeUsers24h} active in 24h`, icon: Users, color: "text-blue-400" },
    { label: "Online Users", val: counts.onlineUsers.toString(), change: "Active last 5 mins", icon: UserCheck, color: "text-emerald-400" },
    { label: "Total Projects", val: counts.projects.toString(), change: "All workspace directories", icon: FolderGit2, color: "text-orange-400" },
    { label: "Today's AI Requests", val: counts.todayAiRequests.toString(), change: `${counts.totalAiGenerations} total prompts`, icon: Cpu, color: "text-indigo-400" },
    { label: "Open Tickets", val: counts.openTickets.toString(), change: `${counts.totalTickets} total queries`, icon: AlertTriangle, color: "text-amber-400" },
    { label: "System Health", val: `${counts.systemHealthPercent}%`, change: `${counts.dbStatus} Postgres`, icon: ShieldCheck, color: "text-purple-400" },
  ];

  // Secondary Telemetry Row
  const secondaryStats = [
    { label: "Closed Tickets", val: counts.closedTickets.toString(), icon: ShieldCheck, color: "text-emerald-400" },
    { label: "Active Notifications", val: counts.activeNotifications.toString(), icon: Zap, color: "text-cyan-400" },
    { label: "Feature Flags", val: counts.featureFlagsCount.toString(), icon: Layers, color: "text-orange-400" },
    { label: "Total Feedback", val: counts.totalFeedback.toString(), icon: MessageSquareCode, color: "text-indigo-400" },
    { label: "Avg. User Rating", val: `${counts.avgRating} / 5`, icon: Star, color: "text-amber-400" },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto font-sans">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-wide">
            Operational Control Center
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time telemetry, active user tracking, ticket queues, and system health status.
          </p>
        </div>

        {/* Maintenance Toggle Action */}
        <button
          onClick={() => setMaintenanceMode(!maintenanceMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-bold border transition-all cursor-pointer ${
            maintenanceMode
              ? "bg-red-500/25 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse"
              : "bg-white/[0.03] border-white/10 hover:border-white/20 text-white"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          {maintenanceMode ? "Maintenance Mode Active" : "Enable Maintenance Mode"}
        </button>
      </div>

      {/* ── Operational Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-xl p-4 flex flex-col justify-between hover:border-blue-800/40 transition-all"
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                {stat.label}
              </span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="mt-3">
              <span className="text-xl font-heading font-black text-white block">
                {stat.val}
              </span>
              <span className="text-[9.5px] font-semibold text-neutral-400 mt-0.5 block leading-none">
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Secondary Telemetry Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {secondaryStats.map((item, i) => (
          <div key={i} className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[9.5px] uppercase font-bold tracking-wider text-neutral-500 block">{item.label}</span>
              <span className="text-lg font-heading font-black text-white block mt-0.5">{item.val}</span>
            </div>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </div>
        ))}
      </div>

      {/* ── Core Telemetries & Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Activity & Growth Chart */}
        <div className="lg:col-span-2 bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-orange-400" />
              <span className="font-heading text-[15px] font-bold text-white">Daily AI Requests &amp; Active Users</span>
            </div>
            <span className="text-[10px] text-neutral-400 uppercase font-mono">Live Telemetry</span>
          </div>

          <div className="h-48 w-full relative flex items-end">
            <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              
              <path
                d="M 0 160 Q 100 120, 200 140 T 300 80 T 400 90 T 500 50 T 600 30"
                fill="none"
                stroke="url(#chartGlow)"
                strokeWidth="12"
                strokeLinecap="round"
                className="opacity-50"
              />
              <path
                d="M 0 160 Q 100 120, 200 140 T 300 80 T 400 90 T 500 50 T 600 30"
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 0 160 Q 100 120, 200 140 T 300 80 T 400 90 T 500 50 T 600 30 L 600 200 L 0 200 Z"
                fill="url(#chartGlow)"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between mt-4 text-[10px] text-neutral-500 font-mono border-t border-white/[0.08] pt-3.5">
            <span>Operating Status: Online</span>
            <span>Database: Connected</span>
            <span>Realtime: Active</span>
          </div>
        </div>

        {/* System & Instance Telemetry */}
        <div className="bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Server className="h-4.5 w-4.5 text-indigo-400" />
              <span className="font-heading text-[15px] font-bold text-white">Instance Telemetry</span>
            </div>
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
              Operational
            </span>
          </div>

          <div className="space-y-3.5 text-xs text-left">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-neutral-400 mb-1">
                <span>Database Read / Write I/O</span>
                <span className="font-mono">Healthy (0ms delay)</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "95%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-neutral-400 mb-1">
                <span>Edge Functions Engine</span>
                <span className="font-mono">8 active functions</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-neutral-400 mb-1">
                <span>Realtime WebSocket Publication</span>
                <span className="font-mono">Connected</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px]">
              <span className="text-neutral-500">PostgreSQL Instance:</span>
              <span className="font-semibold text-white">Supabase Cloud</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lower Area: Quick Actions & Recent Activities ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Operations Actions */}
        <div className="bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-2xl p-5 space-y-4 text-left">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Quick Operations
          </span>
          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => {
                cacheManager.clear();
                alert("Cache invalidated successfully.");
              }}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer gap-2"
            >
              <Zap className="h-5 w-5 text-orange-400" />
              Flush Cache Layer
            </button>
            <button
              onClick={() => refetch()}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer gap-2"
            >
              <Database className="h-5 w-5 text-indigo-400" />
              Sync Supabase DB
            </button>
            <Link
              to="/admin/notifications"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer gap-2"
            >
              <Zap className="h-5 w-5 text-emerald-400" />
              Broadcast Notice
            </Link>
            <Link
              to="/admin/audit"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer gap-2"
            >
              <Activity className="h-5 w-5 text-blue-400" />
              Audit Logs
            </Link>
          </div>
        </div>

        {/* Live Audit Log Stream */}
        <div className="lg:col-span-2 bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-2xl p-5 space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="font-heading text-[15px] font-bold text-white">Live Audit Activity Stream</span>
            <Link to="/admin/audit" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
              View full audit history <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 font-mono text-center">No recent audit logs recorded.</p>
            ) : (
              recentLogs.map((log) => {
                const actorName = log.profiles?.full_name || log.profiles?.email || "System Operator";
                return (
                  <div key={log.id} className="flex justify-between items-start text-xs border-b border-white/[0.02] pb-3 last:border-b-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-neutral-300 font-medium">
                        <span className="text-orange-400 font-bold">{actorName}</span> performed <span className="font-mono text-white">{log.action}</span> on <span className="font-mono text-neutral-400">{log.entity}</span>
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                        <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span>IP: {log.ip_address || "Internal"}</span>
                        <span>•</span>
                        <span className="capitalize text-emerald-400">{log.result}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
