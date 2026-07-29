import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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
  Play,
  FileText,
  ShieldCheck,
} from "lucide-react";

export function AdminDashboardPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [counts, setCounts] = useState({
    users: 0,
    activeUsers: 0,
    projects: 0,
    aiRequests: 0,
    failedAiRequests: 0,
    openTickets: 0,
    loading: true,
  });

  useEffect(() => {
    async function fetchRealMetrics() {
      try {
        // 1. Total users
        const { count: usersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // 2. Active users (recently updated profiles in last 24h as a proxy)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: activeUsersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("updated_at", dayAgo);

        // 3. Projects count
        const { count: projectsCount } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true });

        // 4. AI assistant requests (assistant role chat messages) today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const { count: aiRequestsCount } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("role", "assistant")
          .gte("created_at", startOfToday.toISOString());

        // 5. Open tickets
        const { count: openTicketsCount } = await supabase
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .eq("status", "open");

        // 6. System warnings/failures count
        const { count: failedCount } = await supabase
          .from("system_logs")
          .select("*", { count: "exact", head: true })
          .eq("level", "error");

        setCounts({
          users: usersCount || 0,
          activeUsers: activeUsersCount || 0,
          projects: projectsCount || 0,
          aiRequests: aiRequestsCount || 0,
          failedAiRequests: failedCount || 0,
          openTickets: openTicketsCount || 0,
          loading: false,
        });
      } catch (err) {
        console.error("Failed to load real metrics:", err);
        setCounts((prev) => ({ ...prev, loading: false }));
      }
    }
    fetchRealMetrics();
  }, []);

  // Stats Card data
  const stats = [
    { label: "Total Users", val: counts.users.toString(), change: "Registered profiles", icon: Users, color: "text-blue-400" },
    { label: "Daily Active Users", val: counts.activeUsers.toString(), change: "Active last 24h", icon: UserCheck, color: "text-emerald-400" },
    { label: "Projects Created", val: counts.projects.toString(), change: "All workspaces", icon: FolderGit2, color: "text-orange-400" },
    { label: "AI Requests Today", val: counts.aiRequests.toString(), change: "Assistant responses", icon: Cpu, color: "text-indigo-400" },
    { label: "Failed AI Requests", val: counts.failedAiRequests.toString(), change: "System errors log", icon: AlertTriangle, color: "text-red-400" },
    { label: "Open Tickets", val: counts.openTickets.toString(), change: "Awaiting support", icon: Ticket, color: "text-amber-400" },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-wide">
            Operational Control Center
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            General health overview, active users profiles, and machine intelligence operations telemetry.
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
              <span className="text-[9.5px] font-semibold text-neutral-450 mt-0.5 block leading-none">
                {stat.change}
              </span>
            </div>
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
              <span className="font-heading text-[15px] font-bold text-white">Daily AI Requests & Active Users</span>
            </div>
            <span className="text-[10px] text-neutral-450 uppercase font-mono">Last 7 Operating Days</span>
          </div>

          {/* Pure SVG Responsive Line Chart */}
          <div className="h-48 w-full relative flex items-end">
            <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Tilted reference grid lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              
              {/* Chart line path */}
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
              
              {/* Filled area */}
              <path
                d="M 0 160 Q 100 120, 200 140 T 300 80 T 400 90 T 500 50 T 600 30 L 600 200 L 0 200 Z"
                fill="url(#chartGlow)"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between mt-4 text-[10px] text-neutral-500 font-mono border-t border-white/[0.08] pt-3.5">
            <span>Jul 23</span>
            <span>Jul 24</span>
            <span>Jul 25</span>
            <span>Jul 26</span>
            <span>Jul 27</span>
            <span>Jul 28</span>
            <span>Jul 29 (Today)</span>
          </div>
        </div>

        {/* System & Hardware Health metrics */}
        <div className="bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Server className="h-4.5 w-4.5 text-indigo-400" />
              <span className="font-heading text-[15px] font-bold text-white">Instance Status</span>
            </div>
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
              Operational
            </span>
          </div>

          <div className="space-y-3.5 text-xs text-left">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-neutral-400 mb-1">
                <span>Database Read / Write I/O</span>
                <span className="font-mono">14.2%</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "14.2%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-neutral-400 mb-1">
                <span>CPU Cluster Telemetry</span>
                <span className="font-mono">34.8%</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "34.8%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-neutral-400 mb-1">
                <span>Supabase Storage Buckets</span>
                <span className="font-mono">82% (41GB / 50GB)</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: "82%" }} />
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px]">
              <span className="text-neutral-500">Node Edge Functions:</span>
              <span className="font-semibold text-white">4 active</span>
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
            <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer gap-2">
              <Zap className="h-5 w-5 text-orange-400" />
              Flush Edge Cache
            </button>
            <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer gap-2">
              <Database className="h-5 w-5 text-indigo-400" />
              Backup Postgres
            </button>
            <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Sync API Secrets
            </button>
            <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              Compile Audit PDF
            </button>
          </div>
        </div>

        {/* Recent Admin & User actions logs */}
        <div className="lg:col-span-2 bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-2xl p-5 space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="font-heading text-[15px] font-bold text-white">Recent Activities Log</span>
            <Link to="/admin/audit" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
              View full audit history <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {[
              { text: "Admin promoted user 'yash@devcanvas.ai' to MODERATOR role.", time: "12 minutes ago", ip: "192.168.1.14" },
              { text: "Rate limit block triggered for IP range '45.12.82.*' on API routes.", time: "45 minutes ago", ip: "VPC Firewalls" },
              { text: "Feature flag 'AI_AUTOSCALE_SPEC' updated to TRUE.", time: "2 hours ago", ip: "192.168.1.14" },
              { text: "Support Ticket #482 solved by operator 'support_user_2'.", time: "4 hours ago", ip: "172.16.82.12" },
            ].map((log, i) => (
              <div key={i} className="flex justify-between items-start text-xs border-b border-white/[0.02] pb-3 last:border-b-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-neutral-350 leading-relaxed font-sans">{log.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                    <span>{log.time}</span>
                    <span>•</span>
                    <span>Actor IP: {log.ip}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
export default AdminDashboardPage;
