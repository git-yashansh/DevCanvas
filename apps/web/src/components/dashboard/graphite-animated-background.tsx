import { useEffect, useRef } from "react";
import gsap from "gsap";

interface GlowingDot {
  id: number;
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
}

const GLOWING_DOTS: GlowingDot[] = Array.from({ length: 45 }, (_, i) => ({
  id: i,
  x: Math.floor(Math.sin(i * 12.3) * 45 + 50),
  y: Math.floor(Math.cos(i * 8.7) * 45 + 50),
  size: i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1.5,
  baseOpacity: 0.15 + (i % 5) * 0.1,
}));

export function GraphiteAnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      dotsRef.current.forEach((el, index) => {
        if (!el) return;

        gsap.to(el, {
          opacity: 0.7,
          scale: 1.3,
          duration: 2 + (index % 4),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          force3D: true,
        });

        gsap.to(el, {
          x: index % 2 ? 15 : -15,
          y: index % 3 ? 20 : -20,
          duration: 12 + (index % 5),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          force3D: true,
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="
        absolute
        inset-0
        overflow-hidden
        pointer-events-none
        -z-10
        select-none
      "
      style={{
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#09090B",
        }}
      />

      <div
        className="absolute -top-40 left-1/2 h-[650px] w-[850px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(circle,rgba(255,255,255,.05) 0%,rgba(24,24,27,.12) 45%,transparent 75%)",
          filter: "blur(55px)",
          transform: "translate3d(-50%, 0, 0)",
          willChange: "transform",
        }}
      />

      {/* Sidebar area ambient glow to catch the glass blur */}
      <div
        className="absolute top-1/4 -left-[150px] h-[600px] w-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, transparent 70%)",
          filter: "blur(60px)",
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      />

      {/* Topbar area ambient glow to catch the glass blur */}
      <div
        className="absolute top-0 left-0 w-full h-[150px] pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.015), transparent)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,.035) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          transform:
            "perspective(700px) rotateX(60deg) translateY(-22%) scale(1.5) translateZ(0)",
          transformOrigin: "top center",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, black 0%, transparent 100%)",
          willChange: "transform",
        }}
      />

      {GLOWING_DOTS.map((dot, i) => (
        <div
          key={dot.id}
          ref={(el) => {
            dotsRef.current[i] = el;
          }}
          className="absolute rounded-full bg-white"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            opacity: dot.baseOpacity,
            boxShadow: `0 0 ${dot.size * 3}px rgba(255,255,255,.7)`,
            willChange: "transform, opacity",
            transform: "translateZ(0)",
          }}
        />
      ))}

      <div className="absolute inset-0 bg-noise opacity-25" />
    </div>
  );
}