import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    num: "01",
    title: "Describe your project",
    description: "Type a prompt like \"A multi-tenant SaaS with billing and RBAC\" — in plain English, no diagrams or specs needed.",
    color: "text-primary-400",
    glow: "bg-primary-500/15",
  },
  {
    num: "02",
    title: "AI generates the assets",
    description: "DevCanvas calls Gemini 1.5 Flash and returns a full architecture diagram, normalized schema, OpenAPI spec, and security report — in under 15 seconds.",
    color: "text-accent-400",
    glow: "bg-accent-500/15",
  },
  {
    num: "03",
    title: "Review and export",
    description: "Inspect every layer interactively. Export SQL, JSON, or PNG. Save to a project for your team. Regenerate any section in one click.",
    color: "text-success-400",
    glow: "bg-success-500/15",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".step-card",
        { opacity: 0, x: -40 },
        {
          opacity: 1, x: 0,
          duration: 0.7, ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: { trigger: ".steps-container", start: "top 80%", once: true },
        },
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section id="how-it-works" ref={ref} className="relative py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/5 blur-[100px]" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/50">
            How it works
          </span>
          <h2 className="font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Three steps from idea
            <br />
            <span className="text-gradient">to production-ready specs</span>
          </h2>
        </div>

        <div className="steps-container relative">
          {/* Connector line */}
          <div className="absolute left-8 top-12 hidden h-[calc(100%-96px)] w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent lg:block" />

          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={step.num} className="step-card flex gap-6">
                <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 ${step.glow}`}>
                  <span className={`font-heading text-xl font-bold ${step.color}`}>{step.num}</span>
                  {i < steps.length - 1 ? (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 lg:hidden">
                      <ArrowRight className="h-4 w-4 rotate-90 text-white/15" />
                    </div>
                  ) : null}
                </div>
                <div className="flex-1 rounded-2xl border border-white/8 bg-white/3 p-6">
                  <h3 className="font-heading text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
