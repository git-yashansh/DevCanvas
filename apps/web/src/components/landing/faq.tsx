import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@utils/index";

const faqs = [
  {
    question: "How does DevCanvas generate architecture from natural language?",
    answer: "Your prompt is sent to Gemini 1.5 Flash with a structured system prompt that constrains the output to a defined JSON schema. DevCanvas parses the response into services, data stores, data flows, and interaction patterns, then renders an interactive diagram you can edit and export.",
  },
  {
    question: "Can I use DevCanvas with an existing codebase?",
    answer: "Yes. The Repository Analyzer connects to any public GitHub repository, maps the folder structure, extracts dependency graphs, and surfaces code quality metrics. Private repositories are supported on Team plans via GitHub OAuth.",
  },
  {
    question: "What does the security center check?",
    answer: "It runs OWASP Top 10 analysis, scans for known vulnerability patterns, analyzes authentication configurations, detects injection and XSS risks, and produces a security score from A+ to F with prioritized remediation steps.",
  },
  {
    question: "Is my data stored or used for training?",
    answer: "Your prompts and generated artifacts are stored in your workspace so you can revisit them. We never use your data to train models. You can delete projects and their artifacts at any time.",
  },
  {
    question: "Can I export the generated artifacts?",
    answer: "Every artifact — architecture diagrams, schemas, API specs, and security reports — can be exported as SQL, OpenAPI JSON, Markdown, JSON, or PNG/SVG.",
  },
  {
    question: "Do you offer a team or enterprise plan?",
    answer: "Yes. The Team plan adds shared workspaces, RBAC, audit logs, and SSO. For enterprise needs like custom data retention or on-prem deployment, contact our sales team.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/50">
            FAQ
          </span>
          <h2 className="font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Questions?
            <br />
            <span className="text-gradient">We have answers.</span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.question}
                className={cn(
                  "overflow-hidden rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-200",
                  isOpen ? "border-indigo-500/40 bg-[#0c0a1d]/90" : "border-white/12 bg-[#090715]/85 hover:border-white/20",
                )}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-white/90">{faq.question}</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 shrink-0 text-white/40 transition-transform duration-200",
                    isOpen && "rotate-180 text-indigo-400",
                  )} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}>
                      <p className="px-6 pb-5 text-sm leading-relaxed text-white/70">{faq.answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
