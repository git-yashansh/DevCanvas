import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowUpRight } from "lucide-react";
import { cn } from "@utils/index";

const plans = [
  {
    name: "Hobby",
    price: { monthly: 0, yearly: 0 },
    description: "For individuals exploring DevCanvas.",
    features: [
      "3 projects",
      "Architecture generation",
      "Database schema design",
      "Basic security scan",
      "Community support",
    ],
    cta: "Start free",
    href: "/sign-up",
    highlighted: false,
  },
  {
    name: "Pro",
    price: { monthly: 24, yearly: 19 },
    description: "For engineers shipping production software.",
    features: [
      "Unlimited projects",
      "Full security center",
      "Repository analyzer",
      "Cost estimation",
      "System design interview",
      "Priority generation queue",
      "Email support",
    ],
    cta: "Start 14-day trial",
    href: "/sign-up",
    highlighted: true,
  },
  {
    name: "Team",
    price: { monthly: 49, yearly: 39 },
    description: "For teams collaborating on architecture.",
    features: [
      "Everything in Pro",
      "Shared workspaces",
      "Role-based access control",
      "Audit logs",
      "SSO / SAML",
      "Dedicated support",
    ],
    cta: "Contact sales",
    href: "/sign-up",
    highlighted: false,
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="relative py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/5 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/50">
            Pricing
          </span>
          <h2 className="font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Simple, transparent
            <br />
            <span className="text-gradient">pricing for every team</span>
          </h2>
        </div>

        {/* Toggle */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <span className={cn("text-sm transition-colors", !yearly ? "text-white/80" : "text-white/30")}>Monthly</span>
          <button
            onClick={() => setYearly((v) => !v)}
            className="relative h-7 w-13 rounded-full border border-white/10 bg-white/5 transition-colors"
            aria-label="Toggle billing">
            <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className={cn("absolute top-1 h-5 w-5 rounded-full bg-primary-500", yearly ? "left-7" : "left-1")} />
          </button>
          <span className={cn("text-sm transition-colors", yearly ? "text-white/80" : "text-white/30")}>
            Yearly <span className="ml-1.5 text-xs text-success-400">Save 20%</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-2xl border p-7 backdrop-blur-xl shadow-2xl transition-all duration-300",
                plan.highlighted
                  ? "border-primary-500/50 bg-[#0c0a1d]/90 shadow-primary-500/20"
                  : "border-white/12 bg-[#090715]/85 hover:border-white/20 hover:bg-[#0c0a1d]/90",
              )}
            >
              {plan.highlighted ? (
                <>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent" />
                  <span className="absolute right-5 top-5 rounded-full bg-primary-500/20 px-3 py-1 text-xs font-semibold text-primary-300 border border-primary-500/30">
                    Most popular
                  </span>
                </>
              ) : null}

              <h3 className="font-heading text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-white/60">{plan.description}</p>

              <div className="mt-7 flex items-baseline gap-1">
                <span className="font-heading text-4xl font-bold text-white">
                  ${yearly ? plan.price.yearly : plan.price.monthly}
                </span>
                <span className="text-sm text-white/50">/mo</span>
              </div>

              <ul className="mt-7 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/80 font-medium">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-500/20 border border-success-500/30">
                      <Check className="h-2.5 w-2.5 text-success-400" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to={plan.href}
                className={cn(
                  "mt-8 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
                  plan.highlighted
                    ? "bg-white text-black hover:bg-white/90 shadow-lg"
                    : "border border-white/15 bg-white/10 text-white hover:border-white/30 hover:bg-white/15",
                )}
              >
                {plan.cta}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
