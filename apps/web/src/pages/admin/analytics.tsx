import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Globe,
  Compass,
  Monitor,
  Loader2,
  RefreshCw,
  Download,
  Cpu,
  FolderGit2,
  Ticket,
  Mail,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdminAnalytics } from "@/services/admin/hooks";

// Reusable SVG Line/Area Chart Component
function SVGLineChart({ data, xKey, yKey, color = "#f97316" }: { data: any[]; xKey: string; yKey: string; color?: string }) {
  if (data.length === 0) return <div className="text-neutral-500 text-xs py-12 text-center font-mono">No data points recorded yet</div>;
  const maxVal = Math.max(...data.map(d => d[yKey]), 1);
  const width = 500;
  const height = 150;
  const padding = 15;
  const points = data.map((d, idx) => {
    const x = padding + (idx * (width - 2 * padding)) / Math.max(data.length - 1, 1);
    const y = height - padding - (d[yKey] * (height - 2 * padding)) / maxVal;
    return `${x},${y}`;
  }).join(" ");

  const fillPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      <polygon fill={`${color}0A`} points={fillPoints} />
    </svg>
  );
}

// Reusable SVG Bar Chart Component
function SVGBarChart({ data, xKey, yKey, color = "#6366f1" }: { data: any[]; xKey: string; yKey: string; color?: string }) {
  if (data.length === 0) return <div className="text-neutral-500 text-xs py-12 text-center font-mono">No data points recorded yet</div>;
  const maxVal = Math.max(...data.map(d => d[yKey]), 1);
  const width = 500;
  const height = 150;
  const padding = 15;
  const barWidth = Math.max(8, ((width - 2 * padding) / data.length) - 8);

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      {data.map((d, idx) => {
        const x = padding + idx * ((width - 2 * padding) / data.length) + 4;
        const barHeight = (d[yKey] * (height - 2 * padding)) / maxVal;
        const y = height - padding - barHeight;
        return (
          <rect
            key={idx}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={color}
            rx={2}
            className="opacity-80 hover:opacity-100 transition-opacity"
          />
        );
      })}
    </svg>
  );
}

// Segmented Shares Bar Component
function SegmentedBar({ data, nameKey, valKey }: { data: any[]; nameKey: string; valKey: string }) {
  const total = data.reduce((acc, d) => acc + d[valKey], 0) || 1;
  const COLORS = ["bg-orange-500", "bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-cyan-500", "bg-amber-500"];

  return (
    <div className="space-y-4">
      <div className="w-full h-3 rounded-full bg-neutral-900 flex overflow-hidden">
        {data.map((d, idx) => {
          const width = (d[valKey] / total) * 100;
          if (width === 0) return null;
          return (
            <div
              key={idx}
              className={COLORS[idx % COLORS.length]}
              style={{ width: `${width}%` }}
              title={`${d[nameKey]}: ${d[valKey]}`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        {data.map((d, idx) => {
          const share = Math.round((d[valKey] / total) * 100);
          const colorBg = COLORS[idx % COLORS.length];
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${colorBg}`} />
              <span className="text-neutral-400 capitalize truncate">{d[nameKey]}</span>
              <span className="font-mono text-neutral-500 ml-auto">{d[valKey]} ({share}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type TabType = "overview" | "generators" | "projects" | "support" | "users";

export function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  // React Query Hook
  const { data: metrics, isLoading, refetch } = useAdminAnalytics();

  // Supabase Realtime update channel subscriptions
  useEffect(() => {
    const profilesChan = supabase.channel("realtime:profiles").on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => refetch()).subscribe();
    const projectsChan = supabase.channel("realtime:projects").on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => refetch()).subscribe();
    const ticketsChan = supabase.channel("realtime:support_tickets").on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => refetch()).subscribe();
    const notifsChan = supabase.channel("realtime:notifications").on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => refetch()).subscribe();
    const eventsChan = supabase.channel("realtime:events").on("postgres_changes", { event: "*", schema: "public", table: "analytics_events" }, () => refetch()).subscribe();

    return () => {
      supabase.removeChannel(profilesChan);
      supabase.removeChannel(projectsChan);
      supabase.removeChannel(ticketsChan);
      supabase.removeChannel(notifsChan);
      supabase.removeChannel(eventsChan);
    };
  }, [refetch]);

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    if (!metrics) return;
    let csvContent = "";
    let filename = `devcanvas_analytics_${activeTab}`;

    if (activeTab === "overview") {
      csvContent = "Metric,Value\n" +
        `Total Users,${metrics.totalUsers}\n` +
        `Active Today,${metrics.activeUsersToday}\n` +
        `Active This Week,${metrics.activeUsersWeek}\n` +
        `Active This Month,${metrics.activeUsersMonth}\n` +
        `New Registrations,${metrics.newUsersToday}\n` +
        `Total Projects,${metrics.totalProjects}\n` +
        `Projects Today,${metrics.projectsToday}\n` +
        `Avg Session Duration,${metrics.avgSessionDuration}\n` +
        `Daily Logins,${metrics.dailyLogins}\n` +
        `Monthly Logins,${metrics.monthlyLogins}\n`;
    } else if (activeTab === "generators") {
      csvContent = "AI Generator,Usage Count\n" +
        metrics.generatorUsage.map(g => `${g.generator},${g.count}`).join("\n");
    } else if (activeTab === "projects") {
      csvContent = "Project Category,Count\n" +
        metrics.projectCategories.map(c => `${c.category},${c.count}`).join("\n");
    } else if (activeTab === "support") {
      csvContent = "Ticket Priority,Count\n" +
        metrics.ticketsByPriority.map(p => `${p.priority},${p.count}`).join("\n");
    } else {
      csvContent = "User Name,User Email,Logins Count,Generations,Projects\n" +
        metrics.topActiveUsers.map(u => `"${u.name}",${u.email},${u.logins},${u.generations},${u.projects}`).join("\n");
    }

    if (format === "csv" || format === "excel") {
      const mime = format === "csv" ? "text/csv" : "application/vnd.ms-excel";
      const blob = new Blob([csvContent], { type: mime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.${format === "csv" ? "csv" : "xls"}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "pdf") {
      const blob = new Blob([`DevCanvas SaaS Analytics Report\n=============================\nGenerated at: ${new Date().toLocaleString()}\n\n` + csvContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-neutral-400">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="text-xs font-mono">Running live database aggregation...</span>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-wide">
            SaaS Conversion &amp; Retention Analytics
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Monitor user active funnels, session metrics, regional geographics, and device hardware telemetry.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/10 hover:border-white/20 rounded-xl text-xs font-heading font-bold text-neutral-300 transition-all">
              <Download className="h-4 w-4" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-32 rounded-xl bg-neutral-900 border border-white/10 p-1 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all z-50">
              {(["csv", "excel", "pdf"] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  className="w-full text-left rounded-lg px-3 py-2 text-[11px] font-bold text-neutral-400 hover:bg-white/5 hover:text-white uppercase transition-colors"
                >
                  {fmt === "pdf" ? "PDF (TXT)" : fmt}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 rounded-xl text-xs font-heading font-bold text-orange-400 transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-4 overflow-x-auto pb-px">
        {([
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "generators", label: "AI Generators", icon: Cpu },
          { id: "projects", label: "Projects", icon: FolderGit2 },
          { id: "support", label: "Support Desk", icon: Ticket },
          { id: "users", label: "Users Growth", icon: Users },
        ] as const).map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 pb-3.5 text-xs font-bold transition-all relative border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === t.id
                  ? "border-orange-500 text-white font-extrabold"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Grid Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Users", val: metrics.totalUsers, desc: `${metrics.newUsersToday} registered today`, color: "text-orange-400" },
              { label: "Monthly Active (MAU)", val: metrics.activeUsersMonth, desc: `Engagement: ${metrics.retentionRate}`, color: "text-indigo-400" },
              { label: "Total Projects", val: metrics.totalProjects, desc: `${metrics.projectsToday} created today`, color: "text-emerald-400" },
              { label: "Session Duration", val: metrics.avgSessionDuration, desc: "Avg active duration", color: "text-cyan-400" },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-xl p-5 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">{item.label}</span>
                <div className="mt-4">
                  <span className="text-2xl font-heading font-black text-white block">{item.val}</span>
                  <span className="text-[10px] font-semibold text-neutral-400 mt-1 block">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Retention Line Chart */}
            <div className="lg:col-span-2 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                <span className="font-heading text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <TrendingUp className="h-4.5 w-4.5 text-orange-400" /> User Registrations Trend
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">Live Database Computed</span>
              </div>
              <div className="h-44 flex items-end">
                <SVGLineChart data={metrics.userRegistrations} xKey="date" yKey="count" color="#f97316" />
              </div>
              <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                {metrics.userRegistrations.map((d, idx) => (
                  <span key={idx}>{d.date}</span>
                ))}
              </div>
            </div>

            {/* Breakdown parameters */}
            <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <span className="font-heading text-xs font-bold text-white block border-b border-white/[0.08] pb-3 uppercase tracking-wider">
                Device &amp; Browser Telemetry
              </span>
              <div className="space-y-4 text-xs text-left">
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1.5">
                    <span className="flex items-center gap-1.5"><Monitor className="h-3.5 w-3.5 text-orange-400" /> Desktop Workstations</span>
                    <span className="font-mono font-bold text-white">{metrics.desktopPercent}%</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${metrics.desktopPercent}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1.5">
                    <span className="flex items-center gap-1.5"><Compass className="h-3.5 w-3.5 text-indigo-400" /> Web Browsers</span>
                    <span className="font-mono font-bold text-white">{metrics.browserPercent}%</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${metrics.browserPercent}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1.5">
                    <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-emerald-400" /> International Traffic</span>
                    <span className="font-mono font-bold text-white">{metrics.intlPercent}%</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.intlPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "generators" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* Chart Usage (Bar Chart) */}
          <div className="lg:col-span-8 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <span className="font-heading text-xs font-bold text-white block uppercase tracking-wider border-b border-white/5 pb-3">AI Generator Usage Metrics</span>
            <div className="h-56 flex items-end">
              <SVGBarChart data={metrics.generatorUsage} xKey="generator" yKey="count" color="#f97316" />
            </div>
            <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
              {metrics.generatorUsage.map((d, idx) => (
                <span key={idx} className="capitalize">{d.generator}</span>
              ))}
            </div>
          </div>

          {/* Top/Least lists */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-4 space-y-3">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Top AI Generators</span>
              <div className="space-y-2">
                {metrics.topGenerators.map((g, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-white/[0.02] border border-white/5">
                    <span className="capitalize text-neutral-300 font-semibold">{g.generator}</span>
                    <span className="font-mono font-bold text-white">{g.count} calls</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-4 space-y-3">
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Least Used AI Generators</span>
              <div className="space-y-2">
                {metrics.leastUsedGenerators.map((g, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-white/[0.02] border border-white/5">
                    <span className="capitalize text-neutral-300 font-semibold">{g.generator}</span>
                    <span className="font-mono font-bold text-white">{g.count} calls</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "projects" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* Project trends over months */}
          <div className="lg:col-span-8 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <span className="font-heading text-xs font-bold text-white block uppercase tracking-wider border-b border-white/5 pb-3">Monthly Project Creations</span>
            <div className="h-56 flex items-end">
              <SVGBarChart data={metrics.projectsPerMonth} xKey="month" yKey="count" color="#6366f1" />
            </div>
            <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
              {metrics.projectsPerMonth.map((d, idx) => (
                <span key={idx}>{d.month}</span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Project Categories */}
            <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <span className="text-[10px] uppercase font-bold text-white tracking-wider block border-b border-white/5 pb-2">Visibility Breakdown</span>
              <SegmentedBar data={metrics.projectCategories} nameKey="category" valKey="count" />
            </div>

            {/* Top active creators */}
            <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-4 space-y-3">
              <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Top Project Creators</span>
              <div className="space-y-2">
                {metrics.topCreators.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-white/[0.02] border border-white/5">
                    <div className="truncate">
                      <p className="font-semibold text-white truncate">{c.name}</p>
                      <p className="text-[9.5px] text-neutral-500 truncate">{c.email}</p>
                    </div>
                    <span className="font-mono font-bold text-neutral-300 shrink-0">{c.count} projects</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "support" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* Resolution Stats & KPIs */}
          <div className="lg:col-span-4 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-white tracking-wider block border-b border-white/5 pb-2">Support Queue Telemetry</span>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3.5 bg-neutral-900/50 rounded-xl border border-white/5">
                  <span className="text-[9.5px] text-neutral-500 uppercase font-mono block">Open Tickets</span>
                  <span className="text-xl font-bold text-amber-500 block mt-1">{metrics.openTickets}</span>
                </div>
                <div className="p-3.5 bg-neutral-900/50 rounded-xl border border-white/5">
                  <span className="text-[9.5px] text-neutral-500 uppercase font-mono block">Resolved Tickets</span>
                  <span className="text-xl font-bold text-emerald-500 block mt-1">{metrics.resolvedTickets}</span>
                </div>
              </div>
            </div>
            <div className="border-t border-white/5 pt-4 mt-6">
              <span className="text-[9.5px] text-neutral-500 uppercase font-mono block">Avg. Ticket Resolution Time</span>
              <span className="text-2xl font-black text-white block mt-1.5">{metrics.avgTicketResolutionTime}</span>
            </div>
          </div>

          {/* Chart Categorizations */}
          <div className="lg:col-span-4 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <span className="text-[10px] uppercase font-bold text-white tracking-wider block border-b border-white/5 pb-2">Tickets by Priority</span>
            <SegmentedBar data={metrics.ticketsByPriority} nameKey="priority" valKey="count" />
          </div>

          <div className="lg:col-span-4 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <span className="text-[10px] uppercase font-bold text-white tracking-wider block border-b border-white/5 pb-2">Tickets by Category</span>
            <SegmentedBar data={metrics.ticketsByCategory} nameKey="category" valKey="count" />
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* User retention details */}
          <div className="lg:col-span-4 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-5">
            <div>
              <span className="text-[10px] uppercase font-bold text-white tracking-wider block border-b border-white/5 pb-2">Retention &amp; Active User Counts</span>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3.5 bg-neutral-900/50 rounded-xl border border-white/5">
                  <span className="text-[9.5px] text-neutral-500 uppercase font-mono block">Returning Users</span>
                  <span className="text-xl font-bold text-indigo-400 block mt-1">{metrics.returningUsers}</span>
                </div>
                <div className="p-3.5 bg-neutral-900/50 rounded-xl border border-white/5">
                  <span className="text-[9.5px] text-neutral-500 uppercase font-mono block">Inactive (&gt;30d)</span>
                  <span className="text-xl font-bold text-rose-500 block mt-1">{metrics.inactiveUsers}</span>
                </div>
              </div>
            </div>
            <div className="border-t border-white/5 pt-4">
              <span className="text-[9.5px] text-neutral-500 uppercase font-mono block">Engagement Rate (DAU / MAU)</span>
              <span className="text-3xl font-black text-white block mt-1.5">{metrics.retentionRate}</span>
            </div>
          </div>

          {/* User registrations / activity grid */}
          <div className="lg:col-span-8 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <span className="text-[10px] uppercase font-bold text-white tracking-wider block border-b border-white/5 pb-3">Top Active Users</span>
            <div className="space-y-2">
              {metrics.topActiveUsers.map((u, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-3.5 rounded bg-white/[0.02] border border-white/5">
                  <div className="truncate">
                    <p className="font-semibold text-white truncate">{u.name}</p>
                    <p className="text-[9.5px] text-neutral-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0 font-mono text-[11px] text-neutral-400">
                    <div>
                      <span className="text-neutral-500">Logins:</span> <span className="font-bold text-indigo-400">{u.logins}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">AI calls:</span> <span className="font-bold text-orange-400">{u.generations}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Projects:</span> <span className="font-bold text-emerald-400">{u.projects}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAnalyticsPage;
