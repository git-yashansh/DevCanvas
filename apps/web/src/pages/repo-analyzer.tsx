import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Search,
  Sparkles,
  AlertCircle,
  FolderTree,
  ShieldAlert,
  Clock,
  Database,
  Cpu,
  RefreshCw,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Download,
  Info,
  Check,
  TrendingUp,
  FileCode,
  Box,
  Layers,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Zap,
  Activity,
  Award
} from "lucide-react";
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@ui/index";
import { PageHeader } from "@/components/dashboard/page-header";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useAIQueue } from "@/lib/ai-queue-context";
import { cn } from "@utils/index";
import { AILoader } from "@/components/dashboard/AILoader";

interface RepoFile {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  isOpen?: boolean;
  children?: string[]; // IDs of children files
  // Metadata for info panel
  purpose: string;
  responsibilities: string[];
  imports: string[];
  exports: string[];
  functions: string[];
  classes: string[];
  hooks: string[];
  components: string[];
  complexity: "Low" | "Medium" | "High" | "Critical";
  loc: number;
  dependencies: string[]; // Related file IDs
  dependents: string[];   // File IDs consuming this
  aiSummary: string;
  improvements: string[];
  layer: "Component" | "Hook" | "Service" | "API" | "Database Layer" | "Root";
}

const REPO_EXPLORER_FILES: Record<string, RepoFile> = {
  "src": {
    id: "src",
    name: "src",
    type: "folder",
    path: "src",
    purpose: "Application source files containing code directories, pages, and utilities.",
    responsibilities: ["Core bootstrapping", "Imports organization"],
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    hooks: [],
    components: [],
    complexity: "Medium",
    loc: 2450,
    dependencies: [],
    dependents: [],
    aiSummary: "Main root codebase context containing routing, UI components, custom React hooks, API logic client classes, and business operations.",
    improvements: ["Prune dead configuration variables", "Introduce sub-features packaging"],
    layer: "Root"
  },
  "src-app": {
    id: "src-app",
    name: "App.tsx",
    type: "file",
    path: "src/App.tsx",
    purpose: "Mounts the main application wrapper, initializes state providers and layout contexts.",
    responsibilities: ["Global Providers binding", "Global style imports"],
    imports: ["react", "framer-motion", "src-router", "src-auth-hook"],
    exports: ["App"],
    functions: ["App()"],
    classes: [],
    hooks: ["useAuth"],
    components: ["App", "AuthProvider", "ThemeProvider"],
    complexity: "Low",
    loc: 48,
    dependencies: ["src-router", "src-auth-hook"],
    dependents: [],
    aiSummary: "Initial entry file for mounting CSS styling frameworks, binding Auth0 / Supabase session layers, and injecting routes controller instances.",
    improvements: ["Split large inline ThemeProvider setups to a separate settings class."],
    layer: "Component"
  },
  "src-router": {
    id: "src-router",
    name: "Router.tsx",
    type: "file",
    path: "src/Router.tsx",
    purpose: "Handles route declarations, paths resolution, lazy-loading, and private guard bindings.",
    responsibilities: ["Paths parsing", "Auth gates checks"],
    imports: ["react-router-dom", "src-auth-hook", "src-dashboard-page"],
    exports: ["AppRouter"],
    functions: ["AppRouter()"],
    classes: [],
    hooks: ["useAuth"],
    components: ["AppRouter", "PrivateRoute"],
    complexity: "Medium",
    loc: 84,
    dependencies: ["src-auth-hook", "src-dashboard-page"],
    dependents: ["src-app"],
    aiSummary: "Orchestrator map matching paths configurations with target lazy-loaded layout bundles. Direct dependency on useAuth hooks for private route constraints.",
    improvements: ["Migrate route maps to structural object config parameters rather than JSX markup loops."],
    layer: "Component"
  },
  "src-components": {
    id: "src-components",
    name: "components",
    type: "folder",
    path: "src/components",
    purpose: "Hosts reusable UI elements, common layout widgets, and atomic UI cards.",
    responsibilities: ["Visual rendering", "Data presentation layers"],
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    hooks: [],
    components: [],
    complexity: "Medium",
    loc: 1120,
    dependencies: [],
    dependents: [],
    aiSummary: "Visual modular components directory. Contains layout sidebars, user headers, stats indicators, and list tables.",
    improvements: ["Prune unused design files", "Apply Storybook unit templates."],
    layer: "Component"
  },
  "src-dashboard-comp": {
    id: "src-dashboard-comp",
    name: "Dashboard.tsx",
    type: "file",
    path: "src/components/Dashboard.tsx",
    purpose: "Primary visual widget orchestrating project statistics charts and list states.",
    responsibilities: ["Telemetry grids coordination", "Fetch triggers coordination"],
    imports: ["react", "src-fetch-hook", "src-user-service"],
    exports: ["DashboardView"],
    functions: ["DashboardView()", "calculateMetrics()"],
    classes: [],
    hooks: ["useFetch"],
    components: ["DashboardView", "MetricsCard", "StatsChart"],
    complexity: "High",
    loc: 180,
    dependencies: ["src-fetch-hook", "src-user-service"],
    dependents: ["src-router"],
    aiSummary: "The visual controller coordinates user charts dashboards, fetching metrics via custom useFetch hooks mapping user payloads.",
    improvements: ["Extract calculateMetrics to a separate helper class.", "De-duplicate repeated state callbacks."],
    layer: "Component"
  },
  "src-hooks": {
    id: "src-hooks",
    name: "hooks",
    type: "folder",
    path: "src/hooks",
    purpose: "Directory containing custom stateful react hooks.",
    responsibilities: ["Custom State abstractions", "Side effects management"],
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    hooks: [],
    components: [],
    complexity: "Low",
    loc: 190,
    dependencies: [],
    dependents: [],
    aiSummary: "Encapsulates react hooks abstractions to simplify API query structures and authentication verification bindings.",
    improvements: ["Write unified test mock specs for hooks pipelines."],
    layer: "Hook"
  },
  "src-auth-hook": {
    id: "src-auth-hook",
    name: "useAuth.ts",
    type: "file",
    path: "src/hooks/useAuth.ts",
    purpose: "Monitors active auth sessions tokens, user payloads, login, and signout handlers.",
    responsibilities: ["JWT token storage parsing", "Credentials verification"],
    imports: ["react", "src-api-client"],
    exports: ["useAuth", "AuthProvider"],
    functions: ["useAuth()", "login()", "logout()"],
    classes: [],
    hooks: ["useAuth"],
    components: [],
    complexity: "Medium",
    loc: 72,
    dependencies: ["src-api-client"],
    dependents: ["src-app", "src-router"],
    aiSummary: "Extracts identity logic to local contexts, saving access tokens to browser states and querying Auth payloads.",
    improvements: ["Rotate refresh tokens automatically inside interceptors.", "Clear local caches on user signout."],
    layer: "Hook"
  },
  "src-fetch-hook": {
    id: "src-fetch-hook",
    name: "useFetch.ts",
    type: "file",
    path: "src/hooks/useFetch.ts",
    purpose: "Simple async client hook caching resource calls and mapping JSON responses.",
    responsibilities: ["Queries caching", "Error states mapping"],
    imports: ["react", "src-api-client"],
    exports: ["useFetch"],
    functions: ["useFetch()"],
    classes: [],
    hooks: ["useFetch"],
    components: [],
    complexity: "Low",
    loc: 45,
    dependencies: ["src-api-client"],
    dependents: ["src-dashboard-comp"],
    aiSummary: "General-purpose query wrapper containing caching arrays, retry configs, and request rate-limiting logic.",
    improvements: ["Implement request cancellation handlers using AbortController."],
    layer: "Hook"
  },
  "src-services": {
    id: "src-services",
    name: "services",
    type: "folder",
    path: "src/services",
    purpose: "Hosts business logic layer, payment scripts, and API wrappers.",
    responsibilities: ["Business rules logic", "Gateway integrations routing"],
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    hooks: [],
    components: [],
    complexity: "Medium",
    loc: 540,
    dependencies: [],
    dependents: [],
    aiSummary: "The core service layer managing calculations, storage abstractions, data mapper triggers, and Stripe payment transactions.",
    improvements: ["Prune redundant helper maps.", "Move hardcoded payload strings to configuration environments."],
    layer: "Service"
  },
  "src-user-service": {
    id: "src-user-service",
    name: "userService.ts",
    type: "file",
    path: "src/services/userService.ts",
    purpose: "Executes client operations: password resets, profile audits, and payment cards validation.",
    responsibilities: ["Payloads mapping", "Data transformation checks"],
    imports: ["src-api-client"],
    exports: ["UserService"],
    functions: ["getUserProfile()", "updateProfile()", "validateSubscription()"],
    classes: ["UserServiceClass"],
    hooks: [],
    components: [],
    complexity: "High",
    loc: 130,
    dependencies: ["src-api-client"],
    dependents: ["src-dashboard-comp"],
    aiSummary: "Provides core profile controllers, sanitizing inputs, validating webhook credentials, and sending queries to API clients.",
    improvements: ["Split validation logics to a distinct schema helper.", "Implement retry strategies for transient network drops."],
    layer: "Service"
  },
  "src-api": {
    id: "src-api",
    name: "api",
    type: "folder",
    path: "src/api",
    purpose: "Gateway config containing base interceptors, HTTP mappings, and header injections.",
    responsibilities: ["Axios client instances setup", "Retry logic policies configurations"],
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    hooks: [],
    components: [],
    complexity: "Low",
    loc: 180,
    dependencies: [],
    dependents: [],
    aiSummary: "Manages server client configs, mapping base URLs, handling JWT headers, and routing HTTP exceptions.",
    improvements: ["Remove hardcoded API target URLs.", "Configure telemetry profiling hooks."],
    layer: "API"
  },
  "src-api-client": {
    id: "src-api-client",
    name: "apiClient.ts",
    type: "file",
    path: "src/api/apiClient.ts",
    purpose: "Unified API client with Axios wrapper injecting credentials and logging errors.",
    responsibilities: ["Header injection", "Telemetry logging", "HTTP dispatching"],
    imports: [],
    exports: ["apiClient"],
    functions: ["get()", "post()", "put()", "delete()"],
    classes: ["ApiClientWrapper"],
    hooks: [],
    components: [],
    complexity: "Medium",
    loc: 95,
    dependencies: ["src-db-layer"],
    dependents: ["src-auth-hook", "src-fetch-hook", "src-user-service"],
    aiSummary: "Base HTTP layer providing parameterized request blocks, standard status checks, and token rotations.",
    improvements: ["Implement automated retry policies for 5xx status failures.", "Bind request trace IDs to headers."],
    layer: "API"
  },
  "src-db": {
    id: "src-db",
    name: "database",
    type: "folder",
    path: "src/database",
    purpose: "Database layers configuring PostgreSQL client pools and mapping ORM schemas.",
    responsibilities: ["SQL tables definition", "Entity models definition", "Client connection hooks"],
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    hooks: [],
    components: [],
    complexity: "High",
    loc: 480,
    dependencies: [],
    dependents: [],
    aiSummary: "Encapsulates tables models mapping, row schemas parsing, database connection pooling configurations, and migrators.",
    improvements: ["Enable pooling optimizations.", "Audit row-level access parameters."],
    layer: "Database Layer"
  },
  "src-db-layer": {
    id: "src-db-layer",
    name: "dbClient.ts",
    type: "file",
    path: "src/database/dbClient.ts",
    purpose: "Instantiates connection pools, configures SSL variables, and queries transactional tables.",
    responsibilities: ["Database connection initialization", "Query dispatching"],
    imports: ["pg"],
    exports: ["dbQuery"],
    functions: ["dbQuery()", "getTransactionPool()"],
    classes: ["DatabasePoolManager"],
    hooks: [],
    components: [],
    complexity: "High",
    loc: 110,
    dependencies: [],
    dependents: ["src-api-client"],
    aiSummary: "The foundational layer querying relational pools, mapping response columns, logging SQL latencies, and terminating processes.",
    improvements: ["Implement query caching maps.", "Configure automated connection state monitors."],
    layer: "Database Layer"
  }
};

const UNDERSTAND_REPLAY_STEPS = [
  {
    targetId: "src",
    label: "Step 1: Codebase Entry Root (src/)",
    explainer: "Bootstrapping source root folder directory containing layout contexts, client modules, configuration schemas, and assets."
  },
  {
    targetId: "src-app",
    label: "Step 2: Startup Controller (App.tsx)",
    explainer: "App.tsx handles core startup, binding global providers, mounting React Context parameters, and managing styling files imports."
  },
  {
    targetId: "src-router",
    label: "Step 3: Route Ingress Manager (Router.tsx)",
    explainer: "Routing manager dispatches url paths, lazy loads view pages, checks authentication, and mounts guard gateways."
  },
  {
    targetId: "src-dashboard-comp",
    label: "Step 4: Layout Widget (Dashboard.tsx)",
    explainer: "Dashboard component coordinates primary telemetry widgets, statistics graphs, and layout cards."
  },
  {
    targetId: "src-fetch-hook",
    label: "Step 5: Query Hook (useFetch.ts)",
    explainer: "Dashboard coordinates API query streams and request statuses by calling general-purpose fetching hook useFetch."
  },
  {
    targetId: "src-auth-hook",
    label: "Step 6: Session Tracker (useAuth.ts)",
    explainer: "useAuth evaluates JSON Web Tokens signatures validation, handles cookie storage, and saves state configurations."
  },
  {
    targetId: "src-user-service",
    label: "Step 7: Business Manager (userService.ts)",
    explainer: "userService maps parameters, checks subscription flags, and triggers API clients callbacks."
  },
  {
    targetId: "src-api-client",
    label: "Step 8: Network Gateway (apiClient.ts)",
    explainer: "Base API client parses query strings, serializes payload JSON objects, and handles credentials headers."
  },
  {
    targetId: "src-db-layer",
    label: "Step 9: Database Engine (dbClient.ts)",
    explainer: "Database client validates query configurations, locks subnets pools, queries tables, and returns data payloads."
  }
];

const CODE_QUALITY_ISSUES = [
  { file: "src/components/Dashboard.tsx", smell: "Cyclomatic Complexity (Score: 24)", severity: "High", impact: "Hard to test", recommendation: "Extract statistics mapper routines into static utility functions." },
  { file: "src/services/userService.ts", smell: "Long Module (LOC: 130)", severity: "Medium", impact: "Low readability", recommendation: "Split profile controller methods into separate profile/subscription classes." },
  { file: "src/database/dbClient.ts", smell: "Deep Nesting in Transaction", severity: "High", impact: "Pool leaks risk", recommendation: "Refactor nested transaction promises into await try-catch blocks." },
  { file: "src/Router.tsx", smell: "Hardcoded Route Guards", severity: "Low", impact: "Low flexibility", recommendation: "Move routing definitions to a JSON configuration model." }
];

const COMPLIANCE_SECURITY_ITEMS = [
  { title: "Circular Dependency Detected", details: "src/hooks/useAuth.ts âž” src/api/apiClient.ts âž” src/hooks/useAuth.ts", type: "Circular dependency" },
  { title: "Unused imports inside Router.tsx", details: "import { AlertCircle } from 'lucide-react' is unused", type: "Dead imports" },
  { title: "Duplicate mapping utility functions", details: "formatDate() exists inside both helpers.ts and format.ts", type: "Redundancy" },
  { title: "Unprotected database credentials", details: "SSL fallback allowed without strict environment variables requirements", type: "Security Risk" }
];

export function RepoAnalyzerPage() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const aiQueue = useAIQueue();
  
  const [repoUrl, setRepoUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [finishedLoading, setFinishedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [repoFiles, setRepoFiles] = useState<Record<string, RepoFile>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Explorer states
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [hoveredFileId, setHoveredFileId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({
    "src": false,
    "src-components": false,
    "src-hooks": false,
    "src-services": false,
    "src-api": false,
    "src-db": false
  });

  // Replay walkthrough engine state
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayStepIndex, setReplayStepIndex] = useState(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1500); // ms

  const projectId = searchParams.get("projectId");

  // Load project repo spec if exists
  useEffect(() => {
    if (!projectId) return;
    async function loadProjectRepo() {
      const { data, error } = await supabase
        .from("projects")
        .select("description")
        .eq("id", projectId)
        .maybeSingle();
      if (error) console.warn("Failed to load project repo:", error);
    }
    loadProjectRepo();
  }, [projectId]);

  // Understand walkthrough timing loop
  useEffect(() => {
    if (!isReplaying) return;
    const interval = setInterval(() => {
      setReplayStepIndex((prev) => {
        if (prev >= UNDERSTAND_REPLAY_STEPS.length - 1) {
          setIsReplaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);
    return () => clearInterval(interval);
  }, [isReplaying, playbackSpeed]);

  const handleStartReplay = () => {
    setIsReplaying(true);
    setReplayStepIndex(0);
  };

  const handlePauseReplay = () => {
    setIsReplaying(false);
  };

  const handleStepReplay = () => {
    setIsReplaying(false);
    setReplayStepIndex((prev) => (prev >= UNDERSTAND_REPLAY_STEPS.length - 1 ? 0 : prev + 1));
  };

  const handleResetReplay = () => {
    setIsReplaying(false);
    setReplayStepIndex(-1);
  };

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) return;
    setError(null);
    setGenerating(true);
    setFinishedLoading(false);
    setReport(null);
    setRepoFiles({});

    try {
      const data = await aiQueue.enqueue('analyze-repository', repoUrl, { prompt: repoUrl });
      if (!data.analysis) throw new Error("No analysis returned from AI.");

      const analysis = data.analysis;

      // Build repoFiles map from AI-generated files list
      if (Array.isArray(analysis.files) && analysis.files.length > 0) {
        const filesMap: Record<string, RepoFile> = {};
        analysis.files.forEach((f: any) => {
          if (f.id) filesMap[f.id] = f as RepoFile;
        });
        setRepoFiles(filesMap);
      }

      setReport(analysis);
      setFinishedLoading(true);
      setGenerating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze repository.");
      setGenerating(false);
    }
  };

  const toggleFolder = (id: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const activeFile = useMemo(() => {
    if (!selectedFileId) return null;
    return repoFiles[selectedFileId] ?? null;
  }, [selectedFileId, repoFiles]);

  const replayActiveId = useMemo(() => {
    if (replayStepIndex >= 0 && replayStepIndex < UNDERSTAND_REPLAY_STEPS.length) {
      return UNDERSTAND_REPLAY_STEPS[replayStepIndex].targetId;
    }
    return null;
  }, [replayStepIndex]);

  return (
    <div className="relative w-full px-5 py-6 lg:px-8 overflow-hidden min-h-screen">
      {/* Page-level white tilted grid background */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"
        style={{ transform: "rotate(-12deg) scale(2.2)", transformOrigin: "center center" }}
      />
      <PageHeader
        title="Repository Analyzer"
        description="Connect any public GitHub repository to map dependencies, detect code smells, and scan structure vulnerabilities."
      />

      {/* ── TOP REPOSITORY LINK INPUT BOX ── */}
      <div className="mt-6">
        <div 
          className="relative rounded-[28px] overflow-hidden border border-white/[0.04] p-5 sm:p-6 transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] group hover:border-white/10 text-left"
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

          {/* Cyan/sky/blue glow effect */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2/3 z-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-90 opacity-80"
            style={{
              background: `
                radial-gradient(ellipse at bottom right, rgba(6, 182, 212, 0.45) -10%, rgba(6, 182, 212, 0) 70%),
                radial-gradient(ellipse at bottom left, rgba(56, 189, 248, 0.45) -10%, rgba(56, 189, 248, 0) 70%)
              `,
              filter: "blur(30px)",
            }}
          />

          {/* Central blue glow */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2/3 z-21 pointer-events-none transition-opacity duration-300 group-hover:opacity-85 opacity-75"
            style={{
              background: `
                radial-gradient(circle at bottom center, rgba(59, 130, 246, 0.3) -20%, rgba(56, 189, 248, 0.25) 30%, rgba(56, 189, 248, 0) 70%)
              `,
              filter: "blur(35px)",
            }}
          />

          {/* Tilted Grid background overlay */}
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0"
            style={{ transform: "rotate(-12deg) scale(1.6)", transformOrigin: "center center" }}
          />

          {/* Large Background Icon Watermark */}
          <GitBranch className="absolute bottom-[-24px] right-[-24px] z-10 opacity-[0.03] group-hover:opacity-[0.05] pointer-events-none select-none text-cyan-400 w-36 h-36 transform rotate-[-5deg] group-hover:rotate-[-15deg] group-hover:scale-110 transition-all duration-300" />

          {/* Bottom border line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] z-25 transition-opacity duration-300 group-hover:opacity-100 opacity-90"
            style={{
              background: "linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.05) 100%)",
            }}
          />

          {/* Content wrapper */}
          <div className="relative z-30 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
              <span className="text-base font-bold text-white">
                Enter GitHub Repository Details
              </span>
            </div>
            <div className="flex gap-3 flex-col sm:flex-row">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAnalyze();
                  }
                }}
                placeholder="e.g. https://github.com/facebook/react or username/repository"
                className="flex-grow rounded-xl border border-white/10 bg-neutral-900/90 px-4 py-3.5 text-base text-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 font-sans"
                disabled={generating}
              />
              <Button
                variant="gradient"
                onClick={handleAnalyze}
                disabled={!repoUrl.trim() || generating}
                className="shrink-0 font-semibold text-base h-11 px-6"
              >
                {generating ? "Analyzing..." : "Analyze Repo"}
              </Button>
            </div>
            <p className="text-sm font-medium text-neutral-400">
              Supports public GitHub repository links. Maps source directory structure, identifies dependencies, and audits code smells.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {generating && !finishedLoading ? (
          <div className="mt-8 py-12 bg-transparent border-none">
            <AILoader isFinished={false} />
          </div>
        ) : report ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-8"
          >
            {/* 1. Health Dashboard Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 flex items-center gap-1"><Award className="h-3 w-3" /> Health Score</span>
                <span className="text-3xl font-heading font-black text-white mt-1">{report.score}%</span>
                <Badge variant="outline" className={cn("text-[9px] font-bold mt-1",
                  report.score >= 80 ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
                  report.score >= 60 ? "bg-warning-500/10 border-warning-500/20 text-warning-400" :
                  "bg-danger-500/10 border-danger-500/20 text-danger-400"
                )}>
                  {report.score >= 80 ? "Excellent" : report.score >= 60 ? "Moderate" : "Needs Work"}
                </Badge>
              </div>

              {[
                { label: "Maintainability Index", val: report.maintainability, status: report.maintainability >= 80 ? "High" : report.maintainability >= 60 ? "Moderate" : "Low" },
                { label: "Architecture Integrity", val: report.architecture, status: report.architecture >= 80 ? "Clean" : report.architecture >= 60 ? "Moderate" : "Fragmented" },
                { label: "Test Coverage", val: report.testCoverage, status: report.testCoverage >= 70 ? "Good" : report.testCoverage >= 40 ? "Partial" : "Needs Work" },
                { label: "Documentation Index", val: report.documentation, status: report.documentation >= 70 ? "Good" : report.documentation >= 40 ? "Partial" : "Poor" }
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col justify-between text-left">
                  <div>
                    <span className="text-[9.5px] uppercase font-bold tracking-wider text-neutral-500">{m.label}</span>
                    <span className="text-xl font-heading font-extrabold text-white block mt-1">{m.val}%</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden">
                      <div className={cn("h-full", m.val >= 70 ? "bg-primary-500" : m.val >= 40 ? "bg-warning-500" : "bg-danger-500")} style={{ width: `${m.val}%` }} />
                    </div>
                    <span className="text-[9px] text-neutral-500 font-bold block">{m.status}</span>
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col justify-center text-left">
                <span className="text-[9.5px] uppercase font-bold tracking-wider text-warning-400">Technical Debt</span>
                <span className="text-xl font-heading font-extrabold text-white mt-1">~{report.technicalDebt} Days</span>
                <span className="text-[9px] text-neutral-500 mt-1 block">estimated refactoring logs</span>
              </div>
            </div>

            {/* 2. Walkthrough Exploration Controls bar */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-left flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] font-bold bg-primary-500/10 border-primary-500/20 text-primary-400">Walkthrough Replay</Badge>
                  <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-200">Interactive Architecture Replay</h3>
                </div>
                <p className="text-[10.5px] text-neutral-500">Trace layers workflow mapping from components routing queries to database connection pools.</p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetReplay}
                  className="flex items-center gap-1 h-8 text-[11px]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>

                {isReplaying ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePauseReplay}
                    className="flex items-center gap-1 h-8 text-[11px]"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={handleStartReplay}
                    className="flex items-center gap-1 h-8 text-[11px]"
                  >
                    <Play className="h-3.5 w-3.5" />
                    ðŸ§  Understand Repository
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStepReplay}
                  className="flex items-center gap-1 h-8 text-[11px]"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Next Step
                </Button>
              </div>
            </div>

            {/* Replay Console Log */}
            {replayStepIndex >= 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-950 border border-primary-500/20 rounded-xl p-4 text-left flex gap-3 text-xs"
              >
                <Zap className="h-5 w-5 text-primary-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white font-mono">{UNDERSTAND_REPLAY_STEPS[replayStepIndex].label}</span>
                  <p className="text-neutral-450 leading-relaxed">{UNDERSTAND_REPLAY_STEPS[replayStepIndex].explainer}</p>
                </div>
              </motion.div>
            )}

            {/* 3. Hero Repository Explorer Visualization Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 border border-neutral-800 rounded-xl overflow-hidden min-h-[750px] bg-neutral-950">
              {/* Left Side: Directory Folder Tree Explorer */}
              <div className="lg:col-span-4 border-r border-neutral-800 p-4 text-left overflow-y-auto max-h-[780px]">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-850 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                    <FolderTree className="h-3.5 w-3.5 text-neutral-500" /> Directory tree
                  </span>
                  <span className="text-[9px] text-neutral-600">Select file to inspect profile</span>
                </div>

                <div className="space-y-1 text-xs select-none">
                  {Object.keys(repoFiles).length > 0 ? (
                    // Dynamic tree: group files by folder layer, render folders then files
                    (() => {
                      const folders = Object.values(repoFiles).filter(f => f.type === "folder");
                      const rootFiles = Object.values(repoFiles).filter(f => f.type === "file" && !Object.values(repoFiles).some(folder => folder.children?.includes(f.id)));
                      const renderFile = (file: RepoFile) => (
                        <div
                          key={file.id}
                          onClick={() => setSelectedFileId(file.id)}
                          onMouseEnter={() => setHoveredFileId(file.id)}
                          onMouseLeave={() => setHoveredFileId(null)}
                          className={cn(
                            "flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors",
                            selectedFileId === file.id && "bg-primary-500/10 text-white border border-primary-500/20",
                            selectedFileId !== file.id && "hover:bg-neutral-900/60 text-neutral-400"
                          )}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <FileCode className={cn("h-3.5 w-3.5 shrink-0",
                              file.complexity === "High" || file.complexity === "Critical" ? "text-danger-400" :
                              file.complexity === "Medium" ? "text-warning-400" : "text-indigo-400"
                            )} />
                            <span className="truncate">{file.name}</span>
                          </span>
                          <Badge variant="outline" className={cn(
                            "text-[8px] scale-90 border-neutral-800 text-neutral-500 uppercase shrink-0",
                            file.complexity === "High" && "border-danger-500/20 text-danger-400",
                            file.complexity === "Critical" && "border-danger-500/20 text-danger-400"
                          )}>
                            {file.loc > 0 ? `LOC: ${file.loc}` : file.complexity}
                          </Badge>
                        </div>
                      );

                      return (
                        <>
                          {folders.map(folder => (
                            <div key={folder.id}>
                              <div
                                onClick={() => toggleFolder(folder.id)}
                                className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-neutral-900 cursor-pointer text-neutral-300 font-semibold"
                              >
                                {collapsedFolders[folder.id] ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                <span>{folder.name}/</span>
                              </div>
                              {!collapsedFolders[folder.id] && (
                                <div className="pl-4 space-y-1 border-l border-neutral-850 ml-3">
                                  {(folder.children ?? []).map(childId => {
                                    const child = repoFiles[childId];
                                    return child ? renderFile(child) : null;
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                          {rootFiles.map(renderFile)}
                        </>
                      );
                    })()
                  ) : (
                    <div className="py-8 text-center space-y-2">
                      <FolderTree className="h-8 w-8 text-neutral-700 mx-auto" />
                      <p className="text-xs text-neutral-600">Analyze a repository to explore its file structure.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Dependency Explorer Canvas */}


              <div className="lg:col-span-8 relative overflow-hidden bg-neutral-950 p-4">
                <div className="absolute left-4 top-4 z-10 text-left">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">Codebase Modules Dependency graph</h4>
                  <p className="text-[9.5px] text-neutral-500">Shows relationships from components down to database layers. Active paths show directional arrows flow.</p>
                </div>

                <div className="overflow-x-auto h-full flex items-center justify-center">
                  <svg className="w-full h-[680px]" style={{ minWidth: "850px" }}>
                    <defs>
                      <pattern id="repo-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#161619" strokeWidth="1" />
                      </pattern>
                      <marker id="arrow-blue" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                      </marker>
                      <marker id="arrow-gray" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#27272a" />
                      </marker>
                    </defs>

                    <rect width="100%" height="100%" fill="url(#repo-grid)" />

                    {/* Nodes configuration */}
                    {[
                      { id: "src-app", name: "App.tsx", col: 1, row: 1, type: "Component" },
                      { id: "src-router", name: "Router.tsx", col: 1, row: 2, type: "Component" },
                      { id: "src-dashboard-comp", name: "Dashboard.tsx", col: 2, row: 2, type: "Component" },
                      { id: "src-auth-hook", name: "useAuth.ts", col: 3, row: 1, type: "Hook" },
                      { id: "src-fetch-hook", name: "useFetch.ts", col: 3, row: 2, type: "Hook" },
                      { id: "src-user-service", name: "userService.ts", col: 4, row: 2, type: "Service" },
                      { id: "src-api-client", name: "apiClient.ts", col: 5, row: 2, type: "API" },
                      { id: "src-db-layer", name: "dbClient.ts", col: 6, row: 2, type: "Database Layer" }
                    ].map((node) => {
                      const xCoord = 50 + (node.col - 1) * 130;
                      const yCoord = 120 + (node.row - 1) * 160;

                      // Check highlights
                      const isActiveReplay = replayActiveId === node.id;
                      const isHovered = hoveredFileId === node.id;
                      const isSelected = selectedFileId === node.id;

                      const hasDirectDepHighlight = hoveredFileId !== null && 
                        (REPO_EXPLORER_FILES[hoveredFileId]?.dependencies.includes(node.id) || 
                         REPO_EXPLORER_FILES[hoveredFileId]?.dependents.includes(node.id));

                      const outlineColor = isSelected ? "#3b82f6" : isActiveReplay ? "#eab308" : isHovered ? "#60a5fa" : hasDirectDepHighlight ? "#2563eb" : "#27272a";
                      const fillBg = isSelected ? "#1e3a8a" : isActiveReplay ? "#713f12" : "#111827";

                      // Trace edges to target dependencies
                      const nodeData = REPO_EXPLORER_FILES[node.id];
                      const edgeList = nodeData ? nodeData.dependencies : [];

                      return (
                        <g key={node.id}>
                          {/* Draw connections */}
                          {edgeList.map((depId) => {
                            const targetNode = REPO_EXPLORER_FILES[depId];
                            if (!targetNode) return null;

                            // Calculate target column/row coords
                            const tNodeConfig = [
                              { id: "src-app", col: 1, row: 1 },
                              { id: "src-router", col: 1, row: 2 },
                              { id: "src-dashboard-comp", col: 2, row: 2 },
                              { id: "src-auth-hook", col: 3, row: 1 },
                              { id: "src-fetch-hook", col: 3, row: 2 },
                              { id: "src-user-service", col: 4, row: 2 },
                              { id: "src-api-client", col: 5, row: 2 },
                              { id: "src-db-layer", col: 6, row: 2 }
                            ].find(t => t.id === depId);

                            if (!tNodeConfig) return null;

                            const txCoord = 50 + (tNodeConfig.col - 1) * 130;
                            const tyCoord = 120 + (tNodeConfig.row - 1) * 160;

                            const isEdgeHighlighted = isHovered || hoveredFileId === depId || isActiveReplay;

                            return (
                              <g key={`${node.id}-${depId}`}>
                                <path
                                  d={`M ${xCoord + 55} ${yCoord + 25} C ${(xCoord + txCoord) / 2} ${yCoord + 25}, ${(xCoord + txCoord) / 2} ${tyCoord + 25}, ${txCoord} ${tyCoord + 25}`}
                                  fill="none"
                                  stroke={isEdgeHighlighted ? "#3b82f6" : "#1f1f23"}
                                  strokeWidth={isEdgeHighlighted ? 2 : 1}
                                  markerEnd={isEdgeHighlighted ? "url(#arrow-blue)" : "url(#arrow-gray)"}
                                  className="transition-colors duration-350"
                                />
                              </g>
                            );
                          })}

                          {/* Render node box */}
                          <g
                            transform={`translate(${xCoord}, ${yCoord})`}
                            onClick={() => setSelectedFileId(node.id)}
                            onMouseEnter={() => setHoveredFileId(node.id)}
                            onMouseLeave={() => setHoveredFileId(null)}
                            className="cursor-pointer transition-transform duration-200 hover:scale-105"
                          >
                            <rect
                              width="110"
                              height="50"
                              rx="6"
                              fill={fillBg}
                              stroke={outlineColor}
                              strokeWidth={isSelected || isActiveReplay || isHovered ? 2 : 1.2}
                            />
                            <text x="10" y="22" fill="#ffffff" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">{node.name}</text>
                            <text x="10" y="38" fill="#71717a" fontSize="7.5" fontFamily="monospace">{node.type.toUpperCase()}</text>

                            {/* Flash dot during active replay exploration */}
                            {isActiveReplay && (
                              <circle cx="95" cy="12" r="3" fill="#eab308" className="animate-ping" />
                            )}
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>

            {/* 4. Architecture Detection explanation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 md:col-span-2 text-left space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">Detected System Architecture Model</h3>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-bold uppercase">Layered Monolith (Clean Architecture Patterns)</Badge>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans pt-1">
                  {report.summary}
                </p>
                {report.framework && (
                  <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-850 text-[11px] leading-relaxed text-neutral-400">
                    <span className="font-bold text-neutral-300">Framework / Primary Language:</span> {report.framework} Â· {report.primaryLanguage} Â· ~{report.totalFiles?.toLocaleString() ?? "N/A"} files Â· ~{report.totalLoc?.toLocaleString() ?? "N/A"} LOC
                  </div>
                )}
              </div>

              {/* Folder statistics */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 md:col-span-1 text-left space-y-4">
                <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">Folder Codebase Telemetry</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-neutral-900/60 border border-neutral-850 rounded-lg">
                    <span className="text-neutral-500 text-[10px] uppercase font-bold block">Total Files</span>
                    <span className="text-sm font-bold text-white mt-1 block">{report.totalFiles?.toLocaleString() ?? "â€”"}</span>
                  </div>
                  <div className="p-3.5 bg-neutral-900/60 border border-neutral-850 rounded-lg">
                    <span className="text-neutral-500 text-[10px] uppercase font-bold block">Lines of Code</span>
                    <span className="text-sm font-bold text-white mt-1 block">{report.totalLoc?.toLocaleString() ?? "â€”"}</span>
                  </div>
                  <div className="p-3.5 bg-neutral-900/60 border border-neutral-850 rounded-lg">
                    <span className="text-neutral-500 text-[10px] uppercase font-bold block">Primary Language</span>
                    <span className="text-[11px] font-bold text-white mt-1 block truncate">{report.primaryLanguage ?? "â€”"}</span>
                  </div>
                  <div className="p-3.5 bg-neutral-900/60 border border-neutral-850 rounded-lg">
                    <span className="text-neutral-500 text-[10px] uppercase font-bold block">Complexity</span>
                    <span className={cn("text-sm font-bold mt-1 block",
                      report.complexity === "Low" ? "text-emerald-400" :
                      report.complexity === "Medium" ? "text-warning-400" :
                      "text-danger-400"
                    )}>{report.complexity ?? "â€”"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Additional workspace tabs details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dependency checks - uses real AI data */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-left space-y-4">
                <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">Dependencies Integrity Audit</h3>
                <div className="space-y-2">
                  {(report.circularDeps?.length > 0 ? report.circularDeps : []).length > 0 ? (
                    report.circularDeps.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-neutral-900/70 border border-neutral-850 rounded-lg space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-xs text-white">{item.title}</span>
                          <Badge variant="outline" className="text-[8px] border-warning-500/20 text-warning-400 bg-warning-500/5">{item.type}</Badge>
                        </div>
                        <p className="text-[11px] text-neutral-450 font-mono leading-relaxed">{item.details}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-600 italic py-2">No circular dependencies detected, or analyze a repository to check.</p>
                  )}
                </div>
              </div>

              {/* Code Quality Refactoring Opportunities - uses real AI data */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-left space-y-4">
                <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">Refactoring &amp; Code Quality Registry</h3>
                <div className="space-y-2">
                  {(report.codeSmells?.length > 0 ? report.codeSmells : []).length > 0 ? (
                    report.codeSmells.map((item: any, idx: number) => (
                      <div key={idx} className="p-3.5 bg-neutral-900/70 border border-neutral-850 rounded-lg space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-neutral-200 truncate max-w-[220px]">{item.file}</span>
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-bold uppercase",
                            (item.severity === "High" || item.severity === "Critical") && "bg-danger-500/10 border-danger-500/20 text-danger-400",
                            item.severity === "Medium" && "bg-warning-500/10 border-warning-500/20 text-warning-400",
                            item.severity === "Low" && "bg-primary-500/10 border-primary-500/20 text-primary-400"
                          )}>{item.severity} Smell</Badge>
                        </div>
                        <div className="text-[11px] text-neutral-400 flex justify-between gap-2">
                          <span>Smell: {item.smell}</span>
                          <span className="text-[10px] text-neutral-500 italic shrink-0">{item.impact}</span>
                        </div>
                        <div className="text-[11px] text-primary-300 bg-neutral-950 p-2 rounded leading-normal">
                          Remediation: {item.recommendation}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-600 italic py-2">Analyze a repository to detect code quality issues.</p>
                  )}
                </div>
              </div>
            </div>

            {/* 6. Executive Report Summary */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-left space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-neutral-850 pb-4 text-center">
                <h3 className="font-heading text-base font-black text-white">SYSTEM DEVELOPMENT &amp; CODEBASE QUALITY REPORT</h3>
                <p className="text-[9.5px] text-neutral-500 font-mono mt-1">Generated by DevCanvas Code Intelligence. Private &amp; Confidential.</p>
              </div>

              <div className="space-y-4 text-xs text-neutral-300 leading-relaxed font-sans">
                <section className="space-y-1">
                  <h4 className="font-heading font-bold text-neutral-200">1. Executive Summary</h4>
                  <p>{report.summary}</p>
                </section>
                {report.layers?.length > 0 && (
                  <section className="space-y-1">
                    <h4 className="font-heading font-bold text-neutral-200">2. Architecture Layer Overview</h4>
                    <ul className="list-disc pl-4 space-y-1 text-neutral-450">
                      {report.layers.map((layer: any, i: number) => (
                        <li key={i}><span className="text-neutral-300 font-semibold">{layer.name}:</span> {layer.purpose}</li>
                      ))}
                    </ul>
                  </section>
                )}
                {report.recommendations && (
                  <section className="space-y-2">
                    <h4 className="font-heading font-bold text-neutral-200">3. Actionable Remediations Checklist</h4>
                    {report.recommendations.immediate?.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-danger-400 uppercase tracking-wider">Immediate</span>
                        <ul className="list-disc pl-4 space-y-1 text-neutral-450 mt-1">
                          {report.recommendations.immediate.map((r: string, i: number) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                    {report.recommendations.shortTerm?.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-warning-400 uppercase tracking-wider">Short Term</span>
                        <ul className="list-disc pl-4 space-y-1 text-neutral-450 mt-1">
                          {report.recommendations.shortTerm.map((r: string, i: number) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                    {report.recommendations.longTerm?.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">Long Term</span>
                        <ul className="list-disc pl-4 space-y-1 text-neutral-450 mt-1">
                          {report.recommendations.longTerm.map((r: string, i: number) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                  </section>
                )}
                {report.githubMeta && (
                  <section className="space-y-1 border-t border-neutral-850 pt-4">
                    <h4 className="font-heading font-bold text-neutral-200">4. Repository Metadata</h4>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div><span className="text-neutral-500">Owner:</span> <span className="text-neutral-300">{report.githubMeta.owner}</span></div>
                      <div><span className="text-neutral-500">Repo:</span> <span className="text-neutral-300">{report.githubMeta.repo}</span></div>
                      <div><span className="text-neutral-500">Stars:</span> <span className="text-neutral-300">{report.githubMeta.stars?.toLocaleString() ?? "â€”"}</span></div>
                      <div><span className="text-neutral-500">Forks:</span> <span className="text-neutral-300">{report.githubMeta.forks?.toLocaleString() ?? "â€”"}</span></div>
                      {report.githubMeta.topics?.length > 0 && (
                        <div className="col-span-2"><span className="text-neutral-500">Topics:</span> <span className="text-neutral-300">{report.githubMeta.topics.join(", ")}</span></div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>

          </motion.div>
        ) : !generating ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-left space-y-6"
          >
            <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-4">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <GitBranch className="h-10 w-10 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-sans font-bold text-white tracking-normal">Enter a repository link to inspect codebase structure</h3>
                <p className="text-xs text-neutral-400 max-w-md leading-relaxed">Provide a public GitHub link above to calculate quality metrics, build interactive dependency trees, map modular layer workflows, and audit code smell indices.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Interactive Dependency Maps", desc: "Visualize components pipelines relationships from layout levels down to transaction connection pools.", icon: Cpu },
                { title: "Understand Walkthroughs", desc: "Step through execution flows step-by-step with synchronized AI explanations describing each module's responsibility.", icon: Play },
                { title: "Code Smells & Complexity", desc: "Audit cyclomatic index warnings, circular dependencies paths, dead codes imports, and duplicate functions.", icon: ShieldAlert },
                { title: "Technical Debt Estimation", desc: "Calculate overall maintainability scores, test coverage scopes, and estimate hours required to clean legacys.", icon: Clock }
              ].map((f, idx) => (
                <div key={idx} className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-5 space-y-3">
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-850 text-emerald-400 w-fit">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-sans font-extrabold text-neutral-200 uppercase tracking-widest leading-normal">{f.title}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Floating File Details Modal Dialog */}
      <Dialog open={!!activeFile} onOpenChange={(open) => { if (!open) setSelectedFileId(null); }}>
        <DialogContent className="max-w-2xl bg-neutral-900 border border-neutral-850 text-neutral-200 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-neutral-850 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg border border-neutral-800 text-primary-400 bg-primary-500/10">
                <FileCode className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="font-heading text-lg font-bold text-white leading-tight">
                  {activeFile?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-455 mt-0.5">
                  Path: {activeFile?.path}
                </DialogDescription>
              </div>
            </div>
            {activeFile && (
              <Badge variant="outline" className={cn(
                "text-xs font-semibold px-2 py-0.5 uppercase",
                activeFile.complexity === "Critical" && "bg-danger-500/10 border-danger-500/20 text-danger-400",
                activeFile.complexity === "High" && "bg-orange-500/10 border-orange-500/20 text-orange-400",
                activeFile.complexity === "Medium" && "bg-warning-500/10 border-warning-500/20 text-warning-400",
                activeFile.complexity === "Low" && "bg-primary-500/10 border-primary-500/20 text-primary-400"
              )}>
                {activeFile.complexity} Complexity
              </Badge>
            )}
          </DialogHeader>

          {activeFile && (
            <div className="mt-4 space-y-4 text-xs text-left">
              {/* Purpose */}
              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-850 space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">File Purpose</span>
                <p className="text-neutral-300 leading-relaxed font-sans">{activeFile.purpose}</p>
              </div>

              {/* Responsibilities */}
              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-850 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">Responsibilities</span>
                <ul className="list-disc pl-4 space-y-1 text-neutral-350">
                  {activeFile.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Imports / Exports list */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-850 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">Imports</span>
                  <div className="flex flex-wrap gap-1">
                    {activeFile.imports.length > 0 ? (
                      activeFile.imports.map((imp, idx) => (
                        <Badge key={idx} variant="outline" className="text-[9px] bg-neutral-900 border-neutral-800 text-neutral-400">{imp}</Badge>
                      ))
                    ) : (
                      <span className="text-neutral-600 italic">None</span>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-850 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">Exports</span>
                  <div className="flex flex-wrap gap-1">
                    {activeFile.exports.length > 0 ? (
                      activeFile.exports.map((exp, idx) => (
                        <Badge key={idx} variant="outline" className="text-[9px] bg-neutral-900 border-neutral-800 text-neutral-400">{exp}</Badge>
                      ))
                    ) : (
                      <span className="text-neutral-600 italic">None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Functions, classes, hooks */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850">
                  <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">Functions</span>
                  <span className="text-neutral-300 font-mono text-[10.5px] mt-1 block">{activeFile.functions.join(", ") || "None"}</span>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850">
                  <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">Classes</span>
                  <span className="text-neutral-300 font-mono text-[10.5px] mt-1 block">{activeFile.classes.join(", ") || "None"}</span>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850">
                  <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">Custom Hooks</span>
                  <span className="text-neutral-300 font-mono text-[10.5px] mt-1 block">{activeFile.hooks.join(", ") || "None"}</span>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-850 space-y-2">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">AI Codebase context summary</span>
                <div className="flex gap-2 text-xs text-neutral-300 leading-relaxed leading-normal">
                  <Sparkles className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
                  <p>{activeFile.aiSummary}</p>
                </div>
              </div>

              {/* Potential improvements */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-2">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">Potential Improvements &amp; Refactoring</span>
                <ul className="list-disc pl-4 space-y-1 text-neutral-350">
                  {activeFile.improvements.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>

              {/* Statistics */}
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 text-neutral-450 flex justify-between text-[11px]">
                <span>Lines of Code (LOC): <strong className="text-white">{activeFile.loc} lines</strong></span>
                <span>Layer: <strong className="text-white">{activeFile.layer}</strong></span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
