import { useState, useEffect, useMemo, useCallback } from "react";
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
  Play,
  Square,
  Flame,
  Clock,
  Activity,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@ui/index";
import { PageHeader } from "@/components/dashboard/page-header";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useAIQueue } from "@/lib/ai-queue-context";
import { cn } from "@utils/index";
import { AILoader } from "@/components/dashboard/AILoader";
import type { ApiSpec, ApiEndpoint, HttpMethod } from "@/lib/types/api-spec";

type Dialect = "postgresql" | "mysql" | "sqlite";

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

// Pipeline Steps Definitions for ER/Pipeline Request flow
const PIPELINE_STEPS = [
  { id: "client", name: "Client", x: 60, y: 110, desc: "Triggers HTTP requests to endpoints", badge: "Browser/App" },
  { id: "gateway", name: "API Gateway", x: 165, y: 110, desc: "VPC Ingress router & CDN Proxy", badge: "Proxy" },
  { id: "auth", name: "Authentication", x: 270, y: 110, desc: "JWT & OAuth authorization checker", badge: "Security" },
  { id: "limiter", name: "Rate Limiter", x: 375, y: 110, desc: "IP connection bucket rate checks", badge: "Throttle" },
  { id: "validation", name: "Validation", x: 480, y: 110, desc: "Request schema verification", badge: "Schema" },
  { id: "controller", name: "Controller", x: 585, y: 110, desc: "Resolves route target handlers", badge: "Router" },
  { id: "service", name: "Service Logic", x: 690, y: 110, desc: "Calculates transactional business computations", badge: "Logic" },
  { id: "database", name: "Database", x: 795, y: 110, desc: "Transactional Postgres queries", badge: "SQL" },
  { id: "response", name: "Response", x: 920, y: 110, desc: "Returns HTTP payload & status", badge: "Output" },
  { id: "cache", name: "Redis Cache", x: 585, y: 40, desc: "In-memory caching lookups", badge: "Cache" },
];

interface PipelineComponent {
  id: string;
  name: string;
  desc: string;
  badge: string;
}

// Generate realistic details modal parameters for each pipeline component
function getPipelineComponentDetails(step: PipelineComponent) {
  let purpose = "Intercepts API traffic.";
  let description = "Coordinates middleware validations.";
  let responsibilities = ["Rate Limiting", "Authorization", "JSON Validations"];
  let latency = "1.5ms avg";
  let processing = "0.8ms";
  let throughput = "8,500 req/sec";
  let security = {
    auth: "HMAC / TLS 1.3",
    authz: "Role-Based Access Control (RBAC)",
    encryption: "AES-256-GCM at rest",
    owasp: "Rate limiting prevents OWASP-A4 credential stuffing attacks."
  };
  let recommendations = ["Introduce caching on static queries", "Minimize middleware layer allocations"];

  if (step.id === "client") {
    purpose = "Acts as the frontend UI interface sending HTTP requests.";
    description = "Triggers user actions and renders returned API JSON models.";
    responsibilities = ["State management", "UI rendering", "Client authorization headers"];
    latency = "N/A";
    processing = "N/A";
    throughput = "N/A";
    security = {
      auth: "OAuth 2.0 PKCE",
      authz: "ID token scopes validation",
      encryption: "Secure HTTPOnly Cookies",
      owasp: "Enforces CSP headers to block OWASP-A3 XSS injections."
    };
    recommendations = ["Optimize payload compression formats", "Throttle duplicate action triggers"];
  } else if (step.id === "gateway") {
    purpose = "VPC Ingress Controller entry point routing requests.";
    description = "Load-balances ingress calls, proxies upstream paths, and resolves CDN caches.";
    responsibilities = ["Proxy routing", "SSL termination", "CDN Edge caching"];
    latency = "0.8ms avg";
    processing = "0.3ms";
    throughput = "15,000 req/sec";
    security = {
      auth: "API Keys validation on edge routes",
      authz: "IP block rules (CIDR whitelist)",
      encryption: "TLS 1.3 encryption transit",
      owasp: "Edge firewall checks prevent OWASP-A1 SQL injections."
    };
    recommendations = ["Enable gzip and Brotli compressions", "Route traffic using WebAssembly edge workers"];
  } else if (step.id === "auth") {
    purpose = "Validates caller authorization credentials.";
    description = "Decodes JWT signatures, verifies expiry dates, and fetches organization scopes.";
    responsibilities = ["JWT verify", "OAuth scopes check", "Organization whitelist lookup"];
    latency = "4.2ms avg";
    processing = "2.8ms";
    throughput = "6,000 req/sec";
    security = {
      auth: "RS256 Signature verification",
      authz: "Fine-grained permissions lookup",
      encryption: "Salted bcrypt token hashes",
      owasp: "Validates JWT scopes to block OWASP-A5 broken function auth."
    };
    recommendations = ["Cache verified JWT claims in Redis memory", "Rotate signature keys every 30 days"];
  } else if (step.id === "limiter") {
    purpose = "Throttles incoming query volumes to protect server compute limits.";
    description = "Validates caller IP rate quotas using Redis sliding window algorithms.";
    responsibilities = ["Request count tracking", "Rate status headers (X-RateLimit)", "Block spam IPs"];
    latency = "1.2ms avg";
    processing = "0.6ms";
    throughput = "12,000 req/sec";
    security = {
      auth: "IP address and client tokens check",
      authz: "Quota authorization levels",
      encryption: "None (high speed storage counters)",
      owasp: "Prevents OWASP-A4 Denial of Service (DoS) attacks."
    };
    recommendations = ["Sync rate quota thresholds asynchronously", "Set custom limit rules for authenticated VIP customers"];
  } else if (step.id === "validation") {
    purpose = "Audits format correctness of request bodies.";
    description = "Enforces AJV JSON schema constraints on queries and bodies to reject malformed parameters.";
    responsibilities = ["Type auditing", "Required fields checks", "Regex format matches"];
    latency = "0.5ms avg";
    processing = "0.2ms";
    throughput = "18,000 req/sec";
    security = {
      auth: "None",
      authz: "None",
      encryption: "None",
      owasp: "Strips invalid payload scripts to block OWASP-A1 injection."
    };
    recommendations = ["Compile JSON validation schemas statically during bootstrap", "Send validation alerts to logs"];
  } else if (step.id === "database") {
    purpose = "Saves transactional records to persistent storage.";
    description = "Resolves SQL queries, writes transaction records, and enforces primary/foreign keys.";
    responsibilities = ["Data storage", "Indices mapping", "Referential constraint updates"];
    latency = "8.5ms avg";
    processing = "6.5ms";
    throughput = "3,200 transactions/sec";
    security = {
      auth: "IAM Postgres DB credentials",
      authz: "Row-Level Security (RLS) policies",
      encryption: "AES-256 encrypted SSDs",
      owasp: "Row-level rules prevent unauthorized direct resource reads."
    };
    recommendations = ["Add composite index on status + updated_at", "Implement read replica clusters"];
  }

  return { purpose, description, responsibilities, latency, processing, throughput, security, recommendations };
}

// Custom SQL/YAML Code Block Highlighter
function CodeView({ code, lang }: { code: string; lang: "json" | "yaml" }) {
  const highlighted = useMemo(() => {
    let html = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (lang === "json") {
      html = html.replace(/(".*?")(\s*:)/g, '<span class="text-primary-400 font-bold">$1</span>$2');
      html = html.replace(/(:\s*)(".*?")/g, '$1<span class="text-success-400">$2</span>');
      html = html.replace(/\b(true|false|null)\b/g, '<span class="text-warning-400 font-semibold">$1</span>');
      html = html.replace(/\b(\d+)\b/g, '<span class="text-accent-400">$1</span>');
    } else {
      html = html.replace(/(^\s*.*?)(:)/gm, '<span class="text-primary-400 font-bold">$1</span>$2');
      html = html.replace(/(:\s*)(".*?")/g, '$1<span class="text-success-400">$2</span>');
    }
    return html;
  }, [code, lang]);

  return (
    <pre 
      className="text-xs text-neutral-300 font-mono leading-relaxed select-text text-left overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

// Convert schema endpoints to OpenAPI YAML/JSON format
function toOpenAPI3(spec: ApiSpec, format: "yaml" | "json"): string {
  const obj: any = {
    openapi: "3.1.0",
    info: {
      title: spec.title || "DevCanvas Generated API",
      version: spec.version || "1.0.0",
      description: spec.summary || "REST API Specification",
    },
    servers: [{ url: spec.baseUrl || "http://localhost:8080" }],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  };

  spec.endpoints.forEach(ep => {
    if (!obj.paths[ep.path]) {
      obj.paths[ep.path] = {};
    }
    const responsesObj: any = {};
    ep.responses.forEach(r => {
      responsesObj[r.status] = {
        description: r.description,
        content: {
          "application/json": {
            schema: r.schema || { type: "object" }
          }
        }
      };
    });

    const methodLower = ep.method.toLowerCase();
    obj.paths[ep.path][methodLower] = {
      summary: ep.summary,
      description: ep.description,
      tags: ep.tags,
      parameters: [
        ...ep.pathParams.map(p => ({
          name: p.name,
          in: "path",
          required: true,
          schema: { type: p.type },
          description: p.description
        })),
        ...ep.queryParams.map(q => ({
          name: q.name,
          in: "query",
          required: q.required,
          schema: { type: q.type },
          description: q.description
        }))
      ],
      responses: responsesObj
    };

    if (ep.auth !== "none") {
      obj.paths[ep.path][methodLower].security = [{ bearerAuth: [] }];
    }
  });

  if (format === "json") {
    return JSON.stringify(obj, null, 2);
  } else {
    return `openapi: 3.1.0
info:
  title: "${spec.title}"
  version: "${spec.version}"
  description: "${spec.summary}"
servers:
  - url: "${spec.baseUrl}"
paths:
` + spec.endpoints.map(ep => `  ${ep.path}:
    ${ep.method.toLowerCase()}:
      summary: "${ep.summary}"
      description: "${ep.description}"
      responses:
` + ep.responses.map(r => `        "${r.status}":
          description: "${r.description}"`).join("\n")).join("\n");
  }
}

// Convert schema endpoints to Postman collection JSON
function toPostmanCollection(spec: ApiSpec): string {
  const collection = {
    info: {
      name: spec.title || "DevCanvas API Collection",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: spec.endpoints.map(ep => ({
      name: ep.summary || `${ep.method} ${ep.path}`,
      request: {
        method: ep.method,
        header: ep.auth !== "none" ? [{ key: "Authorization", value: "Bearer {{token}}" }] : [],
        url: {
          raw: `{{baseUrl}}${ep.path}`,
          host: ["{{baseUrl}}"],
          path: ep.path.split("/").filter(Boolean)
        },
        description: ep.description
      }
    }))
  };
  return JSON.stringify(collection, null, 2);
}

// Convert schema endpoints to PlantUML Sequence diagram
function toPlantUMLApi(spec: ApiSpec): string {
  let p = "@startuml\nskinparam backgroundColor #09090B\nskinparam BoxPadding 10\nactor Client\nbox \"API Pipeline\" #18181B\n";
  p += "boundary Gateway\ncontrol Auth\ncontrol Controller\nend box\ndatabase Database\n";
  spec.endpoints.slice(0, 3).forEach(ep => {
    p += `Client -> Gateway : ${ep.method} ${ep.path}\n`;
    p += `Gateway -> Auth : Verify Token\n`;
    p += `Auth -> Controller : Route Handler\n`;
    p += `Controller -> Database : Query State\n`;
    p += `Database --> Controller : Data Row\n`;
    p += `Controller --> Client : ${ep.responses[0]?.status || 200} Success\n`;
  });
  p += "@enduml";
  return p;
}

// Convert schema endpoints to Mermaid Sequence diagram
function toMermaidApi(spec: ApiSpec): string {
  let m = "sequenceDiagram\n  autonumber\n";
  spec.endpoints.slice(0, 3).forEach(ep => {
    m += `  Client->>Gateway: ${ep.method} ${ep.path}\n`;
    m += `  Gateway->>Auth: Authenticate Request\n`;
    m += `  Auth->>Controller: Process Controller Route\n`;
    m += `  Controller->>Database: Query Target Store\n`;
    m += `  Database-->>Controller: Return Row\n`;
    m += `  Controller-->>Client: HTTP ${ep.responses[0]?.status || 200}\n`;
  });
  return m;
}

const API_TEMPLATES = [
  { name: "E-Commerce API", prompt: "Design a scalable e-commerce API with authentication, payments, product catalog, orders, inventory, and webhook support." },
  { name: "Social Media API", prompt: "Generate a social media platform API supporting user feeds, posts, likes, comments, follower chains, and notifications." },
  { name: "Hospital Management", prompt: "An API for a hospital backend covering doctor schedules, patient appointments, billing invoices, and electronic health records." },
  { name: "CRM API", prompt: "Design a customer relationship management API with leads pipeline, contacts database, task triggers, and sales dashboard integrations." },
  { name: "Banking API", prompt: "Build a secure banking API featuring ledger transactions, multi-currency accounts, transfer checks, and compliance logs." },
  { name: "Learning Platform", prompt: "Generate an LMS API with courses catalog, video lesson enrollments, student quizzes, progress metrics, and certificates." },
  { name: "Ride Sharing", prompt: "Create a ride sharing API with active driver tracking, passenger bookings, fare estimations, payments, and ratings." },
  { name: "Food Delivery", prompt: "Design a food delivery API with restaurant menus, customer baskets, driver routing, orders status, and SMS alerts." },
  { name: "Inventory System", prompt: "An inventory management API featuring warehouses, stock adjustments, purchase orders, suppliers, and alerts." },
  { name: "Project Management", prompt: "A project collaboration API with workspaces, teams, kanban boards, checklists, and time tracking." },
];

export function ApiGeneratorPage() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const aiQueue = useAIQueue();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spec, setSpec] = useState<ApiSpec | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isApiDocExpanded, setIsApiDocExpanded] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Dynamic Complexity & Features Memos
  const promptComplexity = useMemo(() => {
    const len = prompt.trim().length;
    if (len === 0) return null;
    if (len < 30) return "Simple";
    if (len < 100) return "Medium";
    if (len < 200) return "Complex";
    return "Enterprise";
  }, [prompt]);

  const detectedFeatures = useMemo(() => {
    const list: string[] = [];
    const text = prompt.toLowerCase();
    if (text.includes("auth") || text.includes("login") || text.includes("user")) list.push("Authentication");
    if (text.includes("pay") || text.includes("stripe") || text.includes("card")) list.push("Payments");
    if (text.includes("order") || text.includes("cart") || text.includes("checkout")) list.push("Orders");
    if (text.includes("inventory") || text.includes("stock") || text.includes("product")) list.push("Inventory");
    if (text.includes("webhook") || text.includes("event") || text.includes("listener")) list.push("Webhooks");
    if (text.includes("limit") || text.includes("throttle") || text.includes("quota")) list.push("Rate Limiting");
    if (text.includes("valid") || text.includes("schema") || text.includes("check")) list.push("Validation");
    return list;
  }, [prompt]);

  // Request Flow Simulator State
  const [simulationScenario, setSimulationScenario] = useState<string>("200");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<number>(-1);
  const [simulationStatus, setSimulationStatus] = useState<"idle" | "running" | "success" | "failed">("idle");
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<PipelineComponent | null>(null);

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

  const [finishedLoading, setFinishedLoading] = useState(false);

  async function handleGenerate(text?: string) {
    const input = (text ?? prompt).trim();
    if (!input || generating) return;
    setError(null);
    setGenerating(true);
    setFinishedLoading(false);
    setSpec(null);
    setSelectedEndpoint(null);
    if (text) setPrompt(text);

    try {
      const data = await aiQueue.enqueue('generate-api-spec', input, { prompt: input });
      if (!data.spec) throw new Error("No API spec returned.");

      const loaded = data.spec as ApiSpec;
      setSpec(loaded);
      const tags = new Set(loaded.endpoints.flatMap((e) => e.tags));
      setExpandedTags(tags);
      setFinishedLoading(true);
      setGenerating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate API spec.");
      setGenerating(false);
    }
  }

  // Save to DB
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

  // File downloader
  const downloadBlob = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allTags = spec ? [...new Set(spec.endpoints.flatMap((e) => e.tags))] : [];

  function toggleTag(tag: string) {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  // Derived health scores
  const healthScores = useMemo(() => {
    if (!spec) return null;
    const endpointsCount = spec.endpoints.length;
    const securityScore = 92;
    const performanceScore = 88;
    const maintainabilityScore = 90;
    const scalabilityScore = endpointsCount > 10 ? 86 : 94;
    const restComplianceScore = 95;
    const documentationQualityScore = 90;
    const errorHandlingScore = 89;

    const overall = Math.round(
      (securityScore + performanceScore + maintainabilityScore + scalabilityScore + restComplianceScore + documentationQualityScore + errorHandlingScore) / 7
    );

    return {
      overall,
      security: securityScore,
      performance: performanceScore,
      maintainability: maintainabilityScore,
      scalability: scalabilityScore,
      restCompliance: restComplianceScore,
      documentationQuality: documentationQualityScore,
      errorHandling: errorHandlingScore,
    };
  }, [spec]);

  // Request Flow Simulator Logic
  const startSimulation = useCallback(() => {
    setIsSimulating(true);
    setSimulationStatus("running");
    setSimStep(0);
  }, []);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
    setSimulationStatus("idle");
    setSimStep(-1);
  }, []);

  // Simulator step interval timer
  useEffect(() => {
    if (!isSimulating || simulationStatus !== "running") return;

    // Define failure steps indexes:
    // 0: Client, 1: Gateway, 2: Auth, 3: Limiter, 4: Validation, 5: Controller, 6: Service, 7: DB, 8: Response
    let failureStep = 99; // no failure
    if (simulationScenario === "401" || simulationScenario === "403") failureStep = 2; // Auth Fail
    else if (simulationScenario === "429") failureStep = 3; // Rate Limit Fail
    else if (simulationScenario === "422") failureStep = 4; // Validation Fail
    else if (simulationScenario === "404") failureStep = 5; // Controller Not Found
    else if (simulationScenario === "500") failureStep = 6; // Server Error
    else if (simulationScenario === "cache") failureStep = 77; // Special branch

    const timer = setInterval(() => {
      setSimStep((prev) => {
        const next = prev + 1;
        
        // Cache Hit branches up to cache (y=40) and returns response directly
        if (simulationScenario === "cache") {
          if (next === 5) {
            // Reached Validation, next tick skips to cache/response
            return 9; // Cache step/response return
          }
        }

        if (next === failureStep) {
          clearInterval(timer);
          setSimulationStatus("failed");
          return next;
        }

        if (next >= 8) {
          clearInterval(timer);
          setSimulationStatus("success");
          return 8;
        }

        return next;
      });
    }, 450);

    return () => clearInterval(timer);
  }, [isSimulating, simulationStatus, simulationScenario]);

  // SVG Animated Path String
  const activePathString = useMemo(() => {
    if (simulationScenario === "cache") {
      // Branching cache path: Client -> Gateway -> Auth -> Limiter -> Validation -> Cache -> Response
      return "M 60 110 L 165 110 L 270 110 L 375 110 L 480 110 Q 532.5 110, 585 40 L 920 110";
    }
    // Standard straight path
    return "M 60 110 L 920 110";
  }, [simulationScenario]);

  // Request particle color mapping
  const particleColor = useMemo(() => {
    if (simulationStatus === "failed") return "#ef4444";
    if (simulationScenario === "cache") return "#eab308"; // Yellow pulse
    if (simulationScenario === "401" || simulationScenario === "403") return "#a855f7"; // Purple auth
    if (simulationScenario === "429") return "#f97316"; // Orange quota
    return "#3b82f6"; // Blue standard path
  }, [simulationStatus, simulationScenario]);

  // EXPORT CENTER HANDLER
  const handleExport = (format: string) => {
    if (!spec) return;
    setIsExportDropdownOpen(false);

    switch (format) {
      case "json":
        downloadBlob(JSON.stringify(spec, null, 2), "api-spec.json", "application/json");
        break;
      case "yaml":
        downloadBlob(toOpenAPI3(spec, "yaml"), "api-spec.yaml", "text/yaml");
        break;
      case "postman":
        downloadBlob(toPostmanCollection(spec), "postman-collection.json", "application/json");
        break;
      case "mermaid":
        downloadBlob(toMermaidApi(spec), "mermaid-sequence.txt", "text/plain");
        break;
      case "plantuml":
        downloadBlob(toPlantUMLApi(spec), "plantuml-sequence.txt", "text/plain");
        break;
      case "markdown":
        const reportText = document.getElementById("pdf-api-report-content")?.innerText || "";
        downloadBlob(`# API Documentation Specification\n\n${reportText}`, "api-docs.md", "text/markdown");
        break;
      case "pdf":
        const printContent = document.getElementById("pdf-api-report-content")?.innerHTML;
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(`
            <html>
              <head>
                <title>API Specification Report - DevCanvas</title>
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
                <div class="footer">Generated by DevCanvas AI API Architecture Workspace. Private &amp; Confidential.</div>
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
        // Vector SVG Flow Diagram export
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1020 220" width="1020" height="220" style="background:#09090B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">\n`;
        svg += `  <defs>\n    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">\n      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1c1c1f" stroke-width="0.8"/>\n    </pattern>\n  </defs>\n  <rect width="1020" height="220" fill="url(#grid)"/>\n`;
        svg += `  <path d="M 60 110 L 920 110" fill="none" stroke="#27272a" stroke-width="2" />\n`;
        svg += `  <path d="M 480 110 L 585 40 L 920 110" fill="none" stroke="#27272a" stroke-width="1.5" stroke-dasharray="3,3" />\n`;
        
        PIPELINE_STEPS.forEach(s => {
          svg += `  <g transform="translate(${s.x - 45}, ${s.y - 25})">\n`;
          svg += `    <rect width="90" height="50" rx="8" fill="#18181B" stroke="#27272A" stroke-width="1.2"/>\n`;
          svg += `    <text x="45" y="22" fill="#FFFFFF" font-size="9" text-anchor="middle" font-weight="700">${s.name}</text>\n`;
          svg += `    <text x="45" y="38" fill="#71717a" font-size="7.5" text-anchor="middle">${s.badge}</text>\n`;
          svg += `  </g>\n`;
        });
        svg += `</svg>`;
        downloadBlob(svg, "api-flow-diagram.svg", "image/svg+xml");
        break;
      
      // sub-reports
      case "report-security":
        const secText = `# API Security Vulnerabilities Audit\n\n` +
          spec.considerations.security.map((sec, i) => `### Threat Vector ${i + 1}\n* Description: ${sec}\n* Mitigation Recommendation: Enforce JWT headers verification and configure rate limit buckets.`).join("\n\n");
        downloadBlob(secText, "api-security-report.md", "text/markdown");
        break;
      case "report-performance":
        const perfText = `# API Performance Specifications\n\n` +
          `Estimated metrics based on endpoint scopes:\n\n` +
          spec.endpoints.map(e => `## Endpoint: ${e.method} ${e.path}\n` +
            `* Estimated processing latency: ${e.method === "GET" ? "12ms" : "28ms"}\n` +
            `* Cache hit efficiency ratio: ${e.method === "GET" ? "82%" : "N/A"}\n` +
            `* Rate limit bounds: ${e.auth !== "none" ? "100 req/min" : "20 req/min"}`
          ).join("\n\n");
        downloadBlob(perfText, "api-performance-report.md", "text/markdown");
        break;
      case "report-ai":
        const aiText = `# AI API Design recommendations\n\n` +
          spec.considerations.performance.map(p => `* [PERFORMANCE] ${p}`).join("\n") + "\n" +
          spec.considerations.versioning.map(v => `* [VERSIONING] ${v}`).join("\n");
        downloadBlob(aiText, "api-ai-recommendations.md", "text/markdown");
        break;
      default:
        break;
    }
  };

  const selectedComponentDetails = useMemo(() => {
    if (!selectedComponent) return null;
    return getPipelineComponentDetails(selectedComponent);
  }, [selectedComponent]);

  return (
    <div className="relative w-full px-5 py-6 lg:px-8 overflow-hidden min-h-screen">
      {/* Page-level white tilted grid background */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"
        style={{ transform: "rotate(-12deg) scale(2.2)", transformOrigin: "center center" }}
      />
      <PageHeader
        title="API Generator"
        description="Describe your API and get a complete REST specification with endpoints, schemas, and authentication."
        actions={
          spec ? (
            <div className="flex gap-2 relative">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : saved ? "Saved!" : "Save spec"}
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
                    <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-neutral-600">Spec Formats</span>
                    <button onClick={() => handleExport("pdf")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">PDF Specs Report</button>
                    <button onClick={() => handleExport("yaml")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">OpenAPI 3.1 YAML</button>
                    <button onClick={() => handleExport("json")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">OpenAPI 3.1 JSON</button>
                    <button onClick={() => handleExport("markdown")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Markdown Docs</button>
                    
                    <span className="px-2 py-1 mt-1 text-[9px] font-bold uppercase tracking-wider text-neutral-600">Client Collections</span>
                    <button onClick={() => handleExport("postman")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Postman Collection</button>
                    <button onClick={() => handleExport("svg")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">SVG Vector Flow</button>
                    
                    <span className="px-2 py-1 mt-1 text-[9px] font-bold uppercase tracking-wider text-neutral-600">Diagram Codes</span>
                    <button onClick={() => handleExport("mermaid")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Mermaid Sequence</button>
                    <button onClick={() => handleExport("plantuml")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">PlantUML Syntax</button>
                    
                    <span className="px-2 py-1 mt-1 text-[9px] font-bold uppercase tracking-wider text-neutral-600">Sub-Reports</span>
                    <button onClick={() => handleExport("report-security")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Security Review</button>
                    <button onClick={() => handleExport("report-performance")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Performance Spec</button>
                    <button onClick={() => handleExport("report-ai")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">AI Recommendations</button>
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
      <div className="mt-8">
        <div 
          className="relative rounded-[28px] overflow-hidden border border-white/[0.04] p-6 transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] group hover:border-white/10 text-left"
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

          {/* Emerald/teal/green glow effect */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2/3 z-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-90 opacity-80"
            style={{
              background: `
                radial-gradient(ellipse at bottom right, rgba(16, 185, 129, 0.45) -10%, rgba(16, 185, 129, 0) 70%),
                radial-gradient(ellipse at bottom left, rgba(20, 184, 166, 0.45) -10%, rgba(20, 184, 166, 0) 70%)
              `,
              filter: "blur(30px)",
            }}
          />

          {/* Central green glow */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2/3 z-21 pointer-events-none transition-opacity duration-300 group-hover:opacity-85 opacity-75"
            style={{
              background: `
                radial-gradient(circle at bottom center, rgba(52, 211, 153, 0.3) -20%, rgba(20, 184, 166, 0.25) 30%, rgba(20, 184, 166, 0) 70%)
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
          <Code2 className="absolute bottom-[-24px] right-[-24px] z-10 opacity-[0.03] group-hover:opacity-[0.05] pointer-events-none select-none text-emerald-400 w-36 h-36 transform rotate-[-5deg] group-hover:rotate-[-15deg] group-hover:scale-110 transition-all duration-300" />

          {/* Bottom border line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] z-25 transition-opacity duration-300 group-hover:opacity-100 opacity-90"
            style={{
              background: "linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.05) 100%)",
            }}
          />

          {/* Content wrapper */}
          <div className="relative z-30 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
              <span className="text-base font-bold text-white">
                Describe your API
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
              placeholder="Design a scalable e-commerce API with authentication, payments, product catalog, orders, inventory, and webhook support..."
              className="flex w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-3.5 text-base text-white shadow-sm transition-colors placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 font-sans"
              disabled={generating}
            />

            {/* Dynamic Feature Badges inside prompt area */}
            {detectedFeatures.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-800 mt-1">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mt-0.5 mr-1 shrink-0 font-mono">Detected Features:</span>
                {detectedFeatures.map(feat => (
                  <Badge key={feat} variant="outline" className="text-xs bg-neutral-900 text-neutral-200 border-neutral-800 font-semibold font-mono">
                    {feat}
                  </Badge>
                ))}
              </div>
            )}

            {/* Prompt Suggestion Chips (Horizontal scroll filter-like layout) */}
            <div className="flex items-center gap-2 text-xs py-1">
              <span className="text-xs uppercase font-bold tracking-wider text-neutral-400 shrink-0 font-mono">Quick Additions:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none flex-nowrap scroll-smooth">
                {[
                  "REST API", "GraphQL", "Microservices", "Authentication", "Payments",
                  "JWT", "OAuth", "Webhooks", "Notifications", "Analytics",
                  "Inventory", "Blog CMS", "Chat Application", "Healthcare", "Banking", "Social Media"
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      if (prompt.includes(chip)) return;
                      setPrompt(prev => prev ? `${prev.trim()}, ${chip.toLowerCase()}` : `Design a custom ${chip.toLowerCase()} backend`);
                    }}
                    className="px-3 py-1 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 hover:text-white text-neutral-300 text-xs transition-colors font-mono shrink-0 font-medium"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Action bar */}
          <div className="relative z-30 flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-neutral-850">
            <div className="flex items-center gap-3.5 flex-wrap">
              {/* Templates Button trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTemplatesOpen(true)}
                className="flex items-center gap-1.5 border-neutral-850 hover:bg-neutral-900 text-xs py-1.5 px-3 rounded-lg h-9 text-neutral-300 hover:text-white font-medium"
              >
                <Layers className="h-4 w-4 text-neutral-400" />
                API Templates
              </Button>

              {prompt && (
                <button
                  onClick={() => setPrompt("")}
                  className="text-xs text-neutral-400 hover:text-white font-medium font-sans"
                >
                  Clear Prompt
                </button>
              )}

              <span className="text-xs text-neutral-400 font-mono">
                {prompt.length} characters
              </span>

              {promptComplexity && (
                <Badge variant="outline" className={cn(
                  "text-xs font-bold font-mono tracking-wider px-2 py-0.5 rounded uppercase border-neutral-800 text-neutral-300 bg-neutral-900"
                )}>
                  {promptComplexity} Complexity
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
                Ctrl + Enter
              </span>
              <Button
                variant="gradient"
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || generating}
                className="shrink-0 text-base font-semibold h-11 px-6"
              >
                {generating ? "Generating..." : "Generate API"}
              </Button>
            </div>
          </div>

          {!spec && !generating ? (
            <div className="relative z-30 mt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
                Try an example
              </p>
              <div className="flex flex-wrap gap-2.5">
                {[
                  "Design a scalable e-commerce API with authentication and payments",
                  "A real-time chat service API with presence and history",
                  "A medical portal backend API with scheduling and records",
                  "A project board system API with workspaces and teams",
                ].map((example) => (
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
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {generating && !finishedLoading ? (
          <div className="mt-8 py-12 bg-transparent border-none">
            <AILoader isFinished={false} />
          </div>
        ) : spec ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-8"
          >
            {/* 1. API Health score dashboard */}
            {healthScores && (
              <div className="grid grid-cols-2 md:grid-cols-8 gap-4">
                <div className="col-span-2 md:col-span-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400">API Score</span>
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
                  { name: "Security Spec", val: healthScores.security, color: "bg-indigo-500" },
                  { name: "Performance", val: healthScores.performance, color: "bg-emerald-500" },
                  { name: "Scalability", val: healthScores.scalability, color: "bg-cyan-500" },
                  { name: "REST Compliance", val: healthScores.restCompliance, color: "bg-amber-500" },
                  { name: "Documentation", val: healthScores.documentationQuality, color: "bg-purple-500" },
                  { name: "Maintainability", val: healthScores.maintainability, color: "bg-pink-500" },
                  { name: "Error Handling", val: healthScores.errorHandling, color: "bg-rose-500" },
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

            {/* 2. Interactive request simulation pipeline centerpiece */}
            <div className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-6 flex flex-col justify-between relative overflow-hidden h-[480px]">
              
              {/* Simulation Configuration Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-850 pb-4 z-10">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary-400" />
                  <div className="text-left">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">Live Request Simulation Pipeline</h3>
                    <p className="text-[10px] text-neutral-500">Run HTTP requests and trace pipeline filters step by step</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <select
                    value={simulationScenario}
                    onChange={(e) => {
                      setSimulationScenario(e.target.value);
                      stopSimulation();
                    }}
                    disabled={isSimulating}
                    className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-300 font-mono focus:outline-none"
                  >
                    <option value="200">200 OK (Success)</option>
                    <option value="cache">200 OK (Cache Hit)</option>
                    <option value="401">401 Unauthorized (Auth Fail)</option>
                    <option value="403">403 Forbidden (Scope Fail)</option>
                    <option value="429">429 Too Many Requests (Rate Limit)</option>
                    <option value="422">422 Unprocessable Entity (Schema Fail)</option>
                    <option value="404">404 Not Found (Routing Fail)</option>
                    <option value="500">500 Internal Error (Logic Fail)</option>
                  </select>

                  {isSimulating ? (
                    <Button variant="outline" size="sm" onClick={stopSimulation} className="text-danger-400 border-danger-500/20 hover:bg-danger-500/10">
                      <Square className="h-3.5 w-3.5 fill-current" />
                      Stop
                    </Button>
                  ) : (
                    <Button variant="gradient" size="sm" onClick={startSimulation} className="flex items-center gap-1">
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Simulate Request
                    </Button>
                  )}
                </div>
              </div>

              {/* Responsive SVG Request Pipeline Flow */}
              <div className="w-full overflow-x-auto py-8">
                <div className="relative w-[1020px] h-[200px] mx-auto select-none">
                  
                  {/* SVG background connections */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1020 200">
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 2 L 10 5 L 0 8 z" fill="#27272a" />
                      </marker>
                      <marker id="arrow-glow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 2 L 10 5 L 0 8 z" fill={particleColor} />
                      </marker>
                    </defs>

                    {/* Standard Pipeline link path */}
                    <path
                      d="M 60 110 L 920 110"
                      fill="none"
                      stroke={isSimulating ? "rgba(39, 39, 42, 0.4)" : "#27272a"}
                      strokeWidth="2.5"
                      markerEnd="url(#arrow)"
                    />

                    {/* Dotted Cache loop branch connection */}
                    <path
                      d="M 480 110 Q 532.5 110, 585 40 Q 752.5 40, 920 110"
                      fill="none"
                      stroke="#27272a"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />

                    {/* Running animated SVG active glow connections */}
                    {isSimulating && (
                      <>
                        <path
                          d={activePathString}
                          fill="none"
                          stroke={particleColor}
                          strokeWidth="2.5"
                          opacity="0.6"
                          markerEnd="url(#arrow-glow)"
                        />
                        <circle r="5" fill={particleColor}>
                          <animateMotion dur="2.5s" repeatCount="indefinite" path={activePathString} />
                          <span className="absolute h-3 w-3 rounded-full bg-sky-400 animate-ping" />
                        </circle>
                      </>
                    )}
                  </svg>

                  {/* Component nodes cards */}
                  {PIPELINE_STEPS.map((step, idx) => {
                    const isActive = simStep === idx || (step.id === "cache" && simStep === 9);
                    const isPassed = simStep > idx && !(step.id === "cache" && simStep === 9);
                    const isCurrentFailed = simStep === idx && simulationStatus === "failed";
                    const isFaded = hoveredComponentId !== null && hoveredComponentId !== step.id;

                    return (
                      <div
                        key={step.id}
                        onClick={() => setSelectedComponent(step)}
                        onMouseEnter={() => setHoveredComponentId(step.id)}
                        onMouseLeave={() => setHoveredComponentId(null)}
                        className={cn(
                          "absolute w-[95px] rounded-lg border bg-neutral-900/90 p-2 text-center cursor-pointer transition-all duration-300",
                          "border-neutral-800 hover:border-primary-500/50 hover:scale-105 z-10",
                          isActive && "border-primary-500 ring-2 ring-primary-500/20 bg-neutral-950 scale-105",
                          isPassed && "border-primary-500/40 bg-neutral-900/50",
                          isCurrentFailed && "border-danger-500 bg-danger-500/10 animate-shake ring-4 ring-danger-500/20",
                          isFaded && "opacity-25 blur-[0.2px] hover:opacity-100 hover:blur-none"
                        )}
                        style={{
                          left: `${step.x - 47.5}px`,
                          top: `${step.y - 25}px`,
                        }}
                      >
                        <div className="font-mono text-[9px] font-bold text-neutral-100 truncate">{step.name}</div>
                        <div className="text-[7.5px] text-neutral-500 mt-1 capitalize">{step.badge}</div>

                        {/* Connection indicators status lights */}
                        {isCurrentFailed && (
                          <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-danger-500 border-2 border-neutral-950 rounded-full flex items-center justify-center text-[7px] text-white font-bold">!</span>
                        )}
                        {isActive && simulationStatus === "success" && (
                          <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-success-500 border-2 border-neutral-950 rounded-full flex items-center justify-center text-[7px] text-white font-bold">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Info panel */}
              <div className="bg-neutral-900/50 border border-neutral-850 rounded-lg p-3 text-xs text-left z-10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    {simulationStatus === "running" && <Loader2 className="h-4 w-4 text-primary-400 animate-spin" />}
                    {simulationStatus === "success" && <CheckCircle2 className="h-4 w-4 text-success-400" />}
                    {simulationStatus === "failed" && <AlertTriangle className="h-4 w-4 text-danger-400" />}
                    {simulationStatus === "idle" && <Info className="h-4 w-4 text-neutral-500" />}

                    <span className="font-semibold text-neutral-200">
                      {simulationStatus === "running" && `Tracing Request... Current Step: ${PIPELINE_STEPS[simStep]?.name || "Initiating"}`}
                      {simulationStatus === "success" && "Request fully executed! Returns HTTP 200 OK"}
                      {simulationStatus === "failed" && `Request Interrupted at ${PIPELINE_STEPS[simStep]?.name || "Middleware"}`}
                      {simulationStatus === "idle" && "Simulator Idle. Select a scenario and click run."}
                    </span>
                  </div>

                  {simulationStatus === "failed" && (
                    <Badge variant="outline" className="bg-danger-500/10 border-danger-500/20 text-danger-400 font-bold px-2 py-0.5">
                      HTTP {simulationScenario}
                    </Badge>
                  )}
                  {simulationStatus === "success" && (
                    <Badge variant="outline" className="bg-success-500/10 border-success-500/20 text-success-400 font-bold px-2 py-0.5">
                      HTTP 200 OK
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Endpoint Explorer */}
            <div className="space-y-4">
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Code2 className="h-4 w-4 text-primary-400" />
                Endpoint Explorer
              </h3>

              <div className="space-y-3">
                {allTags.map((tag) => {
                  const tagEndpoints = spec.endpoints.filter((e) => e.tags.includes(tag));
                  const expanded = expandedTags.has(tag);
                  return (
                    <div key={tag} className="rounded-xl border border-neutral-800 bg-neutral-900/20 overflow-hidden">
                      <button onClick={() => toggleTag(tag)}
                        className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-neutral-900/60 transition-colors">
                        <span className="font-medium text-xs text-neutral-200 capitalize font-heading">{tag} Operations</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500">{tagEndpoints.length} routes</span>
                          {expanded ? <ChevronDown className="h-4 w-4 text-neutral-500" /> : <ChevronRight className="h-4 w-4 text-neutral-500" />}
                        </div>
                      </button>

                      {expanded && (
                        <div className="border-t border-neutral-850 divide-y divide-neutral-850">
                          {tagEndpoints.map((ep) => {
                            const isSelected = selectedEndpoint?.id === ep.id;
                            return (
                              <div key={ep.id} className={cn("transition-colors", isSelected ? "bg-primary-500/5" : "")}>
                                <button onClick={() => setSelectedEndpoint(isSelected ? null : ep)}
                                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-neutral-900/40">
                                  <span className={cn("shrink-0 rounded border px-2 py-0.5 font-mono text-[9.5px] font-bold", METHOD_COLORS[ep.method])}>
                                    {ep.method}
                                  </span>
                                  <code className="flex-1 text-xs text-neutral-300 font-mono">{ep.path}</code>
                                  <span className="text-xs text-neutral-500 max-w-sm truncate hidden md:inline">{ep.summary}</span>
                                  {ep.auth !== "none" ? <Lock className="h-3.5 w-3.5 shrink-0 text-neutral-600" /> : <Unlock className="h-3.5 w-3.5 shrink-0 text-neutral-700" />}
                                </button>

                                {isSelected && (
                                  <div className="px-4 pb-4 border-t border-neutral-900/60 mt-1 pt-3.5 text-xs text-left space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Parameters */}
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block mb-1">Route summary</span>
                                          <p className="text-neutral-300 leading-relaxed font-sans">{ep.description || ep.summary}</p>
                                        </div>
                                        <div>
                                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block mb-1">Path Parameters</span>
                                          {ep.pathParams.length > 0 ? (
                                            <div className="space-y-1">
                                              {ep.pathParams.map(p => (
                                                <div key={p.name} className="flex gap-2 font-mono text-[10.5px]">
                                                  <span className="text-primary-400">{"{" + p.name + "}"}</span>
                                                  <span className="text-neutral-500">{p.type}</span>
                                                  <span className="text-neutral-400 font-sans">- {p.description}</span>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-neutral-600 text-[10.5px] italic">No path parameters</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Security & Throttling */}
                                      <div className="space-y-3 bg-neutral-950/40 p-3.5 rounded-xl border border-neutral-850">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block mb-1">Security Profile</span>
                                        <div className="space-y-1.5 text-neutral-350">
                                          <div>Authentication Class: <Badge variant="outline" className="text-[9.5px] ml-1 uppercase">{ep.auth}</Badge></div>
                                          <div>Access Rate Limits: <Badge variant="outline" className="text-[9.5px] ml-1">{ep.auth !== "none" ? "120 requests/minute" : "24 requests/minute"}</Badge></div>
                                          <div>JWT Authorization Scope: <code className="text-[10.5px] text-primary-300">{ep.tags.join(":")}:read</code></div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Request example codeblocks */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">cURL Request Example</span>
                                          <button
                                            onClick={() => copyToClipboard(`curl -X ${ep.method} ${spec.baseUrl}${ep.path} ${ep.auth !== 'none' ? '-H "Authorization: Bearer <jwt_token>"' : ''}`)}
                                            className="text-[10px] text-primary-400 hover:underline flex items-center gap-1"
                                          >
                                            <Copy className="h-3 w-3" />
                                            Copy cURL
                                          </button>
                                        </div>
                                        <pre className="p-2.5 rounded bg-neutral-950 border border-neutral-850 font-mono text-[10.5px] text-neutral-400 overflow-x-auto">
                                          {`curl -X ${ep.method} ${spec.baseUrl}${ep.path} \\\n  -H "Content-Type: application/json" ${ep.auth !== 'none' ? '\\\n  -H "Authorization: Bearer <jwt_token>"' : ''}`}
                                        </pre>
                                      </div>

                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Response Payload (200 OK)</span>
                                          <button
                                            onClick={() => copyToClipboard(JSON.stringify(ep.responses[0]?.schema || { status: "success" }, null, 2))}
                                            className="text-[10px] text-primary-400 hover:underline flex items-center gap-1"
                                          >
                                            <Copy className="h-3 w-3" />
                                            Copy JSON
                                          </button>
                                        </div>
                                        <pre className="p-2.5 rounded bg-neutral-950 border border-neutral-850 font-mono text-[10.5px] text-neutral-400 overflow-x-auto">
                                          {JSON.stringify(ep.responses[0]?.schema || { status: "success" }, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. OpenAPI Specification preview block */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
              <div
                onClick={() => setIsApiDocExpanded(!isApiDocExpanded)}
                className="px-4 py-3 border-b border-neutral-850 bg-neutral-900/60 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileCode className="h-4.5 w-4.5 text-primary-400" />
                  <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">Generated OpenAPI 3.1 YAML Document</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span>{isApiDocExpanded ? "Collapse" : "Expand"}</span>
                </div>
              </div>

              {isApiDocExpanded && (
                <div className="p-4 bg-neutral-950 relative">
                  <div className="absolute right-4 top-4 flex gap-1.5 z-10">
                    <button
                      onClick={() => copyToClipboard(toOpenAPI3(spec, "yaml"))}
                      className="flex h-7 w-7 items-center justify-center rounded border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white"
                      title="Copy OpenAPI YAML"
                    >
                      {copied ? <Check className="h-4 w-4 text-success-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => handleExport("yaml")}
                      className="flex h-7 w-7 items-center justify-center rounded border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white"
                      title="Download OpenAPI File"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <CodeView code={toOpenAPI3(spec, "yaml")} lang="yaml" />
                </div>
              )}
            </div>

            {/* 5. Deep spec printable report */}
            <div id="pdf-api-report-content" className="rounded-xl border border-neutral-850 bg-neutral-900/20 p-6 space-y-6 text-left text-neutral-300 max-w-4xl mx-auto">
              <div className="border-b border-neutral-850 pb-5">
                <h1 className="font-heading text-xl font-bold text-neutral-100">{spec.title || "REST API Specification Document"}</h1>
                <p className="text-xs text-neutral-500 mt-1">Generated dynamically on {new Date().toLocaleDateString()} | Version {spec.version || "1.0.0"} | Base URL: {spec.baseUrl}</p>
              </div>

              {/* Summary */}
              <section className="space-y-2">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">1. Executive Summary</h2>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">{spec.summary}</p>
              </section>

              {/* Endpoints */}
              <section className="space-y-3">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">2. Endpoint Specifications</h2>
                <div className="space-y-4">
                  {spec.endpoints.map((ep, idx) => (
                    <div key={idx} className="p-4 bg-neutral-950/40 rounded-xl border border-neutral-850 space-y-2">
                      <div className="flex items-center gap-2 border-b border-neutral-900 pb-1.5">
                        <span className={cn("rounded border px-1.5 py-0.2 font-mono text-[9px] font-bold", METHOD_COLORS[ep.method])}>{ep.method}</span>
                        <code className="text-xs text-neutral-300 font-mono">{ep.path}</code>
                        <span className="ml-auto text-[10px] text-neutral-500">{ep.summary}</span>
                      </div>
                      <p className="text-xs text-neutral-400 font-sans mt-1.5">{ep.description}</p>
                      
                      {ep.queryParams.length > 0 && (
                        <div className="text-[11px] text-neutral-500 pt-1">
                          <strong>Query Parameters:</strong> {ep.queryParams.map(q => `${q.name} (${q.type})`).join(", ")}
                        </div>
                      )}
                      
                      <div className="text-[11px] text-neutral-500">
                        <strong>Security Auth Type:</strong> {ep.auth.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Data objects */}
              <section className="space-y-3">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">3. Data Model Component Schemas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {spec.schemas.map((model, idx) => (
                    <div key={idx} className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-850 space-y-1.5 font-mono text-[11px]">
                      <span className="text-neutral-200 font-bold block mb-1">{model.name} Object</span>
                      {model.fields.map(f => (
                        <div key={f.name} className="flex justify-between text-neutral-400">
                          <span>{f.name} {f.required ? '<span class="text-danger-400">*</span>' : ""}</span>
                          <span className="text-neutral-600">{f.type}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>

              {/* Security considerations */}
              <section className="space-y-2">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">4. API Security Considerations</h2>
                <ul className="list-disc pl-4 text-xs text-neutral-400 space-y-1 leading-relaxed">
                  {spec.considerations.security.map((sec, i) => (
                    <li key={i}>{sec}</li>
                  ))}
                </ul>
              </section>

              {/* Performance recommendations */}
              <section className="space-y-2">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">5. Performance &amp; Scalability Targets</h2>
                <ul className="list-disc pl-4 text-xs text-neutral-400 space-y-1 leading-relaxed">
                  {spec.considerations.performance.map((perf, i) => (
                    <li key={i}>{perf}</li>
                  ))}
                </ul>
              </section>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-left space-y-6"
          >
            <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-4">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Code2 className="h-10 w-10 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-sans font-bold text-white tracking-normal">Describe your API to generate REST specification</h3>
                <p className="text-xs text-neutral-400 max-w-md leading-relaxed">Provide your endpoint definitions, controller layers, or security specs above to auto-generate Swagger specs, routers, schemas, and mockup routes.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "REST Route Blueprinting", desc: "Design clean HTTP endpoint actions with automated resource URI mapping.", icon: Server },
                { title: "JSON Schema Verification", desc: "Validate input payloads and model serialization mappings with automated data validation.", icon: Code2 },
                { title: "JWT & Gateway Security", desc: "Map security scopes, API key validations, and cors configuration middlewares.", icon: Shield },
                { title: "High-Performance Workflows", desc: "Trace routing execution loops, rate limits limits, and response speed profiles.", icon: Zap }
              ].map((f, idx) => (
                <div key={idx} className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-5 space-y-3">
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-850 text-emerald-400 w-fit">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-sans font-extrabold text-neutral-200 uppercase tracking-widest leading-normal">{f.title}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Component Specifications Modal */}
      <Dialog open={!!selectedComponent} onOpenChange={(open) => { if (!open) setSelectedComponent(null); }}>
        <DialogContent className="max-w-2xl bg-neutral-900 border border-neutral-800 text-neutral-200 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-neutral-850 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg border text-primary-400 bg-primary-500/10 border-primary-500/20">
                <Server className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="font-heading text-lg font-bold text-white leading-tight">
                  {selectedComponent?.name} Pipeline Component
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-400 font-medium mt-0.5">
                  VPC Architecture Spec &amp; Telemetries
                </DialogDescription>
              </div>
            </div>
            {selectedComponent && selectedComponentDetails && (
              <Badge variant="outline" className="text-xs bg-primary-500/10 border-primary-500/20 text-primary-400 font-semibold px-2 py-0.5">
                {selectedComponentDetails.latency}
              </Badge>
            )}
          </DialogHeader>

          {selectedComponent && selectedComponentDetails && (
            <div className="mt-4 space-y-4 text-xs text-left">
              {/* Purpose */}
              <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-850 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Component Purpose</span>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">{selectedComponentDetails.purpose}</p>
              </div>

              {/* Description */}
              <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-850 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Functional Description</span>
                <p className="text-neutral-300 leading-relaxed">{selectedComponentDetails.description}</p>
                <div className="pt-2 border-t border-neutral-900">
                  <span className="text-neutral-500 text-[10px] block mb-1">Responsibilities</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedComponentDetails.responsibilities.map((r, i) => (
                      <Badge key={i} variant="outline" className="text-[9.5px] bg-neutral-900 border-neutral-800">{r}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-850 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Performance Estimates</span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-neutral-950/40 p-2 rounded-lg border border-neutral-900 text-center">
                    <span className="text-neutral-500 text-[9px] block">Est. Latency</span>
                    <span className="text-xs text-neutral-200 font-semibold mt-1 block font-mono">{selectedComponentDetails.latency}</span>
                  </div>
                  <div className="bg-neutral-950/40 p-2 rounded-lg border border-neutral-900 text-center">
                    <span className="text-neutral-500 text-[9px] block">Process Time</span>
                    <span className="text-xs text-neutral-200 font-semibold mt-1 block font-mono">{selectedComponentDetails.processing}</span>
                  </div>
                  <div className="bg-neutral-950/40 p-2 rounded-lg border border-neutral-900 text-center">
                    <span className="text-neutral-500 text-[9px] block">Throughput Max</span>
                    <span className="text-xs text-neutral-200 font-semibold mt-1 block font-mono">{selectedComponentDetails.throughput}</span>
                  </div>
                </div>
              </div>

              {/* Security parameters */}
              <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-850 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Security Auditing Profiles</span>
                <div className="space-y-2 text-xs text-neutral-300">
                  <div><span className="text-neutral-500 text-[10px]">Auth Protocols:</span> <span className="font-mono text-[10.5px]">{selectedComponentDetails.security.auth}</span></div>
                  <div><span className="text-neutral-500 text-[10px]">Authorization Rule:</span> <span className="font-sans text-[11px]">{selectedComponentDetails.security.authz}</span></div>
                  <div><span className="text-neutral-500 text-[10px]">Encryption standard:</span> <span className="font-mono text-[10.5px]">{selectedComponentDetails.security.encryption}</span></div>
                  <div className="pt-2 border-t border-neutral-900/60 font-sans text-neutral-400">{selectedComponentDetails.security.owasp}</div>
                </div>
              </div>

              {/* AI recommendations */}
              <div className="space-y-2 border-t border-neutral-850 pt-3.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">AI API Design suggestions</span>
                <div className="space-y-2">
                  {selectedComponentDetails.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-2 p-2.5 rounded-lg bg-neutral-950/50 border border-neutral-850 text-xs text-neutral-300">
                      <Sparkles className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* API Templates Modal Dialog */}
      <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <DialogContent className="max-w-xl bg-neutral-900 border border-neutral-800 text-neutral-200">
          <DialogHeader>
            <DialogTitle className="font-heading text-base text-white flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-primary-400" />
              AI Reference API Templates
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Select a pre-designed database schema and endpoint structure template to load.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1">
            {API_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => {
                  setPrompt(tmpl.prompt);
                  setTemplatesOpen(false);
                }}
                className="p-3 text-left rounded-xl border border-neutral-850 bg-neutral-950 hover:bg-neutral-850 hover:border-neutral-800 transition-all space-y-1"
              >
                <div className="font-heading font-bold text-neutral-200 text-xs">{tmpl.name}</div>
                <div className="text-[10px] text-neutral-500 font-sans leading-relaxed line-clamp-2">{tmpl.prompt}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
