import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@ui/index";
import { SectionHeader } from "@/components/section-header";

const nodes = [
  { label: "Client", x: 5, y: 50, color: "var(--color-primary-500)" },
  { label: "API Gateway", x: 28, y: 50, color: "var(--color-accent-500)" },
  { label: "Auth Service", x: 52, y: 22, color: "var(--color-secondary-500)" },
  { label: "Core API", x: 52, y: 50, color: "var(--color-primary-500)" },
  { label: "Queue Worker", x: 52, y: 78, color: "var(--color-warning-500)" },
  { label: "Postgres", x: 78, y: 35, color: "var(--color-success-500)" },
  { label: "Redis", x: 78, y: 65, color: "var(--color-danger-500)" },
];

const edges = [
  [0, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [3, 5],
  [3, 6],
  [4, 6],
];

const checklist = [
  "Service boundaries and ownership",
  "Synchronous vs asynchronous flows",
  "Data flow and storage layer mapping",
  "Scaling and failover strategy",
  "Interactive React Flow diagram export",
];

export function ArchitecturePreview() {
  return (
    <section id="architecture" className="relative py-24">
      <div className="absolute inset-0 -z-10 bg-dots [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Architecture"
              title="Visualize your system before you build it"
              description="Describe your application and DevCanvas generates an interactive architecture diagram with service boundaries, data flows, and scaling paths."
            />
            <ul className="mt-8 space-y-3">
              {checklist.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="flex items-start gap-3 text-sm text-neutral-300"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-500/15">
                    <Check className="h-3 w-3 text-success-400" />
                  </span>
                  {item}
                </motion.li>
              ))}
            </ul>
            <div className="mt-8">
              <Button variant="outline" asChild>
                <a href="#features">
                  See it in action
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="gradient-border overflow-hidden rounded-2xl"
          >
            <div className="glass-strong rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Architecture Diagram
                </span>
                <span className="rounded-md bg-primary-500/10 px-2 py-0.5 text-xs text-primary-300">
                  Auto-generated
                </span>
              </div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-surface-2">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {edges.map(([from, to], i) => {
                    const a = nodes[from];
                    const b = nodes[to];
                    return (
                      <line
                        key={i}
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke="var(--color-border-hover)"
                        strokeWidth="0.4"
                        strokeDasharray="1.5 1.5"
                      />
                    );
                  })}
                </svg>
                {nodes.map((node, i) => (
                  <motion.div
                    key={node.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface shadow-md sm:h-12 sm:w-12"
                      style={{ boxShadow: `0 0 12px ${node.color}30` }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: node.color }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-neutral-400 sm:text-xs">
                      {node.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
