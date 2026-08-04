import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Boxes,
  Database,
  Code2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Users,
  Compass,
  FileText,
  Rocket,
  Plus,
} from "lucide-react";
import { Button, Badge } from "@ui/index";
import { useCreateProject } from "@/lib/queries/projects";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useAIQueue } from "@/lib/ai-queue-context";
import { cn } from "@utils/cn";
import { Graph } from "@/lib/algorithms";

// ── Streamlined 4-Step Wizard Config ────────────────────────
interface StepDef {
  id: number;
  label: string;
  desc: string;
  icon: any;
}

const WIZARD_STEPS: StepDef[] = [
  { id: 1, label: "Basics", desc: "Project name & category", icon: Compass },
  { id: 2, label: "Roles & Features", desc: "Target audience & capabilities", icon: Users },
  { id: 3, label: "Tech Stack", desc: "Frameworks & database engine", icon: Code2 },
  { id: 4, label: "Generate Blueprint", desc: "Review & AI Artifact Generation", icon: Sparkles },
];

const PRESETS = [
  { name: "SaaS Platform", cat: "SaaS", desc: "Multi-tenant B2B subscription portal with dashboards & RBAC." },
  { name: "E-Commerce System", cat: "E-commerce", desc: "Digital storefront with Stripe billing, shopping carts, & orders." },
  { name: "Health Analytics", cat: "Healthcare", desc: "Patient data portals, HIPAA compliance audits, & reports." },
  { name: "AI Workspace", cat: "Artificial Intelligence", desc: "LLM agent workspace with prompt engineering & webhooks." },
];

const PRESET_ROLES = ["Customer", "Admin", "Vendor", "Manager", "Support Agent", "Guest"];
const PRESET_FEATURES = [
  "Authentication & JWT",
  "Stripe Billing",
  "Dashboard Analytics",
  "Real-time Chat",
  "File Storage & Uploads",
  "REST & OpenAPI Specs",
];

const GENERATE_STEPS = [
  { key: "architecture", label: "System Architecture", field: "architecture", endpoint: "generate-architecture", bodyFn: (p: string) => ({ prompt: p }), responseFn: (d: any) => d.architecture },
  { key: "database", label: "Database Schema", field: "database_schema", endpoint: "generate-database-schema", bodyFn: (p: string) => ({ prompt: p, dialect: "postgresql" }), responseFn: (d: any) => d.schema },
  { key: "api", label: "API Specification", field: "api_spec", endpoint: "generate-api-spec", bodyFn: (p: string) => ({ prompt: p }), responseFn: (d: any) => d.spec },
  { key: "security", label: "Security Report", field: "security_report", endpoint: "analyze-security", bodyFn: (p: string) => ({ prompt: p }), responseFn: (d: any) => d.analysis },
  { key: "documentation", label: "Documentation Suite", field: "documentation", endpoint: "generate-documentation", bodyFn: (p: string) => ({ prompt: p }), responseFn: (d: any) => d.doc },
  { key: "deployment", label: "Deployment CI/CD", field: "deployment_plan", endpoint: "generate-deployment-plan", bodyFn: (p: string) => ({ prompt: p }), responseFn: (d: any) => d.plan },
];

export function NewProjectPage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const { session } = useAuth();
  const aiQueue = useAIQueue();

  const [currentStep, setCurrentStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingStepLabel, setGeneratingStepLabel] = useState("");
  const [autoGenerateAll, setAutoGenerateAll] = useState(true);

  // Creation Mode
  const [creationMode, setCreationMode] = useState<"wizard" | "direct">("wizard");
  const [directPrompt, setDirectPrompt] = useState("");

  // ── Step State Values ───────────────────────────────────────
  const [projectName, setProjectName] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [category, setCategory] = useState("SaaS");
  const [problemSolved, setProblemSolved] = useState("");
  const [targetUsers, setTargetUsers] = useState("");

  // Roles & Features
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Customer", "Admin"]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["Authentication & JWT", "Stripe Billing"]);

  // Tech Stack
  const [stackFrontend, setStackFrontend] = useState("React 18 (Vite)");
  const [stackBackend, setStackBackend] = useState("Node.js / Express");
  const [stackDatabase, setStackDatabase] = useState("PostgreSQL");
  const [stackCloud, setStackCloud] = useState("AWS / Docker");

  // Load local draft
  useEffect(() => {
    const saved = localStorage.getItem("devcanvas_wizard_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.projectName) setProjectName(parsed.projectName);
        if (parsed.shortDesc) setShortDesc(parsed.shortDesc);
        if (parsed.category) setCategory(parsed.category);
      } catch (e) {
        console.error("Failed to load cached draft", e);
      }
    }
  }, []);

  const triggerDraftSave = () => {
    const draft = { projectName, shortDesc, category };
    localStorage.setItem("devcanvas_wizard_draft", JSON.stringify(draft));
  };

  // Helper function to execute AI artifact generation pipeline
  const runArtifactPipeline = async (projectId: string, promptText: string) => {
    const updates: Record<string, any> = {};
    const input = promptText.trim() || `${projectName}: ${shortDesc} (${category})`;

    setGeneratingStepLabel("Initializing dependency graph...");
    
    // Construct a Directed Acyclic Graph representing generator dependencies
    const g = new Graph<typeof GENERATE_STEPS[0]>();
    GENE_STEPS_LOOP: GENERATE_STEPS.forEach((step) => g.addNode(step.key, step));

    // Define generator dependencies: Architecture -> Database -> API -> Security -> Documentation -> Deployment
    g.addEdge("architecture", "database");
    g.addEdge("database", "api");
    g.addEdge("api", "security");
    g.addEdge("security", "documentation");
    g.addEdge("documentation", "deployment");

    // Perform Topological Sort to schedule generator tasks in correct sequence
    let sortedOrder: string[];
    try {
      sortedOrder = g.topologicalSort();
    } catch (e: any) {
      setServerError(`Generator dependency error: ${e.message}`);
      throw e;
    }

    // Execute generators sequentially following dependency rules
    for (const stepKey of sortedOrder) {
      const step = GENERATE_STEPS.find((s) => s.key === stepKey);
      if (!step) continue;

      setGeneratingStepLabel(`Generating ${step.label}...`);
      try {
        const data = await aiQueue.enqueue(
          step.endpoint,
          input,
          step.bodyFn(input)
        );
        
        const value = step.responseFn(data);
        if (value) updates[step.field] = value;
      } catch (err) {
        console.warn(`Step ${step.label} generation failed:`, err);
      }
    }

    if (Object.keys(updates).length > 0) {
      setGeneratingStepLabel("Saving all generated AI artifacts...");
      await supabase.from("projects").update(updates).eq("id", projectId);
    }
  };

  // Create Project & Run AI Pipeline
  const handleCreateProjectSubmit = async () => {
    const finalName = projectName.trim() || (creationMode === "direct" ? "My AI Project" : "");
    if (!finalName) {
      setServerError("Project name is required.");
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    setServerError(null);

    const fullPrompt = creationMode === "direct" && directPrompt.trim()
      ? directPrompt.trim()
      : `${finalName}: ${shortDesc}. Problem: ${problemSolved}. Target: ${targetUsers}. Stack: ${stackFrontend}, ${stackBackend}, ${stackDatabase}. Features: ${selectedFeatures.join(", ")}`;

    const completeSpecification = {
      basics: { projectName: finalName, shortDesc, category },
      business: { problemSolved, targetUsers },
      roles: selectedRoles,
      features: selectedFeatures,
      technology: { stackFrontend, stackBackend, stackDatabase, stackCloud },
    };

    try {
      const tags = [category.toLowerCase(), "ai-generated"].filter(Boolean);

      const newProj = await createProject.mutateAsync({
        name: finalName,
        description: shortDesc || (creationMode === "direct" ? directPrompt : `Blueprint workspace for ${finalName}`),
        tags,
        specification: completeSpecification,
      });

      if (autoGenerateAll) {
        await runArtifactPipeline(newProj.id, fullPrompt);
      }

      localStorage.removeItem("devcanvas_wizard_draft");
      navigate(`/app/projects/${newProj.id}`);
    } catch (err: any) {
      setServerError(err.message || "Failed to initialize project.");
    } finally {
      setSubmitting(false);
      setGeneratingStepLabel("");
    }
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setProjectName(preset.name);
    setCategory(preset.cat);
    setShortDesc(preset.desc);
    triggerDraftSave();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left">
      {/* Top Action Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/app")}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-[#00e699]">
          <Sparkles className="mr-1 h-3.5 w-3.5" /> AI Project Initialization System
        </Badge>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
            Create New AI Engineering Workspace
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed font-sans mt-1">
            Build a comprehensive engineering blueprint with auto-generated System Architecture, PostgreSQL Schema, OpenAPI Specs, Security Audit, and Deployment CI/CD.
          </p>
        </div>

        {/* Creation Mode Switcher */}
        <div className="flex gap-2 rounded-lg bg-neutral-950 p-1 w-fit border border-white/10 text-xs">
          <button
            onClick={() => setCreationMode("wizard")}
            className={cn(
              "px-4 py-1.5 rounded-md font-semibold transition-all",
              creationMode === "wizard"
                ? "bg-white/[0.08] text-white border border-white/10"
                : "text-neutral-400 hover:text-white"
            )}
          >
            Streamlined Guided Wizard
          </button>
          <button
            onClick={() => setCreationMode("direct")}
            className={cn(
              "px-4 py-1.5 rounded-md font-semibold transition-all",
              creationMode === "direct"
                ? "bg-white/[0.08] text-white border border-white/10"
                : "text-neutral-400 hover:text-white"
            )}
          >
            Direct 1-Prompt Mode
          </button>
        </div>

        {creationMode === "wizard" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Main Form Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Stepper Steps Header */}
              <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
                {WIZARD_STEPS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(s.id)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold shrink-0 transition-all",
                      currentStep === s.id
                        ? "border-[#00e699] bg-[#00e699]/10 text-white"
                        : "border-white/5 bg-neutral-950 text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    <s.icon className={cn("h-4 w-4", currentStep === s.id ? "text-[#00e699]" : "text-neutral-500")} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Wizard Step Content Box */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
                {/* STEP 1: BASICS */}
                {currentStep === 1 && (
                  <div className="space-y-4 text-xs">
                    <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                      <Compass className="h-4.5 w-4.5 text-[#00e699]" /> 1. Project Basics
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-neutral-300 font-medium">Project Name</label>
                        <input
                          type="text"
                          value={projectName}
                          onChange={(e) => { setProjectName(e.target.value); triggerDraftSave(); }}
                          placeholder="e.g. HealthCare SaaS Portal"
                          className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00e699]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-neutral-300 font-medium">Category</label>
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="e.g. SaaS, E-Commerce, Healthcare"
                          className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00e699]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-neutral-300 font-medium">Short Project Description / Pitch</label>
                      <textarea
                        value={shortDesc}
                        onChange={(e) => { setShortDesc(e.target.value); triggerDraftSave(); }}
                        rows={3}
                        placeholder="Define what your application does, its core value proposition..."
                        className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00e699] resize-none font-sans"
                      />
                    </div>

                    {/* Presets */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Quick Presets</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {PRESETS.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => handleApplyPreset(p)}
                            className="text-left p-3 rounded-xl border border-white/5 bg-neutral-950 hover:border-white/15 hover:bg-neutral-900 transition-all space-y-0.5"
                          >
                            <span className="font-bold text-white block text-xs">{p.name}</span>
                            <span className="text-[11px] text-neutral-400 block leading-tight">{p.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: ROLES & FEATURES */}
                {currentStep === 2 && (
                  <div className="space-y-4 text-xs">
                    <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                      <Users className="h-4.5 w-4.5 text-[#00e699]" /> 2. Target Users, Roles &amp; Capabilities
                    </h3>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-neutral-300 font-medium">Target Audience / Users</label>
                        <input
                          type="text"
                          value={targetUsers}
                          onChange={(e) => setTargetUsers(e.target.value)}
                          placeholder="e.g. Small business owners & administrators"
                          className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00e699]"
                        />
                      </div>

                      <div className="space-y-1 pt-2">
                        <label className="block text-neutral-300 font-medium">Select User Roles</label>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_ROLES.map((role) => {
                            const active = selectedRoles.includes(role);
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => {
                                  setSelectedRoles(prev =>
                                    active ? prev.filter(r => r !== role) : [...prev, role]
                                  );
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                                  active
                                    ? "border-[#00e699] bg-[#00e699]/10 text-[#00e699]"
                                    : "border-white/10 bg-neutral-950 text-neutral-400 hover:text-white"
                                )}
                              >
                                {role}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1 pt-2">
                        <label className="block text-neutral-300 font-medium">Core Capabilities / Features</label>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_FEATURES.map((feat) => {
                            const active = selectedFeatures.includes(feat);
                            return (
                              <button
                                key={feat}
                                type="button"
                                onClick={() => {
                                  setSelectedFeatures(prev =>
                                    active ? prev.filter(f => f !== feat) : [...prev, feat]
                                  );
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                                  active
                                    ? "border-[#00e699] bg-[#00e699]/10 text-[#00e699]"
                                    : "border-white/10 bg-neutral-950 text-neutral-400 hover:text-white"
                                )}
                              >
                                {feat}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: TECH STACK */}
                {currentStep === 3 && (
                  <div className="space-y-4 text-xs">
                    <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                      <Code2 className="h-4.5 w-4.5 text-[#00e699]" /> 3. Preferred Technology Stack
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-neutral-300 font-medium">Frontend Framework</label>
                        <select
                          value={stackFrontend}
                          onChange={(e) => setStackFrontend(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00e699]"
                        >
                          <option>React 18 (Vite)</option>
                          <option>Next.js 14 App Router</option>
                          <option>Vue 3 (Vite)</option>
                          <option>SvelteKit</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-neutral-300 font-medium">Backend Architecture</label>
                        <select
                          value={stackBackend}
                          onChange={(e) => setStackBackend(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00e699]"
                        >
                          <option>Node.js / Express</option>
                          <option>Python FastAPI</option>
                          <option>Go (Golang)</option>
                          <option>Supabase Edge Functions</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-neutral-300 font-medium">Database Engine</label>
                        <select
                          value={stackDatabase}
                          onChange={(e) => setStackDatabase(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00e699]"
                        >
                          <option>PostgreSQL</option>
                          <option>PostgreSQL + Redis</option>
                          <option>MongoDB</option>
                          <option>MySQL</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-neutral-300 font-medium">Deployment Platform</label>
                        <select
                          value={stackCloud}
                          onChange={(e) => setStackCloud(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00e699]"
                        >
                          <option>AWS / Docker</option>
                          <option>Vercel / Supabase</option>
                          <option>Kubernetes Cluster</option>
                          <option>Docker Compose</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & AUTOMATIC GENERATION */}
                {currentStep === 4 && (
                  <div className="space-y-4 text-xs">
                    <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-[#00e699]" /> 4. Review &amp; Initialize Blueprint Workspace
                    </h3>

                    <div className="rounded-xl border border-white/10 bg-neutral-950 p-4 space-y-3 font-mono text-[11px] text-neutral-300">
                      <div>
                        <span className="text-neutral-500 uppercase text-[9px] font-bold block">Project Title</span>
                        <span className="text-white font-bold text-sm block mt-0.5">{projectName || "Untitled Project"}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 uppercase text-[9px] font-bold block">Scope &amp; Description</span>
                        <span className="text-neutral-300 block leading-relaxed mt-0.5">{shortDesc || "No description provided."}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[10.5px]">
                        <div><span className="text-neutral-500">Category:</span> {category}</div>
                        <div><span className="text-neutral-500">Roles:</span> {selectedRoles.join(", ")}</div>
                        <div className="col-span-2"><span className="text-neutral-500">Stack:</span> {stackFrontend} · {stackBackend} · {stackDatabase} · {stackCloud}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-950 rounded-xl border border-white/10 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white text-xs block">Automatically Generate All 6 AI Artifacts</span>
                        <span className="text-[11px] text-neutral-400 block">System Architecture, PostgreSQL Schema, OpenAPI Endpoints, OWASP Security, Docs, CI/CD</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoGenerateAll}
                        onChange={(e) => setAutoGenerateAll(e.target.checked)}
                        className="h-4 w-4 rounded accent-[#00e699] cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
                  <button
                    type="button"
                    disabled={currentStep === 1 || submitting}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all font-semibold"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-neutral-950 hover:bg-neutral-200 transition-all font-bold"
                    >
                      Next Step <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <Button
                      variant="gradient"
                      onClick={handleCreateProjectSubmit}
                      disabled={submitting || !projectName.trim()}
                      className="flex items-center gap-2 text-xs"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-[#00e699]" />
                          <span>{generatingStepLabel || "Creating Project..."}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Create Project &amp; Generate Specs</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {serverError && (
                  <p className="text-xs text-danger-400 flex items-center gap-1 pt-2">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
                  </p>
                )}
              </div>
            </div>

            {/* Right Summary Sidebar (4 Columns) */}
            <aside className="lg:col-span-4 space-y-4 text-xs">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">Workspace Specs Summary</span>
                <div className="space-y-2 text-[11px]">
                  <div><span className="text-neutral-500">Name:</span> <span className="font-bold text-white">{projectName || "—"}</span></div>
                  <div><span className="text-neutral-500">Category:</span> <span className="text-neutral-300">{category}</span></div>
                  <div><span className="text-neutral-500">Roles ({selectedRoles.length}):</span> <span className="text-neutral-300">{selectedRoles.join(", ")}</span></div>
                  <div><span className="text-neutral-500">Features ({selectedFeatures.length}):</span> <span className="text-neutral-300">{selectedFeatures.join(", ")}</span></div>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          /* Direct 1-Prompt Mode */
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-[#00e699]" /> Direct 1-Prompt Requirement Mode
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Enter your project idea in 1 sentence. Our AI will automatically parse the requirements, initialize the workspace, and generate your architecture, database schema, API routes, and security reports.
            </p>

            <textarea
              value={directPrompt}
              onChange={(e) => setDirectPrompt(e.target.value)}
              placeholder="e.g. A multi-tenant SaaS application with user billing, RBAC permissions, PostgreSQL database, and REST OpenAPI endpoints..."
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00e699] resize-none font-sans"
            />

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGenerateAll}
                  onChange={(e) => setAutoGenerateAll(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#00e699]"
                />
                Auto-generate all 6 AI engineering artifacts
              </label>

              <Button
                variant="gradient"
                onClick={handleCreateProjectSubmit}
                disabled={!directPrompt.trim() || submitting}
                className="flex items-center gap-2 text-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#00e699]" />
                    <span>{generatingStepLabel || "Generating Specs..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Initialize Project Specs</span>
                  </>
                )}
              </Button>
            </div>

            {serverError && (
              <p className="text-xs text-danger-400 flex items-center gap-1 pt-1">
                <AlertCircle className="h-4 w-4" /> {serverError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
