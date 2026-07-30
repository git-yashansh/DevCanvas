import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Boxes,
  Database,
  Code2,
  ShieldCheck,
  FileText,
  Server,
  Loader2,
  MessageSquare,
  Zap,
  Layout,
  Terminal,
  Layers,
  ChevronRight,
  Bot,
  Play,
  Heart,
  Plus
} from "lucide-react";
import { useProjects, useCreateProject } from "@/lib/queries/projects";
import { useRecentActivity } from "@/lib/queries/activity";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/cn";
import { AIOrb } from "@/components/dashboard/AIOrb";

// Reusable Sub-components:

// 1. HomeHero Section
interface HomeHeroProps {
  greeting: string;
  userName: string;
  onStartBuilding: () => void;
  onExploreTemplates: () => void;
}

function HomeHero({ greeting, userName, onStartBuilding, onExploreTemplates }: HomeHeroProps) {
  return (
    <div className="space-y-4 text-left max-w-4xl">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-medium text-white tracking-tight leading-tight">
        <span>{greeting}, </span>
        <span className="italic bg-gradient-to-r from-orange-300 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
          {userName}
        </span>
      </h1>
      <p className="text-lg sm:text-xl font-heading text-neutral-300 font-light">
        Build production-ready software architecture with AI.
      </p>
      <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-sans max-w-2xl">
        Generate interactive architecture system diagrams, relational database schemas, OpenAPI documentation, security vulnerability reports, and CI/CD configurations from a single prompt.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={onStartBuilding}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>Start Building</span>
        </button>
        <button
          onClick={onExploreTemplates}
          className="bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all cursor-pointer"
        >
          Explore Templates
        </button>
      </div>
    </div>
  );
}

// 2. PromptCard Section
interface PromptCardProps {
  promptText: string;
  setPromptText: (text: string) => void;
  onSubmit: (mode: "architecture" | "project") => void;
  isGenerating: boolean;
}

function PromptCard({ promptText, setPromptText, onSubmit, isGenerating }: PromptCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const examplePrompts = [
    { label: "CRM System", prompt: "A multi-tenant CRM system with drag-and-drop sales pipeline, lead scoring, and integration with Stripe/Twilio." },
    { label: "AI SaaS Platform", prompt: "A subscription-based AI SaaS platform where users input text prompts to generate audio tracks, using next.js, fastify, and pgvector." },
    { label: "Fintech App", prompt: "A wealth management fintech platform featuring secure ledgering, Plaid integration, KYC checks, and real-time stock ticker sync." },
    { label: "Healthcare Portal", prompt: "A HIPAA-compliant doctor-patient scheduling portal with video visits, encrypted medical record logs, and prescription tracking." },
    { label: "Marketplace", prompt: "A peer-to-peer equipment rental marketplace with geolocation filtering, user reviews, deposit holds, and chat." },
  ];

  return (
    <div className="glowing-border-container">
      <div className="glowing-border-content p-5 lg:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <span className="font-heading text-lg font-bold text-white tracking-wide">
            What are you building today?
          </span>
        </div>

        <div className="bg-black border border-white/10 rounded-xl p-4 focus-within:border-emerald-500/60 transition-all space-y-2">
          <textarea
            ref={textareaRef}
            rows={4}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Describe your startup, SaaS, mobile app, AI product, or backend service in detail..."
            className="bg-transparent border-none outline-none text-base text-white placeholder-neutral-500 w-full resize-none leading-relaxed font-sans"
          />
          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <span className="text-xs text-neutral-500">Press option + enter to submit query</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isGenerating || !promptText.trim()}
                onClick={() => onSubmit("architecture")}
                className="bg-transparent hover:bg-white/5 border border-white/20 text-neutral-300 px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Generate Architecture</span>
              </button>
              <button
                type="button"
                disabled={isGenerating || !promptText.trim()}
                onClick={() => onSubmit("project")}
                className="bg-white hover:bg-neutral-200 text-black px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                <span>{isGenerating ? "Creating..." : "Create Complete Project"}</span>
                <AIOrb size={36} className="bg-transparent border-none opacity-90 pointer-events-none" renderScale={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Suggestion Pills */}
        <div className="space-y-1.5">
          <span className="text-xs text-neutral-500 font-semibold block">Try an example idea:</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {examplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPromptText(p.prompt)}
                className="text-neutral-300 bg-[#181920] border border-white/10 hover:border-emerald-500/40 hover:text-white px-3 py-1.5 rounded-full transition-all shrink-0 whitespace-nowrap"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. QuickStartRoadmap Section
interface QuickStartRoadmapProps {
  onStepClick: (stepId: string) => void;
}

function QuickStartRoadmap({ onStepClick }: QuickStartRoadmapProps) {
  const steps = [
    { id: "describe", label: "Describe Idea", sub: "Input prompt", icon: Sparkles },
    { id: "architecture", label: "Architecture", sub: "System components", icon: Boxes },
    { id: "database", label: "Database", sub: "Relational schema", icon: Database },
    { id: "api", label: "API Spec", sub: "Endpoints & routes", icon: Code2 },
    { id: "security", label: "Security", sub: "Threat modeling", icon: ShieldCheck },
    { id: "docs", label: "Documentation", sub: "System specs", icon: FileText },
    { id: "deploy", label: "Deploy Plan", sub: "Docker & cloud", icon: Server },
  ];

  return (
    <div className="bg-[#121319] border border-white/10 rounded-xl p-5 lg:p-6 space-y-4">
      <div>
        <h2 className="font-heading text-lg font-bold text-white tracking-wide">Interactive Development Cycle</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Click any stage to instantly open its generator component</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5 relative">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              onClick={() => onStepClick(s.id)}
              className="bg-[#181920] border border-white/5 hover:border-emerald-500/40 rounded-xl p-3.5 flex flex-col justify-between items-start cursor-pointer hover:bg-[#1c1d27] transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="h-10 w-10 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded">
                  0{idx + 1}
                </span>
                {idx < steps.length - 1 && (
                  <span className="hidden lg:block absolute top-[26px] left-[90%] w-[35%] h-[1px] bg-white/5 z-0" />
                )}
              </div>
              <div className="mt-4">
                <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {s.label}
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5 truncate">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 4. TemplateGrid Section
interface TemplateGridProps {
  onSelectTemplate: (name: string, desc: string, tags: string[]) => void;
  isGenerating: boolean;
}

function TemplateGrid({ onSelectTemplate, isGenerating }: TemplateGridProps) {
  const templates = [
    {
      name: "SaaS Platform",
      desc: "Full-stack SaaS with users, billing subscription logic, billing portals, dashboard, and webhook APIs.",
      techs: ["React", "Express", "PostgreSQL", "Stripe"],
      time: "~45s",
      icon: Layout,
    },
    {
      name: "AI Agent Workspace",
      desc: "Event-driven AI chatbot platform with secure conversational threads, vector databases, and embeddings integration.",
      techs: ["Next.js", "Python", "PGVector", "OpenAI"],
      time: "~60s",
      icon: Bot,
    },
    {
      name: "Corporate CRM",
      desc: "Internal dashboard with custom contact pipelines, task tracking boards, lead analytics, and audit logging.",
      techs: ["React", "NestJS", "PostgreSQL", "Tailwind"],
      time: "~45s",
      icon: Boxes,
    },
    {
      name: "E-Commerce App",
      desc: "Clean digital marketplace store with shopping cart context, order sync pipelines, and payment APIs.",
      techs: ["Vite", "Supabase", "Node.js", "Stripe"],
      time: "~50s",
      icon: Database,
    },
    {
      name: "B2B Marketplace",
      desc: "Bulk listings directory platform with user profile reviews, geolocation coordinates, and secure transaction escrow.",
      techs: ["Next.js", "Express", "MongoDB", "Auth0"],
      time: "~60s",
      icon: Layers,
    },
    {
      name: "LMS Platform",
      desc: "Online course site with lesson progression analytics, quizzes, certificate generation, and upload CDN specs.",
      techs: ["React", "Fastify", "MySQL", "AWS S3"],
      time: "~55s",
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold text-white tracking-wide">Production Ready Templates</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Accelerate project setup using pre-configured industry standards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t, idx) => {
          const Icon = t.icon;
          return (
            <div
              key={idx}
              className="bg-[#121319] border border-white/10 hover:border-white/20 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:bg-[#151722] transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="h-3 w-3 text-emerald-400" /> {t.time}
                  </span>
                </div>
                <div className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {t.name}
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                  {t.desc}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {t.techs.map((tech, i) => (
                    <span key={i} className="text-[10px] bg-neutral-900 text-neutral-300 border border-white/5 px-2 py-0.5 rounded">
                      {tech}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => onSelectTemplate(t.name, t.desc, t.techs)}
                  className="w-full bg-[#181920] hover:bg-emerald-500 hover:text-black border border-white/10 hover:border-transparent text-white font-medium text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span>Use Template</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 5. FeatureGrid Section ("Why DevCanvas")
function FeatureGrid() {
  const navigate = useNavigate();
  const features = [
    { title: "Architecture Design", desc: "Define component boundaries and interactive structural node diagrams.", icon: Boxes, path: "/app/architecture" },
    { title: "Database Modeling", desc: "Auto-generate migrations, relationships, schemas, and schemas data types.", icon: Database, path: "/app/database" },
    { title: "API Specifications", desc: "Build RESTful routes matching strict OpenAPI JSON formatting blueprints.", icon: Code2, path: "/app/api-generator" },
    { title: "Security Auditing", desc: "Scan authorization schemes and ensure full RBAC checklist safety.", icon: ShieldCheck, path: "/app/security" },
    { title: "Repository Analysis", desc: "Import code structures directly to track structural components.", icon: Bot, path: "/app/repo" },
    { title: "Documentation Suite", desc: "Write comprehensive technical instructions, deployment specs, and Readmes.", icon: FileText, path: "/app/documentation" },
    { title: "Deployment Spec", desc: "Generate Docker compose, pipeline integrations, and cloud configs.", icon: Server, path: "/app/deployment" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold text-white tracking-wide">AI-Powered Engineering Modules</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Explore specialized micro-services targeting system specs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(f.path)}
              className="bg-[#121319] border border-white/10 hover:border-white/20 rounded-xl p-4.5 cursor-pointer flex flex-col justify-between hover:bg-[#141620] transition-all group h-36"
            >
              <div className="h-8 w-8 rounded-lg bg-neutral-900 text-neutral-300 group-hover:text-emerald-400 group-hover:bg-emerald-950/20 flex items-center justify-center border border-white/5 transition-all">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="mt-4">
                <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>{f.title}</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 6. ContinueSection
interface ContinueSectionProps {
  recentProject: any;
  recentChats: any[];
  activity: any[];
}

function ContinueSection({ recentProject, recentChats, activity }: ContinueSectionProps) {
  const navigate = useNavigate();

  // Determine recommend step
  const recommendedStep = useMemo(() => {
    if (!recentProject) return null;
    if (!recentProject.architecture) return { label: "Generate System Architecture Blueprint", path: `/app/architecture` };
    if (!recentProject.database_schema) return { label: "Design Relational Schema Migrations", path: `/app/database` };
    if (!recentProject.api_spec) return { label: "Specify RESTful OpenAPI Specification", path: `/app/api-generator` };
    if (!recentProject.security_report) return { label: "Run Threat Modeling and Audit Security", path: `/app/security` };
    if (!recentProject.documentation) return { label: "Build Technical System Documentation", path: `/app/documentation` };
    return { label: "Generate CI/CD Docker Deployment Specs", path: `/app/deployment` };
  }, [recentProject]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Recent Project details */}
      {recentProject && (
        <div className="lg:col-span-2 bg-[#121319] border border-white/10 rounded-xl p-5 lg:p-6 space-y-4 hover:border-white/20 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Active Workspace</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                Status: Active
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-heading font-medium text-white">{recentProject.name}</h3>
              <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{recentProject.description}</p>
            </div>

            {recommendedStep && (
              <div className="bg-[#181920] border border-white/5 rounded-xl p-3.5 flex items-center justify-between hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Recommended Action</div>
                    <div className="text-xs font-semibold text-white truncate max-w-[280px] sm:max-w-md">
                      {recommendedStep.label}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(recommendedStep.path)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Build</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
            <div className="flex items-center gap-2">
              {recentProject.tags?.map((t: string, i: number) => (
                <span key={i} className="text-[10px] bg-neutral-900 border border-white/5 px-2 py-0.5 rounded text-neutral-300">
                  {t}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate(`/app/projects/${recentProject.id}`)}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>Open Project Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Recent Chats & Updates */}
      <div className="bg-[#121319] border border-white/10 rounded-xl p-5 lg:p-6 space-y-4 hover:border-white/20 transition-all flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            <MessageSquare className="h-4 w-4 text-indigo-400" />
            <span>Recent AI Workspace Chats</span>
          </div>

          <div className="space-y-2">
            {recentChats.length > 0 ? (
              recentChats.map((c, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/app/chat`)}
                  className="p-2.5 bg-[#181920] hover:bg-[#1c1d27] border border-white/5 rounded-lg cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-neutral-300">AI Chat Log</span>
                    <span className="text-neutral-500 font-mono">Verified</span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-1 leading-normal">
                    {c.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-neutral-500">
                No active conversations yet
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate("/app/chat")}
          className="w-full bg-[#181920] border border-white/5 hover:border-white/20 text-xs font-semibold text-white py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Open AI Chat Window</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// Main Page Component
export function HomePage() {
  const { profile } = useAuth();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: activityData } = useRecentActivity(5);
  const navigate = useNavigate();
  const createProjectMutation = useCreateProject();

  const [promptText, setPromptText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName = profile?.full_name?.split(" ")[0] || "Developer";

  const recentProject = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return null;
    return projectsData[0];
  }, [projectsData]);

  // Handle building from textarea prompt or templates
  const handleStartGeneration = async (mode: "architecture" | "project" | "template", customName?: string, customDesc?: string, customTags?: string[]) => {
    const name = customName || (promptText.trim().split(" ").slice(0, 3).join(" ") || "New Project");
    const desc = customDesc || promptText.trim();
    
    if (!desc && mode !== "template") return;
    
    setIsGenerating(true);
    try {
      const newProj = await createProjectMutation.mutateAsync({
        name,
        description: desc || "Pre-configured project template template.",
        tags: customTags || ["AI SaaS", "API Spec", "Web Framework"],
      });
      // Redirect directly to the target creator dashboard workspace
      navigate(`/app/projects/${newProj.id}`);
    } catch (err) {
      console.error("Failed to generate project: ", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStepClick = (stepId: string) => {
    const textarea = document.querySelector("textarea");
    if (stepId === "describe") {
      textarea?.focus();
    } else {
      const stepRoutes: Record<string, string> = {
        architecture: "/app/architecture",
        database: "/app/database",
        api: "/app/api-generator",
        security: "/app/security",
        docs: "/app/documentation",
        deploy: "/app/deployment",
      };
      if (stepRoutes[stepId]) {
        navigate(stepRoutes[stepId]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans antialiased p-6 lg:p-10 space-y-9 text-left">
      {/* 1. Welcome Hero */}
      <HomeHero
        greeting={greeting}
        userName={userName}
        onStartBuilding={() => {
          const textarea = document.querySelector("textarea");
          textarea?.focus();
        }}
        onExploreTemplates={() => {
          const element = document.getElementById("templates-section");
          element?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* 2. Large AI Prompt Card */}
      <PromptCard
        promptText={promptText}
        setPromptText={setPromptText}
        onSubmit={(mode) => handleStartGeneration(mode)}
        isGenerating={isGenerating}
      />

      {/* 3. Quick Start Roadmap */}
      <QuickStartRoadmap onStepClick={handleStepClick} />

      {/* 4. Continue Working / Recent Activity if has data */}
      {!projectsLoading && projectsData && projectsData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-white tracking-wide">Continue Workspace</h2>
            <button
              onClick={() => navigate("/app/workspace")}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1.5 font-semibold"
            >
              <span>Open Full Workspace</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <ContinueSection
            recentProject={recentProject}
            recentChats={activityData ? activityData.slice(0, 3) : []}
            activity={activityData ?? []}
          />
        </div>
      )}

      {/* 5. Project Templates Section */}
      <div id="templates-section" className="pt-2">
        <TemplateGrid
          onSelectTemplate={(name, desc, tags) => handleStartGeneration("template", name, desc, tags)}
          isGenerating={isGenerating}
        />
      </div>

      {/* 6. Why DevCanvas Feature Grid */}
      <FeatureGrid />

      {/* Empty State warning for new users */}
      {!projectsLoading && (!projectsData || projectsData.length === 0) && (
        <div className="bg-[#121319] border border-dashed border-white/10 rounded-xl p-8 text-center space-y-4 max-w-lg mx-auto">
          <div className="h-12 w-12 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">No active projects found</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Describe your idea in the prompt generator above or select one of the pre-configured SaaS, AI, or CRM templates to initialize your workspace.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
