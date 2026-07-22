import { motion } from "framer-motion";
import { type LucideIcon, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@ui/index";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
}

export function GeneratorPlaceholder({ title, description, icon: Icon, features }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title={title} description={description} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8 gradient-border rounded-2xl"
      >
        <div className="glass-strong rounded-2xl p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500/10">
            <Icon className="h-7 w-7 text-primary-400" />
          </div>
          <h3 className="mt-5 font-heading text-lg font-semibold text-neutral-50">
            {title} arrives in an upcoming sprint
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-400">
            This generator is part of the DevCanvas roadmap. The full interactive
            experience will be built in a dedicated sprint.
          </p>

          <div className="mx-auto mt-6 max-w-md space-y-2 text-left">
            {features.map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-neutral-300"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-400" />
                {feature}
              </motion.div>
            ))}
          </div>

          <Button variant="gradient" className="mt-6" disabled>
            <Icon className="h-4 w-4" />
            Coming soon
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
