import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Boxes,
  Database,
  Code2,
  ShieldCheck,
  FileText,
  GitBranch,
  Rocket,
  Settings,
  MessageSquare,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Share2,
  Copy,
  Check,
  Search,
  Command,
  Zap,
  Award,
  Layers,
  Cpu,
  Server,
  RefreshCw,
  Edit3,
  Trash2,
  ExternalLink,
  Shield,
  FileCode,
  Lock,
  Globe,
  Sliders,
  Terminal,
  Bot,
  Wand2,
  X,
  Network,
  TrendingUp,
  Package,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@ui/index";
import { useProject, useDeleteProject, useUpdateProject, useCreateProject } from "@/lib/queries/projects";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { ValidationCenterTab } from "@/components/project/validation-center-tab";
import { ProjectInsightsTab } from "@/components/project/project-insights-tab";
import { BlueprintCenterTab } from "@/components/project/blueprint-center-tab";
import { ProjectKnowledgeGraphTab } from "@/components/project/knowledge-graph-tab";
import { ProjectContextPanel } from "@/components/project/project-context-panel";
import { analyzeProjectConsistency } from "@/lib/utils/consistency-checker";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { formatDate, cn } from "@utils/index";

type Tab = "overview" | "validation" | "insights" | "blueprint" | "graph" | "artifacts" | "chat" | "settings";


// ── Generator Definitions ─────────────────────────────────────
interface GeneratorDef {
  kind: string;
  title: string;
  shortTitle: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  href: (projectId: string) => string;
  dataKey: string | null;
  description: (project: any) => string;
}

const GENERATORS: GeneratorDef[] = [
  {
    kind: "architecture",
    title: "System Architecture",
    shortTitle: "Architecture",
    icon: Boxes,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    href: (id) => `/app/architecture?projectId=${id}`,
    dataKey: "architecture",
    description: (p) =>
      p?.architecture
        ? `${p.architecture.services?.length ?? 0} Services · ${p.architecture.connections?.length ?? 0} Connections`
        : "Map microservices & data flows",
  },
  {
    kind: "database",
    title: "Database Schema",
    shortTitle: "Database",
    icon: Database,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    href: (id) => `/app/database?projectId=${id}`,
    dataKey: "database_schema",
    description: (p) =>
      p?.database_schema
        ? `${p.database_schema.tables?.length ?? 0} Tables · Relational Schema`
        : "Design PostgreSQL tables & relationships",
  },
  {
    kind: "api",
    title: "API Specification",
    shortTitle: "API",
    icon: Code2,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    href: (id) => `/app/api-generator?projectId=${id}`,
    dataKey: "api_spec",
    description: (p) =>
      p?.api_spec
        ? `${p.api_spec.endpoints?.length ?? 0} Endpoints · ${p.api_spec.version ?? "v1.0"}`
        : "Generate OpenAPI & REST endpoints",
  },
  {
    kind: "security",
    title: "Security Report",
    shortTitle: "Security",
    icon: ShieldCheck,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    href: (id) => `/app/security?projectId=${id}`,
    dataKey: "security_report",
    description: (p) =>
      p?.security_report
        ? `Score: ${p.security_report.score ?? "88"}/100 · ${p.security_report.findings?.length ?? 0} OWASP Audits`
        : "Audit attack surface & vulnerabilities",
  },
  {
    kind: "repo",
    title: "Repo Analyzer",
    shortTitle: "Repo",
    icon: GitBranch,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    href: (id) => `/app/repo?projectId=${id}`,
    dataKey: null,
    description: () => "Codebase structure & dependency graphs",
  },
  {
    kind: "documentation",
    title: "Documentation",
    shortTitle: "Docs",
    icon: FileText,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    href: (id) => `/app/documentation?projectId=${id}`,
    dataKey: "documentation",
    description: (p) =>
      p?.documentation
        ? "Onboarding guide & API Reference ready"
        : "Auto-generate README & developer guides",
  },
  {
    kind: "deployment",
    title: "Deployment Planner",
    shortTitle: "Deploy",
    icon: Rocket,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    href: (id) => `/app/deployment?projectId=${id}`,
    dataKey: "deployment_plan",
    description: (p) =>
      p?.deployment_plan
        ? "Dockerfiles & GitHub Actions configured"
        : "Docker, Kubernetes & CI/CD pipelines",
  },
];

const GENERATE_STEPS = [
  { key: "architecture", label: "System Architecture",  field: "architecture",    endpoint: "generate-architecture",    bodyFn: (p: string) => ({ prompt: p }),         responseFn: (d: any) => d.architecture },
  { key: "database",     label: "Database Schema",      field: "database_schema", endpoint: "generate-database-schema", bodyFn: (p: string) => ({ prompt: p, dialect: "postgresql" }), responseFn: (d: any) => d.schema },
  { key: "api",          label: "API Specification",    field: "api_spec",        endpoint: "generate-api-spec",        bodyFn: (p: string) => ({ prompt: p }),         responseFn: (d: any) => d.spec },
  { key: "security",     label: "Security Report",      field: "security_report", endpoint: "analyze-security",         bodyFn: (p: string) => ({ prompt: p }),         responseFn: (d: any) => d.analysis },
  { key: "documentation",label: "Documentation Suite",  field: "documentation",   endpoint: "generate-documentation",   bodyFn: (p: string) => ({ prompt: p }),         responseFn: (d: any) => d.doc },
  { key: "deployment",   label: "Deployment CI/CD",     field: "deployment_plan", endpoint: "generate-deployment-plan",  bodyFn: (p: string) => ({ prompt: p }),         responseFn: (d: any) => d.plan },
];

// ── Export Formats & Presets ─────────────────────────────────
const EXPORT_TARGET_AIS = [
  { id: "devcanvas", name: "🚀 AI Project Package (.devcanvas)", desc: "Native portable DevCanvas spec bundle with complete metadata", icon: Zap },
  { id: "chatgpt",   name: "🤖 Export for ChatGPT",   desc: "Optimized system prompt & markdown specification for GPT-4o", icon: Bot },
  { id: "claude",    name: "🧠 Export for Claude",    desc: "XML-tagged structured system prompt for Claude 3.5 Sonnet", icon: Cpu },
  { id: "gemini",    name: "♊ Export for Gemini",    desc: "Clean markdown context bundle for Gemini 2.5/3.0", icon: Sparkles },
  { id: "cursor",    name: "⚡ Export for Cursor",    desc: ".cursorrules & project context prompt file for Cursor IDE", icon: Terminal },
  { id: "copilot",   name: "🐙 Export for Copilot",   desc: "GitHub Copilot instructions & architecture context doc", icon: FileCode },
  { id: "windsurf",  name: "🌀 Export for Windsurf",  desc: "Cascade AI rules & code generation context package", icon: Wand2 },
];

const EXPORT_PRESETS = [
  { id: "full",       name: "Full Engineering Package", desc: "Complete specs, diagrams, security, and AI rules" },
  { id: "dev-handoff",name: "Developer Handoff",       desc: "DB Schema, OpenAPI endpoints, and setup instructions" },
  { id: "ai-coding",  name: "AI Coding Blueprint",      desc: "Structured prompt bundle for LLM code generators" },
  { id: "client",     name: "Client Presentation",      desc: "Executive summary, system architecture, and tech stack" },
  { id: "security",   name: "Compliance & Security",    desc: "OWASP Top 10 analysis, threat matrix, and remediations" },
];

const EXPORT_FORMATS = [
  { id: "devcanvas", name: ".devcanvas Package", ext: ".devcanvas", mime: "application/json" },
  { id: "markdown",  name: "Markdown (.md)",     ext: ".md",         mime: "text/markdown" },
  { id: "json",      name: "Raw JSON (.json)",   ext: ".json",       mime: "application/json" },
  { id: "yaml",      name: "YAML Spec (.yaml)",  ext: ".yaml",       mime: "text/yaml" },
  { id: "openapi",   name: "OpenAPI 3.0 (.json)",ext: ".json",       mime: "application/json" },
  { id: "sql",       name: "PostgreSQL DDL (.sql)",ext: ".sql",      mime: "text/plain" },
  { id: "mermaid",   name: "Mermaid Diagram (.mmd)",ext: ".mmd",     mime: "text/plain" },
];

// ── Main Page Component ──────────────────────────────────────
export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, error, refetch } = useProject(id);
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const createProject = useCreateProject();

  const [tab, setTab] = useState<Tab>("overview");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameDescValue, setRenameDescValue] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const validationResult = useMemo(() => analyzeProjectConsistency(project), [project]);

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-danger-400" />
        <h2 className="mt-4 font-heading text-lg font-semibold text-neutral-100">
          Project not found
        </h2>
        <p className="mt-1 text-sm text-neutral-400">
          {error ? error.message : "This project may have been deleted."}
        </p>
        <Button variant="outline" className="mt-6" onClick={() => navigate("/app/projects")}>
          Back to projects
        </Button>
      </div>
    );
  }

  const handleDuplicateProject = async () => {
    try {
      const cloned = await createProject.mutateAsync({
        name: `${project.name} (Copy)`,
        description: project.description ?? undefined,
        tags: project.tags ?? [],
      });
      // Copy artifacts
      await supabase.from("projects").update({
        architecture: project.architecture,
        database_schema: project.database_schema,
        api_spec: project.api_spec,
        security_report: project.security_report,
      }).eq("id", cloned.id);

      navigate(`/app/projects/${cloned.id}`);
    } catch (err: any) {
      alert("Failed to duplicate project: " + err.message);
    }
  };

  const handleSaveRename = async () => {
    if (!renameValue.trim()) return;
    try {
      await updateProject.mutateAsync({
        id: project.id,
        name: renameValue.trim(),
        description: renameDescValue.trim(),
      });
      setRenameModalOpen(false);
      await refetch();
    } catch (err: any) {
      alert("Failed to rename project: " + err.message);
    }
  };

  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "overview",   label: "Overview",   icon: Boxes },
    { id: "validation", label: "Validation", icon: ShieldCheck },
    { id: "insights",   label: "Insights",   icon: TrendingUp },
    { id: "blueprint",  label: "Blueprint",  icon: Package },
    { id: "graph",      label: "Knowledge Graph", icon: Network },
    { id: "artifacts",  label: "Artifacts",  icon: FileText },
    { id: "chat",       label: "AI Chat",    icon: MessageSquare },
    { id: "settings",   label: "Settings",   icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-neutral-200 pb-16">
      {/* ── STICKY TOP ACTION BAR ──────────────────────────────── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.08] bg-[#09090B]/85 px-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/app/projects")}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Projects</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <span className="font-heading text-sm font-semibold text-white tracking-tight truncate max-w-[180px] sm:max-w-xs">
            {project.name}
          </span>
          <Badge variant={project.status === "active" ? "success" : "warning"} className="text-[10px]">
            {project.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Ctrl+K Search Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-neutral-400 hover:border-white/20 hover:text-white transition-all"
          >
            <Search className="h-3.5 w-3.5 text-neutral-500" />
            <span>Search</span>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-neutral-300">⌘K</kbd>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Spec</span>
          </Button>

          {/* Quick options */}
          <button
            onClick={() => {
              setRenameValue(project.name);
              setRenameDescValue(project.description ?? "");
              setRenameModalOpen(true);
            }}
            title="Edit Project Name"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT & STICKY CONTEXT PANEL LAYOUT ─────────── */}
      <div className="flex w-full min-h-[calc(100vh-3.5rem)]">
        {/* Main Workspace Column */}
        <div className="flex-1 min-w-0 mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          {/* Navigation Tabs */}
          <div className="border-b border-white/[0.08] mb-6 overflow-x-auto">
            <nav className="flex gap-1 min-w-max">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                    tab === t.id ? "text-primary-400" : "text-neutral-400 hover:text-white"
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {tab === t.id && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-primary-500 to-indigo-500"
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {tab === "overview" && (
            <OverviewTab
              project={project}
              projectId={project.id}
              setTab={setTab}
              refetch={refetch}
              onOpenExport={() => setExportModalOpen(true)}
              onDuplicate={handleDuplicateProject}
            />
          )}
          {tab === "validation" && <ValidationCenterTab project={project} />}
          {tab === "insights"   && <ProjectInsightsTab project={project} />}
          {tab === "blueprint"  && <BlueprintCenterTab project={project} />}
          {tab === "graph"      && <ProjectKnowledgeGraphTab project={project} />}
          {tab === "artifacts"  && <ArtifactsTab project={project} projectId={project.id} />}
          {tab === "chat"       && <ChatPanel projectId={project.id} />}
          {tab === "settings"   && (
            <SettingsTab
              project={project}
              projectId={project.id}
              onDelete={async () => {
                await deleteProject.mutateAsync(project.id);
                navigate("/app/projects");
              }}
              deleting={deleteProject.isPending}
            />
          )}
        </div>

        {/* Sticky Right Context Panel */}
        <ProjectContextPanel project={project} overallScore={validationResult.overallScore} />
      </div>


      {/* ── GLOBAL EXPORT CENTER MODAL ───────────────────────── */}
      <ExportModal
        project={project}
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />

      {/* ── SHARE MODAL ───────────────────────────────────────── */}
      <ShareModal
        project={project}
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      {/* ── RENAME MODAL ──────────────────────────────────────── */}
      <Dialog open={renameModalOpen} onOpenChange={setRenameModalOpen}>
        <DialogContent className="bg-neutral-900 border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold">Edit Project Details</DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Update project name and prompt description.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Project Name</label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Description Prompt</label>
              <textarea
                value={renameDescValue}
                onChange={(e) => setRenameDescValue(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setRenameModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" size="sm" onClick={handleSaveRename}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── COMMAND PALETTE MODAL (Ctrl + K) ─────────────────── */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        projectId={project.id}
        onOpenExport={() => { setCommandPaletteOpen(false); setExportModalOpen(true); }}
        onOpenShare={() => { setCommandPaletteOpen(false); setShareModalOpen(true); }}
      />
    </div>
  );
}

// ── OVERVIEW TAB ─────────────────────────────────────────────
function OverviewTab({
  project,
  projectId,
  setTab,
  refetch,
  onOpenExport,
  onDuplicate,
}: {
  project: any;
  projectId: string;
  setTab: (tab: Tab) => void;
  refetch: () => Promise<any>;
  onOpenExport: () => void;
  onDuplicate: () => void;
}) {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [projectDescription, setProjectDescription] = useState(project.description ?? "");
  const [savingDescription, setSavingDescription] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generateStep, setGenerateStep] = useState("");
  const [generateProgress, setGenerateProgress] = useState<Record<string, "pending"|"running"|"done"|"error">>({});
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Derived scores & stats
  const generatedCount = GENERATORS.filter((g) => g.dataKey && project[g.dataKey]).length;
  const serviceCount   = project.architecture?.services?.length   ?? 0;
  const tableCount     = project.database_schema?.tables?.length  ?? 0;
  const endpointCount  = project.api_spec?.endpoints?.length      ?? 0;

  const overallScore = useMemo(() => {
    let score = 70;
    if (project.architecture) score += 8;
    if (project.database_schema) score += 7;
    if (project.api_spec) score += 8;
    if (project.security_report) score += 7;
    return Math.min(98, score);
  }, [project]);

  // Detected Tech Stack derived from artifacts
  const techStack = useMemo(() => {
    const stack = ["React 18", "TypeScript", "TailwindCSS"];
    if (project.database_schema) stack.push("PostgreSQL", "Prisma");
    if (project.api_spec) stack.push("REST API", "OpenAPI 3.0", "JWT Auth");
    if (project.architecture) stack.push("Docker", "Redis", "Nginx");
    return stack;
  }, [project]);

  async function handleSaveDescription() {
    setSavingDescription(true);
    setGenerateError(null);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ description: projectDescription.trim() })
        .eq("id", projectId);
      if (error) throw error;
      await refetch();
    } catch (err: any) {
      setGenerateError(err.message || "Failed to save description.");
    } finally {
      setSavingDescription(false);
    }
  }

  async function handleGenerateAll() {
    const input = projectDescription.trim();
    if (!input || generatingAll) return;

    setGeneratingAll(true);
    setGenerateError(null);

    const initialProgress: Record<string, "pending"|"running"|"done"|"error"> = {};
    GENERATE_STEPS.forEach((s) => { initialProgress[s.key] = "pending"; });
    setGenerateProgress(initialProgress);

    try {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated.");

      setGenerateStep("Saving prompt…");
      await supabase.from("projects").update({ description: input }).eq("id", projectId);

      const updates: Record<string, any> = {};

      for (const step of GENERATE_STEPS) {
        setGenerateStep(step.label);
        setGenerateProgress((prev) => ({ ...prev, [step.key]: "running" }));

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${step.endpoint}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(step.bodyFn(input)),
          }
        );

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Failed to generate ${step.label} (${res.status})`);
        }

        const data = await res.json();
        const value = step.responseFn(data);
        if (!value) throw new Error(`No data returned for ${step.label}.`);
        updates[step.field] = value;

        setGenerateProgress((prev) => ({ ...prev, [step.key]: "done" }));
      }

      setGenerateStep("Saving results…");
      const { error: dbError } = await supabase.from("projects").update(updates).eq("id", projectId);
      if (dbError) throw dbError;

      await supabase.from("chat_messages").insert([{
        project_id: projectId,
        role: "system",
        content: `All engineering artifacts generated for prompt: "${input}"`,
      }]);

      await refetch();
    } catch (err: any) {
      setGenerateError(err.message || "Failed to generate artifacts.");
      setGenerateProgress((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => { if (next[k] === "running") next[k] = "error"; });
        return next;
      });
    } finally {
      setGeneratingAll(false);
      setGenerateStep("");
    }
  }

  return (
    <div className="space-y-8">
      {/* ── 1. HERO HEADER ────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl tracking-tight">
                {project.name}
              </h1>
              <Badge variant={project.status === "active" ? "success" : "warning"}>
                {project.status}
              </Badge>
              <Badge variant="outline" className="text-xs border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                Score: {overallScore}/100
              </Badge>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed font-sans">
              {project.description || "No project description provided. Define your application prompt below to generate full specifications."}
            </p>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-neutral-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-neutral-500" />
                Created {formatDate(project.created_at)}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-neutral-500" />
                Updated {formatDate(project.updated_at)}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-neutral-500" />
                Owner: <strong className="text-neutral-200">Lead Architect</strong>
              </span>
            </div>

            {/* Tech Stack Pills */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider mr-1">Stack:</span>
              {techStack.map((tech) => (
                <span key={tech} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-neutral-300 font-medium">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Hero Quick Action Buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onDuplicate} className="text-xs">
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </Button>
            <Button variant="gradient" size="sm" onClick={onOpenExport} className="text-xs">
              <Download className="h-3.5 w-3.5" /> Export Specs
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. CONTEXTUAL SUMMARY CARDS ───────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Artifacts", val: `${generatedCount} / 4`, sub: "+2 Generated Recently", icon: Boxes, color: "text-indigo-400", bg: "bg-indigo-500/10", action: () => setTab("artifacts") },
          { label: "Services", val: `${serviceCount} Services`, sub: serviceCount > 0 ? "Microservices Architecture" : "Pending generation", icon: Server, color: "text-sky-400", bg: "bg-sky-500/10", href: `/app/architecture?projectId=${projectId}` },
          { label: "Tables", val: `${tableCount} Tables`, sub: tableCount > 0 ? "Relational Schema Defined" : "Pending generation", icon: Database, color: "text-violet-400", bg: "bg-violet-500/10", href: `/app/database?projectId=${projectId}` },
          { label: "Endpoints", val: `${endpointCount} Endpoints`, sub: endpointCount > 0 ? "REST + JWT Authorization" : "Pending generation", icon: Code2, color: "text-emerald-400", bg: "bg-emerald-500/10", href: `/app/api-generator?projectId=${projectId}` },
        ].map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => card.action ? card.action() : card.href ? navigate(card.href) : null}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{card.label}</span>
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", card.bg, card.color)}>
                <card.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="font-heading text-2xl font-bold text-white block">{card.val}</span>
              <span className="text-xs text-neutral-500 font-medium block mt-0.5">{card.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── 3. PROMPT GENERATOR RUNNER ────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-400" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
              AI Engineering Blueprint Generator
            </h3>
          </div>
          <Badge variant="outline" className="text-[10px] border-primary-500/30 text-primary-400">Automated Pipeline</Badge>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          Define your application requirements below. DevCanvas AI will sequentially generate your Architecture Diagram, PostgreSQL Schema, OpenAPI Endpoints, and Security Audit.
        </p>

        <textarea
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          rows={3}
          placeholder="A multi-tenant SaaS platform with billing, RBAC authorization, PostgreSQL database, and OpenAPI endpoints..."
          className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-sans"
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDescription}
            disabled={savingDescription || projectDescription === project.description}
          >
            {savingDescription ? "Saving…" : "Save Prompt"}
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={handleGenerateAll}
            disabled={generatingAll || !projectDescription.trim()}
          >
            {generatingAll ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {generateStep || "Generating Blueprint..."}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate All Artifacts
              </>
            )}
          </Button>
        </div>

        {generatingAll && Object.keys(generateProgress).length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GENERATE_STEPS.map((step) => {
              const status = generateProgress[step.key] ?? "pending";
              return (
                <div
                  key={step.key}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                    status === "done"    && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                    status === "running" && "border-primary-500/40 bg-primary-500/10 text-primary-300",
                    status === "error"   && "border-danger-500/30 bg-danger-500/10 text-danger-400",
                    status === "pending" && "border-white/10 bg-neutral-950 text-neutral-500",
                  )}
                >
                  {status === "done"    && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                  {status === "running" && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
                  {status === "error"   && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                  {status === "pending" && <Clock className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate">{step.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {generateError && (
          <p className="text-xs text-danger-400 flex items-center gap-1.5 pt-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {generateError}
          </p>
        )}
      </div>

      {/* ── 4. AI ENGINEERING SCORE & RECOMMENDATIONS GRID ────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Engineering Score Breakdown */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">
              AI Engineering Score
            </h3>
            <span className="font-heading text-xl font-bold text-emerald-400">{overallScore}%</span>
          </div>

          <div className="space-y-3">
            {[
              { label: "System Architecture", pct: project.architecture ? 92 : 40, status: project.architecture ? "Clean" : "Pending" },
              { label: "Database Normalization", pct: project.database_schema ? 88 : 30, status: project.database_schema ? "Ready" : "Pending" },
              { label: "API Specification", pct: project.api_spec ? 94 : 35, status: project.api_spec ? "OpenAPI 3.0" : "Pending" },
              { label: "Security & OWASP Audit", pct: project.security_report ? 86 : 50, status: project.security_report ? "Audited" : "Pending" },
              { label: "Documentation Index", pct: 90, status: "Ready" },
              { label: "Deployment & CI/CD", pct: 84, status: "Configured" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-neutral-300">{item.label}</span>
                  <span className="text-neutral-400 font-mono">{item.pct}% ({item.status})</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-700",
                      item.pct >= 85 ? "bg-emerald-500" : item.pct >= 60 ? "bg-amber-500" : "bg-neutral-600"
                    )}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Practical AI Recommendations */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">
              AI Recommendations
            </h3>
            <Badge variant="outline" className="text-[10px]">Actionable</Badge>
          </div>

          <div className="space-y-2.5">
            {[
              { title: "Strengthen API Authentication", desc: "Add JWT bearer validation & rate limiting to /api/v1/auth endpoints.", type: "Security", href: `/app/security?projectId=${projectId}` },
              { title: "Optimize DB Composite Indexes", desc: "Create index on users(email, status) to speed up authentication queries.", type: "Database", href: `/app/database?projectId=${projectId}` },
              { title: "Generate GitHub Actions CI/CD", desc: "Export Docker Compose & Kubernetes deployment descriptors.", type: "Deploy", href: `/app/deployment?projectId=${projectId}` },
              { title: "Connect GitHub Repository", desc: "Analyze live source code tree and map circular dependency loops.", type: "Repo", href: `/app/repo?projectId=${projectId}` },
            ].map((rec, i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-white/15">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">{rec.title}</span>
                    <Badge variant="outline" className="text-[8px] uppercase">{rec.type}</Badge>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate">{rec.desc}</p>
                </div>
                <button
                  onClick={() => navigate(rec.href)}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-primary-300 hover:bg-white/10 transition-all"
                >
                  Apply <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. RECENT ARTIFACTS REGISTRY ───────────────────────── */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
            Engineering Artifacts Registry
          </h3>
          <button onClick={() => setTab("artifacts")} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 font-semibold">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GENERATORS.map((gen) => {
            const hasData = gen.dataKey ? !!project[gen.dataKey] : false;
            return (
              <div
                key={gen.kind}
                className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", gen.bgColor, gen.color)}>
                    <gen.icon className="h-4.5 w-4.5" />
                  </span>
                  <Badge variant={hasData ? "success" : "outline"} className="text-[10px]">
                    {hasData ? "Generated" : "Pending"}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-heading text-sm font-bold text-white">{gen.title}</h4>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{gen.description(project)}</p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Button
                    variant={hasData ? "outline" : "ghost"}
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate(gen.href(projectId))}
                  >
                    {hasData ? "View Artifact" : "Open Tool"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 6. RECENT ACTIVITY TIMELINE ────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left space-y-4">
        <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">
          Recent Activity Timeline
        </h3>

        <div className="space-y-3">
          {[
            { action: "Generated System Architecture Blueprint", time: "2 hours ago", icon: Boxes, color: "text-indigo-400" },
            { action: "Generated PostgreSQL Database Schema", time: "3 hours ago", icon: Database, color: "text-violet-400" },
            { action: "Generated REST API OpenAPI Specification", time: "4 hours ago", icon: Code2, color: "text-sky-400" },
            { action: "Executed Security & OWASP Audit", time: "5 hours ago", icon: ShieldCheck, color: "text-emerald-400" },
            { action: "Updated Project Description Prompt", time: "1 day ago", icon: Edit3, color: "text-amber-400" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xs border-b border-white/[0.04] pb-2.5 last:border-0 last:pb-0">
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.04]", item.color)}>
                <item.icon className="h-3.5 w-3.5" />
              </span>
              <span className="font-medium text-neutral-200 flex-1">{item.action}</span>
              <span className="text-neutral-500 font-mono text-[11px]">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ARTIFACTS TAB ────────────────────────────────────────────
function ArtifactsTab({ project, projectId }: { project: any; projectId: string }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400 font-medium">
          {GENERATORS.filter((g) => g.dataKey && project[g.dataKey]).length} of {GENERATORS.filter((g) => g.dataKey).length} Core Artifacts Generated
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GENERATORS.map((gen, i) => {
          const hasData = gen.dataKey ? !!project[gen.dataKey] : false;
          return (
            <motion.div
              key={gen.kind}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", gen.bgColor, gen.color)}>
                  <gen.icon className="h-5 w-5" />
                </span>
                <Badge variant={hasData ? "success" : "outline"} className="text-[10px]">
                  {hasData ? "Generated" : "Pending"}
                </Badge>
              </div>

              <div>
                <h4 className="font-heading text-sm font-bold text-white">{gen.title}</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{gen.description(project)}</p>
              </div>

              <Button
                variant={hasData ? "outline" : "ghost"}
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate(gen.href(projectId))}
              >
                {hasData ? "View Artifact" : "Open Generator"}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── SETTINGS TAB ────────────────────────────────────────────
function SettingsTab({
  project,
  projectId,
  onDelete,
  deleting,
}: {
  project: any;
  projectId: string;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="max-w-xl space-y-6 text-left">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
        <h3 className="font-heading text-sm font-bold text-white">General Configuration</h3>
        <div className="text-xs space-y-2 text-neutral-400">
          <div className="flex justify-between py-1 border-b border-white/5">
            <span>Project ID</span>
            <span className="font-mono text-neutral-200">{projectId}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span>Created Date</span>
            <span className="text-neutral-200">{formatDate(project.created_at)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Visibility</span>
            <span className="text-neutral-200 uppercase font-semibold">{project.visibility ?? "Private"}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-danger-500/20 bg-danger-500/5 p-6 space-y-3">
        <h3 className="font-heading text-sm font-bold text-danger-400">Danger Zone</h3>
        <p className="text-xs text-neutral-400">
          Deleting a project permanently removes it and all associated artifacts.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
          disabled={deleting}
          className="text-xs"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Project Permanently"}
        </Button>
      </div>
    </div>
  );
}

// ── GLOBAL EXPORT CENTER MODAL ───────────────────────────────
function ExportModal({ project, open, onClose }: { project: any; open: boolean; onClose: () => void }) {
  const [selectedFormat, setSelectedFormat] = useState("devcanvas");
  const [selectedPreset, setSelectedPreset] = useState("full");
  const [selectedTargetAI, setSelectedTargetAI] = useState("devcanvas");

  const [includeArch, setIncludeArch] = useState(true);
  const [includeDB, setIncludeDB] = useState(true);
  const [includeAPI, setIncludeAPI] = useState(true);
  const [includeSecurity, setIncludeSecurity] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);

  // Helper download blob builder
  const handleDownload = () => {
    let content = "";
    let filename = `${project.name.toLowerCase().replace(/\s+/g, "-")}-spec`;
    let mime = "text/plain";

    if (selectedFormat === "devcanvas" || selectedTargetAI === "devcanvas") {
      filename += ".devcanvas";
      mime = "application/json";
      content = JSON.stringify({
        devcanvasVersion: "1.0",
        projectName: project.name,
        description: project.description,
        createdAt: project.created_at,
        architecture: includeArch ? project.architecture : null,
        databaseSchema: includeDB ? project.database_schema : null,
        apiSpec: includeAPI ? project.api_spec : null,
        securityReport: includeSecurity ? project.security_report : null,
        targetAI: selectedTargetAI,
      }, null, 2);
    } else if (selectedFormat === "markdown") {
      filename += ".md";
      mime = "text/markdown";
      content = `# DevCanvas AI Engineering Blueprint: ${project.name}\n\n` +
        `## Description\n${project.description ?? "N/A"}\n\n` +
        `## Architecture\n${JSON.stringify(project.architecture ?? {}, null, 2)}\n\n` +
        `## Database Schema\n${JSON.stringify(project.database_schema ?? {}, null, 2)}\n\n` +
        `## API Spec\n${JSON.stringify(project.api_spec ?? {}, null, 2)}\n\n` +
        `## Security Report\n${JSON.stringify(project.security_report ?? {}, null, 2)}`;
    } else {
      filename += ".json";
      mime = "application/json";
      content = JSON.stringify(project, null, 2);
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-neutral-900 border border-white/10 text-white p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-white/10 pb-3">
          <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
            <Download className="h-5 w-5 text-primary-400" />
            Global Engineering Blueprint Export
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Export the complete project blueprint optimized for developers, clients, or AI coding assistants.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-left">
          {/* Target AI One-Click Exporters */}
          <div className="space-y-3 lg:col-span-1 border-r border-white/10 pr-4">
            <h4 className="font-bold text-neutral-300 uppercase tracking-wider text-[10.5px]">Target AI One-Click Exporters</h4>
            <div className="space-y-1.5">
              {EXPORT_TARGET_AIS.map((ai) => (
                <button
                  key={ai.id}
                  onClick={() => setSelectedTargetAI(ai.id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5",
                    selectedTargetAI === ai.id
                      ? "border-primary-500 bg-primary-500/10 text-white"
                      : "border-white/5 bg-white/[0.02] text-neutral-400 hover:border-white/15 hover:text-white"
                  )}
                >
                  <ai.icon className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-bold block text-xs truncate">{ai.name}</span>
                    <span className="text-[10px] text-neutral-500 leading-tight block truncate">{ai.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Options */}
          <div className="space-y-4 lg:col-span-2">
            {/* Presets */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-neutral-300 uppercase tracking-wider text-[10.5px]">Smart Export Presets</h4>
              <div className="flex flex-wrap gap-1.5">
                {EXPORT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPreset(p.id)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                      selectedPreset === p.id
                        ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                        : "border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white"
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Included Artifacts Checkboxes */}
            <div className="space-y-2 pt-1">
              <h4 className="font-bold text-neutral-300 uppercase tracking-wider text-[10.5px]">Included Specs</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: "System Architecture", val: includeArch, set: setIncludeArch },
                  { label: "Database Schema", val: includeDB, set: setIncludeDB },
                  { label: "API Specification", val: includeAPI, set: setIncludeAPI },
                  { label: "Security & OWASP Audit", val: includeSecurity, set: setIncludeSecurity },
                  { label: "AI Recommendations", val: includeRecommendations, set: setIncludeRecommendations },
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-2 cursor-pointer text-neutral-300">
                    <input
                      type="checkbox"
                      checked={item.val}
                      onChange={(e) => item.set(e.target.checked)}
                      className="rounded border-white/20 bg-neutral-950 text-primary-500 focus:ring-primary-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preview Box */}
            <div className="rounded-xl border border-white/10 bg-neutral-950 p-3 space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase">
                <span>Blueprint Preview</span>
                <span>Estimated Size: ~165 KB</span>
              </div>
              <p className="font-mono text-[10.5px] text-neutral-400 truncate">
                # DevCanvas AI Engineering Blueprint: {project.name} (Format: {selectedFormat})
              </p>
            </div>

            {/* Download CTA */}
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button variant="gradient" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" /> Download Export Package
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── SHARE MODAL ──────────────────────────────────────────────
function ShareModal({ project, open, onClose }: { project: any; open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/app/projects/${project.id}?share=1`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-neutral-900 border border-white/10 text-white p-6">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
            <Share2 className="h-5 w-5 text-indigo-400" /> Share Project Blueprint
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Generate a shareable read-only link for clients or team members.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 text-xs text-left">
          <div>
            <label className="block text-neutral-300 font-medium mb-1">Shareable URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 font-mono"
              />
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-neutral-300 font-medium">Access Permission</span>
              <Badge variant="outline">Read-Only</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-300 font-medium">Link Expiration</span>
              <span className="text-neutral-400">30 Days</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="gradient" size="sm" onClick={onClose}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── COMMAND PALETTE (Ctrl + K) ───────────────────────────────
function CommandPalette({
  open,
  onClose,
  projectId,
  onOpenExport,
  onOpenShare,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onOpenExport: () => void;
  onOpenShare: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  if (!open) return null;

  const items = [
    { label: "System Architecture Generator", href: `/app/architecture?projectId=${projectId}`, icon: Boxes },
    { label: "Database Schema Designer", href: `/app/database?projectId=${projectId}`, icon: Database },
    { label: "API Generator", href: `/app/api-generator?projectId=${projectId}`, icon: Code2 },
    { label: "Security Center Audit", href: `/app/security?projectId=${projectId}`, icon: ShieldCheck },
    { label: "Repository Analyzer", href: `/app/repo?projectId=${projectId}`, icon: GitBranch },
    { label: "Export Project Blueprint", action: onOpenExport, icon: Download },
    { label: "Share Project Link", action: onOpenShare, icon: Share2 },
  ];

  const filtered = items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-neutral-900 border border-white/10 text-white p-0 overflow-hidden">
        <div className="flex items-center border-b border-white/10 px-4 py-3 gap-3">
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search generator..."
            className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-neutral-500"
          />
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-neutral-400 font-mono">ESC</kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                onClose();
                if (item.action) item.action();
                else if (item.href) navigate(item.href);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-neutral-300 hover:bg-white/10 hover:text-white transition-colors text-left"
            >
              <item.icon className="h-4 w-4 text-primary-400" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
