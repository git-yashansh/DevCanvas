import { motion } from "framer-motion";
import { GitBranch, Star, GitFork, AlertTriangle, Check } from "lucide-react";
import { SectionHeader } from "@/components/section-header";

const files = [
  { path: "src/api/", files: 24, quality: "A" },
  { path: "src/services/", files: 18, quality: "A" },
  { path: "src/components/", files: 42, quality: "B+" },
  { path: "src/hooks/", files: 12, quality: "A" },
  { path: "src/lib/", files: 8, quality: "A-" },
  { path: "tests/", files: 31, quality: "B" },
];

const metrics = [
  { icon: Star, label: "Stars", value: "2.4k" },
  { icon: GitFork, label: "Forks", value: "318" },
  { icon: GitBranch, label: "Branches", value: "24" },
  { icon: AlertTriangle, label: "Open issues", value: "7" },
];

export function RepoAnalyzerPreview() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Repository Analyzer"
          title="Understand any codebase in seconds"
          description="Connect a GitHub repository and DevCanvas maps the structure, surfaces quality metrics, and recommends refactors."
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mt-16 max-w-4xl gradient-border overflow-hidden rounded-2xl"
        >
          <div className="glass-strong rounded-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-2">
                  <GitBranch className="h-4 w-4 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-100">
                    acme-corp/platform
                  </p>
                  <p className="text-xs text-neutral-500">main · updated 2h ago</p>
                </div>
              </div>
              <div className="hidden gap-4 sm:flex">
                {metrics.map((metric) => (
                  <div key={metric.label} className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <metric.icon className="h-3.5 w-3.5" />
                    {metric.value}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {files.map((file, i) => (
                  <motion.div
                    key={file.path}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-neutral-300">
                        {file.path}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {file.files} files
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-success-300">
                      <Check className="h-3 w-3" />
                      {file.quality}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
