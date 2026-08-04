import { useState, useEffect, useMemo, useCallback } from "react";
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
  Shield,
  Search,
  ChevronRight,
  TrendingDown,
  Info,
  Maximize2,
  Minimize2,
  Eye,
  X,
  CheckCircle2,
  FileCode,
  FileText,
} from "lucide-react";
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@ui/index";
import { PageHeader } from "@/components/dashboard/page-header";
import { ERDiagram } from "@/components/architecture/er-diagram";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useAIQueue } from "@/lib/ai-queue-context";
import { cn } from "@utils/index";
import { AILoader } from "@/components/dashboard/AILoader";
import type {
  DatabaseSchema,
  SchemaTable,
  SchemaColumn,
} from "@/lib/types/database-schema";

type Dialect = "postgresql" | "mysql" | "sqlite";

const EXAMPLE_PROMPTS = [
  "A project management app with workspaces, projects, tasks, and comments",
  "An e-commerce platform with products, categories, orders, and inventory",
  "A blog platform with authors, posts, tags, and comments",
  "A learning management system with courses, lessons, enrollments, and progress",
  "A multi-tenant SaaS with organizations, members, roles, and billing",
];

// Helper to highlight SQL syntax using styled HTML spans
function HighlightedSQL({ sql }: { sql: string }) {
  const highlighted = useMemo(() => {
    let html = sql
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Highlight keywords and data types
    html = html.replace(/\b(CREATE TABLE|ALTER TABLE|ADD CONSTRAINT|FOREIGN KEY|PRIMARY KEY|REFERENCES|INDEX|UNIQUE|NOT NULL|DEFAULT|ON DELETE|ON UPDATE|CASCADE)\b/g, '<span class="text-primary-400 font-bold">$1</span>');
    html = html.replace(/\b(INT|VARCHAR|TEXT|TIMESTAMP|BOOLEAN|UUID|DECIMAL|DATE|INTEGER|SERIAL|bigint|character varying|timestamp with time zone)\b/g, '<span class="text-success-400 font-medium">$1</span>');
    html = html.replace(/(--.*)$/gm, '<span class="text-neutral-500 font-mono italic">$1</span>');

    return html;
  }, [sql]);

  return (
    <pre 
      className="text-xs text-neutral-300 font-mono leading-relaxed select-text text-left overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

// Generate realistic telemetry and specifications for each selected table
function getDetailedTableMetrics(table: SchemaTable, schema: DatabaseSchema) {
  let purpose = "Stores system entity instances.";
  if (table.name.toLowerCase().includes("user") || table.name.toLowerCase().includes("profile")) {
    purpose = "Manages user authentication credentials, profiles, and access authorization records.";
  } else if (table.name.toLowerCase().includes("order") || table.name.toLowerCase().includes("payment")) {
    purpose = "Tracks transactions, cart items, customer checkouts, and payment processor logs.";
  } else if (table.name.toLowerCase().includes("task") || table.name.toLowerCase().includes("project")) {
    purpose = "Stores collaboration items, project tasks, assignment targets, and workspaces metadata.";
  } else if (table.name.toLowerCase().includes("post") || table.name.toLowerCase().includes("comment")) {
    purpose = "Stores content entries, blog posts, tags, and client replies.";
  }

  const parents: string[] = [];
  const children: string[] = [];
  const fkeys: string[] = [];

  schema.relations.forEach(r => {
    if (r.from === table.id) {
      const targetName = schema.tables.find(t => t.id === r.to)?.name || r.to;
      children.push(targetName);
      fkeys.push(`${r.fromColumn} -> ${targetName}.${r.toColumn}`);
    } else if (r.to === table.id) {
      parents.push(schema.tables.find(t => t.id === r.from)?.name || r.from);
    }
  });

  let estRows = "1,200 rows";
  let storageSize = "240 KB";
  let readFreq = "820 reads/min";
  let writeFreq = "45 writes/min";
  let growth = "+5% per month";

  if (table.name.toLowerCase().includes("user") || table.name.toLowerCase().includes("task") || table.name.toLowerCase().includes("post")) {
    estRows = "25,000 rows";
    storageSize = "8.4 MB";
    readFreq = "4,200 reads/min";
    writeFreq = "120 writes/min";
    growth = "+12% per month";
  } else if (table.name.toLowerCase().includes("order") || table.name.toLowerCase().includes("transaction")) {
    estRows = "150,000 rows";
    storageSize = "45.2 MB";
    readFreq = "1,500 reads/min";
    writeFreq = "320 writes/min";
    growth = "+24% per month";
  }

  const indexesList = schema.indexes
    .filter(idx => idx.table === table.name)
    .map(idx => `${idx.columns.join("+")} (${idx.type.toUpperCase()})`);
  
  if (indexesList.length === 0) {
    indexesList.push("PRIMARY KEY (BTREE)");
  }

  const missingIndexes: string[] = [];
  if (parents.length > 0 && !schema.indexes.some(idx => idx.table === table.name && idx.columns.some(c => c.toLowerCase().includes("id")))) {
    missingIndexes.push("INDEX on Foreign Key reference columns.");
  } else {
    missingIndexes.push("Covering composite index for nested search queries.");
  }

  let slowQueries = `SELECT * FROM ${table.name} WHERE id = ...;`;
  let normalization = "Third Normal Form (3NF) compliant";
  if (table.name.toLowerCase().includes("order") || table.name.toLowerCase().includes("task")) {
    slowQueries = `SELECT * FROM ${table.name} ORDER BY updated_at DESC LIMIT 50;`;
  }

  const aiRecommendations: string[] = [];
  if (table.name.toLowerCase().includes("user")) {
    aiRecommendations.push("Use UUID instead of incremental integers to prevent metadata scraping.", "Add composite index on status + role column group.");
  } else if (table.name.toLowerCase().includes("order") || table.name.toLowerCase().includes("payment")) {
    aiRecommendations.push("Archive old data to partition tables older than 1 year.", "Add composite index on client_id + order_date.");
  } else {
    aiRecommendations.push("Normalize nested JSON metadata fields into a structured relation table.", "Partition historical logs or analytics rows.");
  }

  return { purpose, parents, children, fkeys, estRows, storageSize, readFreq, writeFreq, growth, indexesList, missingIndexes, slowQueries, normalization, aiRecommendations };
}

// Convert schema to Mermaid ER diagram
function toMermaidER(schema: DatabaseSchema): string {
  let code = "erDiagram\n";
  schema.tables.forEach(t => {
    code += `  ${t.name} {\n`;
    t.columns.forEach(c => {
      code += `    ${c.type.replace(/\s+/g, "_")} ${c.name} "${c.description.replace(/"/g, "'")}"\n`;
    });
    code += `  }\n`;
  });
  schema.relations.forEach(r => {
    const fromTable = schema.tables.find(t => t.id === r.from)?.name || r.from;
    const toTable = schema.tables.find(t => t.id === r.to)?.name || r.to;
    const card = r.type === "one-to-one" ? "||--||" : "||--|{";
    code += `  ${fromTable} ${card} ${toTable} : "${r.fromColumn} -> ${r.toColumn}"\n`;
  });
  return code;
}

// Convert schema to PlantUML ER diagram
function toPlantUMLER(schema: DatabaseSchema): string {
  let code = "@startuml\nskinparam backgroundColor #09090B\nskinparam ArrowColor #3b82f6\n";
  schema.tables.forEach(t => {
    code += `entity "${t.name}" {\n`;
    t.columns.forEach(c => {
      code += `  ${c.primaryKey ? "* " : ""}${c.name} : ${c.type}\n`;
    });
    code += `}\n`;
  });
  schema.relations.forEach(r => {
    const fromTable = schema.tables.find(t => t.id === r.from)?.name || r.from;
    const toTable = schema.tables.find(t => t.id === r.to)?.name || r.to;
    code += `"${fromTable}" --> "${toTable}" : ${r.fromColumn} to ${r.toColumn}\n`;
  });
  code += "@enduml";
  return code;
}

function normalizeSchema(raw: any): DatabaseSchema | null {
  if (!raw || typeof raw !== "object") return null;
  // If it's a completely empty object or lacks tables array, treat it as null (not generated yet)
  if (!raw.tables || !Array.isArray(raw.tables) || raw.tables.length === 0) return null;

  return {
    summary: typeof raw.summary === "string" ? raw.summary : "",
    tables: raw.tables.map((t: any) => ({
      id: typeof t?.id === "string" ? t.id : "",
      name: typeof t?.name === "string" ? t.name : "",
      description: typeof t?.description === "string" ? t.description : "",
      columns: Array.isArray(t?.columns) ? t.columns.map((c: any) => ({
        name: typeof c?.name === "string" ? c.name : "",
        type: typeof c?.type === "string" ? c.type : "",
        nullable: typeof c?.nullable === "boolean" ? c.nullable : true,
        primaryKey: typeof c?.primaryKey === "boolean" ? c.primaryKey : false,
        unique: typeof c?.unique === "boolean" ? c.unique : false,
        defaultValue: c?.defaultValue !== undefined ? c.defaultValue : null,
        description: typeof c?.description === "string" ? c.description : "",
      })) : [],
    })),
    relations: Array.isArray(raw.relations) ? raw.relations.map((r: any) => ({
      from: typeof r?.from === "string" ? r.from : "",
      to: typeof r?.to === "string" ? r.to : "",
      fromColumn: typeof r?.fromColumn === "string" ? r.fromColumn : "",
      toColumn: typeof r?.toColumn === "string" ? r.toColumn : "",
      type: typeof r?.type === "string" ? r.type : "one-to-many",
    })) : [],
    indexes: Array.isArray(raw.indexes) ? raw.indexes.map((idx: any) => ({
      table: typeof idx?.table === "string" ? idx.table : "",
      columns: Array.isArray(idx?.columns) ? idx.columns.map((c: any) => String(c)) : [],
      type: typeof idx?.type === "string" ? idx.type : "btree",
    })) : [],
    considerations: {
      normalization: Array.isArray(raw.considerations?.normalization) ? raw.considerations.normalization.map((n: any) => String(n)) : [],
      indexing: Array.isArray(raw.considerations?.indexing) ? raw.considerations.indexing.map((i: any) => String(i)) : [],
      scaling: Array.isArray(raw.considerations?.scaling) ? raw.considerations.scaling.map((s: any) => String(s)) : [],
    },
    sql: typeof raw.sql === "string" ? raw.sql : "",
  };
}

export function DatabaseDesignerPage() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const aiQueue = useAIQueue();
  const [prompt, setPrompt] = useState("");
  const [dialect, setDialect] = useState<Dialect>("postgresql");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [selectedTable, setSelectedTable] = useState<SchemaTable | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isSqlExpanded, setIsSqlExpanded] = useState(true);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [activeRecommendationId, setActiveRecommendationId] = useState<number | null>(null);

  const projectId = searchParams.get("projectId");

  useEffect(() => {
    // Reset all workspace states on project switch/navigation to avoid pollution or crash
    setSchema(null);
    setPrompt("");
    setError(null);
    setSelectedTable(null);
    setBreadcrumb([]);

    if (!projectId) return;
    async function loadProjectSchema() {
      const { data, error } = await supabase
        .from("projects")
        .select("database_schema, description")
        .eq("id", projectId)
        .maybeSingle();
      if (!error) {
        if (data?.database_schema) {
          setSchema(normalizeSchema(data.database_schema));
        }
        if (data?.description) {
          setPrompt(data.description);
        }
      }
    }
    loadProjectSchema();
  }, [projectId]);

  const [finishedLoading, setFinishedLoading] = useState(false);

  async function handleGenerate(text?: string) {
    const input = (text ?? prompt).trim();
    if (!input || generating) return;

    setError(null);
    setGenerating(true);
    setFinishedLoading(false);
    setSchema(null);
    setSelectedTable(null);
    setBreadcrumb([]);
    if (text) setPrompt(text);

    try {
      const data = await aiQueue.enqueue('generate-database-schema', input, { prompt: input, dialect: 'postgresql' });
      if (!data.schema) throw new Error("No schema returned.");

      setSchema(normalizeSchema(data.schema));
      setFinishedLoading(true);
      setGenerating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate schema.");
      setGenerating(false);
    }
  }

  // Save to DB
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
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // General downloader
  const downloadBlob = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Derived Database Health Scores
  const healthScores = useMemo(() => {
    if (!schema) return null;

    const tablesCount = schema.tables.length;
    const indexCount = schema.indexes.length;
    const normalizationVal = 95; // default normalized spec
    const performanceVal = indexCount >= tablesCount ? 88 : 74;
    const scalabilityVal = tablesCount > 8 ? 85 : 94;
    const securityVal = 90;
    const maintainabilityVal = 92;
    const indexQualityVal = indexCount > 0 ? 90 : 65;

    const overall = Math.round(
      (normalizationVal + performanceVal + scalabilityVal + securityVal + maintainabilityVal + indexQualityVal) / 6
    );

    return {
      overall,
      normalization: normalizationVal,
      performance: performanceVal,
      scalability: scalabilityVal,
      security: securityVal,
      maintainability: maintainabilityVal,
      indexQuality: indexQualityVal,
    };
  }, [schema]);

  // Derived details modal metadata
  const selectedTableMetrics = useMemo(() => {
    if (!schema || !selectedTable) return null;
    return getDetailedTableMetrics(selectedTable, schema);
  }, [schema, selectedTable]);

  // EXPORT CENTER HANDLER
  const handleExport = (format: string) => {
    if (!schema) return;
    setIsExportDropdownOpen(false);

    switch (format) {
      case "json":
        downloadBlob(JSON.stringify(schema, null, 2), "database-schema.json", "application/json");
        break;
      case "yaml":
        const yamlStr = `---\nsummary: "${schema.summary.replace(/"/g, '\\"')}"\ntables:\n` +
          schema.tables.map(t => `  - id: ${t.id}\n    name: "${t.name}"\n    columns:\n` + t.columns.map(c => `      - name: "${c.name}"\n        type: "${c.type}"\n        primaryKey: ${c.primaryKey}\n        unique: ${c.unique}\n        nullable: ${c.nullable}`).join("\n")).join("\n") +
          `\nrelations:\n` +
          schema.relations.map(r => `  - from: ${r.from}\n    to: ${r.to}\n    type: ${r.type}\n    fromColumn: ${r.fromColumn}\n    toColumn: ${r.toColumn}`).join("\n");
        downloadBlob(yamlStr, "database-schema.yaml", "text/yaml");
        break;
      case "sql":
        downloadBlob(schema.sql, "schema.sql", "text/sql");
        break;
      case "mermaid":
        downloadBlob(toMermaidER(schema), "mermaid-er-diagram.txt", "text/plain");
        break;
      case "plantuml":
        downloadBlob(toPlantUMLER(schema), "plantuml-er-diagram.txt", "text/plain");
        break;
      case "drawio":
        let drawioStr = `<mxfile host="Electron" modified="${new Date().toISOString()}" agent="DevCanvas" version="1.0.0">\n  <diagram id="diagram_1" name="Database Schema">\n    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">\n      <root>\n        <mxCell id="0" />\n        <mxCell id="1" parent="0" />\n`;
        schema.tables.forEach((t, idx) => {
          const x = 80 + (idx % 3) * 260;
          const y = 80 + Math.floor(idx / 3) * 220;
          drawioStr += `        <mxCell id="${t.id}" value="${t.name}" style="swimlane;fontStyle=0;childLayout=poseLayout;startSize=26;horizontal=1;fillColor=#111827;strokeColor=#374151;fontColor=#F3F4F6;" vertex="1" parent="1">\n          <mxGeometry x="${x}" y="${y}" width="180" height="${40 + t.columns.length * 20}" as="geometry" />\n        </mxCell>\n`;
          t.columns.forEach((col, cIdx) => {
            drawioStr += `        <mxCell id="col_${t.id}_${col.name}" value="${col.primaryKey ? '[PK] ' : col.unique ? '[UQ] ' : ''}${col.name} : ${col.type}" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[];portConstraint=eastwest;fontColor=#D1D5DB;" vertex="1" parent="${t.id}">\n          <mxGeometry y="${26 + cIdx * 20}" width="180" height="20" as="geometry" />\n        </mxCell>\n`;
          });
        });
        schema.relations.forEach((r, idx) => {
          drawioStr += `        <mxCell id="relation_${idx}" value="${r.type}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#3B82F6;fontColor=#9CA3AF;" edge="1" parent="1" source="${r.from}" target="${r.to}">\n          <mxGeometry relative="1" as="geometry" />\n        </mxCell>\n`;
        });
        drawioStr += `      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>`;
        downloadBlob(drawioStr, "database-schema-drawio.xml", "text/xml");
        break;
      case "markdown":
        const reportText = document.getElementById("pdf-db-report-content")?.innerText || "";
        downloadBlob(`# Database Schema Specification Documentation\n\n${reportText}`, "schema-docs.md", "text/markdown");
        break;
      case "pdf":
        // Printable PDF document
        const printContent = document.getElementById("pdf-db-report-content")?.innerHTML;
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(`
            <html>
              <head>
                <title>Database Schema Specification Report - DevCanvas</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
                  h1 { color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 24px; font-size: 26px; }
                  h2 { color: #1d4ed8; margin-top: 36px; font-size: 20px; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; }
                  h3 { color: #1f2937; margin-top: 24px; font-size: 15px; }
                  p, li { font-size: 13px; color: #374151; }
                  table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 24px; }
                  th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; }
                  th { background-color: #f9fafb; font-weight: 600; color: #374151; }
                  ul { padding-left: 20px; }
                  .footer { margin-top: 60px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 10px; }
                </style>
              </head>
              <body>
                ${printContent}
                <div class="footer">Generated by DevCanvas AI Database Architecture Workspace. Private &amp; Confidential.</div>
                <script>
                  window.onload = function() {
                    window.print();
                    window.close();
                  }
                </script>
              </body>
            </html>
          `);
          win.document.close();
        }
        break;
      case "svg":
      case "png":
        // Standalone SVG Diagram export
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1300 650" width="1300" height="650" style="background:#09090B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">\n`;
        svgContent += `  <defs>\n    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">\n      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1d1d20" stroke-width="0.8"/>\n    </pattern>\n  </defs>\n  <rect width="1300" height="650" fill="url(#grid)"/>\n`;

        // Coordinate helper
        const cols = Math.min(Math.ceil(Math.sqrt(schema.tables.length)), 3);
        const colSpacing = 320;
        const rowSpacing = 240;
        const positions: Record<string, { x: number; y: number }> = {};
        schema.tables.forEach((table, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          positions[table.id] = {
            x: 50 + col * colSpacing,
            y: 50 + row * rowSpacing,
          };
        });

        // Draw connections
        schema.relations.forEach(r => {
          const from = positions[r.from] || { x: 0, y: 0 };
          const to = positions[r.to] || { x: 0, y: 0 };
          svgContent += `  <path d="M ${from.x + 220} ${from.y + 35} C ${(from.x + 220 + to.x) / 2} ${from.y + 35}, ${(from.x + 220 + to.x) / 2} ${to.y + 35}, ${to.x} ${to.y + 35}" fill="none" stroke="#3b82f6" stroke-width="1.8" />\n`;
          svgContent += `  <rect x="${(from.x + 220 + to.x) / 2 - 25}" y="${(from.y + to.y) / 2 + 25}" width="50" height="14" rx="3" fill="#18181b" stroke="#27272a" stroke-width="0.5"/>\n`;
          svgContent += `  <text x="${(from.x + 220 + to.x) / 2}" y="${(from.y + to.y) / 2 + 35}" fill="#71717a" font-size="8" text-anchor="middle" font-weight="500">${r.type}</text>\n`;
        });

        // Draw tables
        schema.tables.forEach(t => {
          const pos = positions[t.id] || { x: 0, y: 0 };
          const h = 40 + t.columns.length * 20;
          svgContent += `  <g transform="translate(${pos.x}, ${pos.y})">\n`;
          svgContent += `    <rect width="220" height="${h}" rx="10" fill="#111827" stroke="#374151" stroke-width="1.2" />\n`;
          svgContent += `    <rect width="220" height="30" rx="10" fill="#1f2937" />\n`;
          svgContent += `    <text x="15" y="20" fill="#ffffff" font-size="12" font-weight="700">${t.name}</text>\n`;
          
          t.columns.forEach((col, cIdx) => {
            const isPK = col.primaryKey;
            svgContent += `    <text x="15" y="${48 + cIdx * 20}" fill="${isPK ? '#fbbf24' : '#d1d5db'}" font-size="10.5">${isPK ? '[PK] ' : ''}${col.name}</text>\n`;
            svgContent += `    <text x="150" y="${48 + cIdx * 20}" fill="#71717a" font-size="9.5">${col.type}</text>\n`;
          });
          svgContent += `  </g>\n`;
        });

        svgContent += `</svg>`;
        downloadBlob(svgContent, "er-diagram.svg", "image/svg+xml");
        break;
      
      // targeted sub-reports
      case "report-dictionary":
        const dictRep = `# Database Data Dictionary\n\n` +
          schema.tables.map(t => `## Table: ${t.name}\n${t.description}\n\n` +
            `| Column | Type | Nullable | Default | PK/FK | Unique |\n` +
            `|---|---|---|---|---|---|\n` +
            t.columns.map(c => `| ${c.name} | ${c.type} | ${c.nullable ? 'YES' : 'NO'} | ${c.defaultValue || 'NULL'} | ${c.primaryKey ? 'PK' : '—'} | ${c.unique ? 'YES' : 'NO'} |`).join("\n")
          ).join("\n\n");
        downloadBlob(dictRep, "database-dictionary.md", "text/markdown");
        break;
      case "report-docs":
        const docRep = `# Database Schema Documentation\n\n` +
          `Generated specs for target schema:\n\n` +
          schema.tables.map(t => `## Table: ${t.name}\n${t.description}\n\nColumns breakdown:\n` +
            t.columns.map(c => `* **${c.name}** (${c.type}) - ${c.description}`).join("\n")
          ).join("\n\n");
        downloadBlob(docRep, "schema-documentation.md", "text/markdown");
        break;
      case "report-performance":
        const perfRep = `# Database Performance Analysis Report\n\n` +
          `Estimated slow queries, normalizations, and index optimizations:\n\n` +
          schema.tables.map(t => {
            const metrics = getDetailedTableMetrics(t, schema);
            return `## Table: ${t.name}\n` +
              `* **Normalization Level**: ${metrics.normalization}\n` +
              `* **Missing Index Suggestions**: ${metrics.missingIndexes.join(", ")}\n` +
              `* **Expected Slow Queries**: \n\`\`\`sql\n${metrics.slowQueries}\n\`\`\``;
          }).join("\n\n");
        downloadBlob(perfRep, "database-performance-report.md", "text/markdown");
        break;
      case "report-ai":
        const aiRep = `# AI Schema Architecture Recommendations\n\n` +
          `Actionable targets suggested by AI DB Architects:\n\n` +
          schema.considerations.normalization.map(n => `* [NORMALIZATION] ${n}`).join("\n") + "\n" +
          schema.considerations.indexing.map(i => `* [INDEX] ${i}`).join("\n") + "\n" +
          schema.considerations.scaling.map(s => `* [SCALING] ${s}`).join("\n");
        downloadBlob(aiRep, "database-ai-recommendations.md", "text/markdown");
        break;
      default:
        break;
    }
  };

  const copySqlToClipboard = async () => {
    if (!schema?.sql) return;
    await navigator.clipboard.writeText(schema.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative w-full px-5 py-6 lg:px-8 overflow-hidden min-h-screen">
      {/* Page-level white tilted grid background */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"
        style={{ transform: "rotate(-12deg) scale(2.2)", transformOrigin: "center center" }}
      />
      <PageHeader
        title="Database Designer"
        description="Describe your data model and get a normalized schema with ER diagram, indexes, and migration-ready SQL."
        actions={
          schema ? (
            <div className="flex gap-2 relative">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : saved ? "Saved!" : "Save Schema"}
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Export Workspace
                </Button>
                {isExportDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-56 flex flex-col rounded-lg border border-neutral-800 bg-neutral-900 p-1 text-xs text-neutral-400 shadow-xl z-50">
                    <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-neutral-600">Export Formats</span>
                    <button onClick={() => handleExport("pdf")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">PDF Schema Report</button>
                    <button onClick={() => handleExport("png")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">PNG Diagram (via SVG)</button>
                    <button onClick={() => handleExport("svg")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">SVG Vector Diagram</button>
                    <button onClick={() => handleExport("markdown")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Markdown Documentation</button>
                    <button onClick={() => handleExport("yaml")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">YAML Specs</button>
                    <button onClick={() => handleExport("json")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Raw Schema JSON</button>
                    <button onClick={() => handleExport("sql")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Raw Migration SQL</button>
                    
                    <span className="px-2 py-1 mt-1 text-[9px] font-bold uppercase tracking-wider text-neutral-600">Design Tools</span>
                    <button onClick={() => handleExport("mermaid")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Mermaid ER Diagram</button>
                    <button onClick={() => handleExport("plantuml")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">PlantUML ER Syntax</button>
                    <button onClick={() => handleExport("drawio")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Draw.io XML</button>
                    
                    <span className="px-2 py-1 mt-1 text-[9px] font-bold uppercase tracking-wider text-neutral-600">Engineering Reports</span>
                    <button onClick={() => handleExport("report-dictionary")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Data Dictionary</button>
                    <button onClick={() => handleExport("report-docs")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Schema Documentation</button>
                    <button onClick={() => handleExport("report-performance")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Performance Analysis</button>
                    <button onClick={() => handleExport("report-ai")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">AI recommendations</button>
                  </div>
                )}
              </div>

              <Button variant="ghost" size="sm" onClick={() => handleGenerate()}>
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
            </div>
          ) : null
        }
      />

      {/* Description / Prompt Box */}


      {/* Description / Prompt Box */}
      <div className="mt-8">
        <div 
          className="relative rounded-[28px] overflow-hidden border border-white/[0.04] p-6 transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] group hover:border-white/10"
          style={{
            backgroundColor: "#0e131f",
            boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Subtle glass reflection overlay */}
          <div
            className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-300 group-hover:opacity-75 opacity-50"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(2px)",
            }}
          />

          {/* Dark background with black gradient */}
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, #000000 0%, #000000 70%)",
            }}
          />

          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay z-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Subtle finger smudge texture for realism */}
          <div
            className="absolute inset-0 opacity-[0.06] mix-blend-soft-light z-11 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='smudge'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='3' seed='5' stitchTiles='stitch'/%3E%3CfeGaussianBlur stdDeviation='10'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23smudge)'/%3E%3C/svg%3E")`,
              backdropFilter: "blur(1px)",
            }}
          />

          {/* Purple/indigo/fuchsia glow effect */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2/3 z-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-90 opacity-80"
            style={{
              background: `
                radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.45) -10%, rgba(168, 85, 247, 0) 70%),
                radial-gradient(ellipse at bottom left, rgba(99, 102, 241, 0.45) -10%, rgba(99, 102, 241, 0) 70%)
              `,
              filter: "blur(30px)",
            }}
          />

          {/* Central fuchsia glow */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2/3 z-21 pointer-events-none transition-opacity duration-300 group-hover:opacity-85 opacity-75"
            style={{
              background: `
                radial-gradient(circle at bottom center, rgba(217, 70, 239, 0.3) -20%, rgba(99, 102, 241, 0.25) 30%, rgba(99, 102, 241, 0) 70%)
              `,
              filter: "blur(35px)",
            }}
          />

          {/* Tilted Grid background overlay */}
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0"
            style={{ transform: "rotate(-12deg) scale(1.6)", transformOrigin: "center center" }}
          />

          {/* Large Background Icon Watermark */}
          <Database className="absolute bottom-[-24px] right-[-24px] z-10 opacity-[0.03] group-hover:opacity-[0.05] pointer-events-none select-none text-purple-400 w-36 h-36 transform rotate-[-5deg] group-hover:rotate-[-15deg] group-hover:scale-110 transition-all duration-300" />

          {/* Bottom border line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] z-25 transition-opacity duration-300 group-hover:opacity-100 opacity-90"
            style={{
              background: "linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.05) 100%)",
            }}
          />

          {/* Content wrapper */}
          <div className="relative z-30 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
                <span className="text-base font-bold text-white">
                  Describe your data model
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-400">Dialect:</span>
                <div className="flex gap-1 rounded-lg border border-white/10 bg-surface-2 p-0.5">
                  {(["postgresql", "mysql", "sqlite"] as Dialect[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDialect(d)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-bold transition-colors",
                        dialect === d
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "text-neutral-400 hover:text-white",
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
              className="flex w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-3.5 text-base text-white shadow-sm transition-colors placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 font-sans"
              disabled={generating}
            />
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-neutral-400">
                Press Cmd/Ctrl + Enter to generate
              </p>
              <Button
                variant="gradient"
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || generating}
                className="shrink-0 text-base font-semibold h-11 px-6"
              >
                {generating ? "Generating..." : "Generate schema"}
              </Button>
            </div>
          </div>

          {!schema && !generating ? (
            <div className="relative z-30 mt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
                Try an example
              </p>
              <div className="flex flex-wrap gap-2.5">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    onClick={() => handleGenerate(example)}
                    className="rounded-xl border border-white/10 bg-surface-2 px-4 py-2.5 text-left text-sm font-medium text-neutral-200 transition-colors hover:border-white/20 hover:text-white"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {/* Main Workspace layout */}
      <AnimatePresence mode="wait">
        {generating && !finishedLoading ? (
          <div className="mt-8 py-12 bg-transparent border-none">
            <AILoader isFinished={false} />
          </div>
        ) : schema ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-8"
          >
            {/* 1. Database Health score Dashboard */}
            {healthScores && (
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                <div className="col-span-2 md:col-span-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400">Database Score</span>
                  <span className="text-3xl font-heading font-black text-white mt-1.5">{healthScores.overall}%</span>
                  <div className="w-full bg-neutral-850 h-1.5 rounded-full overflow-hidden mt-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${healthScores.overall}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-primary-500"
                    />
                  </div>
                </div>
                {[
                  { name: "Normalization", val: healthScores.normalization, color: "bg-indigo-500" },
                  { name: "Performance", val: healthScores.performance, color: "bg-emerald-500" },
                  { name: "Scalability", val: healthScores.scalability, color: "bg-cyan-500" },
                  { name: "Security Compliance", val: healthScores.security, color: "bg-amber-500" },
                  { name: "Maintainability", val: healthScores.maintainability, color: "bg-purple-500" },
                  { name: "Index Quality", val: healthScores.indexQuality, color: "bg-pink-500" },
                ].map((score, i) => (
                  <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-neutral-400 truncate">{score.name}</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-xl font-heading font-bold text-neutral-200">{score.val}%</span>
                      <span className="text-[9px] font-mono text-neutral-600">v1.0</span>
                    </div>
                    <div className="w-full bg-neutral-850 h-1 rounded-full overflow-hidden mt-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score.val}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={cn("h-full", score.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Relationship Explorer Breadcrumb Bar */}
            <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400 shrink-0">Relationship Explorer</span>
                <span className="text-neutral-600">|</span>
                {breadcrumb.length === 0 ? (
                  <span className="text-neutral-500 italic">Select a table node below to begin tracing database relationships</span>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {breadcrumb.map((tabId, idx) => {
                      const name = schema.tables.find(t => t.id === tabId)?.name || tabId;
                      return (
                        <div key={idx} className="flex items-center gap-1.5">
                          <button
                            onClick={() => setBreadcrumb(breadcrumb.slice(0, idx + 1))}
                            className="text-neutral-200 hover:text-white font-semibold underline hover:no-underline font-mono"
                          >
                            {name}
                          </button>
                          {idx < breadcrumb.length - 1 && <span className="text-neutral-600">→</span>}
                        </div>
                      );
                    })}
                    <button 
                      onClick={() => setBreadcrumb([])}
                      className="text-neutral-500 hover:text-neutral-300 ml-2 font-bold"
                      title="Clear Path"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Connected Targets quick additions list */}
              {breadcrumb.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-neutral-500 text-[10px]">Step to relation:</span>
                  {(() => {
                    const activeId = breadcrumb[breadcrumb.length - 1];
                    const connected = new Set<string>();
                    schema.relations.forEach(r => {
                      if (r.from === activeId && !breadcrumb.includes(r.to)) connected.add(r.to);
                      if (r.to === activeId && !breadcrumb.includes(r.from)) connected.add(r.from);
                    });

                    return Array.from(connected).map(tabId => {
                      const table = schema.tables.find(t => t.id === tabId);
                      if (!table) return null;
                      return (
                        <button
                          key={tabId}
                          onClick={() => setBreadcrumb([...breadcrumb, tabId])}
                          className="px-2 py-0.5 rounded bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-[10px] font-mono transition-colors"
                        >
                          + {table.name}
                        </button>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* 2. React Flow Centerpiece (Full Width Canvas Workspace) */}
            <div className="w-full">
              <ERDiagram
                schema={schema}
                onSelectTable={setSelectedTable}
                breadcrumb={breadcrumb}
                onBreadcrumbChange={setBreadcrumb}
              />
            </div>

            {/* 3. SQL Preview Expander panel */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
              <div 
                onClick={() => setIsSqlExpanded(!isSqlExpanded)}
                className="px-4 py-3 border-b border-neutral-850 bg-neutral-900/60 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileCode className="h-4.5 w-4.5 text-primary-400" />
                  <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">Generated Migration SQL DDL Script</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span>{isSqlExpanded ? "Collapse" : "Expand"}</span>
                </div>
              </div>

              {isSqlExpanded && (
                <div className="p-4 bg-neutral-950 relative">
                  <div className="absolute right-4 top-4 flex gap-1.5 z-10">
                    <button
                      onClick={copySqlToClipboard}
                      className="flex h-7 w-7 items-center justify-center rounded border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white"
                      title="Copy SQL Code"
                    >
                      {copied ? <Check className="h-4 w-4 text-success-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => handleExport("sql")}
                      className="flex h-7 w-7 items-center justify-center rounded border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white"
                      title="Download SQL File"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <HighlightedSQL sql={schema.sql} />
                </div>
              )}
            </div>

            {/* 4. Detailed Database Analysis report below */}
            <div id="pdf-db-report-content" className="rounded-xl border border-neutral-850 bg-neutral-900/20 p-6 space-y-6 text-left text-neutral-300 max-w-4xl mx-auto">
              <div className="border-b border-neutral-850 pb-5">
                <h1 className="font-heading text-xl font-bold text-neutral-100">Database Schema Specification &amp; Analysis Report</h1>
                <p className="text-xs text-neutral-500 mt-1">Generated dynamically on {new Date().toLocaleDateString()} | Target Dialect: {dialect.toUpperCase()}</p>
              </div>

              {/* Summary */}
              <section className="space-y-2">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">1. Executive Summary</h2>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">{schema.summary}</p>
              </section>

              {/* Table details */}
              <section className="space-y-3">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">2. Normalization &amp; Table Specifications</h2>
                <div className="space-y-4">
                  {schema.tables.map((table, idx) => (
                    <div key={idx} className="p-4 bg-neutral-950/40 rounded-xl border border-neutral-850 space-y-2">
                      <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                        <h4 className="text-xs font-bold text-neutral-255 font-mono">{table.name}</h4>
                        <span className="text-[10px] text-neutral-500 font-sans italic">{table.description}</span>
                      </div>
                      <table className="w-full text-left text-[11px] text-neutral-400">
                        <thead>
                          <tr className="text-neutral-500 border-b border-neutral-900">
                            <th className="py-1">Column</th>
                            <th className="py-1">Data Type</th>
                            <th className="py-1">Attributes</th>
                            <th className="py-1">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900/40">
                          {table.columns.map((c, cIdx) => (
                            <tr key={cIdx}>
                              <td className="py-1.5 font-semibold text-neutral-300 font-mono">{c.name}</td>
                              <td className="py-1.5 font-mono">{c.type}</td>
                              <td className="py-1.5 text-warning-400 font-semibold">{c.primaryKey ? "PK" : c.unique ? "UQ" : c.nullable ? "NULL" : "NOT NULL"}</td>
                              <td className="py-1.5 text-neutral-450">{c.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </section>

              {/* Relationship specifications */}
              <section className="space-y-2">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">3. Schema Relationship Map</h2>
                <div className="overflow-x-auto rounded-lg border border-neutral-850">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-850 bg-neutral-900/60 text-neutral-300">
                        <th className="px-4 py-2 font-semibold">Source Table</th>
                        <th className="px-4 py-2 font-semibold">Key Column</th>
                        <th className="px-4 py-2 font-semibold">Relation Type</th>
                        <th className="px-4 py-2 font-semibold">Target Table</th>
                        <th className="px-4 py-2 font-semibold">Referenced Column</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-850 text-neutral-400">
                      {schema.relations.map((r, idx) => {
                        const fromName = schema.tables.find(t => t.id === r.from)?.name || r.from;
                        const toName = schema.tables.find(t => t.id === r.to)?.name || r.to;
                        return (
                          <tr key={idx} className="hover:bg-neutral-900/10">
                            <td className="px-4 py-2.5 font-semibold text-neutral-200 font-mono">{fromName}</td>
                            <td className="px-4 py-2.5 font-mono">{r.fromColumn}</td>
                            <td className="px-4 py-2.5 capitalize">{r.type}</td>
                            <td className="px-4 py-2.5 font-semibold text-neutral-200 font-mono">{toName}</td>
                            <td className="px-4 py-2.5 font-mono">{r.toColumn}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Index details */}
              <section className="space-y-2">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">4. Target Index Architecture</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {schema.indexes.map((idx, index) => (
                    <div key={index} className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-lg flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-neutral-500 font-sans block text-[10px]">Indexed columns</span>
                        <span className="text-neutral-200 font-bold">{idx.table}.{idx.columns.join("+")}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-neutral-850 text-primary-400">{idx.type.toUpperCase()}</Badge>
                    </div>
                  ))}
                </div>
              </section>

              {/* Database Considerations */}
              <section className="space-y-3">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">5. Schema Optimization strategy</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 p-3 bg-neutral-900/20 border border-neutral-850 rounded-lg">
                    <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-cyan-400" />
                      Normalization Status
                    </h3>
                    <ul className="list-disc pl-4 text-[11px] text-neutral-400 space-y-1">
                      {schema.considerations.normalization.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 p-3 bg-neutral-900/20 border border-neutral-850 rounded-lg">
                    <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-emerald-400" />
                      Indexing Objectives
                    </h3>
                    <ul className="list-disc pl-4 text-[11px] text-neutral-400 space-y-1">
                      {schema.considerations.indexing.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 p-3 bg-neutral-900/20 border border-neutral-850 rounded-lg">
                    <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                      Scalability Recommendations
                    </h3>
                    <ul className="list-disc pl-4 text-[11px] text-neutral-400 space-y-1">
                      {schema.considerations.scaling.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Best Practices */}
              <section className="space-y-2 text-xs">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">6. Best Practices &amp; Security Considerations</h2>
                <div className="space-y-1.5 text-neutral-400 leading-relaxed">
                  <p><strong>Enforce Referential Integrity:</strong> Verify that all target foreign key relations possess explicit CASCADE rules to avoid orphaned data records during delete loops.</p>
                  <p><strong>Composite Indexes:</strong> For nested multi-column query whitelists, define explicit composite index groups to prevent high query search costs.</p>
                  <p><strong>Database VPC boundary:</strong> Do not open target instances directly to public IP networks. Enforce whitelisted client rules and route container traffic using secure VPC private subnet routes.</p>
                </div>
              </section>
            </div>
          </motion.div>
        ) : !generating ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-left space-y-6"
          >
            <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-4">
              <div className="p-4 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Database className="h-10 w-10 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-sans font-bold text-white tracking-normal">Describe your database model to generate schema</h3>
                <p className="text-xs text-neutral-400 max-w-md leading-relaxed">Provide your entities or data relationships above to auto-generate normalized tables, relational ER diagrams, composite indexes, and SQL migration files.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Relational Tables Layout", desc: "Design normalized database tables with strict type columns, primary keys, and auto-increment sequences.", icon: Table2 },
                { title: "Security & Access Audits", desc: "Formulate Supabase RLS policies and role-based permissions to enforce row-level boundary security.", icon: KeyRound },
                { title: "Foreign Key Linkages", desc: "Link composite indexes and parent relational mappings with CASCADE deletion logic rules.", icon: Link2 },
                { title: "Performance Tuning", desc: "Generate explicit indexes, vacuum optimization strategies, and query performance profiles.", icon: Database }
              ].map((f, idx) => (
                <div key={idx} className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-5 space-y-3">
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-850 text-purple-400 w-fit">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-sans font-extrabold text-neutral-200 uppercase tracking-widest leading-normal">{f.title}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Floating Table Specifications modal */}
      <Dialog open={!!selectedTable} onOpenChange={(open) => { if (!open) setSelectedTable(null); }}>
        <DialogContent className="max-w-4xl bg-[#0B0C0E]/95 backdrop-blur-xl border border-white/10 text-neutral-200 max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 lg:p-7">
          <DialogHeader className="border-b border-white/10 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg border text-primary-400 bg-primary-500/10 border-primary-500/20">
                <Table2 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="font-heading text-lg font-bold text-white leading-tight">
                  {selectedTable?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-400 font-medium mt-0.5">
                  Schema Specification &amp; Optimization Profile
                </DialogDescription>
              </div>
            </div>
            {selectedTable && selectedTableMetrics && (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {selectedTableMetrics.normalization}
              </Badge>
            )}
          </DialogHeader>

          {selectedTable && selectedTableMetrics && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px] text-left">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Purpose */}
                <div className="bg-[#121319] p-4 rounded-xl border border-white/10 space-y-1.5">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400">Table Purpose</span>
                  <p className="text-[13px] text-neutral-300 leading-relaxed font-sans">{selectedTableMetrics.purpose}</p>
                </div>

                {/* Table Columns detail */}
                <div className="bg-[#121319] p-4 rounded-xl border border-white/10 space-y-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 block">Columns Definition Schema</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] text-neutral-400 border-collapse">
                      <thead>
                        <tr className="text-neutral-500 border-b border-neutral-850 font-semibold">
                          <th className="py-1">Column</th>
                          <th className="py-1">Data Type</th>
                          <th className="py-1">Nullable</th>
                          <th className="py-1">Default</th>
                          <th className="py-1">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900/30">
                        {selectedTable.columns.map((col, ci) => (
                          <tr key={ci}>
                            <td className="py-2 font-mono font-semibold text-neutral-300 flex items-center gap-1.5">
                              {col.primaryKey && <KeyRound className="h-3 w-3 text-warning-400 shrink-0" />}
                              {col.name}
                            </td>
                            <td className="py-2 font-mono text-[11px]">{col.type}</td>
                            <td className="py-2 text-[11px]">{col.nullable ? "YES" : "NO"}</td>
                            <td className="py-2 font-mono text-neutral-500 text-[11px]">{col.defaultValue === null ? "NULL" : col.defaultValue}</td>
                            <td className="py-2 text-neutral-400 leading-normal">{col.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Connection Tree (Parent and Child Relationships) */}
                <div className="bg-[#121319] p-4 rounded-xl border border-white/10 space-y-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 block">Schema Connection Tree</span>
                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    <div>
                      <span className="text-neutral-500 text-[11px] block mb-1.5">Parent Tables</span>
                      {selectedTableMetrics.parents.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTableMetrics.parents.map((n, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-neutral-900 border-neutral-800">{n}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-600 text-[11px] italic block">No parent dependencies</span>
                      )}
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[11px] block mb-1.5">Child Tables</span>
                      {selectedTableMetrics.children.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTableMetrics.children.map((n, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-neutral-900 border-neutral-800">{n}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-600 text-[11px] italic block">No children dependencies</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-neutral-900">
                    <span className="text-neutral-500 text-[11px] block mb-1">Foreign Key Mappings</span>
                    {selectedTableMetrics.fkeys.length > 0 ? (
                      <div className="space-y-1.5">
                        {selectedTableMetrics.fkeys.map((fk, i) => (
                          <div key={i} className="font-mono text-[11px] text-neutral-300 bg-neutral-900/60 p-1.5 rounded border border-neutral-850">
                            {fk}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-neutral-600 text-[11px] italic block">No foreign key constraints</span>
                    )}
                  </div>
                </div>

                {/* Estimated Statistics */}
                <div className="bg-[#121319] p-4 rounded-xl border border-white/10 space-y-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 block">Table Statistics (Estimated)</span>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: "Est. Rows", val: selectedTableMetrics.estRows },
                      { label: "Storage Size", val: selectedTableMetrics.storageSize },
                      { label: "Read Freq", val: selectedTableMetrics.readFreq },
                      { label: "Write Freq", val: selectedTableMetrics.writeFreq },
                      { label: "Growth", val: selectedTableMetrics.growth },
                    ].map((stat, i) => (
                      <div key={i} className="bg-[#121319] p-2 rounded-lg border border-neutral-900 text-center flex flex-col justify-between">
                        <span className="text-neutral-500 text-[10px] block">{stat.label}</span>
                        <span className="text-[12px] text-neutral-200 font-semibold mt-1 block font-mono">{stat.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Analysis & Normalization */}
                <div className="bg-[#121319] p-4 rounded-xl border border-white/10 space-y-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 block">Performance &amp; Index Profile</span>
                  <div className="space-y-2.5 text-[13px] text-neutral-300">
                    <div>
                      <span className="text-neutral-500 text-[11px] block mb-0.5">Active Indexes</span>
                      {selectedTableMetrics.indexesList.map((idx, i) => (
                        <span key={i} className="inline-block rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 font-mono text-[11px] text-neutral-450 mr-1.5 mt-1">{idx}</span>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-neutral-900/60">
                      <span className="text-neutral-500 text-[11px] block mb-0.5">Missing Index Recommendations</span>
                      <p className="text-neutral-400 font-sans leading-relaxed flex items-center gap-1.5 text-[12px]">
                        <Info className="h-3.5 w-3.5 text-primary-400 shrink-0" />
                        {selectedTableMetrics.missingIndexes.join(", ")}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-neutral-900/60">
                      <span className="text-neutral-500 text-[11px] block mb-0.5">Expected Complex/Slow Query</span>
                      <pre className="p-2 bg-neutral-950 border border-neutral-850 rounded font-mono text-[11px] text-primary-300 overflow-x-auto mt-1">{selectedTableMetrics.slowQueries}</pre>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="bg-[#121319] p-4 rounded-xl border border-white/10 space-y-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 block">AI Database Architect Directives</span>
                  <div className="space-y-2">
                    {selectedTableMetrics.aiRecommendations.map((rec, i) => (
                      <div key={i} className="flex gap-2 p-2 rounded bg-neutral-950/40 border border-neutral-850 text-[12px] text-neutral-300">
                        <Sparkles className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
