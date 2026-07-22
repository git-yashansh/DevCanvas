import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Clock,
  Zap,
  Save,
  Check,
} from "lucide-react";
import { Button, Badge } from "@ui/index";
import { PageHeader } from "@/components/dashboard/page-header";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@utils/index";
import type {
  SecurityAnalysis,
  SecurityFinding,
  Severity,
  OwaspStatus,
} from "@/lib/types/security";

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; icon: typeof AlertCircle }> = {
  critical: { label: "Critical", color: "text-danger-400", bg: "bg-danger-500/10 border-danger-500/20", icon: XCircle },
  high: { label: "High", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", icon: AlertCircle },
  medium: { label: "Medium", color: "text-warning-400", bg: "bg-warning-500/10 border-warning-500/20", icon: AlertTriangle },
  low: { label: "Low", color: "text-primary-400", bg: "bg-primary-500/10 border-primary-500/20", icon: Info },
  info: { label: "Info", color: "text-neutral-400", bg: "bg-neutral-500/10 border-neutral-500/20", icon: Info },
};

const OWASP_STATUS_CONFIG: Record<OwaspStatus, { icon: typeof CheckCircle; color: string }> = {
  pass: { icon: CheckCircle, color: "text-success-400" },
  fail: { icon: XCircle, color: "text-danger-400" },
  warning: { icon: AlertTriangle, color: "text-warning-400" },
  "n/a": { icon: Info, color: "text-neutral-500" },
};

const GRADE_COLORS: Record<string, string> = {
  "A+": "text-success-400",
  A: "text-success-400",
  B: "text-primary-400",
  C: "text-warning-400",
  D: "text-orange-400",
  F: "text-danger-400",
};

const EXAMPLE_PROMPTS = [
  "A Node.js REST API with JWT auth, PostgreSQL, and file uploads stored on S3",
  "A React SPA with user authentication, role-based access, and payment processing via Stripe",
  "A Python Django web app with OAuth2, REST API, and admin panel",
  "A microservices architecture with API gateway, service mesh, and shared secrets",
  "A mobile app backend with Firebase Auth, Cloud Functions, and Firestore",
];

export function SecurityCenterPage() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SecurityAnalysis | null>(null);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const projectId = searchParams.get("projectId");

  useEffect(() => {
    if (!projectId) return;
    async function loadProjectSecurity() {
      const { data, error } = await supabase
        .from("projects")
        .select("security_report, description")
        .eq("id", projectId)
        .maybeSingle();
      if (!error) {
        if (data?.security_report) {
          setAnalysis(data.security_report as unknown as SecurityAnalysis);
        }
        if (data?.description && !prompt) {
          setPrompt(data.description);
        }
      }
    }
    loadProjectSecurity();
  }, [projectId]);

  async function handleSave() {
    if (!projectId || !analysis) return;
    setSaving(true);
    try {
      const { error: dbError } = await supabase
        .from("projects")
        .update({ security_report: analysis })
        .eq("id", projectId);

      if (dbError) throw dbError;

      await supabase.from("chat_messages").insert({
        project_id: projectId,
        role: "system",
        content: `Security analysis completed: score ${analysis.grade}`,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalyze(text?: string) {
    const input = (text ?? prompt).trim();
    if (!input || analyzing) return;
    setError(null);
    setAnalyzing(true);
    setAnalysis(null);
    if (text) setPrompt(text);

    try {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated.");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-security`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ prompt: input }),
        },
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.analysis) throw new Error("No analysis returned.");
      setAnalysis(data.analysis as SecurityAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze security.");
    } finally {
      setAnalyzing(false);
    }
  }

  const severityCounts = analysis
    ? (["critical", "high", "medium", "low", "info"] as Severity[]).map((s) => ({
      severity: s,
      count: analysis.findings.filter((f) => f.severity === s).length,
    }))
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Security Center"
        description="Describe your application stack and get an OWASP-aligned security analysis with actionable remediation."
        actions={
          analysis ? (
            <div className="flex gap-2">
              {projectId && (
                <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                  {saved ? <Check className="h-4 w-4 text-success-400" /> : <Save className="h-4 w-4" />}
                  {saved ? "Saved" : saving ? "Saving..." : "Save to Project"}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => handleAnalyze()}>
                <RefreshCw className="h-4 w-4" />
                Re-analyze
              </Button>
            </div>
          ) : null
        }
      />

      <div className="mt-8">
        <div className="gradient-border rounded-2xl">
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-400" />
                <span className="text-sm font-medium text-neutral-200">Describe your application</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAnalyze(); }}
                rows={4}
                placeholder="A Node.js REST API with JWT auth, PostgreSQL, file uploads on S3, and Redis caching…"
                className="flex w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-neutral-100 shadow-sm transition-colors placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                disabled={analyzing}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-600">Include tech stack, architecture, and any specific concerns</p>
                <Button variant="gradient" onClick={() => handleAnalyze()} disabled={!prompt.trim() || analyzing}>
                  {analyzing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Analyzing…</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4" />Analyze security</>
                  )}
                </Button>
              </div>
            </div>
            {!analysis && !analyzing ? (
              <div className="mt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Try an example</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((ex) => (
                    <button key={ex} onClick={() => handleAnalyze(ex)}
                      className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-xs text-neutral-400 transition-colors hover:border-border-hover hover:text-neutral-100">
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-300">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {analyzing ? (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-8 flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-20">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-2 border-border border-t-primary-500" />
              <ShieldCheck className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-primary-400" />
            </div>
            <h3 className="mt-6 font-heading text-base font-semibold text-neutral-100">Scanning for vulnerabilities</h3>
            <p className="mt-1 text-sm text-neutral-400">Running OWASP Top 10 analysis and threat modeling…</p>
          </motion.div>
        ) : analysis ? (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="mt-8 space-y-6">

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1 rounded-xl border border-border bg-surface p-5 flex flex-col items-center justify-center">
                <div className={cn("font-heading text-6xl font-bold", GRADE_COLORS[analysis.grade])}>
                  {analysis.grade}
                </div>
                <p className="mt-2 text-sm text-neutral-400">Security grade</p>
                <div className="mt-3 w-full rounded-full bg-surface-2 h-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all"
                    style={{ width: `${analysis.score}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-neutral-500">{analysis.score}/100</p>
              </div>

              <div className="sm:col-span-2 rounded-xl border border-border bg-surface p-5">
                <p className="text-sm leading-relaxed text-neutral-300">{analysis.summary}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {severityCounts.map(({ severity, count }) => {
                    if (count === 0) return null;
                    const config = SEVERITY_CONFIG[severity];
                    return (
                      <div key={severity} className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium", config.bg, config.color)}>
                        <config.icon className="h-3.5 w-3.5" />{count} {config.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h3 className="mb-3 font-heading text-sm font-semibold text-neutral-100">
                  Findings ({analysis.findings.length})
                </h3>
                <div className="space-y-2">
                  {analysis.findings.map((finding) => (
                    <FindingCard key={finding.id} finding={finding}
                      expanded={expandedFinding === finding.id}
                      onToggle={() => setExpandedFinding(expandedFinding === finding.id ? null : finding.id)} />
                  ))}
                  {analysis.findings.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-success-500/20 bg-success-500/5 px-5 py-4">
                      <CheckCircle className="h-5 w-5 text-success-400" />
                      <p className="text-sm text-neutral-300">No significant vulnerabilities detected.</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="mb-4 font-heading text-sm font-semibold text-neutral-100">OWASP Top 10</h3>
                  <div className="space-y-2">
                    {analysis.owaspCoverage.map((item) => {
                      const config = OWASP_STATUS_CONFIG[item.status];
                      return (
                        <div key={item.id} className="flex items-center gap-2">
                          <config.icon className={cn("h-3.5 w-3.5 shrink-0", config.color)} />
                          <span className="text-xs text-neutral-400 truncate">{item.id}: {item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <RecommendationsCard recommendations={analysis.recommendations} />

                {analysis.positives.length > 0 ? (
                  <div className="rounded-xl border border-success-500/20 bg-success-500/5 p-5">
                    <h3 className="mb-3 font-heading text-sm font-semibold text-neutral-100">Strengths</h3>
                    <ul className="space-y-1.5">
                      {analysis.positives.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
                          <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-success-400" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function FindingCard({ finding, expanded, onToggle }: {
  finding: SecurityFinding;
  expanded: boolean;
  onToggle: () => void;
}) {
  const config = SEVERITY_CONFIG[finding.severity];
  return (
    <div className={cn("rounded-xl border overflow-hidden transition-colors", config.bg)}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <config.icon className={cn("h-4 w-4 shrink-0", config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-100">{finding.title}</span>
            <Badge variant="outline" className={cn("shrink-0 text-[10px] capitalize", config.color)}>
              {config.label}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500 truncate">{finding.category}</p>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" /> : <ChevronRight className="h-4 w-4 shrink-0 text-neutral-500" />}
      </button>
      {expanded ? (
        <div className="border-t border-border/50 px-4 py-4 space-y-3">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-neutral-500">Description</p>
            <p className="text-xs text-neutral-300">{finding.description}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-neutral-500">Impact</p>
            <p className="text-xs text-neutral-300">{finding.impact}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-neutral-500">Remediation</p>
            <p className="text-xs text-neutral-300">{finding.remediation}</p>
          </div>
          {finding.references.length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-neutral-500">References</p>
              <ul className="space-y-0.5">
                {finding.references.map((ref, i) => (
                  <li key={i} className="text-xs text-primary-400">{ref}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RecommendationsCard({ recommendations }: { recommendations: SecurityAnalysis["recommendations"] }) {
  const sections = [
    { label: "Immediate", items: recommendations.immediate, icon: Zap, color: "text-danger-400" },
    { label: "Short-term", items: recommendations.shortTerm, icon: Clock, color: "text-warning-400" },
    { label: "Long-term", items: recommendations.longTerm, icon: TrendingUp, color: "text-primary-400" },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-4 font-heading text-sm font-semibold text-neutral-100">Recommendations</h3>
      <div className="space-y-4">
        {sections.map((s) => s.items.length > 0 ? (
          <div key={s.label}>
            <div className="mb-2 flex items-center gap-1.5">
              <s.icon className={cn("h-3.5 w-3.5", s.color)} />
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">{s.label}</span>
            </div>
            <ul className="space-y-1">
              {s.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neutral-600" />{item}
                </li>
              ))}
            </ul>
          </div>
        ) : null)}
      </div>
    </div>
  );
}
