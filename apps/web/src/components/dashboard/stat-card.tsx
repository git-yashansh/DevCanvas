import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { type LucideIcon } from "lucide-react";
import { cn } from "@utils/index";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "up" | "down" | "neutral";
  icon: LucideIcon;
  color: string;
  index?: number;
}

export function StatCard({
  label,
  value,
  delta,
  deltaType = "neutral",
  icon: Icon,
  color,
  index = 0,
}: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLParagraphElement>(null);
  const [displayValue, setDisplayValue] = useState<string | number>(typeof value === "number" ? 0 : value);

  // GSAP quickTo setters for 3D tilt & elevation
  const xToRef = useRef<gsap.QuickToFunc | null>(null);
  const yToRef = useRef<gsap.QuickToFunc | null>(null);
  const liftToRef = useRef<gsap.QuickToFunc | null>(null);

  // ── GSAP Counter Tween for Numbers ─────────────────────────
  useEffect(() => {
    const isNum = typeof value === "number" || (!isNaN(Number(value)) && String(value).trim() !== "" && isFinite(Number(value)));
    if (!isNum || !numberRef.current) {
      setDisplayValue(value);
      return;
    }

    const targetVal = typeof value === "number" ? value : parseFloat(String(value));
    const obj = { val: 0 };

    const tween = gsap.to(obj, {
      val: targetVal,
      duration: 0.9,
      ease: "power2.out",
      delay: 0.2 + index * 0.08,
      onUpdate: () => {
        setDisplayValue(Math.round(obj.val));
      },
    });

    return () => {
      tween.kill();
    };
  }, [value, index]);

  // ── GSAP 3D Tilt & Cursor Spotlight Setup ──────────────────
  useEffect(() => {
    if (!cardRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = cardRef.current;
    xToRef.current = gsap.quickTo(el, "rotateY", { duration: 0.4, ease: "power2.out" });
    yToRef.current = gsap.quickTo(el, "rotateX", { duration: 0.4, ease: "power2.out" });
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

    // Clamped rotateX / rotateY to ±6deg
    const rotateY = ((x - centerX) / centerX) * 6;
    const rotateX = -((y - centerY) / centerY) * 6;

    xToRef.current(rotateY);
    yToRef.current(rotateX);

    // Spotlight reposition
    if (spotlightRef.current) {
      spotlightRef.current.style.background = `radial-gradient(280px circle at ${x}px ${y}px, rgba(255, 255, 255, 0.12), transparent 70%)`;
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

  const deltaColor =
    deltaType === "up"
      ? "text-emerald-400"
      : deltaType === "down"
        ? "text-red-400"
        : "text-white/40";

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      className="glass-card stat-card-anim group relative overflow-hidden rounded-2xl p-5 cursor-pointer bg-noise"
    >
      {/* ── Inner Cursor Spotlight Overlay ── */}
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-10"
      />

      <div className="relative z-20 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
            {label}
          </p>
          <p
            ref={numberRef}
            className="mt-2 font-heading text-3xl font-bold tracking-tight text-white"
          >
            {displayValue}
          </p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 shadow-inner transition-transform duration-300 group-hover:scale-110",
            color
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      {delta ? (
        <div className="relative z-20 mt-3 flex items-center gap-1.5 text-xs font-medium">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              deltaType === "up" ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : deltaType === "down" ? "bg-red-400" : "bg-white/30"
            )}
          />
          <span className={deltaColor}>{delta}</span>
        </div>
      ) : null}
    </div>
  );
}
