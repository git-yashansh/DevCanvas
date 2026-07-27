import { useState, useEffect, useRef, useMemo } from "react";
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
  Globe,
  Lock,
  Tag,
  Layers,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Users,
  Compass,
  GitBranch,
  FileText,
  Rocket,
  Shield,
  HelpCircle,
  Plus,
  Trash2,
  BookOpen,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Button, Badge } from "@ui/index";
import { useCreateProject } from "@/lib/queries/projects";
import { supabase } from "@/lib/supabase";
import { cn } from "@utils/cn";

// ── Wizard Step Config ────────────────────────────────────────
interface StepDef {
  id: number;
  label: string;
  desc: string;
  icon: any;
}

const WIZARD_STEPS: StepDef[] = [
  { id: 1,  label: "Basics",       desc: "Project name & category",    icon: Compass },
  { id: 2,  label: "Business",     desc: "Goals & target audience",   icon: Briefcase },
  { id: 3,  label: "User Roles",   desc: "Define roles & permissions", icon: Users },
  { id: 4,  label: "Features",     desc: "Core capabilities list",     icon: Boxes },
  { id: 5,  label: "Workflows",    desc: "User journeys & data flow",  icon: GitBranch },
  { id: 6,  label: "Technology",   desc: "Frameworks & database stack",icon: Code2 },
  { id: 7,  label: "Scale",        desc: "Expected traffic & latency",  icon: TrendingUp },
  { id: 8,  label: "Security",     desc: "Auth strategy & compliance", icon: ShieldCheck },
  { id: 9,  label: "Integrations", desc: "Third-party APIs & tools",   icon: Zap },
  { id: 10, label: "Constraints",  desc: "Budget & timeline limits",   icon: DollarSign },
  { id: 11, label: "AI Discovery", desc: "Interactive requirement scan",icon: Sparkles },
];

const PRESETS = [
  { name: "SaaS Platform", cat: "SaaS", desc: "Multi-tenant B2B subscription portal with dashboards." },
  { name: "E-Commerce System", cat: "E-commerce", desc: "Digital storefront with Stripe billing & shopping carts." },
  { name: "Health Analytics", cat: "Healthcare", desc: "Patient data portals and compliance audits." },
];

const PRESET_ROLES = ["Guest", "Customer", "Admin", "Vendor", "Manager", "Support Agent"];

const PRESET_FEATURES = [
  { name: "Authentication", cat: "Security" },
  { name: "Stripe Payments", cat: "Billing" },
  { name: "Dashboard Widgets", cat: "Analytics" },
  { name: "Real-time Chat", cat: "Communication" },
  { name: "File Uploads", cat: "Media" },
  { name: "CI/CD Pipeline", cat: "DevOps" },
];

const PRESET_INTEGRATIONS = ["Stripe", "PayPal", "Firebase", "SendGrid", "Twilio", "Google Maps", "OpenAI"];

export function NewProjectPage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [currentStep, setCurrentStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Hybrid Mode
  const [creationMode, setCreationMode] = useState<"wizard" | "direct">("wizard");
  const [directPrompt, setDirectPrompt] = useState("");
  const [analyzingDirect, setAnalyzingDirect] = useState(false);

  // ── Step State Values ───────────────────────────────────────
  const [projectName, setProjectName] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [category, setCategory] = useState("SaaS");
  const [industry, setIndustry] = useState("Technology");
  
  // Step 2
  const [problemSolved, setProblemSolved] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [businessGoal, setBusinessGoal] = useState("");
  const [uniqueness, setUniqueness] = useState("");

  // Step 3
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Customer", "Admin"]);
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [rolePermissions, setRolePermissions] = useState<Record<string, string>>({
    Customer: "Read & write own data, make transactions",
    Admin: "Full workspace administrative access",
  });

  // Step 4
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["Authentication", "Stripe Payments"]);
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [newFeatureName, setNewFeatureName] = useState("");
  const [featurePriority, setFeaturePriority] = useState<Record<string, "Must Have" | "Future">>({
    Authentication: "Must Have",
    "Stripe Payments": "Must Have",
  });

  // Step 5
  const [userJourney, setUserJourney] = useState("");
  const [workflowDesc, setWorkflowDesc] = useState("");

  // Step 6
  const [stackFrontend, setStackFrontend] = useState("React (Vite)");
  const [stackBackend, setStackBackend] = useState("Node/Express");
  const [stackDatabase, setStackDatabase] = useState("PostgreSQL");
  const [stackCloud, setStackCloud] = useState("AWS");

  // Step 7
  const [monthlyUsers, setMonthlyUsers] = useState("10,000");
  const [latencyGoal, setLatencyGoal] = useState("< 200ms");

  // Step 8
  const [authStrategy, setAuthStrategy] = useState("JWT Tokens");
  const [complianceRules, setComplianceRules] = useState("GDPR");

  // Step 9
  const [integrations, setIntegrations] = useState<string[]>(["Stripe", "OpenAI"]);

  // Step 10
  const [budget, setBudget] = useState("Flexible");
  const [timeline, setTimeline] = useState("3 Months");

  // Step 11: AI Discovery Console
  const [aiChat, setAiChat] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Welcome! I have scanned your current wizard configurations. Are there any other specific business logic details we should clarify before we build the workspace?" },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);

  // ── Auto-save to LocalStorage ─────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("devcanvas_wizard_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.projectName) setProjectName(parsed.projectName);
        if (parsed.shortDesc) setShortDesc(parsed.shortDesc);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.problemSolved) setProblemSolved(parsed.problemSolved);
        if (parsed.targetUsers) setTargetUsers(parsed.targetUsers);
        if (parsed.businessGoal) setBusinessGoal(parsed.businessGoal);
      } catch (e) {
        console.error("Failed to load cached draft", e);
      }
    }
  }, []);

  const triggerDraftSave = () => {
    const draft = { projectName, shortDesc, category, problemSolved, targetUsers, businessGoal };
    localStorage.setItem("devcanvas_wizard_draft", JSON.stringify(draft));
  };

  // ── AI Discovery Integration ──────────────────────────────
  const handleSendAIChat = async () => {
    if (!aiInput.trim() || aiThinking) return;
    const userText = aiInput.trim();
    setAiChat((prev) => [...prev, { role: "user", text: userText }]);
    setAiInput("");
    setAiThinking(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated.");

      const contextSpec = {
        projectName,
        shortDesc,
        category,
        businessGoal,
        selectedRoles,
        selectedFeatures,
        stackFrontend,
        stackDatabase,
      };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are a Solution Architect guiding the project creation wizard. Suggest 2 relevant technical questions or confirm the spec is complete." },
              { role: "user", content: `Wizard Configuration Context: ${JSON.stringify(contextSpec)}. User message: ${userText}` }
            ]
          }),
        }
      );

      if (!res.ok) throw new Error("AI call failed.");
      const resData = await res.json();
      setAiChat((prev) => [...prev, { role: "assistant", text: resData.reply }]);
    } catch (e: any) {
      setAiChat((prev) => [...prev, { role: "assistant", text: "I have registered your input. Let's finalize your spec layout now." }]);
    } finally {
      setAiThinking(false);
    }
  };

  // ── AI Direct Prompt Analyzer ─────────────────────────────
  const handleAnalyzeDirectPrompt = async () => {
    if (!directPrompt.trim() || analyzingDirect) return;
    setAnalyzingDirect(true);
    setServerError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated.");

      const parsePrompt = `
You are a senior Solutions Architect. Parse the user's project idea: "${directPrompt}" into a structured JSON project specification block.
The JSON must follow this exact schema:
{
  "name": string (a short, creative project name),
  "description": string (1-2 sentence pitch description),
  "category": string (e.g. SaaS, E-commerce, Healthcare, FinTech, AI),
  "problem": string (what problem it solves),
  "targetUsers": string (who uses it),
  "roles": string[] (3-5 user roles),
  "features": string[] (4-6 key features),
  "stack": {
    "frontend": string,
    "backend": string,
    "database": string,
    "cloud": string
  }
}
Return only raw JSON. Do not write explanations.
`;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are a parser. Return only valid JSON. Do not write explanations." },
              { role: "user", content: parsePrompt }
            ]
          }),
        }
      );

      if (!res.ok) throw new Error("Spec parsing failed.");
      const resData = await res.json();
      
      let parsed: any = {};
      try {
        const cleanJsonText = resData.reply
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        parsed = JSON.parse(cleanJsonText);
      } catch {
        parsed = {
          name: "My Direct Project",
          description: directPrompt,
          category: "SaaS",
          problem: "N/A",
          targetUsers: "General public",
          roles: ["Customer", "Admin"],
          features: ["Authentication"],
          stack: { frontend: "React (Vite)", backend: "Node/Express", database: "PostgreSQL", cloud: "AWS" }
        };
      }

      setProjectName(parsed.name || "My Spec Project");
      setShortDesc(parsed.description || "");
      setCategory(parsed.category || "SaaS");
      setProblemSolved(parsed.problem || "");
      setTargetUsers(parsed.targetUsers || "");
      setSelectedRoles(parsed.roles || ["Customer", "Admin"]);
      setSelectedFeatures(parsed.features || ["Authentication"]);
      if (parsed.stack?.frontend) setStackFrontend(parsed.stack.frontend);
      if (parsed.stack?.backend) setStackBackend(parsed.stack.backend);
      if (parsed.stack?.database) setStackDatabase(parsed.stack.database);
      if (parsed.stack?.cloud) setStackCloud(parsed.stack.cloud);

      setCreationMode("wizard");
      setCurrentStep(11);
      
      setAiChat([
        { role: "assistant", text: `I have automatically initialized your project spec based on your prompt! Here is what I mapped:\n\n* **Name**: ${parsed.name}\n* **Stack**: ${parsed.stack?.frontend} + ${parsed.stack?.backend}\n* **Roles**: ${parsed.roles?.join(", ")}\n* **Features**: ${parsed.features?.join(", ")}\n\nDo you want to clarify any details, or shall we finalize and initialize the workspace?` }
      ]);
    } catch (e: any) {
      setServerError("Failed to extract specifications: " + e.message);
    } finally {
      setAnalyzingDirect(false);
    }
  };

  // ── Calculate Readiness scores ─────────────────────────────
  const readinessMetrics = useMemo(() => {
    let business = 40;
    let arch = 30;
    let db = 30;
    let api = 30;

    if (projectName) business += 20;
    if (problemSolved) business += 20;
    if (targetUsers) business += 20;

    if (stackFrontend && stackBackend) arch += 40;
    if (selectedFeatures.length > 0) arch += 30;

    if (stackDatabase) db += 40;
    if (selectedRoles.length > 0) db += 35;

    if (selectedFeatures.includes("Authentication")) api += 40;
    if (userJourney) api += 30;

    return {
      business: Math.min(100, business),
      architecture: Math.min(100, arch),
      database: Math.min(100, db),
      api: Math.min(100, api),
      overall: Math.min(100, Math.round((business + arch + db + api) / 4)),
    };
  }, [projectName, problemSolved, targetUsers, stackFrontend, stackBackend, selectedFeatures, stackDatabase, selectedRoles, userJourney]);

  // ── Form Submit ─────────────────────────────────────────────
  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setServerError("Project name is required.");
      setCreationMode("wizard");
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    setServerError(null);

    const completeSpecification = {
      basics: { projectName, shortDesc, category, industry },
      business: { problemSolved, targetUsers, businessGoal, uniqueness },
      roles: selectedRoles.map(r => ({ name: r, permissions: rolePermissions[r] || "Standard rights" })),
      features: selectedFeatures.map(f => ({ name: f, priority: featurePriority[f] || "Must Have" })),
      workflows: { userJourney, workflowDesc },
      technology: { stackFrontend, stackBackend, stackDatabase, stackCloud },
      scale: { monthlyUsers, latencyGoal },
      security: { authStrategy, complianceRules },
      integrations,
      constraints: { budget, timeline },
      metrics: readinessMetrics,
    };

    try {
      const tags = [category.toLowerCase(), industry.toLowerCase()].filter(Boolean);
      
      const newProj = await createProject.mutateAsync({
        name: projectName,
        description: shortDesc || `Blueprint workspace for ${projectName}`,
        tags,
        specification: completeSpecification,
      });

      localStorage.removeItem("devcanvas_wizard_draft");
      navigate(`/app/projects/${newProj.id}`);
    } catch (err: any) {
      setServerError(err.message || "Failed to initialize blueprint workspace.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setProjectName(preset.name);
    setCategory(preset.cat);
    setShortDesc(preset.desc);
    triggerDraftSave();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/app")}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>
        <Badge variant="outline" className="border-indigo-500/20 bg-indigo-500/5 text-indigo-300">
          <Sparkles className="mr-1 h-3.5 w-3.5" /> AI Spec Discovery Engine
        </Badge>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        {/* Left Column: wizard controls (8 or 12 cols depending on mode) */}
        <div className={cn(creationMode === "direct" ? "lg:col-span-12" : "lg:col-span-8", "space-y-6")}>
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
              AI Project Discovery System
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Build a structured engineering specification with a guided architect session or describe your idea directly.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex gap-2 rounded-lg bg-neutral-900 p-1 w-fit border border-white/5 text-xs">
            <button
              onClick={() => setCreationMode("wizard")}
              className={cn(
                "px-4 py-1.5 rounded-md font-semibold transition-all",
                creationMode === "wizard"
                  ? "bg-white/[0.08] text-white border border-white/10"
                  : "text-neutral-450 hover:text-white"
              )}
            >
              Architect Guided Wizard
            </button>
            <button
              onClick={() => setCreationMode("direct")}
              className={cn(
                "px-4 py-1.5 rounded-md font-semibold transition-all",
                creationMode === "direct"
                  ? "bg-white/[0.08] text-white border border-white/10"
                  : "text-neutral-450 hover:text-white"
              )}
            >
              Direct AI Requirement Prompt (Beginners)
            </button>
          </div>

          {creationMode === "wizard" ? (
            <>
              {/* Stepper Timeline Nav */}
              <div className="overflow-x-auto pb-2 border-b border-white/[0.08] flex gap-2">
                {WIZARD_STEPS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(s.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 transition-all",
                      currentStep === s.id
                        ? "border-primary-500 bg-primary-500/10 text-white"
                        : "border-white/5 bg-white/[0.01] text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    <s.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Steps Switcher */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 text-xs"
                  >
                    {/* STEP 1: BASICS */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                          <Compass className="h-4.5 w-4.5 text-primary-400" /> 1. Project Basics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium">Project Name</label>
                            <input
                              type="text"
                              value={projectName}
                              onChange={(e) => { setProjectName(e.target.value); triggerDraftSave(); }}
                              placeholder="e.g. PetCare Marketplace"
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium">Category</label>
                            <input
                              type="text"
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              placeholder="e.g. SaaS, Marketplace"
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-neutral-300 font-medium">Short Pitch Description</label>
                          <textarea
                            value={shortDesc}
                            onChange={(e) => { setShortDesc(e.target.value); triggerDraftSave(); }}
                            rows={3}
                            placeholder="A concise overview of the core project scope..."
                            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none font-sans"
                          />
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Presets</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {PRESETS.map((p) => (
                              <button
                                key={p.name}
                                onClick={() => handleApplyPreset(p)}
                                className="text-left p-3 rounded-lg border border-white/5 bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.03] transition-all"
                              >
                                <span className="font-semibold text-white block">{p.name}</span>
                                <span className="text-[10.5px] text-neutral-500 block leading-tight mt-0.5">{p.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: BUSINESS DISCOVERY */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                          <Briefcase className="h-4.5 w-4.5 text-primary-400" /> 2. Business Discovery
                        </h3>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium font-sans">What problem does this project solve?</label>
                            <input
                              type="text"
                              value={problemSolved}
                              onChange={(e) => setProblemSolved(e.target.value)}
                              placeholder="e.g. Pet owners struggle to book on-demand veterinary caretakers"
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium font-sans">Who is the target audience?</label>
                            <input
                              type="text"
                              value={targetUsers}
                              onChange={(e) => setTargetUsers(e.target.value)}
                              placeholder="e.g. Busy urban pet owners and professional pet caretakers"
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium font-sans">What is the primary business goal?</label>
                            <input
                              type="text"
                              value={businessGoal}
                              onChange={(e) => setBusinessGoal(e.target.value)}
                              placeholder="e.g. Simplify appointment orchestration and increase caregiver earnings"
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: USER ROLES */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                          <Users className="h-4.5 w-4.5 text-primary-400" /> 3. User Roles &amp; Permissions
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_ROLES.map((role) => {
                            const active = selectedRoles.includes(role);
                            return (
                              <button
                                key={role}
                                onClick={() => {
                                  setSelectedRoles(prev =>
                                    active ? prev.filter(r => r !== role) : [...prev, role]
                                  );
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
                                  active ? "border-primary-500 bg-primary-500/10 text-white" : "border-white/10 text-neutral-400 hover:text-white"
                                )}
                              >
                                {role}
                              </button>
                            );
                          })}
                        </div>

                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Role Capabilities</span>
                          {selectedRoles.map((role) => (
                            <div key={role} className="flex gap-3 items-center">
                              <span className="w-24 font-bold text-neutral-300 truncate">{role}</span>
                              <input
                                type="text"
                                value={rolePermissions[role] || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRolePermissions(prev => ({ ...prev, [role]: val }));
                                }}
                                placeholder="Describe permissions..."
                                className="flex-1 rounded-lg border border-white/10 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STEP 4: FEATURES DISCOVERY */}
                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                          <Boxes className="h-4.5 w-4.5 text-primary-400" /> 4. Features &amp; Capabilities
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {PRESET_FEATURES.map((feat) => {
                            const active = selectedFeatures.includes(feat.name);
                            return (
                              <button
                                key={feat.name}
                                onClick={() => {
                                  setSelectedFeatures(prev =>
                                    active ? prev.filter(f => f !== feat.name) : [...prev, feat.name]
                                  );
                                }}
                                className={cn(
                                  "p-3 rounded-lg border text-left transition-all flex flex-col justify-between",
                                  active ? "border-primary-500 bg-primary-500/10 text-white" : "border-white/5 bg-white/[0.01] text-neutral-400 hover:border-white/15"
                                )}
                              >
                                <span className="font-bold block text-xs text-white">{feat.name}</span>
                                <span className="text-[9px] text-neutral-500 block uppercase font-bold mt-1 tracking-wider">{feat.cat}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* STEP 5: WORKFLOWS */}
                    {currentStep === 5 && (
                      <div className="space-y-4">
                        <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                          <GitBranch className="h-4.5 w-4.5 text-primary-400" /> 5. Core Business Workflows
                        </h3>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium font-sans">Describe the primary user journey</label>
                            <textarea
                              value={userJourney}
                              onChange={(e) => setUserJourney(e.target.value)}
                              rows={3}
                              placeholder="e.g. Customer lands ➔ searches care-givers ➔ books slot ➔ completes payment ➔ provider accepts"
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none font-sans"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 6: TECHNOLOGY PREFERENCES */}
                    {currentStep === 6 && (
                      <div className="space-y-4">
                        <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                          <Code2 className="h-4.5 w-4.5 text-primary-400" /> 6. Tech Stack Preferences
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium">Frontend Framework</label>
                            <select
                              value={stackFrontend}
                              onChange={(e) => setStackFrontend(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              <option>React (Vite)</option>
                              <option>Next.js (App Router)</option>
                              <option>Vue (Nuxt)</option>
                              <option>AI Recommendation</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium">Backend / API Server</label>
                            <select
                              value={stackBackend}
                              onChange={(e) => setStackBackend(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              <option>Node/Express</option>
                              <option>Python (FastAPI)</option>
                              <option>Go (Gin)</option>
                              <option>AI Recommendation</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium">Primary Database</label>
                            <select
                              value={stackDatabase}
                              onChange={(e) => setStackDatabase(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              <option>PostgreSQL</option>
                              <option>MySQL</option>
                              <option>MongoDB</option>
                              <option>SQLite</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium">Cloud Platform</label>
                            <select
                              value={stackCloud}
                              onChange={(e) => setStackCloud(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              <option>AWS</option>
                              <option>Google Cloud (GCP)</option>
                              <option>Vercel / Supabase</option>
                              <option>No Preference</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 7: SCALE & PERFORMANCE */}
                    {currentStep === 7 && (
                      <div className="space-y-4">
                        <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                          <TrendingUp className="h-4.5 w-4.5 text-primary-400" /> 7. Scale &amp; Latency Goals
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium">Expected Monthly Users</label>
                            <select
                              value={monthlyUsers}
                              onChange={(e) => setMonthlyUsers(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              <option>1,000</option>
                              <option>10,000</option>
                              <option>100,000</option>
                              <option>1,000,000+</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium">Target Latency SLA</label>
                            <select
                              value={latencyGoal}
                              onChange={(e) => setLatencyGoal(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              <option>&lt; 100ms (High Speed)</option>
                              <option>&lt; 200ms (Standard)</option>
                              <option>&lt; 500ms</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 8: SECURITY & COMPLIANCE */}
                    {currentStep === 8 && (
                      <div className="space-y-4">
                        <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                          <ShieldCheck className="h-4.5 w-4.5 text-primary-400" /> 8. Security &amp; Compliance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium">Auth Strategy</label>
                            <input
                              type="text"
                              value={authStrategy}
                              onChange={(e) => setAuthStrategy(e.target.value)}
                              placeholder="e.g. JWT with Refresh Tokens, OAuth 2.0"
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium">Regulations Compliance</label>
                            <input
                              type="text"
                              value={complianceRules}
                              onChange={(e) => setComplianceRules(e.target.value)}
                              placeholder="e.g. GDPR, HIPAA, SOC2"
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 9: INTEGRATIONS */}
                    {currentStep === 9 && (
                      <div className="space-y-4">
                        <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                          <Zap className="h-4.5 w-4.5 text-primary-400" /> 9. Integrations &amp; Add-ons
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_INTEGRATIONS.map((tool) => {
                            const active = integrations.includes(tool);
                            return (
                              <button
                                key={tool}
                                onClick={() => {
                                  setIntegrations(prev =>
                                    active ? prev.filter(t => t !== tool) : [...prev, tool]
                                  );
                                }}
                                className={cn(
                                  "px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all",
                                  active ? "border-primary-500 bg-primary-500/10 text-white" : "border-white/10 text-neutral-400 hover:text-white"
                                )}
                              >
                                {tool}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* STEP 10: CONSTRAINTS */}
                    {currentStep === 10 && (
                      <div className="space-y-4">
                        <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                          <DollarSign className="h-4.5 w-4.5 text-primary-400" /> 10. Constraints &amp; Limits
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium">Budget Constraints</label>
                            <input
                              type="text"
                              value={budget}
                              onChange={(e) => setBudget(e.target.value)}
                              placeholder="e.g. Free Tier, Startup Budget"
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-neutral-300 font-medium">Timeline Limit</label>
                            <input
                              type="text"
                              value={timeline}
                              onChange={(e) => setTimeline(e.target.value)}
                              placeholder="e.g. 1 Month MVP, 6 Months"
                              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 11: AI REQUIREMENT DISCOVERY CONSOLE */}
                    {currentStep === 11 && (
                      <div className="space-y-4 text-left">
                        <div className="flex items-center justify-between">
                          <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                            <Sparkles className="h-4.5 w-4.5 text-primary-400" /> 11. AI Requirement Discovery Console
                          </h3>
                          <Badge variant="outline" className="text-[10px] border-primary-500/30 text-primary-400">Interactive Architect</Badge>
                        </div>

                        <p className="text-[11px] text-neutral-450 leading-relaxed font-sans">
                          Our solution architect AI scan has mapped your specifications. Ask questions or confirm modifications below before creating the workspace.
                        </p>

                        {/* Chat console feed */}
                        <div className="rounded-xl border border-white/10 bg-neutral-950 p-4 h-48 overflow-y-auto space-y-3 font-sans">
                          {aiChat.map((msg, i) => (
                            <div key={i} className={cn("text-xs leading-relaxed", msg.role === "user" ? "text-primary-300 text-right" : "text-neutral-300 text-left")}>
                              <span className="font-bold block text-[10px] uppercase text-neutral-500 tracking-wider">
                                {msg.role === "user" ? "You" : "DevCanvas Architect"}
                              </span>
                              <p className="mt-0.5">{msg.text}</p>
                            </div>
                          ))}
                          {aiThinking && (
                            <div className="text-xs text-neutral-500 flex items-center gap-1 font-mono">
                              <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                            </div>
                          )}
                        </div>

                        {/* Chat input box */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSendAIChat(); }}
                            placeholder="Add details (e.g. We require Stripe billing & user accounts)"
                            className="flex-grow rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans"
                          />
                          <Button variant="outline" size="sm" onClick={handleSendAIChat} disabled={aiThinking}>
                            Verify
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Stepper Navigation buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-white/5 text-xs">
                  <button
                    disabled={currentStep === 1}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all font-semibold"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous Step
                  </button>

                  {currentStep < 11 ? (
                    <button
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-neutral-950 hover:bg-neutral-200 transition-all font-bold"
                    >
                      Next Step <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <Button
                      variant="gradient"
                      onClick={handleCreateProject}
                      disabled={submitting || !projectName.trim()}
                      className="flex items-center gap-1.5"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Creating Spec Workspace...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Initialize Spec Blueprint</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {serverError && (
                  <p className="mt-2 text-xs text-danger-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {serverError}
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Direct AI Prompt Mode block */
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md space-y-4">
              <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-primary-400" /> Direct AI Requirement Discovery Scan
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Type your application concept in one or two sentences. Our AI solution architect will automatically structure and build the engineering requirements spec for you.
              </p>

              <textarea
                value={directPrompt}
                onChange={(e) => setDirectPrompt(e.target.value)}
                placeholder="A food delivery app targeting local restaurants with dynamic menus, Stripe billing, and a delivery driver live tracking dashboard..."
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none font-sans"
              />

              <div className="flex justify-end pt-1">
                <Button
                  variant="gradient"
                  onClick={handleAnalyzeDirectPrompt}
                  disabled={!directPrompt.trim() || analyzingDirect}
                  className="flex items-center gap-1.5"
                >
                  {analyzingDirect ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Analyzing &amp; Mapping Specs...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Start AI Scan</span>
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

        {/* Right Column: dynamic spec live preview (4 cols) - Hidden in Direct AI Prompt Mode */}
        {creationMode === "wizard" && (
          <aside className="lg:col-span-4 space-y-6 text-xs leading-relaxed">
            {/* Readiness Completeness Panel */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3.5">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
                <span>Spec Quality Readiness</span>
                <span className="text-primary-400 font-mono">{readinessMetrics.overall}%</span>
              </div>

              <div className="space-y-2">
                {[
                  { label: "Business Specification Clarity", score: readinessMetrics.business },
                  { label: "Architecture Context Readiness", score: readinessMetrics.architecture },
                  { label: "Database Normalization Prep", score: readinessMetrics.database },
                  { label: "API Spec Requirements", score: readinessMetrics.api },
                ].map((m) => (
                  <div key={m.label} className="space-y-1">
                    <div className="flex justify-between text-[10.5px] font-medium">
                      <span className="text-neutral-455">{m.label}</span>
                      <span className="text-neutral-300 font-mono">{m.score}%</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-500",
                          m.score >= 80 ? "bg-emerald-500" : m.score >= 50 ? "bg-primary-500" : "bg-neutral-600"
                        )}
                        style={{ width: `${m.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Specification Preview Summary card */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
              <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">Live Specification Preview</span>

              <div className="space-y-3 font-mono text-[11px] text-neutral-400">
                <div>
                  <span className="text-neutral-500 block uppercase text-[9px] font-bold tracking-widest">Scope</span>
                  <span className="text-neutral-200 font-semibold">{projectName || "—"} ({category})</span>
                </div>

                {targetUsers && (
                  <div>
                    <span className="text-neutral-500 block uppercase text-[9px] font-bold tracking-widest">Target Users</span>
                    <span className="text-neutral-300 block leading-tight mt-0.5">{targetUsers}</span>
                  </div>
                )}

                {selectedRoles.length > 0 && (
                  <div>
                    <span className="text-neutral-500 block uppercase text-[9px] font-bold tracking-widest">User Roles</span>
                    <div className="flex flex-wrap gap-1 mt-1 font-sans">
                      {selectedRoles.map(r => (
                        <span key={r} className="rounded bg-white/5 border border-white/10 px-1 py-0.5 text-[10px] text-neutral-300 font-medium">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFeatures.length > 0 && (
                  <div>
                    <span className="text-neutral-500 block uppercase text-[9px] font-bold tracking-widest">Capabilities</span>
                    <div className="flex flex-wrap gap-1 mt-1 font-sans">
                      {selectedFeatures.map(f => (
                        <span key={f} className="rounded bg-white/5 border border-white/10 px-1 py-0.5 text-[10px] text-neutral-300 font-medium">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-neutral-500 block uppercase text-[9px] font-bold tracking-widest">Stack Blueprint</span>
                  <span className="text-neutral-300 mt-0.5 block">
                    {stackFrontend} · {stackBackend} · {stackDatabase} · {stackCloud}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
