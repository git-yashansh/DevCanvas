import { useEffect, useRef } from "react";
import gsap from "gsap";

interface GlowingDot {
  id: number;
  x: number; // percentage
  y: number; // percentage
  size: number; // px (1.5 to 3.5)
  baseOpacity: number;
}

// Generate 45 floating glowing star dots distributed across the screen
const GLOWING_DOTS: GlowingDot[] = Array.from({ length: 45 }, (_, i) => ({
  id: i,
  x: Math.floor(Math.sin(i * 12.3) * 45 + 50), // 5% to 95%
  y: Math.floor(Math.cos(i * 8.7) * 45 + 50),
  size: (i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1.5),
  baseOpacity: 0.15 + (i % 5) * 0.1,
}));

export function GraphiteAnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      // ── Animate twinkling & slow floating for glowing star dots ──
      dotsRef.current.forEach((el, index) => {
        if (!el || reducedMotion) return;

        // Twinkle pulse timeline
        gsap.to(el, {
          opacity: 0.7,
          scale: 1.4,
          duration: 2 + (index % 4),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.15,
        });

        // Gentle floating drifting timeline
        gsap.to(el, {
          y: (index % 2 === 0 ? "-=25" : "+=25"),
          x: (index % 3 === 0 ? "+=15" : "-=15"),
          duration: 10 + (index % 5) * 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.2,
        });
      });

      // ── Parallax Tracking on Mouse Move ──
      const quickSetters = dotsRef.current.map((el) => {
        if (!el) return null;
        return {
          xTo: gsap.quickTo(el, "x", { duration: 1.2, ease: "power2.out" }),
          yTo: gsap.quickTo(el, "y", { duration: 1.2, ease: "power2.out" }),
        };
      });

      function handleMouseMove(e: MouseEvent) {
        if (reducedMotion) return;
        const { clientX, clientY } = e;
        const xPercent = (clientX / window.innerWidth - 0.5) * 30;
        const yPercent = (clientY / window.innerHeight - 0.5) * 30;

        quickSetters.forEach((setter, i) => {
          if (!setter) return;
          const depth = 0.2 + (i % 4) * 0.25;
          setter.xTo(xPercent * depth);
          setter.yTo(yPercent * depth);
        });
      }

      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 overflow-hidden bg-[#09090B] z-0"
    >
      {/* ── Neutral Ambient Glow (#18181B / White opacity) ── */}
      <div
        className="absolute -top-40 left-1/2 h-[650px] w-[850px] -translate-x-1/2 rounded-full opacity-35 z-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.05) 0%, rgba(24, 24, 27, 0.15) 50%, transparent 75%)",
          filter: "blur(50px)",
        }}
      />

      {/* ── Precision Graphite Grid Lines (rgba(255,255,255,0.03)) ── */}
      <div
        className="absolute inset-0 z-0 opacity-80"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, rgba(0,0,0,1) 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, rgba(0,0,0,1) 0%, transparent 100%)",
        }}
      />

      {/* ── Floating Glowing Dots (Starfield) ── */}
      {GLOWING_DOTS.map((dot, i) => (
        <div
          key={dot.id}
          ref={(el) => (dotsRef.current[i] = el)}
          style={{
            top: `${dot.y}%`,
            left: `${dot.x}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            opacity: dot.baseOpacity,
            boxShadow: `0 0 ${dot.size * 3}px rgba(255, 255, 255, 0.8)`,
          }}
          className="absolute rounded-full bg-white z-0 pointer-events-none"
        />
      ))}

      {/* ── Subtle Noise Overlay ── */}
      <div className="absolute inset-0 bg-noise opacity-30 z-0" />
    </div>
  );
}
