import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Loader2,
  AlertCircle,
  Sparkles,
  Download,
  RefreshCw,
  Copy,
  Check,
  Table2,
  KeyRound,
  Link2,
  TrendingUp,
  Layers,
  Save,
} from "lucide-react";
import { Button, Badge } from "@ui/index";
import { PageHeader } from "@/components/dashboard/page-header";
import { ERDiagram } from "@/components/architecture/er-diagram";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@utils/index";
import type {
  DatabaseSchema,
  SchemaTable,
} from "@/lib/types/database-schema";

type Dialect = "postgresql" | "mysql" | "sqlite";

const EXAMPLE_PROMPTS = [
  "A project management app with workspaces, projects, tasks, and comments",
  "An e-commerce platform with products, categories, orders, and inventory",
  "A blog platform with authors, posts, tags, and comments",
  "A learning management system with courses, lessons, enrollments, and progress",
  "A multi-tenant SaaS with organizations, members, roles, and billing",
];

export function DatabaseDesignerPage() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [dialect, setDialect] = useState<Dialect>("postgresql");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [selectedTable, setSelectedTable] = useState<SchemaTable | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const projectId = searchParams.get("projectId");

  useEffect(() => {
    if (!projectId) return;
    async function loadProjectSchema() {
      const { data, error } = await supabase
        .from("projects")
        .select("database_schema, description")
        .eq("id", projectId)
        .maybeSingle();
      if (!error) {
        if (data?.database_schema) {
          setSchema(data.database_schema as unknown as DatabaseSchema);
        }
        if (data?.description && !prompt) {
          setPrompt(data.description);
        }
      }
    }
    loadProjectSchema();
  }, [projectId]);

  async function handleGenerate(text?: string) {
    const input = (text ?? prompt).trim();
    if (!input || generating) return;

    setError(null);
    setGenerating(true);
    setSchema(null);
    setSelectedTable(null);
    if (text) setPrompt(text);

    try {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated.");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-database-schema`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ prompt: input, dialect }),
        },
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.schema) throw new Error("No schema returned.");

      setSchema(data.schema as DatabaseSchema);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate schema.");
    } finally {
      setGenerating(false);
    }
  }

  function handleDownloadSQL() {
    if (!schema?.sql) return;
    const blob = new Blob([schema.sql], { type: "text/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.sql";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadJSON() {
    if (!schema) return;
    const blob = new Blob([JSON.stringify(schema, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopySQL() {
    if (!schema?.sql) return;
    await navigator.clipboard.writeText(schema.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    if (!projectId || !schema) return;
    setSaving(true);
    try {
      const { error: dbError } = await supabase
        .from("projects")
        .update({ database_schema: schema })
        .eq("id", projectId);

      if (dbError) throw dbError;

      await supabase.from("chat_messages").insert({
        project_id: projectId,
        role: "system",
        content: `Database schema generated: ${schema.summary}`,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Database Designer"
        description="Describe your data model and get a normalized schema with ER diagram, indexes, and migration-ready SQL."
        actions={
          schema ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadJSON}>
                <Download className="h-4 w-4" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadSQL}>
                <Download className="h-4 w-4" />
                SQL
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
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary-400" />
                  <span className="text-sm font-medium text-neutral-200">
                    Describe your data model
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Dialect:</span>
                  <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-0.5">
                    {(["postgresql", "mysql", "sqlite"] as Dialect[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDialect(d)}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                          dialect === d
                            ? "bg-primary-500/15 text-primary-300"
                            : "text-neutral-400 hover:text-neutral-100",
                        )}
                      >
                        {d === "postgresql" ? "Postgres" : d === "mysql" ? "MySQL" : "SQLite"}
                      </button>
                    ))}
                  </div>
                </div>
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
                placeholder="A project management app with workspaces, projects, tasks, and comments…"
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
                      <Database className="h-4 w-4" />
                      Generate schema
                    </>
                  )}
                </Button>
              </div>
            </div>

            {!schema && !generating ? (
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
        ) : schema ? (
          <SchemaResult
            key="result"
            schema={schema}
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
            copied={copied}
            onCopySQL={handleCopySQL}
            projectId={projectId}
            saving={saving}
            saved={saved}
            onSave={handleSave}
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
        <Database className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-primary-400" />
      </div>
      <h3 className="mt-6 font-heading text-base font-semibold text-neutral-100">
        Designing your schema
      </h3>
      <p className="mt-1 text-sm text-neutral-400">
        Normalizing tables, mapping relations, generating SQL…
      </p>
    </motion.div>
  );
}

function SchemaResult({
  schema,
  selectedTable,
  onSelectTable,
  copied,
  onCopySQL,
  projectId,
  saving,
  saved,
  onSave,
}: {
  schema: DatabaseSchema;
  selectedTable: SchemaTable | null;
  onSelectTable: (table: SchemaTable) => void;
  copied: boolean;
  onCopySQL: () => void;
  projectId: string | null;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-8 space-y-6"
    >
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-sm leading-relaxed text-neutral-300">{schema.summary}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-neutral-400">
            <Table2 className="h-3.5 w-3.5 text-primary-400" />
            {schema.tables.length} tables
          </span>
          <span className="flex items-center gap-1.5 text-neutral-400">
            <Link2 className="h-3.5 w-3.5 text-accent-400" />
            {schema.relations.length} relations
          </span>
          <span className="flex items-center gap-1.5 text-neutral-400">
            <KeyRound className="h-3.5 w-3.5 text-warning-400" />
            {schema.indexes.length} indexes
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="mb-3 font-heading text-sm font-semibold text-neutral-100">
            ER Diagram
          </h3>
          <ERDiagram schema={schema} onSelectTable={onSelectTable} />
        </div>

        <div>
          <h3 className="mb-3 font-heading text-sm font-semibold text-neutral-100">
            {selectedTable ? "Table details" : "Select a table"}
          </h3>
          {selectedTable ? (
            <TableDetails table={selectedTable} />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface/50 p-5 text-center">
              <p className="text-xs text-neutral-500">
                Click any table in the diagram to see its columns and details.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 font-heading text-sm font-semibold text-neutral-100">
            Tables ({schema.tables.length})
          </h3>
          <div className="space-y-2">
            {schema.tables.map((table) => (
              <button
                key={table.id}
                onClick={() => onSelectTable(table)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  selectedTable?.id === table.id
                    ? "border-primary-500/30 bg-primary-500/10"
                    : "border-border bg-surface-2 hover:border-border-hover",
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface text-primary-400">
                  <Table2 className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-200">{table.name}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {table.columns.length} columns
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-sm font-semibold text-neutral-100">
                SQL Migration
              </h3>
              <Button variant="ghost" size="sm" onClick={onCopySQL}>
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-surface-2 p-3 text-xs text-neutral-300">
              <code>{schema.sql}</code>
            </pre>
          </div>

          <SchemaConsiderationsCard considerations={schema.considerations} />
        </div>
      </div>

      {projectId ? (
        <div className="flex justify-center">
          <Button variant="gradient" size="lg" onClick={onSave} disabled={saving || saved}>
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved to project
              </>
            ) : saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save to project
              </>
            )}
          </Button>
        </div>
      ) : null}
    </motion.div>
  );
}

function TableDetails({ table }: { table: SchemaTable }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-primary-400">
          <Table2 className="h-5 w-5" />
        </span>
        <div>
          <h4 className="font-heading text-sm font-semibold text-neutral-100">
            {table.name}
          </h4>
          <p className="mt-0.5 text-xs text-neutral-500">{table.description}</p>
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        {table.columns.map((col) => (
          <div
            key={col.name}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2"
          >
            {col.primaryKey ? (
              <KeyRound className="h-3 w-3 shrink-0 text-warning-400" />
            ) : col.unique ? (
              <Link2 className="h-3 w-3 shrink-0 text-accent-400" />
            ) : (
              <span className="w-3 shrink-0" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                col.primaryKey ? "text-neutral-100" : "text-neutral-300",
              )}
            >
              {col.name}
            </span>
            <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
              {col.type}
            </Badge>
            {col.nullable ? (
              <span className="text-[10px] text-neutral-600">?</span>
            ) : (
              <span className="text-[10px] text-neutral-600">NN</span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SchemaConsiderationsCard({
  considerations,
}: {
  considerations: DatabaseSchema["considerations"];
}) {
  const sections = [
    { label: "Normalization", items: considerations.normalization, icon: Layers, color: "text-primary-400" },
    { label: "Indexing", items: considerations.indexing, icon: KeyRound, color: "text-warning-400" },
    { label: "Scaling", items: considerations.scaling, icon: TrendingUp, color: "text-accent-400" },
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
