import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  Loader2,
  AlertCircle,
  Sparkles,
  Download,
  RefreshCw,
  Copy,
  Check,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Server,
  Shield,
  Zap,
  Layers,
  Save,
} from "lucide-react";
import { Button, Badge } from "@ui/index";
import { PageHeader } from "@/components/dashboard/page-header";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@utils/index";
import type { ApiSpec, ApiEndpoint, HttpMethod } from "@/lib/types/api-spec";

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-success-500/15 text-success-400 border-success-500/20",
  POST: "bg-primary-500/15 text-primary-400 border-primary-500/20",
  PUT: "bg-warning-500/15 text-warning-400 border-warning-500/20",
  PATCH: "bg-accent-500/15 text-accent-400 border-accent-500/20",
  DELETE: "bg-danger-500/15 text-danger-400 border-danger-500/20",
};

const EXAMPLE_PROMPTS = [
  "A REST API for a task management app with projects, tasks, and user assignments",
  "An e-commerce API with product catalog, cart, orders, and payment webhooks",
  "A social platform API with profiles, posts, follows, and notifications",
  "A SaaS API with organizations, members, RBAC, and audit logs",
  "A content management API with articles, tags, categories, and media uploads",
];

export function ApiGeneratorPage() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spec, setSpec] = useState<ApiSpec | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const projectId = searchParams.get("projectId");

  useEffect(() => {
    if (!projectId) return;
    async function loadProjectSpec() {
      const { data, error } = await supabase
        .from("projects")
        .select("api_spec, description")
        .eq("id", projectId)
        .maybeSingle();
      if (!error) {
        if (data?.api_spec) {
          const loaded = data.api_spec as unknown as ApiSpec;
          setSpec(loaded);
          const tags = new Set(loaded.endpoints.flatMap((e) => e.tags));
          setExpandedTags(tags);
        }
        if (data?.description && !prompt) {
          setPrompt(data.description);
        }
      }
    }
    loadProjectSpec();
  }, [projectId]);

  async function handleGenerate(text?: string) {
    const input = (text ?? prompt).trim();
    if (!input || generating) return;
    setError(null);
    setGenerating(true);
    setSpec(null);
    setSelectedEndpoint(null);
    if (text) setPrompt(text);

    try {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated.");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-api-spec`,
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
      if (!data.spec) throw new Error("No API spec returned.");

      const loaded = data.spec as ApiSpec;
      setSpec(loaded);
      const tags = new Set(loaded.endpoints.flatMap((e) => e.tags));
      setExpandedTags(tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate API spec.");
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    if (!spec) return;
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "api-spec.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    if (!spec) return;
    await navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    if (!projectId || !spec) return;
    setSaving(true);
    try {
      const { error: dbError } = await supabase
        .from("projects")
        .update({ api_spec: spec })
        .eq("id", projectId);

      if (dbError) throw dbError;

      await supabase.from("chat_messages").insert({
        project_id: projectId,
        role: "system",
        content: `API specification generated for: ${spec.title}`,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const allTags = spec ? [...new Set(spec.endpoints.flatMap((e) => e.tags))] : [];

  function toggleTag(tag: string) {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="API Generator"
        description="Describe your API and get a complete REST specification with endpoints, schemas, and authentication."
        actions={
          spec ? (
            <div className="flex gap-2">
              {projectId && (
                <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                  {saved ? <Check className="h-4 w-4 text-success-400" /> : <Save className="h-4 w-4" />}
                  {saved ? "Saved" : saving ? "Saving..." : "Save to Project"}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-success-400" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy JSON"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleGenerate()}>
                <RefreshCw className="h-4 w-4" />
                Regenerate
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
                <span className="text-sm font-medium text-neutral-200">Describe your API</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
                }}
                rows={3}
                placeholder="A REST API for a task management app with projects, tasks, and user assignments…"
                className="flex w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-neutral-100 shadow-sm transition-colors placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                disabled={generating}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-600">Press Cmd/Ctrl + Enter to generate</p>
                <Button variant="gradient" onClick={() => handleGenerate()} disabled={!prompt.trim() || generating}>
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Generating…</>
                  ) : (
                    <><Code2 className="h-4 w-4" />Generate API</>
                  )}
                </Button>
              </div>
            </div>
            {!spec && !generating ? (
              <div className="mt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Try an example</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((ex) => (
                    <button key={ex} onClick={() => handleGenerate(ex)}
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
        {generating ? (
          <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-8 flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-20">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-2 border-border border-t-primary-500" />
              <Code2 className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-primary-400" />
            </div>
            <h3 className="mt-6 font-heading text-base font-semibold text-neutral-100">Designing your API</h3>
            <p className="mt-1 text-sm text-neutral-400">Mapping endpoints, schemas, and auth flows…</p>
          </motion.div>
        ) : spec ? (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="mt-8 space-y-6">

            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-lg font-semibold text-neutral-50">{spec.title}</h2>
                  <p className="mt-1 text-sm text-neutral-400">{spec.summary}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant="outline">v{spec.version}</Badge>
                  <code className="text-xs text-neutral-500">{spec.baseUrl}</code>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <Layers className="h-3.5 w-3.5 text-primary-400" />{spec.endpoints.length} endpoints
                </span>
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <Server className="h-3.5 w-3.5 text-accent-400" />{spec.schemas.length} schemas
                </span>
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <Shield className="h-3.5 w-3.5 text-success-400" />
                  Auth: {spec.authentication.type}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <h3 className="mb-3 font-heading text-sm font-semibold text-neutral-100">Endpoints</h3>
                <div className="space-y-2">
                  {allTags.map((tag) => {
                    const tagEndpoints = spec.endpoints.filter((e) => e.tags.includes(tag));
                    const expanded = expandedTags.has(tag);
                    return (
                      <div key={tag} className="rounded-xl border border-border bg-surface overflow-hidden">
                        <button onClick={() => toggleTag(tag)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-2 transition-colors">
                          <span className="font-medium text-sm text-neutral-200 capitalize">{tag}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">{tagEndpoints.length}</span>
                            {expanded ? <ChevronDown className="h-4 w-4 text-neutral-500" /> : <ChevronRight className="h-4 w-4 text-neutral-500" />}
                          </div>
                        </button>
                        {expanded ? (
                          <div className="border-t border-border divide-y divide-border">
                            {tagEndpoints.map((ep) => (
                              <button key={ep.id} onClick={() => setSelectedEndpoint(ep === selectedEndpoint ? null : ep)}
                                className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2",
                                  selectedEndpoint?.id === ep.id ? "bg-primary-500/5" : "")}>
                                <span className={cn("shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold", METHOD_COLORS[ep.method])}>
                                  {ep.method}
                                </span>
                                <code className="flex-1 text-xs text-neutral-300">{ep.path}</code>
                                <span className="text-xs text-neutral-500 hidden sm:block">{ep.summary}</span>
                                {ep.auth !== "none" ? <Lock className="h-3 w-3 shrink-0 text-neutral-600" /> : <Unlock className="h-3 w-3 shrink-0 text-neutral-700" />}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                {selectedEndpoint ? (
                  <EndpointDetails endpoint={selectedEndpoint} />
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-surface/50 p-5 text-center">
                    <p className="text-xs text-neutral-500">Click an endpoint to see its details.</p>
                  </div>
                )}
                <ApiConsiderations considerations={spec.considerations} />
              </div>
            </div>

            {spec.schemas.length > 0 ? (
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="mb-4 font-heading text-sm font-semibold text-neutral-100">Data Schemas ({spec.schemas.length})</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {spec.schemas.map((schema) => (
                    <div key={schema.name} className="rounded-lg border border-border bg-surface-2 p-4">
                      <p className="font-mono text-sm font-semibold text-neutral-100">{schema.name}</p>
                      <div className="mt-3 space-y-1.5">
                        {schema.fields.map((field) => (
                          <div key={field.name} className="flex items-center gap-2 text-xs">
                            <span className={cn("font-medium", field.required ? "text-neutral-200" : "text-neutral-400")}>
                              {field.name}{!field.required ? "?" : ""}
                            </span>
                            <span className="ml-auto text-neutral-600">{field.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function EndpointDetails({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
      className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("rounded border px-2 py-0.5 font-mono text-xs font-bold", METHOD_COLORS[endpoint.method])}>
          {endpoint.method}
        </span>
        <code className="text-sm text-neutral-200">{endpoint.path}</code>
      </div>
      <p className="mt-2 text-sm font-medium text-neutral-100">{endpoint.summary}</p>
      <p className="mt-1 text-xs text-neutral-400">{endpoint.description}</p>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-neutral-500">Auth:</span>
        <Badge variant="outline" className="text-[10px] capitalize">{endpoint.auth}</Badge>
      </div>

      {endpoint.pathParams.length > 0 ? (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500">Path params</p>
          {endpoint.pathParams.map((p) => (
            <div key={p.name} className="flex items-center gap-2 rounded px-2 py-1 text-xs">
              <code className="text-primary-300">{"{" + p.name + "}"}</code>
              <span className="text-neutral-600">{p.type}</span>
              <span className="text-neutral-500">{p.description}</span>
            </div>
          ))}
        </div>
      ) : null}

      {endpoint.queryParams.length > 0 ? (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500">Query params</p>
          {endpoint.queryParams.map((p) => (
            <div key={p.name} className="flex items-center gap-2 rounded px-2 py-1 text-xs">
              <code className="text-accent-300">{p.name}{!p.required ? "?" : ""}</code>
              <span className="text-neutral-600">{p.type}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500">Responses</p>
        <div className="space-y-1.5">
          {endpoint.responses.map((r) => (
            <div key={r.status} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs">
              <span className={cn("font-mono font-bold",
                r.status < 300 ? "text-success-400" : r.status < 400 ? "text-warning-400" : "text-danger-400")}>
                {r.status}
              </span>
              <span className="text-neutral-400">{r.description}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ApiConsiderations({ considerations }: { considerations: ApiSpec["considerations"] }) {
  const sections = [
    { label: "Security", items: considerations.security, color: "text-success-400", icon: Shield },
    { label: "Versioning", items: considerations.versioning, color: "text-primary-400", icon: Layers },
    { label: "Performance", items: considerations.performance, color: "text-accent-400", icon: Zap },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-4 font-heading text-sm font-semibold text-neutral-100">Considerations</h3>
      <div className="space-y-4">
        {sections.map((s) => (
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
        ))}
      </div>
    </div>
  );
}
