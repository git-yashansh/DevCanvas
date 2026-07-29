import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Sparkles,
  Layers,
  BookOpen,
  Terminal,
  ShieldAlert,
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

export function DocumentationGeneratorPage() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const aiQueue = useAIQueue();
  
  const [projectPrompt, setProjectPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [finishedLoading, setFinishedLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectId = searchParams.get("projectId");

  // Load existing documentation if available
  useEffect(() => {
    if (!projectId) return;
    async function loadDocs() {
      const { data, error } = await supabase
        .from("projects")
        .select("documentation, description")
        .eq("id", projectId)
        .maybeSingle();

      if (!error && data) {
        if (data.documentation) {
          setReport(data.documentation);
          setFinishedLoading(true);
        }
        if (data.description && !projectPrompt) {
          setProjectPrompt(data.description);
        }
      }
    }
    loadDocs();
  }, [projectId]);

  const handleGenerate = async () => {
    const input = projectPrompt.trim();
    if (!input || generating) return;

    setGenerating(true);
    setFinishedLoading(false);
    setReport(null);
    setError(null);

    try {
      const data = await aiQueue.enqueue('generate-documentation', input, { prompt: input });
      if (!data.doc) throw new Error("No documentation returned from AI.");

      setReport(data.doc);
      setFinishedLoading(true);
      setGenerating(false);

      // Save to Supabase automatically
      if (projectId) {
        setSaving(true);
        await supabase
          .from("projects")
          .update({ documentation: data.doc })
          .eq("id", projectId);
        
        await supabase.from("chat_messages").insert({
          project_id: projectId,
          role: "system",
          content: `Documentation suite generated: ${data.doc.summary}`,
        });
        setSaving(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate documentation.");
      setGenerating(false);
    }
  };

  return (
    <div className="w-full px-5 py-6 lg:px-8">
      <PageHeader
        title="Documentation Generator"
        description="Describe your application structure to generate high-fidelity developer onboarding docs, API specifications, and README assets."
      />

        <div className="bg-gradient-to-b from-[#0a142c] via-[#121319] to-[#121319] border border-blue-900/35 rounded-2xl p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
              <span className="text-base font-bold text-white">Describe Project Scope</span>
            </div>
            <textarea
              value={projectPrompt}
              onChange={(e) => setProjectPrompt(e.target.value)}
              placeholder="A collaborative Kanban board featuring custom auth, real-time sync via websockets, and automated billing hooks..."
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
                disabled={!projectPrompt.trim() || generating}
                className="shrink-0 text-base font-semibold h-11 px-6"
              >
                {generating ? "Generating..." : "Generate Documentation"}
              </Button>
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
          <div className="mt-8 py-12 bg-transparent border-none">
            <AILoader isFinished={false} />
          </div>
        ) : report ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <GeneratorReport
              title="Documentation Suite"
              summary={report.summary}
              visualization={
                <div className="flex flex-col items-center justify-center p-6 h-full bg-black/40">
                  <div className="text-sm font-mono text-indigo-400 mb-4 font-semibold">📚 Generated Document Hierarchy Map</div>
                  <div className="space-y-2 text-xs font-mono text-neutral-300 w-full max-w-md p-4 border border-white/5 rounded-lg bg-surface/60">
                    <div>📁 documentation/</div>
                    <div className="pl-4 text-emerald-400 text-left">├── README.md (Setup instructions, frameworks)</div>
                    <div className="pl-4 text-emerald-400 text-left">├── API_REFERENCE.md (Endpoint routing list, payloads)</div>
                    <div className="pl-4 text-emerald-400 text-left">├── ARCHITECTURE.md (Gemini validation processes)</div>
                    <div className="pl-4 text-emerald-400 text-left">├── ONBOARDING.md (Local container start sequences)</div>
                    <div className="pl-4 text-emerald-400 text-left">└── TROUBLESHOOTING.md (API quota &amp; validation errors)</div>
                  </div>
                </div>
              }
              breakdown={[
                {
                  title: "Platform README.md Asset",
                  description: "Standard markdown guide introducing codebase scope and technology blocks.",
                  codeBlock: report.readme,
                  icon: FileText
                },
                {
                  title: "REST Endpoint API Directory",
                  description: "Detailed endpoint payloads, header rules, and expected response codes.",
                  codeBlock: report.apiDoc,
                  icon: BookOpen
                },
                {
                  title: "Developer Onboarding Tutorial",
                  description: "Local dev server spin up guide, environment mapping checklists.",
                  details: [
                    "Step 1: Install Node.js runtime environment.",
                    "Step 2: Clone repository assets and run 'npm install'.",
                    "Step 3: Create .env matching .env.example specifications.",
                    "Step 4: Execute 'npm run dev' to spin local servers."
                  ],
                  icon: Terminal
                }
              ]}
              cost={[
                { category: "GitBook Premium Cloud hosting subscription", monthly: 8.00 },
                { category: "Vercel Docs Deploy &amp; Asset Distribution CDN", monthly: 0.00 }
              ]}
              recommendations={[
                "Host generated document trees directly on GitBook to support responsive mobile search filters.",
                "Enforce strict JSDoc header commentary validation on pull request merges."
              ]}
              security={[
                {
                  title: "Secrets Exposure Warning",
                  severity: "high",
                  description: "Ensure no raw production API keys or tokens are listed inside onboarding manuals.",
                  solution: "Always use placeholder brackets (e.g. GEMINI_API_KEY=[YOUR_KEY]) inside document references."
                }
              ]}
              onRefresh={handleGenerate}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
