import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Sparkles,
  Layers,
  Cpu,
  Server,
  ShieldCheck,
  PlayCircle,
  FileCode,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@ui/index";
import { PageHeader } from "@/components/dashboard/page-header";
import { AILoader } from "@/components/dashboard/AILoader";
import { GeneratorReport } from "@/components/dashboard/GeneratorReport";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useAIQueue } from "@/lib/ai-queue-context";

export function DeploymentGeneratorPage() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const aiQueue = useAIQueue();
  
  const [deploymentPrompt, setDeploymentPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [finishedLoading, setFinishedLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectId = searchParams.get("projectId");

  // Load existing deployment plan if available
  useEffect(() => {
    if (!projectId) return;
    async function loadPlan() {
      const { data, error } = await supabase
        .from("projects")
        .select("deployment_plan, description")
        .eq("id", projectId)
        .maybeSingle();

      if (!error && data) {
        if (data.deployment_plan) {
          setReport(data.deployment_plan);
          setFinishedLoading(true);
        }
        if (data.description && !deploymentPrompt) {
          setDeploymentPrompt(data.description);
        }
      }
    }
    loadPlan();
  }, [projectId]);

  const handleGenerate = async () => {
    const input = deploymentPrompt.trim();
    if (!input || generating) return;

    setGenerating(true);
    setFinishedLoading(false);
    setReport(null);
    setError(null);

    try {
      const data = await aiQueue.enqueue('generate-deployment-plan', input, { prompt: input });
      if (!data.plan) throw new Error("No deployment plan returned from AI.");

      setReport(data.plan);
      setFinishedLoading(true);
      setGenerating(false);

      // Save to Supabase automatically
      if (projectId) {
        setSaving(true);
        await supabase
          .from("projects")
          .update({ deployment_plan: data.plan })
          .eq("id", projectId);
        
        await supabase.from("chat_messages").insert({
          project_id: projectId,
          role: "system",
          content: `Deployment plan generated: ${data.plan.summary}`,
        });
        setSaving(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate deployment plan.");
      setGenerating(false);
    }
  };

  return (
    <div className="w-full px-5 py-6 lg:px-8">
      <PageHeader
        title="Deployment Architect &amp; Generator"
        description="Describe your application stack to generate Docker configurations, GitHub actions scripts, and production server checklists."
      />

      <div className="mt-8">
        <div className="gradient-border rounded-2xl">
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
                <span className="text-base font-bold text-white">Deployment Targets Details</span>
              </div>
              <textarea
                value={deploymentPrompt}
                onChange={(e) => setDeploymentPrompt(e.target.value)}
                placeholder="A modern Single Page Application (SPA) web frontend to Vercel, Node/Express api endpoints to Railway, and postgres container..."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-3.5 text-base text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none font-sans"
                disabled={generating}
              />
              <div className="flex justify-end mt-1 gap-2 items-center">
                {saving && (
                  <span className="text-xs text-neutral-400 flex items-center gap-1 font-medium">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" /> Saving to workspace...
                  </span>
                )}
                <Button
                  variant="gradient"
                  onClick={handleGenerate}
                  disabled={!deploymentPrompt.trim() || generating}
                  className="shrink-0 text-base font-semibold h-11 px-6"
                >
                  {generating ? "Generating..." : "Generate Deployment Plan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-300">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {generating && !finishedLoading ? (
          <div className="mt-8 rounded-xl border border-border bg-surface py-12">
            <AILoader isFinished={false} />
          </div>
        ) : report ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <GeneratorReport
              title="Deployment Architecture &amp; Pipelines"
              summary={report.summary}
              visualization={
                <div className="flex flex-col items-center justify-center p-6 h-full bg-black/40">
                  <div className="text-sm font-mono text-indigo-400 mb-4 font-semibold">🚢 Deployment Stream Pipeline Diagram</div>
                  <div className="space-y-2 text-xs font-mono text-neutral-300 w-full max-w-md p-4 border border-white/5 rounded-lg bg-surface/60">
                    <div className="flex items-center gap-2 text-indigo-300">
                      <PlayCircle className="h-4 w-4 shrink-0" />
                      <span>Code Commit (git push main)</span>
                    </div>
                    <div className="pl-4 border-l border-neutral-700 py-1 text-left">
                      <div className="text-amber-400">├── Trigger: CI/CD runner (from pipeline)</div>
                      <div className="text-neutral-400">├── Check: Lint, tests, build verification</div>
                      <div className="text-emerald-400">└── Action: Docker container build &amp; push</div>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-300 mt-2">
                      <Server className="h-4 w-4 shrink-0" />
                      <span>Release Orchestrator</span>
                    </div>
                    {report.summary && (
                      <div className="pl-4 border-l border-neutral-700 py-1 text-left text-neutral-400">
                        <div className="text-emerald-400 line-clamp-3">{report.summary}</div>
                      </div>
                    )}
                  </div>
                </div>
              }
              breakdown={[
                {
                  title: "Container Configuration: Dockerfile",
                  description: "Standard docker configuration file for containerized APIs.",
                  codeBlock: report.dockerfile,
                  icon: Cpu
                },
                {
                  title: "CI/CD Pipeline Workflow",
                  description: "GitHub Actions workflow script managing automated quality checks and deployment.",
                  codeBlock: report.pipeline,
                  icon: FileCode
                },
                {
                  title: "Production Release Checklist",
                  description: "Pre-flight checks and rollback strategies for live releases.",
                  details: report.checklist || [
                    "Database schema migrations run before API instances start.",
                    "Verify SSL certificates are bound and active.",
                    "Rollback trigger: If server container returns >5% HTTP 5xx responses, revert container hash within 90 seconds."
                  ],
                  icon: Rocket
                }
              ]}
              cost={report.cost ?? []}
              recommendations={report.recommendations ?? []}
              security={report.security ?? []}
              onRefresh={handleGenerate}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
