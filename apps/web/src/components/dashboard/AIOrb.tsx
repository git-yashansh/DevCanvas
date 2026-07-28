import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function AIOrb({ scale = 1 }: { scale?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 360;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2 - 15;
    const orbRadius = 85;

    const render = () => {
      time += 0.025;
      ctx.clearRect(0, 0, size, size);

      // ── 1. Bottom Floor Reflection ──
      const floorGrad = ctx.createRadialGradient(cx, cy + orbRadius + 18, 5, cx, cy + orbRadius + 18, 90);
      floorGrad.addColorStop(0, "rgba(56, 189, 248, 0.4)");
      floorGrad.addColorStop(0.3, "rgba(14, 116, 144, 0.2)");
      floorGrad.addColorStop(0.7, "rgba(30, 27, 75, 0.08)");
      floorGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy + orbRadius + 22, 95, 30, 0, 0, Math.PI * 2);
      ctx.fillStyle = floorGrad;
      ctx.fill();
      ctx.restore();

      // ── 2. Outer Soft Radial Ambient Glow ──
      const ambientGlow = ctx.createRadialGradient(cx, cy, orbRadius * 0.4, cx, cy, orbRadius * 1.8);
      ambientGlow.addColorStop(0, "rgba(14, 165, 233, 0.22)");
      ambientGlow.addColorStop(0.4, "rgba(99, 102, 241, 0.12)");
      ambientGlow.addColorStop(0.8, "rgba(15, 23, 42, 0.05)");
      ambientGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // ── 3. Translucent Glass Sphere Container ──
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);

      // Inner glass gradient fill
      const glassGrad = ctx.createRadialGradient(cx - 20, cy - 25, 10, cx, cy, orbRadius);
      glassGrad.addColorStop(0, "rgba(15, 23, 42, 0.3)");
      glassGrad.addColorStop(0.6, "rgba(10, 15, 30, 0.5)");
      glassGrad.addColorStop(1, "rgba(6, 9, 20, 0.8)");

      ctx.fillStyle = glassGrad;
      ctx.fill();

      // Thin Outer Glass Rim Stroke
      ctx.strokeStyle = "rgba(56, 189, 248, 0.28)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Clip inner space for flame plasma core
      ctx.clip();

      // ── 4. Inner Swirling Electric Flame Core ──
      for (let layer = 0; layer < 4; layer++) {
        ctx.save();
        ctx.beginPath();

        const layerTime = time * (1.2 + layer * 0.3);
        const flamePoints: [number, number][] = [];
        const numPts = 36;

        for (let i = 0; i <= numPts; i++) {
          const angle = (i / numPts) * Math.PI * 2;

          // Vertical flame pinch deformation (tapering towards top like screenshot 2)
          const isTop = Math.sin(angle) < 0;
          const verticalTaper = isTop ? 1.4 : 0.9;

          const n1 = Math.sin(angle * 3 + layerTime * 1.5) * 12;
          const n2 = Math.cos(angle * 5 - layerTime * 2.1) * 8;
          const n3 = Math.sin(angle * 2 + layerTime * 2.8) * 10;

          const r = (38 - layer * 5 + n1 + n2 + n3) * verticalTaper;
          const px = cx + Math.cos(angle) * r;
          const py = cy - 8 + Math.sin(angle) * r;

          flamePoints.push([px, py]);
        }

        // Draw smooth flame path
        ctx.moveTo(flamePoints[0][0], flamePoints[0][1]);
        for (let i = 1; i < flamePoints.length; i++) {
          const prev = flamePoints[i - 1];
          const curr = flamePoints[i];
          const midX = (prev[0] + curr[0]) / 2;
          const midY = (prev[1] + curr[1]) / 2;
          ctx.quadraticCurveTo(prev[0], prev[1], midX, midY);
        }
        ctx.closePath();

        // Layer gradient colors matching electric blue/cyan flame
        const flameGrad = ctx.createRadialGradient(
          cx + Math.sin(layerTime) * 12,
          cy - 12 + Math.cos(layerTime) * 10,
          2,
          cx,
          cy,
          55
        );

        if (layer === 0) {
          flameGrad.addColorStop(0, "#e0f2fe"); // Brightest White-Cyan Core
          flameGrad.addColorStop(0.3, "#38bdf8"); // Sky Cyan
          flameGrad.addColorStop(0.7, "#2563eb"); // Electric Blue
          flameGrad.addColorStop(1, "rgba(30, 27, 75, 0)");
        } else if (layer === 1) {
          flameGrad.addColorStop(0, "#00f2fe");
          flameGrad.addColorStop(0.4, "#0284c7");
          flameGrad.addColorStop(0.8, "#4338ca");
          flameGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else if (layer === 2) {
          flameGrad.addColorStop(0, "rgba(56, 189, 248, 0.7)");
          flameGrad.addColorStop(0.5, "rgba(79, 70, 229, 0.4)");
          flameGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else {
          flameGrad.addColorStop(0, "rgba(147, 51, 234, 0.5)");
          flameGrad.addColorStop(0.6, "rgba(30, 58, 138, 0.2)");
          flameGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        }

        ctx.fillStyle = flameGrad;
        ctx.fill();
        ctx.restore();
      }

      // ── 5. Wispy Cyan Energy Swirl Arcs (Curved highlights inside orb) ──
      for (let arc = 0; arc < 3; arc++) {
        ctx.save();
        ctx.beginPath();
        const arcAngle = time * (1.5 + arc * 0.4) + (arc * Math.PI) / 1.5;
        const startA = arcAngle;
        const endA = arcAngle + Math.PI * 0.75;

        ctx.arc(cx, cy - 5, 42 + arc * 6, startA, endA);
        ctx.strokeStyle = arc === 0 ? "rgba(224, 242, 254, 0.85)" : arc === 1 ? "rgba(56, 189, 248, 0.7)" : "rgba(147, 197, 253, 0.5)";
        ctx.lineWidth = 2.5 - arc * 0.5;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore(); // Restore glass clipping

      // ── 6. Top-Left Curved Glass Glare Reflection ──
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx - 30, cy - 35, 42, 18, -Math.PI / 4, 0, Math.PI * 2);
      const glassGlare = ctx.createLinearGradient(cx - 50, cy - 50, cx - 10, cy - 20);
      glassGlare.addColorStop(0, "rgba(255, 255, 255, 0.35)");
      glassGlare.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
      glassGlare.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glassGlare;
      ctx.fill();
      ctx.restore();

      // ── 7. Bright Glowing Crescent Light Arc at Bottom Base (Signature Dribbble Spec) ──
      ctx.save();
      ctx.beginPath();
      // Draw bottom crescent light curve matching Screenshot 2
      ctx.arc(cx, cy + 2, orbRadius - 1.5, Math.PI * 0.28, Math.PI * 0.72);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#00f2fe";
      ctx.shadowBlur = 18;
      ctx.stroke();

      // Secondary inner bright white flare arc
      ctx.beginPath();
      ctx.arc(cx, cy + 2, orbRadius - 1.5, Math.PI * 0.38, Math.PI * 0.62);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className="relative flex items-center justify-center select-none mx-auto"
      style={{
        width: 320,
        height: 320,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* High-FPS Futuristic Glass Flame AI Orb Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: 360, height: 360 }}
        className="relative z-10 pointer-events-none"
      />
    </div>
  );
}

export default AIOrb;



