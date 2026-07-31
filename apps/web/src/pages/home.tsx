import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Plus,
  ChevronRight,
  Boxes,
  Bot,
  CreditCard,
  ShoppingCart,
  Layout,
  MonitorSmartphone,
  LayoutTemplate,
  Database,
  Server,
  Laptop,
  Code2,
  Network,
  FileText,
  Cloud,
  Smartphone,
  MessageSquare,
  FileSearch,
  ShieldCheck,
  Bug,
  TestTube,
  BookOpen,
  Activity,
  Rocket,
  Wand2,
  Cpu,
  Workflow,
  FolderKanban,
  Users,
  Zap,
  Shield,
  Layers,
  ArrowRight
} from "lucide-react";
import { useCreateProject } from "@/lib/queries/projects";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/cn";

// --- Gradient Card Component ---
interface GradientCardProps {
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
  gradient?: string;
  actionText?: string;
}

export function GradientCard({ title, desc, icon: Icon, gradient, actionText = "Learn More" }: GradientCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const rotateX = -(y / rect.height) * 8;
      const rotateY = (x / rect.width) * 8;
      setRotation({ x: rotateX, y: rotateY });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative rounded-[24px] overflow-hidden flex flex-col h-full min-h-[280px] w-full"
      style={{
        transformStyle: "preserve-3d",
        backgroundColor: "#0e131f",
        boxShadow: "0 -10px 100px 10px rgba(78, 99, 255, 0.15), 0 0 10px 0 rgba(0, 0, 0, 0.5)",
      }}
      initial={{ y: 0 }}
      animate={{
        y: isHovered ? -5 : 0,
        rotateX: rotation.x,
        rotateY: rotation.y,
        perspective: 1000,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Subtle glass reflection overlay */}
      <motion.div
        className="absolute inset-0 z-30 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.05) 100%)",
          backdropFilter: "blur(2px)",
        }}
        animate={{
          opacity: isHovered ? 0.7 : 0.5,
          rotateX: -rotation.x * 0.2,
          rotateY: -rotation.y * 0.2,
          z: 1,
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      />

      {/* Dark background with black gradient */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(180deg, #000000 0%, #000000 70%)",
        }}
        animate={{
          z: -1
        }}
      />

      {/* Noise texture overlay */}
      <motion.div
        className="absolute inset-0 opacity-20 mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
        animate={{
          z: -0.5
        }}
      />

      {/* Subtle finger smudge texture for realism */}
      <motion.div
        className="absolute inset-0 opacity-[0.06] mix-blend-soft-light z-11 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='smudge'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='3' seed='5' stitchTiles='stitch'/%3E%3CfeGaussianBlur stdDeviation='10'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23smudge)'/%3E%3C/svg%3E")`,
          backdropFilter: "blur(1px)",
        }}
        animate={{
          z: -0.25
        }}
      />

      {/* Purple/blue glow effect */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-2/3 z-20"
        style={{
          background: `
            radial-gradient(ellipse at bottom right, rgba(172, 92, 255, 0.5) -10%, rgba(79, 70, 229, 0) 70%),
            radial-gradient(ellipse at bottom left, rgba(56, 189, 248, 0.5) -10%, rgba(79, 70, 229, 0) 70%)
          `,
          filter: "blur(30px)",
        }}
        animate={{
          opacity: isHovered ? 0.9 : 0.8,
          y: isHovered ? rotation.x * 0.5 : 0,
          z: 0
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      />

      {/* Central purple glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-2/3 z-21"
        style={{
          background: `
            radial-gradient(circle at bottom center, rgba(161, 58, 229, 0.5) -20%, rgba(79, 70, 229, 0) 60%)
          `,
          filter: "blur(35px)",
        }}
        animate={{
          opacity: isHovered ? 0.85 : 0.75,
          y: isHovered ? `calc(10% + ${rotation.x * 0.3}px)` : "10%",
          z: 0
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      />

      {/* Bottom border glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] z-25"
        style={{
          background: "linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.05) 100%)",
        }}
        animate={{
          boxShadow: isHovered
            ? "0 0 20px 4px rgba(172, 92, 255, 0.8), 0 0 30px 6px rgba(138, 58, 185, 0.6), 0 0 40px 8px rgba(56, 189, 248, 0.4)"
            : "0 0 15px 3px rgba(172, 92, 255, 0.6), 0 0 25px 5px rgba(138, 58, 185, 0.5), 0 0 35px 7px rgba(56, 189, 248, 0.3)",
          opacity: isHovered ? 1 : 0.9,
          z: 0.5
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      />

      {/* Card content */}
      <motion.div
        className="relative flex flex-col h-full p-6 z-40"
        animate={{
          z: 2
        }}
      >
        {/* Icon container */}
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
          style={{
            background: "linear-gradient(225deg, #171c2c 0%, #121624 100%)",
            position: "relative",
            overflow: "hidden"
          }}
          animate={{
            boxShadow: isHovered
              ? "0 8px 16px -2px rgba(0, 0, 0, 0.3), 0 4px 8px -1px rgba(0, 0, 0, 0.2), inset 2px 2px 5px rgba(255, 255, 255, 0.15), inset -2px -2px 5px rgba(0, 0, 0, 0.7)"
              : "0 6px 12px -2px rgba(0, 0, 0, 0.25), 0 3px 6px -1px rgba(0, 0, 0, 0.15), inset 1px 1px 3px rgba(255, 255, 255, 0.12), inset -2px -2px 4px rgba(0, 0, 0, 0.5)",
            z: isHovered ? 10 : 5,
            y: isHovered ? -2 : 0,
            rotateX: isHovered ? -rotation.x * 0.5 : 0,
            rotateY: isHovered ? -rotation.y * 0.5 : 0
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut"
          }}
        >
          <div
            className="absolute top-0 left-0 w-2/3 h-2/3 opacity-40"
            style={{
              background: "radial-gradient(circle at top left, rgba(255, 255, 255, 0.5), transparent 80%)",
              pointerEvents: "none",
              filter: "blur(6px)"
            }}
          />
          <div className="flex items-center justify-center w-full h-full relative z-10">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </motion.div>

        {/* Content text */}
        <motion.div
          className="flex flex-col h-full"
          animate={{
            z: isHovered ? 5 : 2,
            rotateX: isHovered ? -rotation.x * 0.3 : 0,
            rotateY: isHovered ? -rotation.y * 0.3 : 0
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut"
          }}
        >
          <motion.h3
            className="text-lg font-medium text-white mb-2"
            style={{
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
            animate={{
              textShadow: isHovered ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
            }}
          >
            {title}
          </motion.h3>

          <motion.p
            className="text-xs mb-4 text-gray-400 font-light flex-grow"
            style={{
              lineHeight: 1.5,
            }}
            animate={{
              opacity: isHovered ? 0.95 : 0.8,
            }}
          >
            {desc}
          </motion.p>

          {/* Action button / link */}
          <motion.div
            className="inline-flex items-center text-white/70 text-[11px] font-medium group cursor-pointer mt-auto"
            whileHover={{
              filter: "drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))",
              color: "#ffffff"
            }}
          >
            <span>{actionText}</span>
            <motion.svg
              className="ml-1 w-3.5 h-3.5"
              width="8"
              height="8"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{
                x: isHovered ? 3 : 0
              }}
              transition={{
                duration: 0.6,
                ease: "easeOut"
              }}
            >
              <path
                d="M1 8H15M15 8L8 1M15 8L8 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function HomePage() {
  const { profile, user } = useAuth();
  const createProjectMutation = useCreateProject();
  const navigate = useNavigate();

  const [promptText, setPromptText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updatePromptText = (val: string) => {
    setPromptText(val);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, 0);
  };

  const handleStartGeneration = async (
    customName?: string,
    customDesc?: string,
    customTags?: string[]
  ) => {
    const name =
      customName ||
      (promptText.trim().split(" ").slice(0, 3).join(" ") || "New Project");
    const desc = customDesc || promptText.trim();

    if (!desc) return;

    setIsGenerating(true);
    try {
      const newProj = await createProjectMutation.mutateAsync({
        name,
        description: desc || "Pre-configured project template.",
        tags: customTags || ["AI SaaS", "API Spec", "Web Framework"],
      });
      navigate(`/app/projects/${newProj.id}`);
    } catch (err) {
      console.error("Failed to generate project: ", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const examplePrompts = [
    {
      label: "SaaS Platform",
      prompt:
        "A multi-tenant SaaS platform with custom subscription plans and Stripe billing.",
      icon: Layout,
    },
    {
      label: "AI SaaS",
      prompt:
        "A subscription-based AI SaaS platform where users input text prompts to generate audio tracks.",
      icon: Bot,
    },
    {
      label: "Fintech",
      prompt:
        "A secure wealth management fintech platform featuring KYC checks and real-time ledger synchronization.",
      icon: CreditCard,
    },
    {
      label: "E-commerce",
      prompt:
        "A modern digital marketplace with product catalog search, shopping carts, and Checkout API integration.",
      icon: ShoppingCart,
    },
    {
      label: "CRM",
      prompt:
        "An enterprise CRM with pipeline deal boards, lead scoring mechanisms, and team collaboration logs.",
      icon: Boxes,
    },
  ];

  const navLinks = ["About", "Services", "Journal", "Contact"];

  return (
    <>
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0608] text-white font-inter select-none">
      {/* ── 1. Background Video ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-80 pointer-events-none"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4"
      />

      {/* ── 2. Dark Overlay ── */}
      <div className="absolute inset-0 bg-black/35 z-10 pointer-events-none" />

      {/* ── 3. Main Center Content with AI Search Bar (Shifted up with wider text) ── */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-6 text-center pt-8 pb-12 max-w-6xl mx-auto space-y-8 -mt-10">
        {/* Main Heading */}
        <div className="space-y-3 max-w-5xl">
          <h1 className="font-instrument italic text-white text-4xl sm:text-6xl md:text-7xl lg:text-[92px] leading-[0.95] tracking-wide text-glow select-none">
            Describe what you want to build?
          </h1>
          <p className="text-white/70 text-sm sm:text-base text-center max-w-2xl mx-auto font-normal leading-relaxed">
            Turn your ideas into production-ready software{" "}
            <span className="text-white font-medium">with the power of AI.</span>
          </p>
        </div>

        {/* ── AI Search Area with Ambient Aura Light ── */}
        <div className="w-full max-w-3xl mt-4 relative z-20 search-container-wrapper">
          {/* Glowing Ambient Aura Backdrop */}
          <div className="absolute -inset-6 bg-gradient-to-r from-amber-500/25 via-pink-500/30 to-indigo-500/30 rounded-3xl blur-2xl opacity-75 pointer-events-none z-[-1]" />
          
          <div className="search-container-gradient">
            <div className="search-container-inner px-5 pt-5 pb-4 bg-[#0d1117]/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={promptText}
                onChange={(e) => updatePromptText(e.target.value)}
                placeholder="Describe what you want to build..."
                rows={2}
                className="w-full bg-transparent border-none outline-none text-[18px] font-normal text-white placeholder-white/40 resize-none min-h-[60px] max-h-[250px] font-sans leading-relaxed focus:ring-0 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleStartGeneration();
                  }
                }}
              />

              {/* Bottom Action Row */}
              <div className="flex items-center justify-between mt-3">
                {/* Left: Plus */}
                <div className="flex items-center gap-2">
                  <button className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Right: Create + Options */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={isGenerating || !promptText.trim()}
                    onClick={() => handleStartGeneration()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-sm font-medium transition-all cursor-pointer select-none border border-white/10"
                  >
                    <Sparkles
                      className={cn(
                        "h-3.5 w-3.5",
                        promptText.trim() ? "text-violet-400" : "text-neutral-400"
                      )}
                    />
                    <span>Create</span>
                  </button>
                  <button className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer">
                    <span className="text-[13px] font-bold tracking-wide select-none">
                      ···
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 relative z-20 text-xs">
          {examplePrompts.map((p, idx) => {
            const Icon = p.icon;
            return (
              <button
                key={idx}
                onClick={() => updatePromptText(p.prompt)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/15 bg-black/40 backdrop-blur-md hover:bg-white/10 hover:border-white/30 text-white/80 hover:text-white transition-all cursor-pointer select-none"
              >
                <Icon className="h-3.5 w-3.5 text-white/60" />
                <span>{p.label}</span>
              </button>
            );
          })}
          <button className="flex items-center gap-0.5 text-indigo-300 hover:text-white font-semibold px-2 py-1.5 transition-colors cursor-pointer">
            <span>More ideas</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>

    {/* ── NEW SECTIONS ── */}
    <div className="relative w-full bg-black text-white overflow-hidden pb-32">
      {/* Background for New Sections */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-1/4 w-[700px] h-[700px] bg-purple-900/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[20%] left-1/3 w-[500px] h-[500px] bg-orange-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 space-y-32 pt-20">
        
        {/* SECTION 1: AI GENERATORS */}
        <section>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-instrument italic font-semibold text-white mb-4 text-glow">
              Ready to Explore Features Of DevCanvas AI Platform ?
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Purpose-built AI models trained to generate production-ready code, beautiful UI, and scalable architecture.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              { title: "AI App Builder", desc: "End-to-end full stack web apps", icon: MonitorSmartphone },
              { title: "UI Generator", desc: "React & Tailwind components", icon: LayoutTemplate },
              { title: "Database Generator", desc: "Postgres schemas & migrations", icon: Database },
              { title: "API Generator", desc: "REST & GraphQL endpoints", icon: Code2 },
              { title: "Architecture", desc: "System design & cloud infra", icon: Network },
            ].map((item, i) => (
              <GradientCard
                key={i}
                title={item.title}
                desc={item.desc}
                icon={item.icon}
                actionText="Quick Launch"
  
              />
            ))}
          </div>
        </section>

        {/* SECTION 2: AI TOOLS */}
        <section>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-instrument italic font-semibold text-white mb-4 text-glow">
              AI Tools
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Supercharge your workflow with intelligent tools designed for modern development teams.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "AI Chat", desc: "Context-aware coding assistant", icon: MessageSquare },
              { title: "Code Review", desc: "Automated PR reviews & fixes", icon: FileSearch },
              { title: "SQL Generator", desc: "Natural language to complex queries", icon: Database },
              { title: "Security Scanner", desc: "Real-time vulnerability detection", icon: ShieldCheck },
              { title: "Bug Finder", desc: "Predictive bug analysis", icon: Bug },
              { title: "API Tester", desc: "Automated endpoint testing", icon: TestTube },
              { title: "Documentation", desc: "Auto-generated readmes & docs", icon: BookOpen },
              { title: "Performance", desc: "Lighthouse & bundle analysis", icon: Activity },
              { title: "Deployment", desc: "CI/CD & cloud configuration", icon: Rocket },
              { title: "Prompt Optimizer", desc: "Enhance AI generation results", icon: Wand2 },
            ].map((item, i) => (
              <GradientCard
                key={i}
                title={item.title}
                desc={item.desc}
                icon={item.icon}
                actionText="Learn More"
              />
            ))}
          </div>
        </section>

        {/* SECTION 3: WHY DEVCANVAS */}
        <section>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-instrument italic font-semibold text-white mb-4 text-glow">
              Why DevCanvas
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              The ultimate platform for turning ideas into scalable, production-ready applications.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "AI Powered Development", desc: "Generate full-stack applications in seconds with our advanced AI engine.", icon: Cpu },
              { title: "Architecture Planning", desc: "Visualize and design system architectures before writing a single line of code.", icon: Workflow },
              { title: "Database Visualizer", desc: "Design schemas, manage migrations, and interact with your data visually.", icon: Database },
              { title: "API Builder", desc: "Create robust REST and GraphQL APIs with auto-generated documentation.", icon: Code2 },
              { title: "Project Workspace", desc: "Manage all your resources, deployments, and team members in one place.", icon: FolderKanban },
              { title: "Real-time Collaboration", desc: "Work together with your team synchronously on code and architecture.", icon: Users },
              { title: "One-click Deployment", desc: "Push to production instantly with our managed edge infrastructure.", icon: Zap },
              { title: "Enterprise Security", desc: "Built-in RBAC, secret management, and compliance out of the box.", icon: Shield },
              { title: "Scalable Infrastructure", desc: "Applications that grow with you, powered by serverless and edge computing.", icon: Layers },
            ].map((item, i) => (
              <GradientCard
                key={i}
                title={item.title}
                desc={item.desc}
                icon={item.icon}
                actionText="Details"
              />
            ))}
          </div>
        </section>

        {/* SECTION 4: FINAL CTA */}
        <section className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black border border-white/10 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-xl">
            <h2 className="text-4xl md:text-6xl font-instrument italic font-bold text-white mb-6 leading-tight text-glow">
              Ready to build something amazing?
            </h2>
            <p className="text-white/70 text-lg mb-8">
              Join thousands of developers building production-ready software with the power of DevCanvas.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition-colors">
                <Sparkles className="w-4 h-4" />
                Create Project
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/10">
                Explore AI Tools
              </button>
            </div>
          </div>
          
          <div className="relative z-10 hidden lg:block w-full max-w-md">
            <div className="aspect-square rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 relative shadow-2xl flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10" />
              <div className="relative w-full h-full border border-white/5 rounded-2xl flex items-center justify-center p-8">
                 <div className="w-full h-full border border-white/10 rounded-xl relative shadow-[0_0_50px_rgba(99,102,241,0.2)] bg-[#0d1117] overflow-hidden">
                    <div className="absolute top-4 left-4 right-4 h-6 border-b border-white/10 flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                       <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <div className="absolute top-14 left-4 right-4 bottom-4 flex gap-4">
                       <div className="w-1/3 h-full bg-white/5 rounded-lg border border-white/5" />
                       <div className="w-2/3 h-full flex flex-col gap-4">
                         <div className="w-full h-1/2 bg-white/5 rounded-lg border border-white/5" />
                         <div className="w-full h-1/2 bg-white/5 rounded-lg border border-white/5" />
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
    </>
  );
}

export default HomePage;
