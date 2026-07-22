import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Boxes,
  Server,
  Database,
  Zap,
  Layers,
  Globe,
  HardDrive,
  Cpu,
  Box,
  Cloud,
  DollarSign,
  Shield,
  TrendingUp,
  RefreshCw,
  Download,
  type LucideIcon,
} from "lucide-react";
import { Button, Badge } from "@ui/index";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArchitectureDiagram } from "@/components/architecture/architecture-diagram";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@utils/index";
import type {
  Architecture,
  ArchitectureService,
  ServiceType,
} from "@/lib/types/architecture";

const EXAMPLE_PROMPTS = [
  "A multi-tenant SaaS platform with billing, RBAC, and real-time collaboration",
  "An e-commerce marketplace with search, payments, and inventory management",
  "A real-time chat application with presence and message history",
  "A data analytics pipeline processing streaming events with dashboards",
  "A social media app with feed, notifications, and content moderation",
];

const typeIcons: Record<ServiceType, LucideIcon> = {
  api: Server,
  worker: Cpu,
  gateway: Globe,
  database: Database,
  cache: Zap,
  queue: Layers,
  storage: HardDrive,
  client: Box,
  external: Cloud,
};

const typeColors: Record<ServiceType, string> = {
  api: "text-primary-400",
  worker: "text-accent-400",
  gateway: "text-secondary-400",
  database: "text-success-400",
  cache: "text-warning-400",
  queue: "text-accent-400",
  storage: "text-neutral-400",
  client: "text-primary-400",
  external: "text-neutral-400",
};

export function ArchitectureGeneratorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [architecture, setArchitecture] = useState<Architecture | null>(null);
  const [selectedService, setSelectedService] = useState<ArchitectureService | null>(null);
  const projectId = searchParams.get("projectId");

  useEffect(() => {
    if (!projectId) return;
    async function loadProjectArch() {
      const { data, error } = await supabase
        .from("projects")
        .select("architecture, description")
        .eq("id", projectId)
        .maybeSingle();
      if (!error) {
        if (data?.architecture) {
          setArchitecture(data.architecture as unknown as Architecture);
        }
        if (data?.description && !prompt) {
          setPrompt(data.description);
        }
      }
    }
    loadProjectArch();
  }, [projectId]);

  async function handleGenerate(text?: string) {
    const input = (text ?? prompt).trim();
    if (!input || generating) return;

    setError(null);
    setGenerating(true);
    setArchitecture(null);
    setSelectedService(null);
    if (text) setPrompt(text);

    try {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated.");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-architecture`,
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
      if (!data.architecture) throw new Error("No architecture returned.");

      setArchitecture(data.architecture as Architecture);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate architecture.");
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    if (!architecture) return;
    const blob = new Blob([JSON.stringify(architecture, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "architecture.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Architecture Generator"
        description="Describe your application and get a complete system architecture with services, data flows, and cost estimates."
        actions={
          architecture ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Export JSON
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
                <span className="text-sm font-medium text-neutral-200">
                  Describe your application
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleGenerate();
                  }
                }}
                rows={3}
                placeholder="A multi-tenant SaaS with billing, RBAC, and real-time collaboration…"
                className="flex w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-neutral-100 shadow-sm transition-colors placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                disabled={generating}
              />
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-neutral-600">
                  Press Cmd/Ctrl + Enter to generate
                </p>
                <Button
                  variant="gradient"
                  onClick={() => handleGenerate()}
                  disabled={!prompt.trim() || generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Boxes className="h-4 w-4" />
                      Generate architecture
                    </>
                  )}
                </Button>
              </div>
            </div>

            {!architecture && !generating ? (
              <div className="mt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Try an example
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((example) => (
                    <button
                      key={example}
                      onClick={() => handleGenerate(example)}
                      className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-xs text-neutral-400 transition-colors hover:border-border-hover hover:text-neutral-100"
                    >
                      {example}
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
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {generating ? (
          <GeneratingState key="generating" />
        ) : architecture ? (
          <ArchitectureResult
            key="result"
            architecture={architecture}
            selectedService={selectedService}
            onSelectService={setSelectedService}
            projectId={projectId}
            navigate={navigate}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function GeneratingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mt-8 flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-20"
    >
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-2 border-border border-t-primary-500" />
        <Boxes className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-primary-400" />
      </div>
      <h3 className="mt-6 font-heading text-base font-semibold text-neutral-100">
        Designing your architecture
      </h3>
      <p className="mt-1 text-sm text-neutral-400">
        Analyzing requirements, mapping services, and estimating costs…
      </p>
    </motion.div>
  );
}

function ArchitectureResult({
  architecture,
  selectedService,
  onSelectService,
  projectId,
  navigate,
}: {
  architecture: Architecture;
  selectedService: ArchitectureService | null;
  onSelectService: (service: ArchitectureService) => void;
  projectId: string | null;
  navigate: (path: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      if (projectId) {
        const { error: dbError } = await supabase
          .from("projects")
          .update({ architecture: architecture })
          .eq("id", projectId);

        if (dbError) throw dbError;

        await supabase.from("chat_messages").insert({
          project_id: projectId,
          role: "system",
          content: `Architecture generated: ${architecture.summary}`,
        });
      }
      setSaved(true);
      setTimeout(() => {
        if (projectId) navigate(`/app/projects/${projectId}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-8 space-y-6"
    >
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-sm leading-relaxed text-neutral-300">{architecture.summary}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-neutral-400">
            <Server className="h-3.5 w-3.5 text-primary-400" />
            {architecture.services.length} services
          </span>
          <span className="flex items-center gap-1.5 text-neutral-400">
            <Layers className="h-3.5 w-3.5 text-accent-400" />
            {architecture.connections.length} connections
          </span>
          <span className="flex items-center gap-1.5 text-neutral-400">
            <DollarSign className="h-3.5 w-3.5 text-success-400" />
            ${architecture.estimatedCost.monthly}/mo estimated
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="mb-3 font-heading text-sm font-semibold text-neutral-100">
            Architecture Diagram
          </h3>
          <ArchitectureDiagram
            architecture={architecture}
            onSelectService={onSelectService}
          />
        </div>

        <div>
          <h3 className="mb-3 font-heading text-sm font-semibold text-neutral-100">
            {selectedService ? "Service details" : "Select a service"}
          </h3>
          {selectedService ? (
            <ServiceDetails service={selectedService} />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface/50 p-5 text-center">
              <p className="text-xs text-neutral-500">
                Click any node in the diagram to see its details.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 font-heading text-sm font-semibold text-neutral-100">
            Services ({architecture.services.length})
          </h3>
          <div className="space-y-2">
            {architecture.services.map((service) => {
              const Icon = typeIcons[service.type] ?? Box;
              const color = typeColors[service.type] ?? "text-neutral-400";
              return (
                <button
                  key={service.id}
                  onClick={() => onSelectService(service)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    selectedService?.id === service.id
                      ? "border-primary-500/30 bg-primary-500/10"
                      : "border-border bg-surface-2 hover:border-border-hover",
                  )}
                >
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface", color)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-200">{service.name}</p>
                    <p className="truncate text-xs text-neutral-500">{service.technology}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {service.type}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold text-neutral-100">
              <DollarSign className="h-4 w-4 text-success-400" />
              Cost Estimate
            </h3>
            <p className="font-heading text-2xl font-semibold text-neutral-50">
              ${architecture.estimatedCost.monthly}
              <span className="text-sm font-normal text-neutral-500">/mo</span>
            </p>
            <div className="mt-4 space-y-2">
              {architecture.estimatedCost.breakdown.map((item) => (
                <div key={item.service} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">{item.service}</span>
                  <span className="font-medium text-neutral-200">${item.cost}</span>
                </div>
              ))}
            </div>
          </div>

          <ConsiderationsCard considerations={architecture.considerations} />
        </div>
      </div>

      {projectId ? (
        <div className="flex justify-center">
          <Button variant="gradient" size="lg" onClick={handleSave} disabled={saving || saved}>
            {saved ? (
              <>
                <Shield className="h-4 w-4" />
                Saved to project
              </>
            ) : saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save to project"
            )}
          </Button>
        </div>
      ) : null}
    </motion.div>
  );
}

function ServiceDetails({ service }: { service: ArchitectureService }) {
  const Icon = typeIcons[service.type] ?? Box;
  const color = typeColors[service.type] ?? "text-neutral-400";
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="flex items-center gap-3">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2", color)}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h4 className="font-heading text-sm font-semibold text-neutral-100">
            {service.name}
          </h4>
          <Badge variant="outline" className="mt-0.5 capitalize">
            {service.type}
          </Badge>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-300">
        {service.description}
      </p>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Technology</span>
          <span className="text-neutral-200">{service.technology}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Scaling</span>
          <span className="text-neutral-200 capitalize">{service.scaling}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ConsiderationsCard({
  considerations,
}: {
  considerations: Architecture["considerations"];
}) {
  const sections = [
    { label: "Scaling", items: considerations.scaling, icon: TrendingUp, color: "text-primary-400" },
    { label: "Security", items: considerations.security, icon: Shield, color: "text-success-400" },
    { label: "Reliability", items: considerations.reliability, icon: Boxes, color: "text-accent-400" },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-4 font-heading text-sm font-semibold text-neutral-100">
        Considerations
      </h3>
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="mb-2 flex items-center gap-1.5">
              <section.icon className={cn("h-3.5 w-3.5", section.color)} />
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                {section.label}
              </span>
            </div>
            <ul className="space-y-1.5">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neutral-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
