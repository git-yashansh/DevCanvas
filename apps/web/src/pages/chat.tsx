import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { useProjects } from "@/lib/queries/projects";
import { cn } from "@utils/index";

export function ChatPage() {
  const { data: projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="AI Chat"
        description="Chat with DevCanvas AI about your projects."
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <h3 className="mb-3 font-heading text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Projects
          </h3>
          <div className="space-y-1.5">
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    selectedProject === project.id
                      ? "border-primary-500/30 bg-primary-500/10 text-primary-300"
                      : "border-border bg-surface text-neutral-300 hover:border-border-hover hover:text-neutral-100",
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{project.name}</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-xs text-neutral-500">
                Create a project to start chatting.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedProject ? (
            <motion.div
              key={selectedProject}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChatPanel projectId={selectedProject} />
            </motion.div>
          ) : (
            <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10">
                <Sparkles className="h-6 w-6 text-primary-400" />
              </div>
              <h3 className="mt-4 font-heading text-sm font-semibold text-neutral-100">
                Select a project
              </h3>
              <p className="mt-1 text-sm text-neutral-400">
                Choose a project from the left to start a conversation with DevCanvas AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
