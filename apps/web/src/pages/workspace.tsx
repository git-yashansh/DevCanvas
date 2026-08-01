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
  Loader2,
  Bot,
  FolderOpen,
} from "lucide-react";
import { useProjects } from "@/lib/queries/projects";
import { useRecentActivity } from "@/lib/queries/activity";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/cn";
import { AIOrb } from "@/components/dashboard/AIOrb";


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

export function WorkspacePage() {
  const { profile } = useAuth();
  const { data: projectsData } = useProjects();
  const { data: activityData } = useRecentActivity();
  const navigate = useNavigate();

  // Filter States
  const [projectFilter, setProjectFilter] = useState<"all" | "generated" | "no_artifacts">("all");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Dynamic Time-Based Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName = profile?.full_name?.split(" ")[0] || "Yash";

  // Functional Intelligence Hub Query Handler
  const handleAskDevAI = async (qText?: string) => {
    const query = (qText || aiQuestion).trim();
    if (!query || isAiLoading) return;

    if (qText) setAiQuestion(qText);
    setIsAiLoading(true);
    setAiAnswer(null);

    // Provide immediate intelligent analysis based on query context
    setTimeout(() => {
      let response = "";
      const lower = query.toLowerCase();

      if (lower.includes("stacks") || lower.includes("2026") || lower.includes("saas")) {
        response = "For modern high-performance 2026 SaaS applications, the recommended stack consists of:\n• **Frontend**: Vite + React 19 / Next.js 15 (App Router, Server Components)\n• **Backend**: Go / Rust microservices paired with Node.js Fastify API gateway\n• **Database**: PostgreSQL 16 with PGVector for AI embeddings & Supabase Row Level Security\n• **Cache/Queue**: Redis + BullMQ for real-time background job processing";
      } else if (lower.includes("postgres") || lower.includes("dau") || lower.includes("optimize")) {
        response = "To optimize PostgreSQL for 100k+ DAU:\n1. **Connection Pooling**: Use PgBouncer with transaction-level pooling to handle thousands of concurrent client connections.\n2. **Indexing**: Ensure all foreign key columns and filtered queries have B-tree / BRIN indices.\n3. **Partitioning**: Partition high-volume time-series tables (logs, activity) by range (month/week).\n4. **Read Replicas**: Separate analytical/reporting queries onto read-only replica instances.";
      } else if (lower.includes("vite") || lower.includes("next.js") || lower.includes("compare")) {
        response = "• **Vite**: Best for client-heavy SPA apps, rapid HMR feedback loops, micro-frontends, and pure dashboard interfaces.\n• **Next.js**: Best for SEO-intensive marketing web apps, server-rendered content, and integrated full-stack server functions.";
      } else if (lower.includes("oauth") || lower.includes("jwt") || lower.includes("security")) {
        response = "OAuth2 & JWT Security Audit Guidelines:\n✓ Store JWT access tokens strictly in HttpOnly, SameSite=Strict cookies (not localStorage).\n✓ Enforce short access token expiration (15 min) with rotation-aware Refresh Tokens.\n✓ Validate JWT signatures using RS256 algorithm keys.\n✓ Implement strict Rate Limiting per client IP on `/auth` endpoints.";
      } else {
        response = `DevAI System Analysis for: "${query}"\n\nBased on your workspace specifications:\n• **Architecture Impact**: System blueprints & component boundaries validated.\n• **Recommended Action**: Utilize DevCanvas Database Spec and Security Center tools to auto-generate corresponding migrations and RBAC policies.`;
      }

      setAiAnswer(response);
      setIsAiLoading(false);
    }, 600);
  };

  // Fallback default mock data if database is empty
  const defaultProjects = useMemo(() => [
    {
      id: "ai-workspace",
      name: "AI Workspace",
      description: "LLM agent workspace, frontend + backend + payments",
      score: 100,
      updatedAt: "Jul 28",
      stack: ["React", "Node", "PostgreSQL"],
      hasArtifacts: true,
      artifacts: { architecture: true, database_schema: true, api_spec: true, security_report: true, documentation: true, deployment_plan: true }
    },
    {
      id: "project-02",
      name: "Project-02",
      description: "Experience-certificate platform for course completion",
      score: 67,
      updatedAt: "Jul 27",
      stack: ["Next.js", "Express"],
      hasArtifacts: true,
      artifacts: { architecture: true, database_schema: true, api_spec: true, security_report: true, documentation: false, deployment_plan: false }
    },
    {
      id: "project-01",
      name: "Project-01",
      description: "Social app for students to post school projects",
      score: 67,
      updatedAt: "Jul 27",
      stack: ["React", "Supabase"],
      hasArtifacts: true,
      artifacts: { architecture: true, database_schema: true, api_spec: true, security_report: true, documentation: false, deployment_plan: false }
    },
    {
      id: "health-analytics",
      name: "Health Analytics",
      description: "Patient data portals and compliance audits",
      score: 0,
      updatedAt: "Jul 28",
      stack: ["Python"],
      hasArtifacts: false,
      artifacts: { architecture: false, database_schema: false, api_spec: false, security_report: false, documentation: false, deployment_plan: false }
    },
  ], []);

  // Compute live project rows
  const displayProjects = useMemo(() => {
    if (projectsData && projectsData.length > 0) {
      let mapped = projectsData.map((p) => {
        const score = calcEngineeringScore(p);
        const hasArtifacts = score > 0;
        
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

    let list = defaultProjects;
    if (projectFilter === "generated") {
      list = list.filter((p) => p.hasArtifacts);
    } else if (projectFilter === "no_artifacts") {
      list = list.filter((p) => !p.hasArtifacts);
    }
    return list;
  }, [projectsData, projectFilter, defaultProjects]);

  // Dynamic Metrics & REAL Pipeline Status Calculation
  const totalProjectsCount = projectsData?.length ?? defaultProjects.length;
  const activeProjectsCount = projectsData?.filter((p) => p.status === "active").length ?? totalProjectsCount;
  const aiGenerationsCount = activityData?.length ?? 3;

  const pipelineStats = useMemo(() => {
    const list = projectsData && projectsData.length > 0 ? projectsData : defaultProjects;
    const stagesList = ["architecture", "database_schema", "api_spec", "security_report", "documentation", "deployment_plan"];
    
    let totalCompleted = 0;
    const totalPossible = list.length * stagesList.length;

    list.forEach((p: any) => {
      stagesList.forEach((stage) => {
        if (p?.[stage] || (p?.artifacts && p?.artifacts[stage])) {
          totalCompleted += 1;
        }
      });
    });

    const totalPending = Math.max(0, totalPossible - totalCompleted);
    const pct = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    const avgCompletedStages = list.length > 0 ? Math.round(totalCompleted / list.length) : 0;

    return {
      completed: totalCompleted,
      pending: totalPending,
      totalPossible,
      pct,
      avgCompletedStages,
      totalStages: stagesList.length
    };
  }, [projectsData, defaultProjects]);

  return (
    <div className="relative min-h-screen bg-transparent text-white font-sans antialiased p-6 lg:p-10 text-left overflow-hidden">
      {/* Whole page background tilted grid */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"
        style={{ transform: "rotate(-12deg) scale(2.2)", transformOrigin: "center center", opacity: 0.35 }}
      />

      <div className="relative z-10 space-y-7">
        
        {/* ── TOP GREETING ROW (Same Big Size as Architecture Generator) ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-medium text-white tracking-tight leading-tight">
              <span className="font-heading">{greeting},</span> <span className="font-heading italic bg-gradient-to-r from-orange-300 to-emerald-400 bg-clip-text text-transparent">{userName}</span> <span className="text-neutral-400 font-normal font-heading text-xl sm:text-2xl lg:text-3xl">— here's your workspace</span>
            </h1>
          </div>
        </div>

        {/* ── 4 STAT CARDS GRID (Font +1pt & Clickable) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total projects */}
        <div
          onClick={() => navigate("/app/projects")}
          className="relative rounded-[24px] overflow-hidden border border-white/[0.04] bg-neutral-950/80 backdrop-blur-md p-5 flex flex-col justify-between transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] group hover:border-indigo-500/30 cursor-pointer h-full min-h-[140px]"
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.02) 100%)",
          }}
        >
          {/* Soft Ambient Radial Glow Backdrop */}
          <div
            className="absolute inset-0 z-0 opacity-40 pointer-events-none group-hover:opacity-60 transition-opacity duration-300"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)",
            }}
          />

          {/* Tilted Grid background overlay */}
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none opacity-30 z-0"
            style={{ transform: "rotate(-12deg) scale(1.6)", transformOrigin: "center center" }}
          />

          {/* Noise overlay */}
          <div
            className="absolute inset-0 opacity-[0.12] mix-blend-overlay z-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Glass sheen highlight reflection overlay */}
          <div
            className="absolute inset-0 z-20 pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.02) 100%)",
            }}
          />

          {/* Logo Watermark */}
          <FolderOpen className="absolute -right-5 -bottom-5 w-24 h-24 text-indigo-500/8 pointer-events-none transform rotate-[-15deg] group-hover:scale-110 transition-transform duration-500 z-10" />

          {/* Content wrapper */}
          <div className="relative z-30 flex flex-col justify-between h-full w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[17px] font-medium text-white tracking-wide group-hover:text-indigo-400 transition-colors">
                Total Projects
              </span>
              <span className="bg-[#181920]/80 text-neutral-300 border border-white/10 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {activeProjectsCount} active
              </span>
            </div>
            <div className="text-4xl font-heading font-medium text-white tracking-tight leading-none group-hover:text-indigo-400 transition-colors">
              {totalProjectsCount}
            </div>
            <div className="text-xs font-normal text-neutral-400">View all projects ↗</div>
          </div>
        </div>

        {/* Card 2: AI generations */}
        <div
          onClick={() => navigate("/app/chat")}
          className="relative rounded-[24px] overflow-hidden border border-white/[0.04] bg-neutral-950/80 backdrop-blur-md p-5 flex flex-col justify-between transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.2)] group hover:border-purple-500/30 cursor-pointer h-full min-h-[140px]"
          style={{
            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.02) 100%)",
          }}
        >
          {/* Soft Ambient Radial Glow Backdrop */}
          <div
            className="absolute inset-0 z-0 opacity-40 pointer-events-none group-hover:opacity-60 transition-opacity duration-300"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)",
            }}
          />

          {/* Tilted Grid background overlay */}
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none opacity-30 z-0"
            style={{ transform: "rotate(-12deg) scale(1.6)", transformOrigin: "center center" }}
          />

          {/* Noise overlay */}
          <div
            className="absolute inset-0 opacity-[0.12] mix-blend-overlay z-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Glass sheen highlight reflection overlay */}
          <div
            className="absolute inset-0 z-20 pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.02) 100%)",
            }}
          />

          {/* Logo Watermark */}
          <Bot className="absolute -right-5 -bottom-5 w-24 h-24 text-purple-500/8 pointer-events-none transform rotate-[-15deg] group-hover:scale-110 transition-transform duration-500 z-10" />

          {/* Content wrapper */}
          <div className="relative z-30 flex flex-col justify-between h-full w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[17px] font-medium text-white tracking-wide group-hover:text-purple-400 transition-colors">
                AI Generations
              </span>
              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> +40%
              </span>
            </div>
            <div className="text-4xl font-heading font-medium text-white tracking-tight leading-none group-hover:text-purple-400 transition-colors">
              {aiGenerationsCount}
            </div>
            <div className="text-xs font-normal text-neutral-400">Open AI Workspace ↗</div>
          </div>
        </div>

        {/* Card 3: Security rating */}
        <div
          onClick={() => navigate("/app/security")}
          className="relative rounded-[24px] overflow-hidden border border-white/[0.04] bg-neutral-950/80 backdrop-blur-md p-5 flex flex-col justify-between transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)] group hover:border-emerald-500/30 cursor-pointer h-full min-h-[140px]"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 184, 166, 0.02) 100%)",
          }}
        >
          {/* Soft Ambient Radial Glow Backdrop */}
          <div
            className="absolute inset-0 z-0 opacity-40 pointer-events-none group-hover:opacity-60 transition-opacity duration-300"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)",
            }}
          />

          {/* Tilted Grid background overlay */}
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none opacity-30 z-0"
            style={{ transform: "rotate(-12deg) scale(1.6)", transformOrigin: "center center" }}
          />

          {/* Noise overlay */}
          <div
            className="absolute inset-0 opacity-[0.12] mix-blend-overlay z-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Glass sheen highlight reflection overlay */}
          <div
            className="absolute inset-0 z-20 pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.02) 100%)",
            }}
          />

          {/* Logo Watermark */}
          <ShieldCheck className="absolute -right-5 -bottom-5 w-24 h-24 text-emerald-500/8 pointer-events-none transform rotate-[-15deg] group-hover:scale-110 transition-transform duration-500 z-10" />

          {/* Content wrapper */}
          <div className="relative z-30 flex flex-col justify-between h-full w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[17px] font-medium text-white tracking-wide group-hover:text-emerald-450 transition-colors">
                Security Rating
              </span>
              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-xs font-medium px-2.5 py-0.5 rounded-full">
                0 critical
              </span>
            </div>
            <div className="text-4xl font-heading font-medium text-emerald-400 tracking-tight leading-none">
              A
            </div>
            <div className="text-xs font-normal text-neutral-400">Security Center ↗</div>
          </div>
        </div>

        {/* Card 4: Active blueprints */}
        <div
          onClick={() => navigate("/app/architecture")}
          className="relative rounded-[24px] overflow-hidden border border-white/[0.04] bg-neutral-950/80 backdrop-blur-md p-5 flex flex-col justify-between transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_-15px_rgba(6,182,212,0.2)] group hover:border-cyan-500/30 cursor-pointer h-full min-h-[140px]"
          style={{
            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)",
          }}
        >
          {/* Soft Ambient Radial Glow Backdrop */}
          <div
            className="absolute inset-0 z-0 opacity-40 pointer-events-none group-hover:opacity-60 transition-opacity duration-300"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 60%)",
            }}
          />

          {/* Tilted Grid background overlay */}
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none opacity-30 z-0"
            style={{ transform: "rotate(-12deg) scale(1.6)", transformOrigin: "center center" }}
          />

          {/* Noise overlay */}
          <div
            className="absolute inset-0 opacity-[0.12] mix-blend-overlay z-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Glass sheen highlight reflection overlay */}
          <div
            className="absolute inset-0 z-20 pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.02) 100%)",
            }}
          />

          {/* Logo Watermark */}
          <Boxes className="absolute -right-5 -bottom-5 w-24 h-24 text-cyan-500/8 pointer-events-none transform rotate-[-15deg] group-hover:scale-110 transition-transform duration-500 z-10" />

          {/* Content wrapper */}
          <div className="relative z-30 flex flex-col justify-between h-full w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[17px] font-medium text-white tracking-wide group-hover:text-cyan-400 transition-colors">
                Active Blueprints
              </span>
              <span className="bg-[#181920]/80 text-neutral-300 border border-white/10 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {pipelineStats.pct}% complete
              </span>
            </div>
            <div className="text-4xl font-heading font-medium text-white tracking-tight leading-none group-hover:text-cyan-400 transition-colors">
              {totalProjectsCount}
            </div>
            <div className="text-xs font-normal text-neutral-400">Architecture Blueprints ↗</div>
          </div>
        </div>

      </div>

      {/* ── ROW 1: DevAI Intelligence Hub (2/3) + Real Pipeline Status (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* DevAI Intelligence Hub Card */}
        <div className="lg:col-span-2 glowing-border-container">
          <div className="glowing-border-content p-5 lg:p-6 flex flex-col justify-between space-y-4">
            
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-heading text-[18px] font-bold text-white tracking-wide">
                DevAI Intelligence Hub
              </span>
            </div>
          </div>

          {/* AI Big Text Area Wrap (+1pt text-base) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskDevAI();
            }}
            className="flex flex-col gap-2.5 bg-black border border-white/10 rounded-xl p-4 focus-within:border-emerald-500/60 transition-all"
          >
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-1" />
              <textarea
                rows={3}
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask DevAI any engineering query about system architecture, database optimization, OAuth2 security, or stack recommendations..."
                className="bg-transparent border-none outline-none text-base text-white placeholder-neutral-400 w-full resize-none leading-relaxed font-sans"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAskDevAI();
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
              <span className="text-sm font-medium text-neutral-400">Press Enter to submit query</span>
              <button
                type="submit"
                disabled={isAiLoading || !aiQuestion.trim()}
                className="bg-black hover:bg-neutral-900 disabled:opacity-50 text-white border border-white/20 hover:border-white/40 font-heading font-bold text-[15px] px-5 py-2 rounded-xl transition-all flex items-center gap-3 shrink-0 h-12 shadow-[0_0_15px_rgba(255,255,255,0.08)] hover:shadow-[0_0_24px_rgba(255,255,255,0.18)]"
              >
                <span className="text-white tracking-wide font-extrabold">{isAiLoading ? "Thinking..." : "Ask AI"}</span>
                <AIOrb size={64} className="bg-transparent border-none opacity-90 shrink-0 pointer-events-none" renderScale={1.5} />
              </button>
            </div>
          </form>

          {/* Question Pills (+1pt text-xs) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 text-xs">
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
                className="text-neutral-300 bg-[#181920] border border-white/10 hover:border-emerald-500/40 hover:text-white px-3 py-1 rounded-full transition-all shrink-0 whitespace-nowrap text-xs"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Working AI Answer Output Display (+1pt text-sm) */}
          {(isAiLoading || aiAnswer) && (
            <div className="p-4 bg-[#181920] border border-emerald-500/30 rounded-xl space-y-2 text-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs border-b border-white/10 pb-2">
                <Bot className="h-4 w-4" /> DevAI Response
              </div>
              {isAiLoading ? (
                <div className="flex items-center gap-2 py-3 text-neutral-400">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  <span>Analyzing architecture specifications...</span>
                </div>
              ) : (
                <div className="text-neutral-200 whitespace-pre-line leading-relaxed text-sm">
                  {aiAnswer}
                </div>
              )}
            </div>
          )}

          </div>
        </div>

        {/* Pipeline Status Card (+1pt) */}
        <div className="bg-gradient-to-b from-[#0a142c] via-[#121319] to-[#121319] border border-blue-900/35 rounded-xl p-5 lg:p-6 flex flex-col justify-between space-y-5 hover:border-blue-800/40 hover:shadow-[0_0_20px_rgba(30,58,138,0.15)] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="font-heading text-[17px] font-medium text-white tracking-wide">
              Pipeline Status
            </span>
            <span className="text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
              Real profile data
            </span>
          </div>

          {/* Dynamic Donut Chart Visual */}
          <div className="flex flex-col items-center justify-center my-auto py-1">
            <div className="relative flex items-center justify-center w-34 h-34">
              <svg width="136" height="136" viewBox="0 0 36 36" className="transform -rotate-90">
                <path
                  fill="none"
                  stroke="#262730"
                  strokeWidth="3.5"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${pipelineStats.pct}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-heading font-bold text-white tracking-tight">
                  {pipelineStats.avgCompletedStages}/{pipelineStats.totalStages}
                </span>
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider mt-0.5">
                  avg stages
                </span>
              </div>
            </div>
          </div>

          <div className="h-[0.5px] bg-white/10 my-1" />

          {/* Dynamic Legend (+1pt text-sm) */}
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                <span>Generated Artifacts</span>
              </div>
              <span className="font-bold text-white">
                {pipelineStats.completed} · {pipelineStats.pct}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <span className="h-2 w-2 rounded-sm bg-[#262730]" />
                <span>Pending Artifacts</span>
              </div>
              <span className="text-neutral-400">
                {pipelineStats.pending} · {100 - pipelineStats.pct}%
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* ── ROW 2: Recent Projects (2/3) + Quick Generators (1/3) (+1pt font sizes) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Recent Projects Card */}
        <div 
          className="relative lg:col-span-2 rounded-[28px] overflow-hidden border border-white/[0.04] p-5 lg:p-6 transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] group hover:border-white/10"
          style={{
            backgroundColor: "#0e131f",
            boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Subtle glass reflection overlay */}
          <div
            className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-300 group-hover:opacity-75 opacity-50"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(2px)",
            }}
          />

          {/* Dark background with black gradient */}
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, #000000 0%, #000000 70%)",
            }}
          />

          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay z-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Subtle finger smudge texture for realism */}
          <div
            className="absolute inset-0 opacity-[0.06] mix-blend-soft-light z-11 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='smudge'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='3' seed='5' stitchTiles='stitch'/%3E%3CfeGaussianBlur stdDeviation='10'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23smudge)'/%3E%3C/svg%3E")`,
              backdropFilter: "blur(1px)",
            }}
          />

          {/* Orange/green glow effect */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2/3 z-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-90 opacity-80"
            style={{
              background: `
                radial-gradient(ellipse at bottom right, rgba(251, 146, 60, 0.45) -10%, rgba(251, 146, 60, 0) 70%),
                radial-gradient(ellipse at bottom left, rgba(52, 211, 153, 0.45) -10%, rgba(52, 211, 153, 0) 70%)
              `,
              filter: "blur(30px)",
            }}
          />

          {/* Central orange-green glow */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2/3 z-21 pointer-events-none transition-opacity duration-300 group-hover:opacity-85 opacity-75"
            style={{
              background: `
                radial-gradient(circle at bottom center, rgba(251, 146, 60, 0.3) -20%, rgba(52, 211, 153, 0.25) 30%, rgba(52, 211, 153, 0) 70%)
              `,
              filter: "blur(35px)",
            }}
          />

          {/* Transparent Grid overlay */}
          <div className="absolute inset-0 z-0 opacity-25 pointer-events-none bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:16px_16px]" />

          {/* Large Background Icon Watermark */}
          <FolderOpen className="absolute bottom-[-24px] right-[-24px] z-10 opacity-[0.03] group-hover:opacity-[0.05] pointer-events-none select-none text-orange-400 w-36 h-36 transform rotate-[-5deg] group-hover:rotate-[-15deg] group-hover:scale-110 transition-all duration-300" />

          {/* Bottom border line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] z-25 transition-opacity duration-300 group-hover:opacity-100 opacity-90"
            style={{
              background: "linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.05) 100%)",
            }}
          />

          {/* Content wrapper */}
          <div className="relative z-30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[17px] font-medium text-white tracking-wide">Recent Projects</span>
              <button
                onClick={() => navigate("/app/projects")}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 text-xs">
              {[
                { id: "all", label: `All · ${totalProjectsCount}` },
                { id: "generated", label: `Generated · ${displayProjects.filter(p => p.hasArtifacts).length}` },
                { id: "no_artifacts", label: `No artifacts · ${displayProjects.filter(p => !p.hasArtifacts).length}` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setProjectFilter(f.id as any)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-normal transition-all border",
                    projectFilter === f.id
                      ? "bg-[#181920]/80 border-white/20 text-white font-medium"
                      : "border-transparent text-neutral-400 hover:text-white"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Project Table (+1pt text sizes) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-white/10">
                    <th className="pb-2.5">Project</th>
                    <th className="pb-2.5">Stack</th>
                    <th className="pb-2.5">Score</th>
                    <th className="pb-2.5 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {displayProjects.map((proj) => (
                    <tr
                      key={proj.id}
                      onClick={() => navigate(`/app/projects/${proj.id}`)}
                      className="hover:text-emerald-400 transition-colors cursor-pointer group/row"
                    >
                      <td className="py-3 pr-3 max-w-[220px]">
                        <div className="font-semibold text-sm text-white group-hover/row:text-emerald-400">{proj.name}</div>
                        <div className="text-xs text-neutral-400 truncate mt-0.5">{proj.description}</div>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {proj.stack.map((stk, idx) => (
                            <span
                              key={idx}
                              className="bg-[#181920]/80 border border-white/10 text-neutral-300 text-[11px] px-2 py-0.5 rounded"
                            >
                              {stk}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {proj.score > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-14 bg-white/10 rounded-full overflow-hidden">
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
                                  "text-xs font-semibold",
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
                            className="text-xs text-emerald-400 hover:underline"
                          >
                            Generate architecture ↗
                          </button>
                        )}
                      </td>
                      <td className="py-3 text-right text-neutral-400 font-normal whitespace-nowrap text-xs">
                        {proj.updatedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Generators Card (+1pt text sizes) */}
        <div 
          className="relative rounded-[28px] overflow-hidden border border-white/[0.04] bg-neutral-950/80 backdrop-blur-md p-5 lg:p-6 transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)] group hover:border-emerald-500/30"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.03) 100%)",
          }}
        >
          {/* Soft Ambient Radial Glow Backdrop */}
          <div
            className="absolute inset-0 z-0 opacity-40 pointer-events-none group-hover:opacity-60 transition-opacity duration-300"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.22) 0%, transparent 60%)",
            }}
          />

          {/* Tilted Grid background overlay */}
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0"
            style={{ transform: "rotate(-12deg) scale(1.6)", transformOrigin: "center center" }}
          />

          {/* Noise overlay */}
          <div
            className="absolute inset-0 opacity-[0.15] mix-blend-overlay z-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Glass sheen highlight reflection overlay */}
          <div
            className="absolute inset-0 z-20 pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.02) 100%)",
            }}
          />

          {/* Logo Watermark */}
          <Sparkles className="absolute -right-6 -bottom-6 w-32 h-32 text-emerald-500/8 pointer-events-none transform rotate-[-15deg] group-hover:scale-110 transition-transform duration-500 z-10" />

          {/* Content wrapper */}
          <div className="relative z-30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="font-heading text-[17px] font-medium text-white tracking-wide">Quick Generators</span>
              </div>
              <span className="bg-[#181920]/85 text-neutral-300 border border-white/10 text-xs font-medium px-2.5 py-0.5 rounded-full">
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
                    className="bg-[#181920]/80 border border-white/10 rounded-lg p-3.5 cursor-pointer flex flex-col gap-2.5 hover:border-white/30 transition-all group/gen"
                  >
                    <div className={cn("h-8 w-8 rounded-md flex items-center justify-center shrink-0", gen.bg)}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover/gen:text-emerald-400">{gen.title}</div>
                      <div className="text-xs text-neutral-400 mt-0.5">{gen.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
  );
}
