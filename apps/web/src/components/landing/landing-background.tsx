import { useEffect, useRef } from "react";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4";

const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55;

/* ─── rAF-driven video fade ─────────────────────────────────────────────── */
function useFadingVideo(ref: React.RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    let rafId = 0;
    let fadingOut = false;

    function fadeTo(target: number, duration: number) {
      cancelAnimationFrame(rafId);
      const start = performance.now();
      const from = parseFloat(video!.style.opacity) || 0;
      function step(now: number) {
        const t = Math.min((now - start) / duration, 1);
        video!.style.opacity = String(from + (target - from) * t);
        if (t < 1) rafId = requestAnimationFrame(step);
      }
      rafId = requestAnimationFrame(step);
    }

    function onLoaded() {
      video!.style.opacity = "0";
      video!.play().catch(() => {});
      fadeTo(1, FADE_MS);
    }

    function onTimeUpdate() {
      const { duration, currentTime } = video!;
      if (!fadingOut && duration > 0 && duration - currentTime <= FADE_OUT_LEAD && duration - currentTime > 0) {
        fadingOut = true;
        fadeTo(0, FADE_MS);
      }
    }

    function onEnded() {
      video!.style.opacity = "0";
      cancelAnimationFrame(rafId);
      fadingOut = false;
      setTimeout(() => {
        video!.currentTime = 0;
        video!.play().catch(() => {});
        fadeTo(1, FADE_MS);
      }, 100);
    }

    video.style.opacity = "0";
    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [ref]);
}

/* ─── Canvas particles ──────────────────────────────────────────────────── */
function useParticles(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      canvas!.width = canvas!.offsetWidth * dpr;
      canvas!.height = canvas!.offsetHeight * dpr;
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.45 + 0.08,
      hue: Math.random() > 0.6 ? 220 : Math.random() > 0.5 ? 260 : 190,
    }));

    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x = (p.x + p.vx + w) % w;
        p.y = (p.y + p.vy + h) % h;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue},90%,70%,${p.alpha})`;
        ctx!.fill();
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [ref]);
}

export function LandingBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useFadingVideo(videoRef);
  useParticles(canvasRef);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#06040f]">
      {/* ── 3D Torus Loop Video Background ─────────────────────────────── */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700"
      />

      {/* ── Dark Gradient Scrim Overlay ────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06040f]/60 via-[#06040f]/30 to-[#06040f]/80" />

      {/* ── Radial Ambient Glowing Blobs ──────────────────────────────── */}
      <div className="absolute -top-40 left-1/2 h-[750px] w-[750px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[140px]" />
      <div className="absolute top-1/3 left-1/4 h-[600px] w-[600px] rounded-full bg-violet-600/12 blur-[120px]" />
      <div className="absolute top-2/3 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[110px]" />
      <div className="absolute bottom-10 left-1/3 h-[600px] w-[600px] rounded-full bg-purple-600/12 blur-[130px]" />

      {/* ── Dot Grid Matrix ────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-dots opacity-20 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_40%,black,transparent)]" />

      {/* ── Canvas Floating Particles ───────────────────────────────────── */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
