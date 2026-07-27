import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Activity,
  TrendingUp,
  Boxes,
  Zap,
  Clock,
  Plus,
  Search,
  Command,
  ArrowUpRight,
  ExternalLink,
  Layers,
  ChevronRight,
  Lock,
  Globe,
  Share2,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProjectCardSkeleton, EmptyProjects } from "@/components/dashboard/project-card";
import { GraphiteAnimatedBackground } from "@/components/dashboard/graphite-animated-background";
import { useProjects } from "@/lib/queries/projects";
import { useRecentActivity } from "@/lib/queries/activity";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/cn";
import { Badge } from "@ui/index";

// Static horizontal spec pipeline roadmap stages
const SPEC_PIPELINE_STAGES = [
  { id: "planning",      label: "Planning",      status: "complete" },
  { id: "architecture",  label: "Architecture",  status: "complete" },
  { id: "database",      label: "Database",      status: "current" },
  { id: "api",           label: "API Specs",     status: "upcoming" },
  { id: "security",      label: "Security",      status: "upcoming" },
  { id: "documentation", label: "Documentation", status: "upcoming" },
  { id: "deployment",    label: "Deployment",    status: "upcoming" },
];

export function DashboardHomePage() {
  const { profile } = useAuth();
  const { data: projects, isLoading } = useProjects();
  const { data: activity } = useRecentActivity();
  const navigate = useNavigate();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<string | null>(null);

  // Client-side project search filter
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    let list = [...projects];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 6);
  }, [projects, searchQuery]);

  // Client-side activity logs filtering
  const filteredActivities = useMemo(() => {
    if (!activity) return [];
    if (!activityFilter) return activity.slice(0, 5);
    const filterTerm = activityFilter.toLowerCase();
    return activity
      .filter((act) => act.content.toLowerCase().includes(filterTerm))
      .slice(0, 5);
  }, [activity, activityFilter]);

  return (
    <div className="relative min-h-screen z-10 space-y-12 pb-20 font-sans tracking-tight antialiased">
      {/* ── Precision Ambient Graphite grid ── */}
      <GraphiteAnimatedBackground />

      {/* Utilise maximum left and right space of the dashboard page */}
      <div className="relative z-10 w-full px-6 lg:px-12 space-y-10">
        
        {/* ── Page Header & Hero Title ── */}
        <div className="relative pt-10 pb-4">
          {/* Subtle Invisible Radial Glow backdrop */}
          <div
            className="absolute -top-12 left-1/3 h-[320px] w-[450px] rounded-full opacity-25 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(124, 92, 255, 0.15) 0%, rgba(59, 130, 246, 0.05) 60%, transparent 100%)",
              filter: "blur(50px)",
            }}
          />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5 text-left">
              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl bg-clip-text">
                Welcome back, {profile?.full_name?.split(" ")[0] ?? "engineer"}
              </h1>
              <p className="text-base text-neutral-400">
                Your AI engineering workspace. Generate, analyze, and ship production-ready architectures.
              </p>
            </div>
            <button
              onClick={() => navigate("/app/projects/new")}
              className="flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-[0_4px_12px_rgba(99,102,241,0.15)] active:scale-[0.98]"
            >
              <Plus className="h-4.5 w-4.5" /> New Project
            </button>
          </div>
        </div>

        {/* ── Search Command Bar Widget ── */}
        <div className="relative group max-w-4xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-xl blur-md opacity-35 group-hover:opacity-50 transition-opacity" />
          <div className="relative flex items-center bg-[#09090B] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
            <Search className="h-5 w-5 text-neutral-500 mr-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, blueprints, technical specifications or type Ctrl + K..."
              className="w-full bg-transparent text-base text-white placeholder-neutral-500 focus:outline-none py-0.5"
            />
            <div className="hidden sm:flex items-center gap-1 border border-white/10 bg-white/[0.04] rounded px-2 py-1 text-xs text-neutral-400 font-mono">
              <Command className="h-3.5 w-3.5" />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* ── Statistics Cards with top borders ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Projects"
            value={projects?.length ?? 0}
            delta={`${projects?.filter((p) => p.status === "active").length ?? 0} active blueprints`}
            deltaType="up"
            icon={FolderKanban}
            colorType="border-t-2 border-t-indigo-500"
            onClick={() => navigate("/app/projects")}
          />
          <StatCard
            label="AI Generations"
            value={activity?.length ?? 0}
            delta="Completed artifact scans"
            deltaType="up"
            icon={Boxes}
            colorType="border-t-2 border-t-blue-500"
            onClick={() => navigate("/app/chat")}
          />
          <StatCard
            label="Avg. Security Rating"
            value="A"
            delta="Zero critical vulnerabilities"
            deltaType="up"
            icon={TrendingUp}
            colorType="border-t-2 border-t-emerald-500"
            onClick={() => navigate("/app/security")}
          />
          <StatCard
            label="Active blue-prints"
            value={
              projects?.filter((p) => {
                const updated = new Date(p.updated_at ?? p.created_at);
                return Date.now() - updated.getTime() < 7 * 24 * 60 * 60 * 1000;
              }).length ?? 0
            }
            delta="updated in the last 7d"
            deltaType="neutral"
            icon={Zap}
            colorType="border-t-2 border-t-amber-500"
            onClick={() => navigate("/app/projects")}
          />
        </div>

        {/* ── Quick Action Generator Modules ── */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Layers className="h-4 w-4" /> Quick Actions Spec Generators
          </h2>
          <QuickActions />
        </div>

        {/* ── Horizontal Progress Spec Widget ── */}
        <div className="rounded-xl border border-white/5 bg-[#09090B] p-6 space-y-4 shadow-sm text-left">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-550">Engineering Delivery Pipeline</span>
            <span className="text-xs text-neutral-450 font-mono">Current state: Database design validation</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-7 gap-3 pt-2">
            {SPEC_PIPELINE_STAGES.map((stg) => (
              <div
                key={stg.id}
                className={cn(
                  "p-4 rounded-lg border text-sm font-semibold transition-all",
                  stg.status === "complete"
                    ? "border-indigo-500/20 bg-indigo-500/5 text-indigo-300"
                    : stg.status === "current"
                    ? "border-primary-500/30 bg-primary-500/10 text-white font-bold"
                    : "border-white/5 bg-white/[0.01] text-neutral-550"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      stg.status === "complete" ? "bg-indigo-400" : stg.status === "current" ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"
                    )}
                  />
                  <span>{stg.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent Projects Grid with Stack Badges & Actions ── */}
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Recent specifications
            </h2>
            <button
              onClick={() => navigate("/app/projects")}
              className="text-xs font-semibold text-neutral-450 hover:text-white transition-colors"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <ProjectCardSkeleton key={i} />)
            ) : filteredProjects.length === 0 ? (
              <div className="col-span-full">
                <EmptyProjects />
              </div>
            ) : (
              filteredProjects.map((project) => {
                const specMetrics = (project as any).specification?.metrics ?? { overall: 85 };
                return (
                  <div
                    key={project.id}
                    className="group relative rounded-xl border border-white/10 bg-[#09090B] hover:border-white/20 transition-all p-6 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-heading text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {project.name}
                        </h3>
                        <Badge variant="outline" className="text-xs font-bold border-emerald-500/20 text-emerald-400">
                          Score {specMetrics.overall}%
                        </Badge>
                      </div>

                      <p className="text-sm text-neutral-300 line-clamp-2 leading-relaxed">
                        {project.description || "No project description provided."}
                      </p>

                      {/* Tech stack badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {["React", "Node.js", "PostgreSQL", "AWS"].map((tech) => (
                          <span
                            key={tech}
                            className="text-xs font-semibold text-neutral-400 bg-white/5 border border-white/5 rounded px-2.5 py-1"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-xs text-neutral-500 font-medium">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => navigate(`/app/projects/${project.id}`)}
                        className="flex items-center gap-1.5 text-sm text-white group-hover:text-indigo-400 font-bold"
                      >
                        Open Workspace <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Activity Feed Filter Timeline ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 text-left">
          
          {/* Timeline Activity card */}
          <div className="rounded-xl border border-white/5 bg-[#09090B] p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3.5">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-400" />
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-neutral-400">
                  Recent activities timeline
                </h3>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                {["Architecture", "Database", "API", "Security"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActivityFilter(activityFilter === cat ? null : cat)}
                    className={cn(
                      "px-2.5 py-1 rounded border transition-colors",
                      activityFilter === cat
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-300"
                        : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredActivities.length > 0 ? (
              <div className="relative pl-5 border-l border-white/15 space-y-5 py-2 font-sans text-sm">
                {filteredActivities.map((item) => (
                  <div key={item.id} className="relative space-y-1">
                    <span className="absolute -left-[25.5px] top-1.5 h-3 w-3 rounded-full border border-[#09090B] bg-indigo-500" />
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm text-neutral-200">{item.content}</span>
                      <span className="text-xs text-neutral-450 font-mono shrink-0">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-neutral-550 py-4">No matching timeline logs found.</div>
            )}
          </div>

          {/* Quick Platform Stats card */}
          <div className="rounded-xl border border-white/5 bg-[#09090B] p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3.5">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-neutral-400">
                Blueprint specifications by status
              </h3>
            </div>

            {projects && projects.length > 0 ? (
              <div className="space-y-4">
                {(["active", "draft", "archived"] as const).map((status) => {
                  const count = projects.filter((p) => p.status === status).length;
                  const pct = projects.length ? Math.round((count / projects.length) * 100) : 0;
                  const barColors = {
                    active: "bg-indigo-500",
                    draft: "bg-amber-500",
                    archived: "bg-neutral-600",
                  };
                  return (
                    <div key={status}>
                      <div className="mb-1.5 flex justify-between text-xs font-sans">
                        <span className="capitalize text-neutral-450 font-semibold">{status}</span>
                        <span className="text-neutral-300 font-mono">{count}</span>
                      </div>
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full ${barColors[status]} transition-[width] duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-neutral-550">
                No active projects recorded.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
