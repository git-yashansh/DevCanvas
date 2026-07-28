import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { MoreHorizontal, Boxes, Database, Code2, ShieldCheck } from "lucide-react";
import { Badge } from "@ui/index";
import { cn, formatRelative } from "@utils/index";
import type { Project, ProjectStatus } from "@types-pkg/index";

const statusConfig: Record<ProjectStatus, { label: string; variant: "default" | "success" | "warning" }> = {
  draft: { label: "Draft", variant: "warning" },
  active: { label: "Active", variant: "success" },
  archived: { label: "Archived", variant: "default" },
};

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const xToRef = useRef<gsap.QuickToFunc | null>(null);
  const yToRef = useRef<gsap.QuickToFunc | null>(null);
  const liftToRef = useRef<gsap.QuickToFunc | null>(null);

  // Calculate actual artifact count & present flags
  const pAny = project as any;
  const hasArch = Boolean(pAny.architecture);
  const hasDb = Boolean(pAny.database_schema);
  const hasApi = Boolean(pAny.api_spec);
  const hasSec = Boolean(pAny.security_report);
  const artifactCount = [hasArch, hasDb, hasApi, hasSec].filter(Boolean).length;

  // ── GSAP Entrance Reveal Animation ─────────────────────────
  useEffect(() => {
    if (!cardRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = cardRef.current;
    gsap.fromTo(
      el,
      { opacity: 0, y: 20, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        delay: index * 0.08,
        ease: "power2.out",
      }
    );
  }, [index]);

  // ── GSAP 3D Tilt Setup ─────────────────────────────────────
  useEffect(() => {
    if (!cardRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = cardRef.current;
    xToRef.current = gsap.quickTo(el, "rotateY", { duration: 0.35, ease: "power2.out" });
    yToRef.current = gsap.quickTo(el, "rotateX", { duration: 0.35, ease: "power2.out" });
    liftToRef.current = gsap.quickTo(el, "y", { duration: 0.3, ease: "power2.out" });
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !xToRef.current || !yToRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 5;
    const rotateX = -((y - centerY) / centerY) * 5;

    xToRef.current(rotateY);
    yToRef.current(rotateX);

    if (spotlightRef.current) {
      spotlightRef.current.style.background = `radial-gradient(300px circle at ${x}px ${y}px, rgba(255, 255, 255, 0.12), transparent 70%)`;
    }
  };

  const handleMouseEnter = () => {
    if (liftToRef.current) liftToRef.current(-6);
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        boxShadow: "0 20px 40px -15px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
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

  const status = statusConfig[project.status];

  const artifactIconItems = [
    { icon: Boxes, active: hasArch, color: "text-indigo-400" },
    { icon: Database, active: hasDb, color: "text-purple-400" },
    { icon: Code2, active: hasApi, color: "text-blue-400" },
    { icon: ShieldCheck, active: hasSec, color: "text-emerald-400" },
  ];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      className="glass-card group relative overflow-hidden rounded-2xl bg-noise cursor-pointer"
    >
      {/* Spotlight Overlay */}
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-10"
      />

      <Link
        to={`/app/projects/${project.id}`}
        className="relative z-20 block p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-heading text-base font-semibold text-white/90 transition-colors group-hover:text-indigo-300">
              {project.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-white/40 leading-relaxed">
              {project.description ?? "No description"}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/30 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {project.tags.length > 0 ? (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-white/50"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-3.5">
          <div className="flex items-center gap-1">
            {artifactIconItems.map(({ icon: Icon, active, color }, i) => (
              <span
                key={i}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06] border border-white/10 transition-colors",
                  active ? color : "text-white/20",
                )}
              >
                <Icon className="h-3 w-3" />
              </span>
            ))}
            <span className="ml-1.5 text-[11px] text-white/40 font-medium">
              {artifactCount} {artifactCount === 1 ? "artifact" : "artifacts"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="text-[11px] text-white/30">
              {formatRelative(project.updated_at)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 bg-noise">
      <div className="shimmer h-4 w-2/3 rounded-lg" />
      <div className="shimmer mt-3 h-3 w-full rounded-lg" />
      <div className="shimmer mt-2 h-3 w-3/4 rounded-lg" />
      <div className="mt-4 flex justify-between">
        <div className="shimmer h-6 w-24 rounded-lg" />
        <div className="shimmer h-5 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export function EmptyProjects() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-16 text-center backdrop-blur-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <Boxes className="h-6 w-6 text-indigo-400" />
      </div>
      <h3 className="mt-4 font-heading text-base font-semibold text-white/90">
        No projects yet
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-white/40 leading-relaxed">
        Create your first project to start generating architecture, schemas, and code with AI.
      </p>
    </div>
  );
}
