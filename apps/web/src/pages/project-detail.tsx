import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Boxes,
  Database,
  Code2,
  ShieldCheck,
  FileText,
  GitBranch,
  DollarSign,
  Settings,
  MessageSquare,
  Loader2,
  AlertCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button } from "@ui/index";
import { useProject, useDeleteProject } from "@/lib/queries/projects";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { formatDate, cn } from "@utils/index";

type Tab = "overview" | "artifacts" | "chat" | "settings";

interface ArtifactMeta {
  kind: string;
  title: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

const sampleArtifacts: ArtifactMeta[] = [
  { kind: "architecture", title: "System Architecture", icon: Boxes, color: "text-primary-400", description: "Service map with 6 services and data flows" },
  { kind: "database", title: "Database Schema", icon: Database, color: "text-accent-400", description: "14 tables across 3 schemas" },
  { kind: "api", title: "REST API Spec", icon: Code2, color: "text-secondary-400", description: "42 endpoints with OpenAPI docs" },
  { kind: "security", title: "Security Report", icon: ShieldCheck, color: "text-success-400", description: "OWASP Top 10 analysis — score A+" },
  { kind: "docs", title: "README & Docs", icon: FileText, color: "text-warning-400", description: "Auto-generated documentation" },
  { kind: "repo", title: "Repo Analysis", icon: GitBranch, color: "text-primary-400", description: "Structure map and quality metrics" },
  { kind: "cost", title: "Cost Estimate", icon: DollarSign, color: "text-success-400", description: "$340/mo projected cloud spend" },
];

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, error, refetch } = useProject(id);
  const deleteProject = useDeleteProject();
  const [tab, setTab] = useState<Tab>("overview");

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-danger-400" />
        <h2 className="mt-4 font-heading text-lg font-semibold text-neutral-100">
          Project not found
        </h2>
        <p className="mt-1 text-sm text-neutral-400">
          {error ? error.message : "This project may have been deleted."}
        </p>
        <Button variant="outline" className="mt-6" onClick={() => navigate("/app/projects")}>
          Back to projects
        </Button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "overview", label: "Overview", icon: Boxes },
    { id: "artifacts", label: "Artifacts", icon: FileText },
    { id: "chat", label: "AI Chat", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("/app/projects")}
        className="mb-4 flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" />
        All projects
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-neutral-50">
                {project.name}
              </h1>
              <Badge variant={project.status === "active" ? "success" : "warning"}>
                {project.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-neutral-400">
              {project.description ?? "No description"}
            </p>
            <p className="mt-2 text-xs text-neutral-600">
              Created {formatDate(project.created_at)} · Updated {formatDate(project.updated_at)}
            </p>
          </div>
        </div>

        <div className="mt-6 border-b border-border">
          <nav className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  tab === t.id
                    ? "text-primary-300"
                    : "text-neutral-400 hover:text-neutral-100",
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {tab === t.id ? (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary-500"
                  />
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {tab === "overview" && <OverviewTab project={project} projectId={project.id} setTab={setTab} refetch={refetch} />}
          {tab === "artifacts" && <ArtifactsTab projectId={project.id} />}
          {tab === "chat" && <ChatPanel projectId={project.id} />}
          {tab === "settings" && (
            <SettingsTab
              projectId={project.id}
              onDelete={async () => {
                await deleteProject.mutateAsync(project.id);
                navigate("/app/projects");
              }}
              deleting={deleteProject.isPending}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}

function OverviewTab({
  project,
  projectId,
  setTab,
  refetch,
}: {
  project: any;
  projectId: string;
  setTab: (tab: Tab) => void;
  refetch: () => Promise<any>;
}) {
  const { session } = useAuth();
  const [projectDescription, setProjectDescription] = useState(project.description ?? "");
  const [savingDescription, setSavingDescription] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generateStep, setGenerateStep] = useState("");
  const [generateError, setGenerateError] = useState<string | null>(null);

  const artifactCount = [
    project.architecture,
    project.database_schema,
    project.api_spec,
    project.security_report,
  ].filter(Boolean).length;

  const serviceCount = project.architecture?.services?.length ?? 0;
  const tableCount = project.database_schema?.tables?.length ?? 0;
  const endpointCount = project.api_spec?.endpoints?.length ?? 0;

  async function handleSaveDescription() {
    setSavingDescription(true);
    setGenerateError(null);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ description: projectDescription.trim() })
        .eq("id", projectId);
      if (error) throw error;
      await refetch();
    } catch (err: any) {
      setGenerateError(err.message || "Failed to save description.");
    } finally {
      setSavingDescription(false);
    }
  }

  async function handleGenerateAll() {
    const input = projectDescription.trim();
    if (!input || generatingAll) return;

    setGeneratingAll(true);
    setGenerateError(null);

    try {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated.");

      // 1. Save description first
      setGenerateStep("Saving description");
      await supabase
        .from("projects")
        .update({ description: input })
        .eq("id", projectId);

      // 2. Generate Architecture
      setGenerateStep("Architecture");
      const archRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-architecture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ prompt: input }),
        }
      );
      if (!archRes.ok) throw new Error("Failed to generate architecture.");
      const archData = await archRes.json();

      // 3. Generate Database Schema
      setGenerateStep("Database Schema");
      const dbRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-database-schema`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ prompt: input, dialect: "postgresql" }),
        }
      );
      if (!dbRes.ok) throw new Error("Failed to generate database schema.");
      const dbData = await dbRes.json();

      // 4. Generate API Spec
      setGenerateStep("API Spec");
      const apiRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-api-spec`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ prompt: input }),
        }
      );
      if (!apiRes.ok) throw new Error("Failed to generate API spec.");
      const apiData = await apiRes.json();

      // 5. Generate Security Report
      setGenerateStep("Security Report");
      const secRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-security`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ prompt: input }),
        }
      );
      if (!secRes.ok) throw new Error("Failed to generate security report.");
      const secData = await secRes.json();

      // 6. Save all to the project record in the database
      setGenerateStep("Saving all results");
      const { error: dbError } = await supabase
        .from("projects")
        .update({
          architecture: archData.architecture,
          database_schema: dbData.schema,
          api_spec: apiData.spec,
          security_report: secData.analysis,
        })
        .eq("id", projectId);

      if (dbError) throw dbError;

      // 7. Insert system messages for chat history
      await supabase.from("chat_messages").insert([
        {
          project_id: projectId,
          role: "system",
          content: `All artifacts successfully generated based on prompt: "${input}"`,
        }
      ]);

      await refetch();
    } catch (err: any) {
      setGenerateError(err.message || "Failed to generate all artifacts.");
    } finally {
      setGeneratingAll(false);
      setGenerateStep("");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {/* Describe Your Project */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-heading text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-400" />
            Describe Your Project
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            Define your application prompt here. The AI will use this description to generate your system architecture, database schema, API spec, and security center findings.
          </p>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            rows={3}
            placeholder="A social media app for pet owners with forums, photo sharing, and geolocation..."
            className="mt-3 flex w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-neutral-100 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
          <div className="mt-3 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDescription}
              disabled={savingDescription || projectDescription === project.description}
            >
              {savingDescription ? "Saving..." : "Save Description"}
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={handleGenerateAll}
              disabled={generatingAll || !projectDescription.trim()}
            >
              {generatingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating All ({generateStep})...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate All Artifacts
                </>
              )}
            </Button>
          </div>
          {generateError && (
            <p className="mt-2 text-xs text-danger-400">{generateError}</p>
          )}
        </div>

        {/* Project Summary */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-heading text-sm font-semibold text-neutral-100">
            Project summary
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Artifacts", value: String(artifactCount), action: () => setTab("artifacts") },
              { label: "Services", value: String(serviceCount), link: `/app/architecture?projectId=${projectId}` },
              { label: "Tables", value: String(tableCount), link: `/app/database?projectId=${projectId}` },
              { label: "Endpoints", value: String(endpointCount), link: `/app/api-generator?projectId=${projectId}` },
            ].map((stat) => {
              if (stat.action) {
                return (
                  <button
                    key={stat.label}
                    onClick={stat.action}
                    className="text-left rounded-lg border border-border bg-surface-2 p-3 hover:border-border-hover hover:bg-surface-3 transition-colors w-full cursor-pointer"
                  >
                    <p className="text-xs text-neutral-500">{stat.label}</p>
                    <p className="mt-1 font-heading text-xl font-semibold text-neutral-50">
                      {stat.value}
                    </p>
                  </button>
                );
              }
              return (
                <Link
                  key={stat.label}
                  to={stat.link || ""}
                  className="text-left rounded-lg border border-border bg-surface-2 p-3 hover:border-border-hover hover:bg-surface-3 transition-colors w-full"
                >
                  <p className="text-xs text-neutral-500">{stat.label}</p>
                  <p className="mt-1 font-heading text-xl font-semibold text-neutral-50">
                    {stat.value}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-heading text-sm font-semibold text-neutral-100">
            Recent artifacts
          </h3>
          <div className="mt-4 space-y-2">
            {sampleArtifacts.slice(0, 4).map((artifact) => {
              const link =
                artifact.kind === "architecture"
                  ? `/app/architecture?projectId=${projectId}`
                  : artifact.kind === "database"
                    ? `/app/database?projectId=${projectId}`
                    : artifact.kind === "api"
                      ? `/app/api-generator?projectId=${projectId}`
                      : artifact.kind === "security"
                        ? `/app/security?projectId=${projectId}`
                        : `/app/architecture?projectId=${projectId}`;
              return (
                <Link
                  key={artifact.kind}
                  to={link}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2.5 transition-colors hover:border-border-hover hover:bg-surface-3 w-full"
                >
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-md bg-surface", artifact.color)}>
                    <artifact.icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-200">{artifact.title}</p>
                    <p className="text-xs text-neutral-500">{artifact.description}</p>
                  </div>
                  <Badge variant="outline">View</Badge>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-heading text-sm font-semibold text-neutral-100">
            Tags & metadata
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.tags.length > 0 ? (
              project.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-surface-2 px-2 py-1 text-xs text-neutral-400">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-neutral-600">No tags</span>
            )}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Visibility</span>
              <span className="text-neutral-300">{project.visibility}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-heading text-sm font-semibold text-neutral-100">
            Quick generate
          </h3>
          <div className="mt-3 space-y-2">
            {sampleArtifacts.slice(0, 4).map((artifact) => {
              const link =
                artifact.kind === "architecture"
                  ? `/app/architecture?projectId=${projectId}`
                  : artifact.kind === "database"
                    ? `/app/database?projectId=${projectId}`
                    : artifact.kind === "api"
                      ? `/app/api-generator?projectId=${projectId}`
                      : artifact.kind === "security"
                        ? `/app/security?projectId=${projectId}`
                        : `/app/architecture?projectId=${projectId}`;
              return (
                <Link
                  key={artifact.kind}
                  to={link}
                  className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-neutral-300 transition-colors hover:border-border-hover hover:text-neutral-100"
                >
                  <artifact.icon className={cn("h-4 w-4", artifact.color)} />
                  {artifact.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ArtifactsTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sampleArtifacts.map((artifact, i) => {
        const link =
          artifact.kind === "architecture"
            ? `/app/architecture?projectId=${projectId}`
            : artifact.kind === "database"
              ? `/app/database?projectId=${projectId}`
              : artifact.kind === "api"
                ? `/app/api-generator?projectId=${projectId}`
                : artifact.kind === "security"
                  ? `/app/security?projectId=${projectId}`
                  : `/app/architecture?projectId=${projectId}`;
        return (
          <motion.div
            key={artifact.kind}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="group rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-border-hover hover:shadow-lg hover:shadow-primary-500/5"
          >
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2", artifact.color)}>
              <artifact.icon className="h-5 w-5" />
            </span>
            <h4 className="mt-3 font-heading text-sm font-semibold text-neutral-100">
              {artifact.title}
            </h4>
            <p className="mt-1 text-xs text-neutral-400">{artifact.description}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full"
              onClick={() => navigate(link)}
            >
              View artifact
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}

function SettingsTab({
  projectId: _projectId,
  onDelete,
  deleting,
}: {
  projectId: string;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="font-heading text-sm font-semibold text-neutral-100">
          General
        </h3>
        <p className="mt-1 text-sm text-neutral-400">
          Project settings will be expanded in upcoming sprints.
        </p>
      </div>

      <div className="rounded-xl border border-danger-500/30 bg-danger-500/5 p-5">
        <h3 className="font-heading text-sm font-semibold text-danger-300">
          Danger zone
        </h3>
        <p className="mt-1 text-sm text-neutral-400">
          Deleting a project permanently removes it and all associated artifacts.
        </p>
        <Button
          variant="danger"
          size="sm"
          className="mt-4"
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deleting…
            </>
          ) : (
            "Delete project"
          )}
        </Button>
      </div>
    </div>
  );
}
