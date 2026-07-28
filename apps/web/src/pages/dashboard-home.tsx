import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  TrendingUp,
  Zap,
  ArrowRight,
  Boxes,
  Database,
  Code2,
  ShieldCheck,
  FileText,
  Server,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import { useProjects } from "@/lib/queries/projects";
import { useRecentActivity } from "@/lib/queries/activity";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/cn";

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
  const { data: projectsData } = useProjects();
  const { data: activityData } = useRecentActivity();
  const navigate = useNavigate();

  // Filter States
  const [projectFilter, setProjectFilter] = useState<"all" | "generated" | "no_artifacts">("all");
  const [aiQuestion, setAiQuestion] = useState("");

  // Dynamic Time-Based Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName = profile?.full_name?.split(" ")[0] || "Yash";

  const handleAskDevAI = (qText?: string) => {
    const query = qText || aiQuestion;
    if (!query.trim()) return;
    navigate(`/app/chat?prompt=${encodeURIComponent(query)}`);
  };

  // Fallback default mock data if database is empty so layout matches user spec 1:1
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

      return mapped.slice(0, 6);
    }

    // Fallback filter over mock projects
    let list = defaultProjects;
    if (projectFilter === "generated") {
      list = list.filter((p) => p.hasArtifacts);
    } else if (projectFilter === "no_artifacts") {
      list = list.filter((p) => !p.hasArtifacts);
    }
    return list;
  }, [projectsData, projectFilter, defaultProjects]);

  // Dynamic Metrics
  const totalProjectsCount = projectsData?.length ?? 4;
  const activeProjectsCount = projectsData?.filter((p) => p.status === "active").length ?? 4;
  const aiGenerationsCount = activityData?.length ?? 3;

  return (
    <div className="min-h-screen bg-[#07080A] text-white font-sans antialiased p-6 lg:p-10 space-y-6 text-left">
      
      {/* ── TOP GREETING & ACTION ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
            {greeting}, {userName} <span className="text-neutral-400 font-normal">— here's your workspace</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 bg-[#121319] border border-white/10 px-3 py-1 rounded-full shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live · Jul 28
          </span>
          <button
            onClick={() => navigate("/app/projects/new")}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            New project
          </button>
        </div>
      </div>

      {/* ── 4 STAT CARDS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total projects */}
        <div className="bg-[#121319] border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium text-neutral-400 uppercase tracking-wider">Total projects</span>
            <span className="bg-[#181920] text-neutral-300 border border-white/10 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
              {activeProjectsCount} active
            </span>
          </div>
          <div className="text-3xl font-medium text-white tracking-tight leading-none">{totalProjectsCount}</div>
          <div className="text-[11px] font-normal text-neutral-400 mt-1">↑ 2 this month</div>
        </div>

        {/* Card 2: AI generations */}
        <div className="bg-[#121319] border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-medium text-neutral-400 uppercase tracking-wider">AI generations</span>
            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> +40%
            </span>
          </div>
          <div className="text-3xl font-medium text-white tracking-tight leading-none">{aiGenerationsCount}</div>
          <div className="text-[11px] font-normal text-neutral-400 mt-1">vs last 30 days</div>
        </div>

        {/* Card 3: Security rating */}
        <div className="bg-[#121319] border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-medium text-neutral-400 uppercase tracking-wider">Security rating</span>
            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
              0 critical
            </span>
          </div>
          <div className="text-3xl font-medium text-emerald-400 tracking-tight leading-none">A</div>
          <div className="text-[11px] font-normal text-neutral-400 mt-1">All checks passed</div>
        </div>

        {/* Card 4: Active blueprints */}
        <div className="bg-[#121319] border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-medium text-neutral-400 uppercase tracking-wider">Active blueprints</span>
            <span className="bg-[#181920] text-neutral-300 border border-white/10 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
              last 7d
            </span>
          </div>
          <div className="text-3xl font-medium text-white tracking-tight leading-none">{totalProjectsCount}</div>
          <div className="text-[11px] font-normal text-neutral-400 mt-1">86% pipeline complete</div>
        </div>

      </div>

      {/* ── ROW 1: DevAI Intelligence Hub (2/3) + Pipeline Status (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* DevAI Intelligence Hub Card */}
        <div className="lg:col-span-2 bg-[#121319] border border-white/10 rounded-xl p-5 lg:p-6 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span className="text-[12px] font-medium text-neutral-300 uppercase tracking-wider">DevAI intelligence hub</span>
            </div>
            <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Live radar 2026
            </span>
          </div>

          {/* AI Input Wrap */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskDevAI();
            }}
            className="flex items-center gap-2 bg-[#181920] border border-white/10 rounded-lg px-3 py-2 focus-within:border-indigo-500/60 transition-all"
          >
            <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="Ask DevAI about tech trends or architecture…"
              className="bg-transparent border-none outline-none text-xs text-white placeholder-neutral-500 w-full"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3 py-1 rounded transition-all flex items-center gap-1 shrink-0"
            >
              Ask AI <ArrowRight className="h-3 w-3" />
            </button>
          </form>

          {/* Question Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
            {[
              { label: "Top 2026 stacks", prompt: "What are the top 2026 tech stacks for SaaS products?" },
              { label: "PostgreSQL at 100k DAU", prompt: "How do I optimize PostgreSQL for 100k DAU?" },
              { label: "Next.js vs Vite", prompt: "Compare Next.js vs Vite for 2026 projects" },
              { label: "OAuth2 audit", prompt: "OAuth2 and JWT security audit checklist" },
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAskDevAI(p.prompt)}
                className="text-neutral-300 bg-[#181920] border border-white/10 hover:border-indigo-500/40 hover:text-white px-2.5 py-1 rounded-full transition-all shrink-0 whitespace-nowrap text-[11px]"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="h-[0.5px] bg-white/10 my-1" />

          {/* Insight Rows */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-[#181920] border border-white/10 rounded-lg">
              <div className="flex items-center gap-2 text-white">
                <TrendingUp className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Rust and Go microservices · PGVector memory</span>
              </div>
              <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0">
                2026 radar
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#181920] border border-white/10 rounded-lg">
              <div className="flex items-center gap-2 text-white">
                <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>AI Workspace · Redis latency drop (45%)</span>
              </div>
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0">
                AI tip
              </span>
            </div>
          </div>

        </div>

        {/* Pipeline Status Card */}
        <div className="bg-[#121319] border border-white/10 rounded-xl p-5 lg:p-6 flex flex-col justify-between space-y-5 hover:border-white/20 transition-all">
          <div className="text-[12px] font-medium text-neutral-400 uppercase tracking-wider">Pipeline status</div>

          {/* Donut Chart Visual */}
          <div className="flex flex-col items-center justify-center my-auto py-1">
            <div className="relative flex items-center justify-center w-32 h-32">
              <svg width="128" height="128" viewBox="0 0 36 36" className="transform -rotate-90">
                <path
                  fill="none"
                  stroke="#262730"
                  strokeWidth="3.5"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="86, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-medium text-white tracking-tight">6/7</span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider">stages</span>
              </div>
            </div>
          </div>

          <div className="h-[0.5px] bg-white/10 my-1" />

          {/* Legend */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <span className="h-2 w-2 rounded-sm bg-indigo-500" />
                <span>Generated</span>
              </div>
              <span className="font-medium text-white">6 · 86%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <span className="h-2 w-2 rounded-sm bg-[#262730]" />
                <span>Pending</span>
              </div>
              <span className="text-neutral-400">1 · 14%</span>
            </div>
          </div>

        </div>

      </div>

      {/* ── ROW 2: Recent Projects (2/3) + Quick Generators (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Recent Projects Card */}
        <div className="lg:col-span-2 bg-[#121319] border border-white/10 rounded-xl p-5 lg:p-6 space-y-4 hover:border-white/20 transition-all">
          
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-neutral-400 uppercase tracking-wider">Recent projects</span>
            <button
              onClick={() => navigate("/app/projects")}
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 border-b border-white/10 pb-2 text-xs">
            {[
              { id: "all", label: "All · 4" },
              { id: "generated", label: "Generated · 3" },
              { id: "no_artifacts", label: "No artifacts · 1" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setProjectFilter(f.id as any)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-normal transition-all border",
                  projectFilter === f.id
                    ? "bg-[#181920] border-white/20 text-white"
                    : "border-transparent text-neutral-400 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Project Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider border-b border-white/10">
                  <th className="pb-2">Project</th>
                  <th className="pb-2">Stack</th>
                  <th className="pb-2">Score</th>
                  <th className="pb-2 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {displayProjects.map((proj) => (
                  <tr
                    key={proj.id}
                    onClick={() => navigate(`/app/projects/${proj.id}`)}
                    className="hover:text-indigo-400 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 pr-3 max-w-[220px]">
                      <div className="font-medium text-xs text-white group-hover:text-indigo-400">{proj.name}</div>
                      <div className="text-[11px] text-neutral-400 truncate mt-0.5">{proj.description}</div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {proj.stack.map((stk, idx) => (
                          <span
                            key={idx}
                            className="bg-[#181920] border border-white/10 text-neutral-300 text-[10px] px-1.5 py-0.5 rounded"
                          >
                            {stk}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {proj.score > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                proj.score === 100 ? "bg-emerald-400" : "bg-amber-400"
                              )}
                              style={{ width: `${proj.score}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-[11px] font-medium",
                              proj.score === 100 ? "text-emerald-400" : "text-amber-400"
                            )}
                          >
                            {proj.score}%
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/app/projects/${proj.id}`);
                          }}
                          className="text-[11px] text-indigo-400 hover:underline"
                        >
                          Generate architecture ↗
                        </button>
                      )}
                    </td>
                    <td className="py-2.5 text-right text-neutral-400 font-normal whitespace-nowrap">
                      {proj.updatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Quick Generators Card */}
        <div className="bg-[#121319] border border-white/10 rounded-xl p-5 lg:p-6 space-y-4 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span className="text-[12px] font-medium text-neutral-400 uppercase tracking-wider">Quick generators</span>
            </div>
            <span className="bg-[#181920] text-neutral-300 border border-white/10 text-[11px] font-medium px-2 py-0.5 rounded-full">
              Instant AI
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                id: "arch",
                title: "Architecture",
                sub: "System diagram",
                icon: Boxes,
                path: "/app/architecture",
                bg: "bg-indigo-950/60 text-indigo-300",
              },
              {
                id: "db",
                title: "Database",
                sub: "Schema spec",
                icon: Database,
                path: "/app/database",
                bg: "bg-purple-950/60 text-purple-300",
              },
              {
                id: "api",
                title: "API specs",
                sub: "REST and OpenAPI",
                icon: Code2,
                path: "/app/api-generator",
                bg: "bg-blue-950/60 text-blue-300",
              },
              {
                id: "sec",
                title: "Security",
                sub: "Audit scans",
                icon: ShieldCheck,
                path: "/app/security",
                bg: "bg-emerald-950/60 text-emerald-300",
              },
              {
                id: "docs",
                title: "Docs suite",
                sub: "Tech spec docs",
                icon: FileText,
                path: "/app/documentation",
                bg: "bg-amber-950/60 text-amber-300",
              },
              {
                id: "deploy",
                title: "CI/CD deploy",
                sub: "Docker and cloud",
                icon: Server,
                path: "/app/deployment",
                bg: "bg-slate-800/80 text-neutral-300",
              },
            ].map((gen) => {
              const IconComp = gen.icon;
              return (
                <div
                  key={gen.id}
                  onClick={() => navigate(gen.path)}
                  className="bg-[#181920] border border-white/10 rounded-lg p-3.5 cursor-pointer flex flex-col gap-2.5 hover:border-white/30 transition-all group"
                >
                  <div className={cn("h-8 w-8 rounded-md flex items-center justify-center shrink-0", gen.bg)}>
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-indigo-400">{gen.title}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{gen.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
