import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Bell,
  ChevronRight,
  TrendingUp,
  FolderKanban,
  Boxes,
  ShieldCheck,
  Zap,
  Activity,
  Sparkles,
  Layers,
  Code2,
  Database,
  Shield,
  FileText,
  Cpu,
  Server,
  Cloud,
} from "lucide-react";
import { useProjects } from "@/lib/queries/projects";
import { useRecentActivity } from "@/lib/queries/activity";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/cn";

// ── Mini Sparkline Bar Chart Component for Stat Cards ──
function MiniBarChart({ color }: { color: "purple" | "blue" | "amber" | "emerald" }) {
  const barColors = {
    purple: ["bg-purple-900/60", "bg-purple-800/80", "bg-purple-600", "bg-purple-400"],
    blue: ["bg-blue-900/60", "bg-blue-800/80", "bg-blue-600", "bg-blue-400"],
    amber: ["bg-amber-900/60", "bg-amber-800/80", "bg-amber-600", "bg-amber-400"],
    emerald: ["bg-emerald-900/60", "bg-emerald-800/80", "bg-emerald-600", "bg-emerald-400"],
  };

  const heights = [10, 16, 22, 14];

  return (
    <div className="flex items-end gap-1 h-6 shrink-0">
      {barColors[color].map((bgClass, idx) => (
        <div
          key={idx}
          className={cn("w-1.5 rounded-sm transition-all duration-300", bgClass)}
          style={{ height: `${heights[idx]}px` }}
        />
      ))}
    </div>
  );
}

/** Calculates engineering score (0-100%) from completed artifact columns */
function calcEngineeringScore(project: any): number {
  const artifacts = [
    "architecture",
    "database_schema",
    "api_spec",
    "security_report",
    "documentation",
    "deployment_plan",
  ];
  const completed = artifacts.filter((key) => !!(project as any)?.[key]).length;
  return Math.round((completed / artifacts.length) * 100);
}

/** Format timestamp into short month/date format like "Jul 28" */
function formatDate(dateStr?: string): string {
  if (!dateStr) return "Jul 28";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Jul 28";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DashboardHomePage() {
  const { profile } = useAuth();
  const { data: projectsData, isLoading: isProjectsLoading } = useProjects();
  const { data: activityData } = useRecentActivity();
  const navigate = useNavigate();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<"all" | "generated" | "no_artifacts">("all");
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("30D");

  // Fallback default mock data if database is empty so layout matches screenshot 1:1
  const defaultProjects = useMemo(() => [
    {
      id: "ai-workspace",
      name: "AI Workspace",
      description: "LLM agent workspace, frontend + backend + payments",
      score: 100,
      updatedAt: "Jul 28",
      stack: ["React", "Node", "PostgreSQL"],
      hasArtifacts: true,
    },
    {
      id: "project-02",
      name: "Project-02",
      description: "Experience-certificate platform for course completion",
      score: 67,
      updatedAt: "Jul 27",
      stack: ["Next.js", "Express"],
      hasArtifacts: true,
    },
    {
      id: "project-01",
      name: "Project-01",
      description: "Social app for students to post school projects",
      score: 67,
      updatedAt: "Jul 27",
      stack: ["React", "Supabase"],
      hasArtifacts: true,
    },
    {
      id: "health-analytics",
      name: "Health Analytics",
      description: "Patient data portals and compliance audits",
      score: 0,
      updatedAt: "Jul 28",
      stack: ["Python"],
      hasArtifacts: false,
    },
  ], []);

  // Compute live project rows
  const displayProjects = useMemo(() => {
    if (projectsData && projectsData.length > 0) {
      let mapped = projectsData.map((p) => {
        const score = calcEngineeringScore(p);
        const hasArtifacts = score > 0;
        
        // Extract tech stack badges
        const services: any[] = p?.architecture?.services ?? [];
        const techs = [...new Set(services.map((s: any) => s.technology).filter(Boolean))] as string[];
        
        return {
          id: p.id,
          name: p.name,
          description: p.description || "Engineering blueprint specification",
          score,
          updatedAt: formatDate(p.updated_at),
          stack: techs.length > 0 ? techs.slice(0, 3) : ["React", "PostgreSQL"],
          hasArtifacts,
        };
      });

      if (projectFilter === "generated") {
        mapped = mapped.filter((p) => p.hasArtifacts);
      } else if (projectFilter === "no_artifacts") {
        mapped = mapped.filter((p) => !p.hasArtifacts);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        mapped = mapped.filter(
          (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
      }

      return mapped.slice(0, 6);
    }

    // Fallback filter over mock projects
    let list = defaultProjects;
    if (projectFilter === "generated") {
      list = list.filter((p) => p.hasArtifacts);
    } else if (projectFilter === "no_artifacts") {
      list = list.filter((p) => !p.hasArtifacts);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list;
  }, [projectsData, projectFilter, searchQuery, defaultProjects]);

  // Derived user details
  const userName = profile?.full_name?.split(" ")[0] || "Yash";
  const userEmail = profile?.email || "kr.yashansh123@gmail.com";
  const userInitials = (profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "YA").slice(0, 2);

  // Dynamic Metrics
  const totalProjectsCount = projectsData?.length ?? 4;
  const activeProjectsCount = projectsData?.filter((p) => p.status === "active").length ?? 4;
  const aiGenerationsCount = activityData?.length ?? 3;

  return (
    <div className="min-h-screen bg-[#0B0C10] text-neutral-100 font-sans tracking-tight antialiased p-6 lg:p-8 space-y-6">
      
      {/* ── TOP HEADER BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121319] border border-white/[0.06] rounded-2xl p-4 lg:px-6">
        
        {/* Left: Branding & Welcome Greeting */}
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-purple-600/90 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-purple-600/20 shrink-0">
            DC
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Good morning, {userName}
            </h1>
            <p className="text-xs text-neutral-400 font-medium">
              Here's what's happening across your workspace
            </p>
          </div>
        </div>

        {/* Right: Search, Action, Notifications, User Pill */}
        <div className="flex items-center flex-wrap md:flex-nowrap gap-3">
          
          {/* Search Input */}
          <div className="relative flex items-center bg-[#181920] border border-white/10 rounded-xl px-3 py-1.5 w-full md:w-64 focus-within:border-purple-500/50 transition-colors">
            <Search className="h-3.5 w-3.5 text-neutral-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, artifacts..."
              className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          {/* New Project Button */}
          <button
            onClick={() => navigate("/app/projects/new")}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            New project
          </button>

          {/* Notification Indicator Square */}
          <button className="h-9 w-9 rounded-xl bg-[#181920] border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors relative shrink-0">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2.5 bg-[#181920] border border-white/10 rounded-xl px-3 py-1.5 shrink-0">
            <div className="h-7 w-7 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              {userInitials}
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <div className="text-xs font-bold text-white">{userName}</div>
              <div className="text-[10px] text-neutral-400 font-mono truncate max-w-[140px]">
                {userEmail}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── 4 STAT CARDS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total projects */}
        <div className="bg-[#121319] border border-white/[0.06] rounded-2xl p-4.5 flex flex-col justify-between hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400">
              <FolderKanban className="h-4 w-4" />
            </div>
            <span className="bg-[#1C1D24] text-neutral-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-white/5">
              {activeProjectsCount} active
            </span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <div className="text-2xl font-black text-white tracking-tight">{totalProjectsCount}</div>
              <div className="text-[11px] font-medium text-neutral-400 mt-0.5">Total projects</div>
            </div>
            <MiniBarChart color="purple" />
          </div>
        </div>

        {/* Card 2: AI generations */}
        <div className="bg-[#121319] border border-white/[0.06] rounded-2xl p-4.5 flex flex-col justify-between hover:border-blue-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-xl bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
              <Boxes className="h-4 w-4" />
            </div>
            <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              +40%
            </span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <div className="text-2xl font-black text-white tracking-tight">{aiGenerationsCount}</div>
              <div className="text-[11px] font-medium text-neutral-400 mt-0.5">AI generations</div>
            </div>
            <MiniBarChart color="blue" />
          </div>
        </div>

        {/* Card 3: Avg. security rating */}
        <div className="bg-[#121319] border border-white/[0.06] rounded-2xl p-4.5 flex flex-col justify-between hover:border-amber-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              0 critical
            </span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <div className="text-2xl font-black text-white tracking-tight">A</div>
              <div className="text-[11px] font-medium text-neutral-400 mt-0.5">Avg. security rating</div>
            </div>
            <MiniBarChart color="amber" />
          </div>
        </div>

        {/* Card 4: Active blueprints */}
        <div className="bg-[#121319] border border-white/[0.06] rounded-2xl p-4.5 flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <Zap className="h-4 w-4" />
            </div>
            <span className="bg-[#1C1D24] text-neutral-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-white/5">
              last 7d
            </span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <div className="text-2xl font-black text-white tracking-tight">{totalProjectsCount}</div>
              <div className="text-[11px] font-medium text-neutral-400 mt-0.5">Active blueprints</div>
            </div>
            <MiniBarChart color="emerald" />
          </div>
        </div>

      </div>

      {/* ── MIDDLE ROW: Generation Activity (2/3) + Pipeline Status (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-left">
        
        {/* Generation Activity Card */}
        <div className="lg:col-span-2 bg-[#121319] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Generation activity</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                7 artifacts this month ·{" "}
                <span className="text-emerald-400 font-semibold">+40% vs last month</span>
              </p>
            </div>

            {/* Time range pills */}
            <div className="flex items-center bg-[#181920] border border-white/10 rounded-lg p-0.5 text-xs font-semibold self-start sm:self-auto">
              {(["7D", "30D", "90D"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    "px-3 py-1 rounded-md transition-all text-[11px]",
                    timeRange === r
                      ? "bg-indigo-600 text-white font-bold shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Visual Area (Sleek Dark Canvas with Bars/Chart indicator) */}
          <div className="h-44 w-full bg-[#181920]/60 border border-white/5 rounded-xl p-4 flex items-end justify-between gap-3 relative overflow-hidden group">
            
            {/* Ambient Background Grid */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {/* Bars Visualization */}
            {[
              { day: "Mon", count: 2, height: "35%" },
              { day: "Tue", count: 4, height: "65%" },
              { day: "Wed", count: 1, height: "25%" },
              { day: "Thu", count: 7, height: "90%" },
              { day: "Fri", count: 3, height: "50%" },
              { day: "Sat", count: 5, height: "75%" },
              { day: "Sun", count: 2, height: "30%" },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group/bar">
                <div className="w-full max-w-[28px] bg-indigo-950/40 rounded-t-lg relative overflow-hidden flex items-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-lg transition-all duration-500 group-hover/bar:from-indigo-500 group-hover/bar:to-purple-400"
                    style={{ height: bar.height }}
                  />
                </div>
                <span className="text-[10px] font-mono text-neutral-500 font-medium">{bar.day}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Pipeline Status Card */}
        <div className="bg-[#121319] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Pipeline status</h2>
          </div>

          {/* Central Donut / Stages Metric Visual */}
          <div className="flex flex-col items-center justify-center my-auto py-2">
            <div className="relative flex items-center justify-center w-36 h-36">
              
              {/* Donut ring SVG */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path
                  className="text-neutral-800"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Progress Ring (86%) */}
                <path
                  className="text-indigo-500 transition-all duration-1000 ease-out"
                  strokeDasharray="86, 100"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-white tracking-tight">6/7</span>
                <span className="text-[11px] text-neutral-400 font-medium">stages done</span>
              </div>

            </div>
          </div>

          {/* Bottom Breakdown Legend */}
          <div className="border-t border-white/5 pt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-300">
                <span className="h-2 w-2 rounded-sm bg-indigo-500" />
                <span>Generated</span>
              </div>
              <span className="font-semibold text-neutral-200">6 · 86%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <span className="h-2 w-2 rounded-sm bg-neutral-700" />
                <span>Pending</span>
              </div>
              <span className="font-semibold text-neutral-400">1 · 14%</span>
            </div>
          </div>

        </div>

      </div>

      {/* ── BOTTOM ROW: Recent Projects (2/3) + Recent Activity (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-left">
        
        {/* Recent Projects Card */}
        <div className="lg:col-span-2 bg-[#121319] border border-white/[0.06] rounded-2xl p-5 space-y-5">
          
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight">Recent projects</h2>
            <button
              onClick={() => navigate("/app/projects")}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            {[
              { id: "all", label: "All", count: totalProjectsCount },
              { id: "generated", label: "Generated", count: 3 },
              { id: "no_artifacts", label: "No artifacts", count: 1 },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setProjectFilter(f.id as any)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                  projectFilter === f.id
                    ? "bg-[#1E1F28] text-white border border-white/10 shadow-sm"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {f.label} · {f.count}
              </button>
            ))}
          </div>

          {/* Project Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 border-b border-white/5">
                  <th className="pb-3 pl-1">PROJECT</th>
                  <th className="pb-3">STACK</th>
                  <th className="pb-3">SCORE</th>
                  <th className="pb-3 pr-1 text-right">UPDATED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {displayProjects.map((proj) => (
                  <tr
                    key={proj.id}
                    onClick={() => navigate(`/app/projects/${proj.id}`)}
                    className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    {/* Project Name & Desc */}
                    <td className="py-3.5 pl-1 pr-4 max-w-[240px]">
                      <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {proj.name}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {proj.description}
                      </div>
                    </td>

                    {/* Stack Badges */}
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {proj.stack.map((stk, idx) => (
                          <span
                            key={idx}
                            className="bg-[#181920] border border-white/10 text-neutral-300 text-[10px] px-2 py-0.5 rounded-md font-medium"
                          >
                            {stk}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Score / Action */}
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      {proj.score > 0 ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border",
                            proj.score === 100
                              ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                              : "bg-amber-950/60 text-amber-400 border-amber-800/40"
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {proj.score}%
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/app/projects/${proj.id}`);
                          }}
                          className="text-xs font-bold text-indigo-400 hover:underline"
                        >
                          Generate architecture
                        </button>
                      )}
                    </td>

                    {/* Updated Date */}
                    <td className="py-3.5 pr-1 text-right text-neutral-400 font-medium whitespace-nowrap">
                      {proj.updatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Recent Activity Card */}
        <div className="bg-[#121319] border border-white/[0.06] rounded-2xl p-5 space-y-5">
          <h2 className="text-sm font-bold text-white tracking-tight">Recent activity</h2>

          <div className="relative pl-3 space-y-5 before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
            {[
              {
                id: 1,
                iconColor: "bg-purple-950/80 border-purple-700/40 text-purple-400",
                text: <>All engineering artifacts generated for <strong className="text-white">AI Workspace</strong></>,
                time: "12:53 PM",
              },
              {
                id: 2,
                iconColor: "bg-blue-950/80 border-blue-700/40 text-blue-400",
                text: <>Database schema generated — PostgreSQL, social collaboration model</>,
                time: "10:10 AM",
              },
              {
                id: 3,
                iconColor: "bg-emerald-950/80 border-emerald-700/40 text-emerald-400",
                text: <>Artifacts generated for <strong className="text-white">Project-01</strong> social app spec</>,
                time: "2:52 PM · Jul 27",
              },
            ].map((act) => (
              <div key={act.id} className="relative flex items-start gap-3 text-xs z-10">
                <div
                  className={cn(
                    "h-6 w-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 shadow-sm",
                    act.iconColor
                  )}
                >
                  <Activity className="h-3 w-3" />
                </div>
                <div className="space-y-1">
                  <p className="text-neutral-300 leading-snug">{act.text}</p>
                  <div className="text-[10px] text-neutral-500 font-medium">{act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
