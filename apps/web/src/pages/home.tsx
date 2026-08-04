import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import LineWaves from "@/components/ui/LineWaves";
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
  ArrowRight,
  Check
} from "lucide-react";
import { useCreateProject } from "@/lib/queries/projects";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/cn";

// --- Feature Colors for Why DevCanvas ---
const FEATURE_COLORS = {
  cyan: {
    glow: "rgba(6, 182, 212, 0.12)",
    iconBg: "from-cyan-500/20 to-blue-500/10",
    borderGlow: "rgba(6, 182, 212, 0.25)",
    text: "text-cyan-400"
  },
  deepBlue: {
    glow: "rgba(29, 78, 216, 0.12)",
    iconBg: "from-blue-600/20 to-indigo-500/10",
    borderGlow: "rgba(29, 78, 216, 0.25)",
    text: "text-blue-400"
  },
  emerald: {
    glow: "rgba(16, 185, 129, 0.12)",
    iconBg: "from-emerald-500/20 to-teal-500/10",
    borderGlow: "rgba(16, 185, 129, 0.25)",
    text: "text-emerald-400"
  },
  orange: {
    glow: "rgba(249, 115, 22, 0.12)",
    iconBg: "from-orange-500/20 to-amber-500/10",
    borderGlow: "rgba(249, 115, 22, 0.25)",
    text: "text-orange-400"
  },
  blue: {
    glow: "rgba(59, 130, 246, 0.12)",
    iconBg: "from-blue-500/20 to-sky-500/10",
    borderGlow: "rgba(59, 130, 246, 0.25)",
    text: "text-blue-400"
  },
  teal: {
    glow: "rgba(20, 184, 166, 0.12)",
    iconBg: "from-teal-500/20 to-emerald-500/10",
    borderGlow: "rgba(20, 184, 166, 0.25)",
    text: "text-teal-400"
  },
  amber: {
    glow: "rgba(245, 158, 11, 0.12)",
    iconBg: "from-amber-500/20 to-orange-500/10",
    borderGlow: "rgba(245, 158, 11, 0.25)",
    text: "text-amber-400"
  },
  slate: {
    glow: "rgba(148, 163, 184, 0.12)",
    iconBg: "from-slate-500/20 to-zinc-500/10",
    borderGlow: "rgba(148, 163, 184, 0.25)",
    text: "text-slate-400"
  }
};

interface FeatureCardProps {
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
  theme: typeof FEATURE_COLORS.cyan;
}

export const DevCanvasFeatureCard = React.memo(({
  title,
  desc,
  icon: Icon,
  theme
}: FeatureCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative rounded-[24px] p-7 overflow-hidden flex flex-col h-full min-h-[260px] border border-white/[0.03] bg-gradient-to-b from-neutral-900/60 to-neutral-950/60 backdrop-blur-lg cursor-pointer"
      style={{
        boxShadow: isHovered 
          ? `0 15px 30px -10px rgba(0, 0, 0, 0.8), 0 0 40px -10px ${theme.borderGlow}`
          : "0 8px 24px -12px rgba(0, 0, 0, 0.5)",
      }}
      animate={{
        y: isHovered ? -6 : 0,
        scale: isHovered ? 1.02 : 1,
        borderColor: isHovered ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.03)",
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      
    >
      {/* Background Soft Glow */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 50% 120%, ${theme.glow} 0%, transparent 70%)`,
        }}
        animate={{
          opacity: isHovered ? 1 : 0.6,
        }}
      />

      {/* Transparent Grid overlay */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:16px_16px]" />

      {/* Large Background Icon Watermark */}
      <motion.div 
        className="absolute bottom-[-24px] right-[-24px] z-0 opacity-[0.03] pointer-events-none select-none"
        animate={{
          rotate: isHovered ? -15 : -5,
          scale: isHovered ? 1.1 : 1,
          opacity: isHovered ? 0.05 : 0.03
        }}
        transition={{ type: "spring", stiffness: 150, damping: 25 }}
      >
        <Icon className={`w-36 h-36 ${theme.text}`} />
      </motion.div>

      {/* Light sheen overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-tr from-white/0 via-white/[0.01] to-white/[0.04] opacity-50" />

      {/* Content */}
      <div className="relative z-20 flex flex-col h-full flex-grow">
        {/* Large Modern Icon Container */}
        <motion.div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.iconBg} border border-white/5 flex items-center justify-center mb-5`}
          animate={{
            rotate: isHovered ? 8 : 0,
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <Icon className={`w-5 h-5 ${theme.text}`} />
        </motion.div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white tracking-tight mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs text-neutral-450 leading-relaxed font-light mb-6 flex-grow">
          {desc}
        </p>

        {/* Learn More button with arrow */}
        <div className="flex items-center gap-1.5 mt-auto text-xs font-semibold text-white/70 hover:text-white cursor-pointer transition-colors duration-200">
          <span>Learn More</span>
          <motion.div
            animate={{ x: isHovered ? 4 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <ArrowRight className={`w-3.5 h-3.5 ${theme.text}`} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

DevCanvasFeatureCard.displayName = "DevCanvasFeatureCard";

const WHY_DEVCANVAS_DATA = [
  {
    title: "AI Powered Development",
    desc: "Generate production-grade full-stack features from simple prompts inside our editor context.",
    icon: Cpu,
    theme: FEATURE_COLORS.cyan
  },
  {
    title: "Architecture Planning",
    desc: "Visualize node relationship hierarchies and cloud hosting graphs automatically.",
    icon: Workflow,
    theme: FEATURE_COLORS.deepBlue
  },
  {
    title: "Database Visualizer",
    desc: "Inspect live relation entities tables, write schemas, and generate migration scripts.",
    icon: Database,
    theme: FEATURE_COLORS.emerald
  },
  {
    title: "API Builder",
    desc: "Construct fully document-mapped REST, GraphQL, or gRPC endpoints in seconds.",
    icon: Code2,
    theme: FEATURE_COLORS.orange
  },
  {
    title: "Project Workspace",
    desc: "Centralize your staging deployments, cloud secrets, and team task boards.",
    icon: FolderKanban,
    theme: FEATURE_COLORS.blue
  },
  {
    title: "Real-time Collaboration",
    desc: "Live-pair with developers synchronously on workspace editor environments.",
    icon: Users,
    theme: FEATURE_COLORS.teal
  },
  {
    title: "One-click Deployment",
    desc: "Stage or push production releases instantly via optimized edge hosting pipelines.",
    icon: Zap,
    theme: FEATURE_COLORS.cyan
  },
  {
    title: "Enterprise Security",
    desc: "Built-in audit trails, key rotations, and fine-grained role permissions.",
    icon: Shield,
    theme: FEATURE_COLORS.amber
  },
  {
    title: "Scalable Infrastructure",
    desc: "Elastic serverless hosting that maps and scales dynamically with consumer demands.",
    icon: Layers,
    theme: FEATURE_COLORS.slate
  }
];

// --- Workspace Illustration ---
const WorkspaceIllustration = () => {
  return (
    <div className="relative w-full h-[320px] rounded-2xl border border-white/5 bg-[#080b11]/80 backdrop-blur-md overflow-hidden p-4 shadow-2xl flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-neutral-800" />
          <div className="w-2 h-2 rounded-full bg-neutral-800" />
          <div className="w-2 h-2 rounded-full bg-neutral-800" />
        </div>
        <div className="text-[10px] text-neutral-500 font-mono tracking-wide">editor.tsx — devcanvas</div>
        <div className="w-4 h-4" />
      </div>

      <div className="flex-1 flex gap-4 min-h-0 relative">
        {/* Left pane: file tree mockup */}
        <div className="w-1/4 border-r border-white/5 pr-3 hidden sm:flex flex-col gap-2 shrink-0">
          <div className="w-full h-3.5 bg-white/5 rounded-md" />
          <div className="w-4/5 h-3 bg-white/5 rounded-md ml-3" />
          <div className="w-3/4 h-3 bg-white/5 rounded-md ml-3" />
          <div className="w-5/6 h-3 bg-white/10 rounded-md ml-3 border-l border-cyan-500/40 pl-1.5" />
          <div className="w-2/3 h-3 bg-white/5 rounded-md ml-3" />
        </div>

        {/* Main code editor space */}
        <div className="flex-1 flex flex-col font-mono text-[10.5px] leading-relaxed text-neutral-450 select-none overflow-hidden relative">
          <div className="flex items-center gap-1 text-cyan-400"><span className="text-neutral-500">1</span> <span className="text-blue-400">import</span> React <span className="text-blue-400">from</span> <span className="text-emerald-400">"react"</span>;</div>
          <div className="flex items-center gap-1"><span className="text-neutral-500">2</span> <span className="text-blue-400">const</span> DevCanvas = () =&gt; &#123;</div>
          <div className="flex items-center gap-1"><span className="text-neutral-500">3</span> &nbsp;&nbsp;<span className="text-blue-400">return</span> (</div>
          <div className="flex items-center gap-1 text-indigo-400"><span className="text-neutral-500">4</span> &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-blue-400">Workspace</span>&gt;</div>
          <div className="flex items-center gap-1"><span className="text-neutral-500">5</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-blue-400">AIBuilder</span></div>
          <div className="flex items-center gap-1 text-amber-500"><span className="text-neutral-500">6</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;engine=<span className="text-emerald-400">"agentic"</span></div>
          <div className="flex items-center gap-1 text-cyan-400"><span className="text-neutral-500">7</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;model=<span className="text-emerald-400">"gemini-3.5"</span></div>
          <div className="flex items-center gap-1"><span className="text-neutral-500">8</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&gt;</div>
          <div className="flex items-center gap-1"><span className="text-neutral-500">9</span> &nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-blue-400">Workspace</span>&gt;</div>
          <div className="flex items-center gap-1"><span className="text-neutral-500">10</span> &nbsp;&nbsp;);</div>
          <div className="flex items-center gap-1"><span className="text-neutral-500">11</span> &#125;;</div>

          {/* Floating UI Elements */}
          <motion.div
            className="absolute bottom-6 right-6 p-3 rounded-xl border border-emerald-500/20 bg-neutral-950/80 shadow-lg flex items-center gap-2.5"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-500 uppercase font-mono">DB Query</span>
              <span className="text-xs font-bold text-white">12ms latency</span>
            </div>
          </motion.div>

          <motion.div
            className="absolute top-12 right-6 p-3 rounded-xl border border-cyan-500/20 bg-neutral-950/80 shadow-lg flex items-center gap-2.5"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-500 uppercase font-mono">API Test</span>
              <span className="text-xs font-bold text-white">200 OK</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// --- Gradient Themes for Premium Cards ---
const GRADIENT_THEMES = {
  indigo: {
    glowColor: "rgba(99, 102, 241, 0.15)",
    themeColor: "text-indigo-400",
    borderGlow: "rgba(99, 102, 241, 0.3)",
    iconBg: "from-indigo-500/20 to-purple-500/10",
    bgGradient: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.02) 100%)",
    badgeBg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    statusDot: "bg-indigo-500",
  },
  purple: {
    glowColor: "rgba(168, 85, 247, 0.15)",
    themeColor: "text-purple-400",
    borderGlow: "rgba(168, 85, 247, 0.3)",
    iconBg: "from-purple-500/20 to-pink-500/10",
    bgGradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.02) 100%)",
    badgeBg: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    statusDot: "bg-purple-500",
  },
  blue: {
    glowColor: "rgba(59, 130, 246, 0.15)",
    themeColor: "text-blue-400",
    borderGlow: "rgba(59, 130, 246, 0.3)",
    iconBg: "from-blue-500/20 to-cyan-500/10",
    bgGradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(6, 182, 212, 0.02) 100%)",
    badgeBg: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    statusDot: "bg-blue-500",
  },
  emerald: {
    glowColor: "rgba(16, 185, 129, 0.15)",
    themeColor: "text-emerald-400",
    borderGlow: "rgba(16, 185, 129, 0.3)",
    iconBg: "from-emerald-500/20 to-teal-500/10",
    bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 184, 166, 0.02) 100%)",
    badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    statusDot: "bg-emerald-500",
  },
  orange: {
    glowColor: "rgba(249, 115, 22, 0.15)",
    themeColor: "text-orange-400",
    borderGlow: "rgba(249, 115, 22, 0.3)",
    iconBg: "from-orange-500/20 to-amber-500/10",
    bgGradient: "linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)",
    badgeBg: "bg-orange-500/10 text-orange-300 border-orange-500/20",
    statusDot: "bg-orange-500",
  },
  cyan: {
    glowColor: "rgba(6, 182, 212, 0.15)",
    themeColor: "text-cyan-400",
    borderGlow: "rgba(6, 182, 212, 0.3)",
    iconBg: "from-cyan-500/20 to-blue-500/10",
    bgGradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)",
    badgeBg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    statusDot: "bg-cyan-500",
  },
  pink: {
    glowColor: "rgba(236, 72, 153, 0.15)",
    themeColor: "text-pink-400",
    borderGlow: "rgba(236, 72, 153, 0.3)",
    iconBg: "from-pink-500/20 to-rose-500/10",
    bgGradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(244, 63, 94, 0.02) 100%)",
    badgeBg: "bg-pink-500/10 text-pink-300 border-pink-500/20",
    statusDot: "bg-pink-500",
  },
  sky: {
    glowColor: "rgba(14, 165, 233, 0.15)",
    themeColor: "text-sky-400",
    borderGlow: "rgba(14, 165, 233, 0.3)",
    iconBg: "from-sky-500/20 to-blue-500/10",
    bgGradient: "linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)",
    badgeBg: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    statusDot: "bg-sky-500",
  },
  violet: {
    glowColor: "rgba(139, 92, 246, 0.15)",
    themeColor: "text-violet-400",
    borderGlow: "rgba(139, 92, 246, 0.3)",
    iconBg: "from-violet-500/20 to-indigo-500/10",
    bgGradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.02) 100%)",
    badgeBg: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    statusDot: "bg-violet-500",
  },
  amber: {
    glowColor: "rgba(245, 158, 11, 0.15)",
    themeColor: "text-amber-400",
    borderGlow: "rgba(245, 158, 11, 0.3)",
    iconBg: "from-amber-500/20 to-orange-500/10",
    bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(249, 115, 22, 0.02) 100%)",
    badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    statusDot: "bg-amber-500",
  }
};

interface PremiumToolCardProps {
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
  badge: string;
  status: string;
  features: string[];
  gradientTheme: typeof GRADIENT_THEMES.indigo;
  actionText?: string;
}

export const PremiumToolCard = React.memo(({
  title,
  desc,
  icon: Icon,
  badge,
  status,
  features,
  gradientTheme,
  actionText = "Explore Tool"
}: PremiumToolCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useTransform(mouseY, [0, 1], [6, -6]);
  const rotateY = useTransform(mouseX, [0, 1], [-6, 6]);

  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const xVal = (e.clientX - rect.left) / width;
    const yVal = (e.clientY - rect.top) / height;

    mouseX.set(xVal);
    mouseY.set(yVal);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className="relative rounded-[28px] overflow-hidden flex flex-col h-full min-h-[420px] w-full border border-white/[0.04] bg-neutral-950/80 backdrop-blur-md"
      style={{
        transformStyle: "preserve-3d",
        boxShadow: isHovered 
          ? `0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 50px -10px ${gradientTheme.borderGlow}`
          : "0 10px 30px -15px rgba(0, 0, 0, 0.5)",
        background: gradientTheme.bgGradient,
        rotateX: rotateXSpring,
        rotateY: rotateYSpring,
      }}
      initial={{ y: 0 }}
      animate={{
        y: isHovered ? -6 : 0,
        perspective: 1000,
        borderColor: isHovered ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.04)",
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Soft Ambient Radial Glow Backdrop */}
      <motion.div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${gradientTheme.glowColor} 0%, transparent 60%)`,
        }}
        animate={{
          opacity: isHovered ? 0.6 : 0.4,
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay z-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glass sheen highlight reflection overlay */}
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.02) 100%)`,
        }}
        animate={{
          opacity: isHovered ? 1 : 0.6,
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-30 p-6 flex flex-col h-full flex-grow select-none">
        
        {/* Header row: Badge + Status */}
        <div className="flex items-center justify-between mb-5">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${gradientTheme.badgeBg}`}>
            {badge}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${gradientTheme.statusDot} animate-pulse`} />
            <span className="text-[10px] text-neutral-400 font-medium tracking-wide uppercase">{status}</span>
          </div>
        </div>

        {/* Icon & Title Row */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradientTheme.iconBg} border border-white/5 flex items-center justify-center shadow-inner`}>
            <Icon className={`w-5 h-5 ${gradientTheme.themeColor}`} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white tracking-tight leading-none mb-1">
              {title}
            </h3>
            <p className="text-[10px] text-neutral-500 font-medium font-mono uppercase tracking-wider">
              DevCanvas Tool
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-450 leading-relaxed font-light mb-5">
          {desc}
        </p>

        {/* Divider */}
        <div className="h-[1px] w-full bg-white/[0.05] mb-5" />

        {/* Feature bullets */}
        <div className="space-y-2.5 mb-6 flex-grow">
          {features.map((feat, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="p-0.5 rounded-full bg-white/5 border border-white/5">
                <Check className={`w-2.5 h-2.5 ${gradientTheme.themeColor}`} />
              </div>
              <span className="text-xs text-neutral-400 font-light truncate">{feat}</span>
            </div>
          ))}
        </div>

        {/* Bottom CTA Area */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="text-xs text-white font-medium">
            {actionText}
          </span>
          <motion.div
            className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center"
            animate={{
              x: isHovered ? 4 : 0,
              backgroundColor: isHovered ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)"
            }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <ArrowRight className={`w-3.5 h-3.5 ${gradientTheme.themeColor}`} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

PremiumToolCard.displayName = "PremiumToolCard";

const AI_TOOLS_DATA = [
  {
    title: "AI Chat",
    desc: "Context-aware conversational coder that designs and modifies codebase components interactively.",
    icon: MessageSquare,
    badge: "Core",
    status: "Active",
    features: ["Project context syncing", "Multi-file operations", "Session persistency"],
    theme: GRADIENT_THEMES.indigo
  },
  {
    title: "Code Review",
    desc: "Automatic verification of security flaws, performance degradation, and style guide deviations.",
    icon: FileSearch,
    badge: "Auditing",
    status: "Stable",
    features: ["PR auto-checks", "Vulnerability scans", "Linter rules matching"],
    theme: GRADIENT_THEMES.purple
  },
  {
    title: "SQL Generator",
    desc: "Translate normal descriptions into highly optimized query statements and Postgres structures.",
    icon: Database,
    badge: "Data",
    status: "Stable",
    features: ["Text-to-SQL compile", "Composite index mapping", "Migration script output"],
    theme: GRADIENT_THEMES.blue
  },
  {
    title: "Security Scanner",
    desc: "Scan codebase contents to identify leaked configuration secrets, credentials, and dependency CVEs.",
    icon: ShieldCheck,
    badge: "SecOps",
    status: "Secure",
    features: ["Secret leakage alert", "CVE dependency audit", "OWASP standard check"],
    theme: GRADIENT_THEMES.emerald
  },
  
  
  {
    title: "Documentation",
    desc: "Instantly create detailed readmes, API reference endpoints, and code blocks explanations.",
    icon: BookOpen,
    badge: "Docs",
    status: "Updated",
    features: ["JSDoc auto-generation", "Markdown exports", "Symbol descriptions"],
    theme: GRADIENT_THEMES.pink
  },
  {
    title: "Performance",
    desc: "Inspect client-side bundles, frame render times, and serverless response latency distributions.",
    icon: Activity,
    badge: "Insights",
    status: "New",
    features: ["Core Web Vitals scores", "Bundle sizes alerts", "Trace analytics graphs"],
    theme: GRADIENT_THEMES.sky
  },
  {
    title: "Deployment",
    desc: "Configure serverless mapping, edge CDN distribution routes, and target pipeline staging.",
    icon: Rocket,
    badge: "DevOps",
    status: "Active",
    features: ["CI/CD automated trigger", "Staging branch preview", "Failover routing"],
    theme: GRADIENT_THEMES.violet
  },
  {
    title: "Prompt Optimizer",
    desc: "Compress natural language tokens, structure system instructions, and design few-shot test cases.",
    icon: Wand2,
    badge: "Meta-AI",
    status: "Updated",
    features: ["Token cost reduction", "Few-shot templates selector", "Model target tuning"],
    theme: GRADIENT_THEMES.amber
  }
];

// --- Gradient Card Component ---
interface GradientCardProps {
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
  gradient?: string;
  actionText?: string;
  titleClassName?: string;
}

export function GradientCard({ title, desc, icon: Icon, gradient, actionText = "Learn More", titleClassName }: GradientCardProps) {
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
      {/* Transparent Grid overlay */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:16px_16px]" />

      {/* Large Background Icon Watermark */}
      <motion.div 
        className="absolute bottom-[-24px] right-[-24px] z-0 opacity-[0.03] pointer-events-none select-none text-white"
        animate={{
          rotate: isHovered ? -15 : -5,
          scale: isHovered ? 1.1 : 1,
          opacity: isHovered ? 0.05 : 0.03
        }}
        transition={{ type: "spring", stiffness: 150, damping: 25 }}
      >
        <Icon className="w-36 h-36" />
      </motion.div>

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
            className={cn("font-medium text-white mb-2", titleClassName || "text-lg font-sans")}
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

  // --- Dynamic Typing Placeholder Effect ---
  const placeholderSentences = [
    "A multi-tenant SaaS platform with custom subscription plans...",
    "A subscription-based AI SaaS platform to generate audio tracks...",
    "A wealth management fintech platform with real-time ledger...",
    "A modern digital marketplace with product catalog search and cart...",
    "An enterprise CRM with pipeline deal boards and lead scoring..."
  ];
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: any;
    const currentSentence = placeholderSentences[sentenceIdx];

    if (!isDeleting && charIdx < currentSentence.length) {
      // Type next character
      timer = setTimeout(() => {
        setCurrentPlaceholder(currentSentence.substring(0, charIdx + 1));
        setCharIdx((prev) => prev + 1);
      }, 50); // typing speed
    } else if (isDeleting && charIdx > 0) {
      // Delete last character
      timer = setTimeout(() => {
        setCurrentPlaceholder(currentSentence.substring(0, charIdx - 1));
        setCharIdx((prev) => prev - 1);
      }, 25); // deleting speed
    } else if (!isDeleting && charIdx === currentSentence.length) {
      // Pause at full sentence before deleting
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2000); // pause duration at end
    } else if (isDeleting && charIdx === 0) {
      // Done deleting, go to next sentence
      setIsDeleting(false);
      setSentenceIdx((prev) => (prev + 1) % placeholderSentences.length);
    }

    return () => clearTimeout(timer);
  }, [charIdx, isDeleting, sentenceIdx]);

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
        <div className="space-y-2 max-w-8xl">
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
                placeholder={currentPlaceholder || ""}
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

      <div className="relative z-10 w-full space-y-32 pt-20">
        
        {/* SECTION 1: AI GENERATORS */}
        <section className="relative max-w-6xl mx-auto px-8 py-16 rounded-[32px] overflow-hidden border border-white/[0.05] bg-neutral-950/40 backdrop-blur-md">
          {/* Background LineWaves overlay */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
            <LineWaves
              speed={0.2}
              innerLineCount={28}
              outerLineCount={32}
              warpIntensity={0.8}
              rotation={-35}
              edgeFadeWidth={0.1}
              colorCycleSpeed={0.5}
              brightness={0.15}
              color1="#3b82f6"
              color2="#8b5cf6"
              color3="#ffffff"
              enableMouseInteraction={true}
              mouseInfluence={1.5}
            />
          </div>
          
          <div className="relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-instrument italic font-semibold text-white mb-4 text-glow">
                Ready to Explore Features Of DevCanvas AI Platform ?
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto text-lg">
                Purpose-built AI models trained to generate production-ready code, beautiful UI, and scalable architecture.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          </div>
        </section>

        {/* SECTION 2: AI TOOLS */}
        <section className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-6xl font-instrument italic font-semibold text-white mb-5 text-glow">
              DevAI Engineering Suite
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Build faster with intelligent AI tools designed to architect, generate production-ready software—all from one unified workspace.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {AI_TOOLS_DATA.map((item, i) => (
              <PremiumToolCard
                key={i}
                title={item.title}
                desc={item.desc}
                icon={item.icon}
                badge={item.badge}
                status={item.status}
                features={item.features}
                gradientTheme={item.theme}
                actionText="Explore Tool"
              />
            ))}
          </div>
        </section>

        {/* SECTION 3: WHY DEVCANVAS */}
        <section className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-6xl font-instrument italic font-semibold text-white mb-4 text-glow">
              Why Teams Choose DevCanvas
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              The ultimate platform for turning ideas into scalable, production-ready applications.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {WHY_DEVCANVAS_DATA.map((item, i) => (
              <DevCanvasFeatureCard
                key={i}
                title={item.title}
                desc={item.desc}
                icon={item.icon}
                theme={item.theme}
              />
            ))}
          </div>
        </section>

        {/* SECTION 4: FINAL CTA */}
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 w-full pb-16">
          <section className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-[#090b10] via-[#07090c] to-[#050505] border border-white/10 p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-[0_0_80px_-20px_rgba(59,130,246,0.15)]">
            {/* Background LineWaves overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
              <LineWaves
                speed={0.25}
                innerLineCount={30}
                outerLineCount={34}
                warpIntensity={0.9}
                rotation={-40}
                edgeFadeWidth={0.0}
                colorCycleSpeed={0.8}
                brightness={0.2}
                color1="#3b82f6"
                color2="#06b6d4"
                color3="#ffffff"
                enableMouseInteraction={true}
                mouseInfluence={1.8}
              />
            </div>
            
            {/* Dev Grid background overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="relative z-10 max-w-xl">
              <h2 className="text-4xl md:text-5xl font-instrument italic font-bold text-white mb-5 leading-[1.15] text-glow">
                Ready to build something amazing?
              </h2>
              <p className="text-white/60 text-sm md:text-base leading-relaxed mb-8 font-light max-w-lg">
                Build and deploy production-ready software using DevCanvas' intelligent agentic workspace environment.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ y: 0 }}
                  onClick={() => handleStartGeneration()}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition-all cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  Create Project
                </motion.button>
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ y: 0 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 text-white font-semibold hover:bg-white/10 transition-all border border-white/10 cursor-pointer hover:shadow-[0_0_35px_-5px_rgba(59,130,246,0.25)]"
                >
                  Explore AI Tools
                </motion.button>
              </div>
            </div>

            <div className="relative z-10 w-full lg:w-1/2 max-w-md">
              <WorkspaceIllustration />
            </div>
          </section>
        </div>

      </div>
    </div>
    </>
  );
}

export default HomePage;
