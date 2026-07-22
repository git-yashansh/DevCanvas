import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Boxes,
  Database,
  Code2,
  ShieldCheck,
  FileText,
  GitBranch,
  type LucideIcon,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  glow: string;
}

const features: Feature[] = [
  {
    icon: Boxes,
    title: "Architecture Generator",
    description: "Describe your app and get a complete system design — services, data flows, scaling strategy, and cost estimates.",
    gradient: "from-primary-500/20 to-primary-600/5",
    glow: "shadow-primary-500/20",
  },
  {
    icon: Database,
    title: "Database Designer",
    description: "Generate normalized schemas with ER diagrams, index suggestions, and migration-ready SQL for Postgres, MySQL, or SQLite.",
    gradient: "from-accent-500/20 to-accent-600/5",
    glow: "shadow-accent-500/20",
  },
  {
    icon: Code2,
    title: "API Generator",
    description: "Full REST API specs with OpenAPI docs, request/response schemas, authentication flows, and client SDKs.",
    gradient: "from-secondary-500/20 to-secondary-600/5",
    glow: "shadow-secondary-500/20",
  },
  {
    icon: ShieldCheck,
    title: "Security Center",
    description: "OWASP Top 10 analysis, threat modeling, and a security score from A+ to F with actionable remediation steps.",
    gradient: "from-success-500/20 to-success-600/5",
    glow: "shadow-success-500/20",
  },
  {
    icon: FileText,
    title: "Doc Generator",
    description: "Auto-generate READMEs, ADRs, API references, and deployment guides — always in sync with your code.",
    gradient: "from-warning-500/20 to-warning-600/5",
    glow: "shadow-warning-500/20",
  },
  {
    icon: GitBranch,
    title: "Repo Analyzer",
    description: "Connect a repo and get structural breakdown, dependency graphs, code quality metrics, and refactoring recommendations.",
    gradient: "from-primary-500/20 to-accent-500/5",
    glow: "shadow-primary-500/20",
  },
];

const ACCENT_COLORS: Record<number, string> = {
  0: "text-primary-400",
  1: "text-accent-400",
  2: "text-secondary-400",
  3: "text-success-400",
  4: "text-warning-400",
  5: "text-primary-300",
};

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: 40, filter: "blur(8px)" },
          {
            opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: titleRef.current, start: "top 85%", once: true },
          },
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative py-32 bg-transparent">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className="mb-16 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/50">
            Platform
          </span>
          <h2 className="font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Everything you need
            <br />
            <span className="text-gradient">to ship production software</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/40 sm:text-lg">
            From first prompt to production-ready specs in seconds. No boilerplate, no guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} accentClass={ACCENT_COLORS[i]} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index, accentClass }: {
  feature: Feature;
  index: number;
  accentClass: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 48, filter: "blur(6px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)",
          duration: 0.7, ease: "power3.out",
          delay: (index % 3) * 0.1,
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        },
      );
    });
    return () => ctx.revert();
  }, [index]);

  return (
    <div
      ref={cardRef}
      className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br ${feature.gradient} p-6 transition-all duration-500 hover:border-white/15 hover:shadow-xl ${feature.glow}`}
    >
      {/* Inner glass surface */}
      <div className="absolute inset-0 rounded-2xl bg-white/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className={`relative mb-5 inline-flex rounded-xl border border-white/10 bg-white/5 p-2.5 ${accentClass}`}>
        <feature.icon className="h-5 w-5" />
      </div>
      <h3 className="relative font-heading text-base font-semibold text-white">
        {feature.title}
      </h3>
      <p className="relative mt-2.5 text-sm leading-relaxed text-white/45">
        {feature.description}
      </p>
    </div>
  );
}
