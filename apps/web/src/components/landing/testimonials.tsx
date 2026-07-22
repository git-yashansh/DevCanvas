import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Quote } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    body: "DevCanvas cut our architecture review time from 3 days to 45 minutes. The AI gets exactly what we need — proper service boundaries, data flow diagrams, even infrastructure cost estimates.",
    author: "Priya Shankar",
    role: "Staff Engineer",
    company: "Stripe",
    initials: "PS",
    color: "from-primary-500/20 to-primary-600/5",
  },
  {
    body: "The security analysis flagged an OWASP A01 vulnerability we'd missed in code review. That alone is worth more than the subscription cost.",
    author: "Marcus Holt",
    role: "Lead Backend Engineer",
    company: "Linear",
    initials: "MH",
    color: "from-success-500/20 to-success-600/5",
  },
  {
    body: "We went from blank Figma canvas to full database schema with ER diagram in 8 minutes. The SQL output was clean enough to push straight to staging.",
    author: "Sophie Chen",
    role: "CTO",
    company: "Raycast",
    initials: "SC",
    color: "from-accent-500/20 to-accent-600/5",
  },
  {
    body: "Our engineers use DevCanvas to prep for system design interviews and it shows — our last round of hires scored 40% higher on architecture questions.",
    author: "James Park",
    role: "Engineering Manager",
    company: "Notion",
    initials: "JP",
    color: "from-secondary-500/20 to-secondary-600/5",
  },
  {
    body: "The API generator produces OpenAPI specs I'd be embarrassed to write better by hand. It even handles pagination patterns and auth middleware correctly.",
    author: "Dani Martínez",
    role: "Senior SWE",
    company: "Vercel",
    initials: "DM",
    color: "from-warning-500/20 to-warning-600/5",
  },
  {
    body: "We use DevCanvas at the start of every project sprint. It's become part of our definition of 'ready' — no schema or architecture, no sprint.",
    author: "Tom Eriksson",
    role: "Principal Engineer",
    company: "GitHub",
    initials: "TE",
    color: "from-primary-500/20 to-accent-500/5",
  },
];

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".testimonial-card",
        { opacity: 0, y: 36, filter: "blur(4px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)",
          duration: 0.6, ease: "power3.out",
          stagger: { amount: 0.5, from: "start" },
          scrollTrigger: { trigger: ".testimonials-grid", start: "top 85%", once: true },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="testimonials" ref={sectionRef} className="relative py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/50">
            Testimonials
          </span>
          <h2 className="font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Trusted by engineers
            <br />
            <span className="text-gradient">at the best companies</span>
          </h2>
        </div>

        <div className="testimonials-grid columns-1 gap-5 sm:columns-2 lg:columns-3">
          {testimonials.map((t) => (
            <div key={t.author}
              className={`testimonial-card mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br ${t.color} p-6`}>
              <Quote className="mb-4 h-5 w-5 text-white/20" />
              <p className="text-sm leading-relaxed text-white/65">{t.body}</p>
              <div className="mt-5 flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.color} border border-white/10 text-xs font-semibold text-white`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{t.author}</p>
                  <p className="text-xs text-white/35">{t.role} · {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
