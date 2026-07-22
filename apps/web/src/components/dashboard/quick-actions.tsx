import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import {
  Boxes,
  Database,
  Code2,
  ShieldCheck,
  GitBranch,
  FileText,
  DollarSign,
  Network,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@utils/index";

interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
  accentBg: string;
}

const actions: QuickAction[] = [
  {
    id: "architecture",
    label: "Architecture",
    href: "/app/architecture",
    icon: Boxes,
    color: "text-indigo-400",
    accentBg: "from-indigo-500/20 to-indigo-500/5",
  },
  {
    id: "database",
    label: "Database",
    href: "/app/database",
    icon: Database,
    color: "text-purple-400",
    accentBg: "from-purple-500/20 to-purple-500/5",
  },
  {
    id: "api",
    label: "API Spec",
    href: "/app/api-generator",
    icon: Code2,
    color: "text-blue-400",
    accentBg: "from-blue-500/20 to-blue-500/5",
  },
  {
    id: "security",
    label: "Security",
    href: "/app/security",
    icon: ShieldCheck,
    color: "text-emerald-400",
    accentBg: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    id: "repo",
    label: "Repo Scan",
    href: "/app/repo",
    icon: GitBranch,
    color: "text-violet-400",
    accentBg: "from-violet-500/20 to-violet-500/5",
  },
  {
    id: "docs",
    label: "Docs",
    href: "/app",
    icon: FileText,
    color: "text-amber-400",
    accentBg: "from-amber-500/20 to-amber-500/5",
  },
  {
    id: "cost",
    label: "Cost",
    href: "/app",
    icon: DollarSign,
    color: "text-teal-400",
    accentBg: "from-teal-500/20 to-teal-500/5",
  },
  {
    id: "system-design",
    label: "System Design",
    href: "/app",
    icon: Network,
    color: "text-cyan-400",
    accentBg: "from-cyan-500/20 to-cyan-500/5",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      {actions.map((action, i) => (
        <QuickActionCard key={action.id} action={action} index={i} />
      ))}
    </div>
  );
}

function QuickActionCard({ action, index }: { action: QuickAction; index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const xToRef = useRef<gsap.QuickToFunc | null>(null);
  const yToRef = useRef<gsap.QuickToFunc | null>(null);
  const liftToRef = useRef<gsap.QuickToFunc | null>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = cardRef.current;
    xToRef.current = gsap.quickTo(el, "rotateY", { duration: 0.35, ease: "power2.out" });
    yToRef.current = gsap.quickTo(el, "rotateX", { duration: 0.35, ease: "power2.out" });
    liftToRef.current = gsap.quickTo(el, "y", { duration: 0.3, ease: "power2.out" });
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current || !xToRef.current || !yToRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 6;
    const rotateX = -((y - centerY) / centerY) * 6;

    xToRef.current(rotateY);
    yToRef.current(rotateX);

    if (spotlightRef.current) {
      spotlightRef.current.style.background = `radial-gradient(220px circle at ${x}px ${y}px, rgba(255, 255, 255, 0.12), transparent 70%)`;
    }
  };

  const handleMouseEnter = () => {
    if (liftToRef.current) liftToRef.current(-6);
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        boxShadow: "0 18px 36px -12px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        duration: 0.3,
      });
    }
  };

  const handleMouseLeave = () => {
    if (xToRef.current) xToRef.current(0);
    if (yToRef.current) yToRef.current(0);
    if (liftToRef.current) liftToRef.current(0);

    if (cardRef.current) {
      gsap.to(cardRef.current, {
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 10px 30px -10px rgba(0, 0, 0, 0.5)",
        duration: 0.4,
      });
    }
    if (spotlightRef.current) {
      spotlightRef.current.style.background = "none";
    }
  };

  return (
    <Link
      ref={cardRef}
      to={action.href}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      className="glass-card quick-action-anim group relative flex flex-col items-center justify-center gap-3 rounded-2xl p-5 cursor-pointer bg-noise text-center transition-all duration-300"
    >
      {/* ── Spotlight Overlay ────────────────────────────────────── */}
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-10"
      />

      {/* ── Centered Icon & Label Container ─────────────────────── */}
      <div className="relative z-20 flex flex-col items-center gap-3">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b shadow-inner backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:border-white/25",
            action.accentBg
          )}
        >
          <action.icon className={cn("h-6 w-6 transition-transform duration-300 group-hover:scale-105", action.color)} />
        </div>

        <span className="font-heading text-xs font-semibold text-white/80 tracking-wide transition-colors duration-200 group-hover:text-white">
          {action.label}
        </span>
      </div>
    </Link>
  );
}
