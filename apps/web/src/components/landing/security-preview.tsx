import { motion } from "framer-motion";
import { Shield, ShieldCheck, ShieldAlert, Lock } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@ui/index";

const checks = [
  { label: "Injection", status: "pass", detail: "No SQL injection vectors detected" },
  { label: "XSS", status: "pass", detail: "Output encoding enforced" },
  { label: "CSRF", status: "warn", detail: "Token rotation recommended" },
  { label: "Auth", status: "pass", detail: "JWT validation present" },
  { label: "Deps", status: "warn", detail: "2 packages behind latest" },
  { label: "Secrets", status: "pass", detail: "No hardcoded secrets" },
];

const statusConfig = {
  pass: { color: "text-success-400", bg: "bg-success-500/15", icon: ShieldCheck },
  warn: { color: "text-warning-400", bg: "bg-warning-500/15", icon: ShieldAlert },
  fail: { color: "text-danger-400", bg: "bg-danger-500/15", icon: ShieldAlert },
} as const;

export function SecurityPreview() {
  return (
    <section id="security" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="order-2 gradient-border overflow-hidden rounded-2xl lg:order-1"
          >
            <div className="glass-strong rounded-2xl p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-success-400" />
                  <span className="font-heading text-sm font-semibold text-neutral-100">
                    Security Report
                  </span>
                </div>
                <Badge variant="success">Score: A+</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {checks.map((check, i) => {
                  const config = statusConfig[check.status as keyof typeof statusConfig];
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={check.label}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06, duration: 0.3 }}
                      className="rounded-lg border border-border bg-surface-2 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-300">
                          {check.label}
                        </span>
                        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${config.bg}`}>
                          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-neutral-500">{check.detail}</p>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface-2 p-3">
                <Lock className="h-4 w-4 text-neutral-500" />
                <span className="text-xs text-neutral-400">
                  OWASP Top 10 coverage with remediation guidance
                </span>
              </div>
            </div>
          </motion.div>

          <div className="order-1 lg:order-2">
            <SectionHeader
              align="left"
              eyebrow="Security"
              title="Ship with confidence, not guesswork"
              description="DevCanvas runs a full OWASP Top 10 analysis on your generated code, flags vulnerable dependencies, and gives you a security score with actionable fixes."
            />
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { value: "10", label: "OWASP checks" },
                { value: "A+", label: "Avg. score" },
                { value: "0", label: "Critical issues" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-surface p-4 text-center"
                >
                  <p className="font-heading text-2xl font-semibold text-neutral-50">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
