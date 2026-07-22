import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ArrowUpRight, Sparkles, Cpu, Zap, Shield } from "lucide-react";

/* ─── Video URL ─────────────────────────────────────────────────────────── */
const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4";

const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55; // seconds before end to start fade

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

/* ─── GSAP word blur-in ─────────────────────────────────────────────────── */
const HEADLINE_WORDS = [
  { text: "Design.", gradient: false },
  { text: "Build.", gradient: false },
  { text: "Secure.", gradient: false },
  { text: "Scale.", gradient: true },
];

function useWordBlur(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLSpanElement>(".hero-word");
    gsap.set(words, { opacity: 0, filter: "blur(14px)", y: 32, rotationX: -15 });
    gsap.to(words, {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      rotationX: 0,
      duration: 0.8,
      ease: "power4.out",
      stagger: 0.11,
      delay: 0.4,
    });
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

    const particles = Array.from({ length: 100 }, () => ({
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

/* ─── Marquee logos ─────────────────────────────────────────────────────── */
const LOGOS = ["Vortex", "Nimbus", "Prysma", "Cirrus", "Kynder", "Halcyn", "Axion", "Nebul"];
const LOGO_COLORS = [
  "from-blue-500/20 to-blue-600/5",
  "from-violet-500/20 to-violet-600/5",
  "from-cyan-500/20 to-cyan-600/5",
  "from-indigo-500/20 to-indigo-600/5",
  "from-sky-500/20 to-sky-600/5",
  "from-purple-500/20 to-purple-600/5",
  "from-teal-500/20 to-teal-600/5",
  "from-blue-400/20 to-blue-500/5",
];

/* ─── Hero ──────────────────────────────────────────────────────────────── */
export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useFadingVideo(videoRef);
  useWordBlur(headingRef);
  useParticles(canvasRef);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06040f]">
      {/* ── Background video ───────────────────────────────────────────── */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0 }}
      />

      {/* ── Dark gradient scrim — darkens video so content reads cleanly ─ */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#06040f]/70 via-[#06040f]/40 to-[#06040f]/80" />

      {/* ── Radial colour blobs ───────────────────────────────────────── */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/12 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[110px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-[350px] w-[350px] rounded-full bg-cyan-500/8 blur-[90px]" />

      {/* ── Dot grid ─────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-dots opacity-20 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_40%,black,transparent)]" />

      {/* ── Canvas particles ─────────────────────────────────────────── */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* ── Scan-line overlay ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 bg-scanlines opacity-[0.03]" />

      {/* ── Content layer ─────────────────────────────────────────────── */}
      <section className="relative z-10 flex min-h-screen flex-col">
        {/* Top glow line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

        {/* ── Blurred spotlight shape behind hero text ─────────────── */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 984,
            height: 527,
            background: "rgba(6,4,15,0.88)",
            filter: "blur(82px)",
            borderRadius: "50%",
          }}
        />

        {/* ── Flex: hero body centered ─────────────────────────────── */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 pt-24 sm:px-6 lg:px-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 inline-flex"
          >
            <span className="liquid-glass inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-sm font-medium text-white/75">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/30">
                <Sparkles className="h-3 w-3 text-indigo-300" />
              </span>
              AI-powered engineering platform · Gemini 1.5 Flash
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            </span>
          </motion.div>

          {/* Headline */}
          <div ref={headingRef} className="w-full max-w-full text-center px-3 sm:px-5 mx-auto">
            <h1 className="font-heading text-[clamp(2.75rem,7.2vw,9.25rem)] font-semibold tracking-tight text-white whitespace-nowrap leading-none lg:leading-[1.03]">
              {HEADLINE_WORDS.map((w, i) => (
                <span
                  key={i}
                  className={`hero-word inline-block ${i < HEADLINE_WORDS.length - 1 ? "mr-2 sm:mr-3 lg:mr-4" : ""}`}
                  style={{ willChange: "transform, opacity, filter" }}
                >
                  {w.gradient ? (
                    <span className="bg-gradient-to-r from-indigo-200 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                      {w.text}
                    </span>
                  ) : (
                    w.text
                  )}
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-12 sm:mt-16 max-w-2xl text-base font-medium text-white/85 sm:text-xl sm:leading-relaxed"
            >
              From architecture to deployment — generate production-grade engineering assets with AI in seconds, not weeks.
            </motion.p>
          </div>

          {/* CTA Group */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Link
              to="/sign-up"
              className="group relative flex h-13 items-center justify-center gap-2.5 rounded-full bg-white px-8 text-base font-semibold text-black shadow-xl shadow-white/10 transition-all duration-300 hover:scale-[1.03] hover:shadow-white/20 active:scale-[0.98]"
            >
              Start building free
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            <a
              href="#features"
              className="liquid-glass flex h-13 items-center justify-center gap-2 rounded-full px-8 text-base font-medium text-white transition-all duration-300 hover:bg-white/10 hover:border-white/20"
            >
              See how it works
            </a>
          </motion.div>

          {/* Trust points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-white/85"
          >
            <span className="flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 px-4 py-1.5 backdrop-blur-md shadow-sm">
              <Zap className="h-4 w-4 text-indigo-400" />
              15-second generation
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 px-4 py-1.5 backdrop-blur-md shadow-sm">
              <Shield className="h-4 w-4 text-indigo-400" />
              SOC 2 compliant
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 px-4 py-1.5 backdrop-blur-md shadow-sm">
              <Cpu className="h-4 w-4 text-indigo-400" />
              No credit card needed
            </span>
          </motion.div>
        </div>

        {/* ── Preview mockup card in hero ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-16 w-full max-w-6xl px-4 pb-24 sm:px-6"
        >
          {/* Window frame */}
          <div className="liquid-glass relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.04] shadow-2xl backdrop-blur-3xl">
            {/* Window titlebar */}
            <div className="flex h-11 items-center justify-between border-b border-white/15 bg-white/[0.06] backdrop-blur-xl px-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <span className="h-3 w-3 rounded-full bg-green-500/70" />
                <div className="ml-4 hidden sm:flex items-center gap-2 text-xs font-mono">
                  <span className="rounded-t-md bg-white/10 px-3 py-1 text-white border-b-2 border-indigo-400">Architecture.tsx</span>
                  <span className="px-3 py-1 text-white/40 hover:text-white/70 transition-colors">Schema.sql</span>
                  <span className="px-3 py-1 text-white/40 hover:text-white/70 transition-colors">API.ts</span>
                  <span className="px-3 py-1 text-white/40 hover:text-white/70 transition-colors">Security.json</span>
                </div>
              </div>
              <span className="font-mono text-xs text-white/50 hidden md:inline">devcanvas.app / workspace / architecture</span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live Engine
              </span>
            </div>

            {/* Mockup content */}
            <div className="grid grid-cols-1 divide-y divide-white/10 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
              {/* Sidebar preview */}
              <div className="p-4 lg:col-span-1 bg-white/[0.01] space-y-6">
                <div>
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">AI Generators</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between rounded-lg bg-indigo-500/25 border border-indigo-500/30 px-3 py-2 text-indigo-200">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Architecture
                      </span>
                      <span className="text-[10px] font-bold text-indigo-300">Active</span>
                    </div>
                    {["Database Schema", "API & Endpoints", "Security Audit", "Code Generation", "Auto Scaler"].map((item) => (
                      <div key={item} className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/50 hover:text-white/80 transition-colors cursor-pointer">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/30" /> {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">Client Integrations</p>
                  <div className="space-y-2 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-white/60">
                      <span>PostgreSQL 16</span>
                      <span className="text-emerald-400">Connected</span>
                    </div>
                    <div className="flex items-center justify-between text-white/60">
                      <span>Redis Cluster</span>
                      <span className="text-emerald-400">Active</span>
                    </div>
                    <div className="flex items-center justify-between text-white/60">
                      <span>Stripe Billing</span>
                      <span className="text-indigo-300">Synced</span>
                    </div>
                    <div className="flex items-center justify-between text-white/60">
                      <span>OAuth2 / Auth0</span>
                      <span className="text-emerald-400">Secured</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main canvas preview */}
              <div className="p-6 lg:col-span-3 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span className="font-heading text-sm font-semibold text-white/90">Enterprise Architecture Studio</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
                    <span className="rounded bg-white/5 px-2 py-0.5 border border-white/10">100% Strict TS</span>
                    <span className="rounded bg-white/5 px-2 py-0.5 border border-white/10">SOC 2 Ready</span>
                  </div>
                </div>

                {/* Prompt block */}
                <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm p-4 text-xs font-mono text-white/70 space-y-2">
                  <div className="flex items-center justify-between text-white/40 text-[10px]">
                    <span>// GENERATION PROMPT</span>
                    <span>Gemini 1.5 Flash · 0.42s</span>
                  </div>
                  <p className="text-indigo-200 font-medium leading-relaxed">
                    "Build a scalable multi-tenant SaaS backend with PostgreSQL read-replicas, Redis caching, Stripe subscription webhooks, RBAC security, and Docker microservices."
                  </p>
                </div>

                {/* Real Code Preview Block */}
                <div className="rounded-xl border border-white/15 bg-black/60 backdrop-blur-md p-4 font-mono text-xs text-white/80 space-y-1.5 overflow-x-auto shadow-inner">
                  <div className="flex items-center justify-between text-[10px] text-white/40 border-b border-white/10 pb-2 mb-2">
                    <span>Generated Code (Architecture.tsx)</span>
                    <span className="text-emerald-400 font-medium">✔ Passed Typechecks & Linter</span>
                  </div>
                  <p className="text-purple-400">import <span className="text-white">{`{ createArchitecture, ScalePolicy }`}</span> from <span className="text-emerald-300">"@devcanvas/core"</span>;</p>
                  <p className="text-indigo-300">import <span className="text-white">{`{ PostgresCluster, RedisCache }`}</span> from <span className="text-emerald-300">"@devcanvas/infrastructure"</span>;</p>
                  <br />
                  <p className="text-indigo-400">export const <span className="text-yellow-300">systemArchitecture</span> = <span className="text-indigo-300">createArchitecture</span>({`{`}</p>
                  <p className="pl-4 text-white/70"><span className="text-indigo-300">client</span>: <span className="text-emerald-300">"Enterprise Multi-Tenant SaaS"</span>,</p>
                  <p className="pl-4 text-white/70"><span className="text-indigo-300">database</span>: <span className="text-yellow-300">PostgresCluster</span>({`{ primary: "us-east-1", replicas: 3, storage: "10TB" }`}),</p>
                  <p className="pl-4 text-white/70"><span className="text-indigo-300">cache</span>: <span className="text-yellow-300">RedisCache</span>({`{ clusterNodes: 6, maxMemory: "64GB", evict: "volatile-lru" }`}),</p>
                  <p className="pl-4 text-white/70"><span className="text-indigo-300">security</span>: {`{ rbac: true, encryption: "AES-256-GCM", auth: "OAuth2/JWT" }`},</p>
                  <p className="pl-4 text-white/70"><span className="text-indigo-300">autoScale</span>: <span className="text-yellow-300">ScalePolicy</span>({`{ minReplicas: 3, maxReplicas: 100, targetCPU: 70 }`})</p>
                  <p className="text-indigo-400">{`}`});</p>
                </div>

                {/* Feature stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/25 border border-indigo-400/30 flex items-center justify-center text-indigo-200 font-bold">14</div>
                    <div>
                      <p className="font-mono text-indigo-200 font-semibold text-xs">Microservices</p>
                      <p className="text-[10px] text-white/60">Auto-configured & Routed</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 backdrop-blur-md p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/25 border border-purple-400/30 flex items-center justify-center text-purple-200 font-bold">38</div>
                    <div>
                      <p className="font-mono text-purple-200 font-semibold text-xs">SQL Migrations</p>
                      <p className="text-[10px] text-white/60">PostgreSQL Strict Types</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-cyan-500/25 border border-cyan-400/30 flex items-center justify-center text-cyan-200 font-bold">0ms</div>
                    <div>
                      <p className="font-mono text-cyan-200 font-semibold text-xs">Zero Latency Cache</p>
                      <p className="text-[10px] text-white/60">Redis Cluster Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Marquee logos */}
        <div className="border-t border-white/10 py-10">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-white/30">
            Trusted by modern engineering teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 px-4 opacity-60">
            {LOGOS.map((logo, i) => (
              <div
                key={logo}
                className={`flex items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-b ${LOGO_COLORS[i % LOGO_COLORS.length]} px-4 py-2 text-sm font-semibold text-white/70`}
              >
                <div className="h-2 w-2 rounded-full bg-white/40" />
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
