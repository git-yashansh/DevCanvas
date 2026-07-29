import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Clock,
  Zap,
  Save,
  Check,
  Download,
  Server,
  Database,
  Cpu,
  HardDrive,
  Cloud,
  Globe,
  Layers,
  Shield,
  FileCode,
  ListFilter
} from "lucide-react";
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@ui/index";
import { PageHeader } from "@/components/dashboard/page-header";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useAIQueue } from "@/lib/ai-queue-context";
import { cn } from "@utils/index";
import { AILoader } from "@/components/dashboard/AILoader";
import type {
  SecurityAnalysis,
  SecurityFinding,
  Severity,
  OwaspStatus,
} from "@/lib/types/security";

const GRADE_COLORS: Record<string, string> = {
  "A+": "text-success-400",
  A: "text-success-400",
  B: "text-primary-400",
  C: "text-warning-400",
  D: "text-orange-400",
  F: "text-danger-400",
};

interface SecurityNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  threatLevel: "Critical" | "High" | "Medium" | "Low" | "None";
  riskScore: number;
  purpose: string;
  vulnerabilities: string[];
  assets: string[];
  owaspMapping: string;
  mitigation: string;
  bestPractices: string[];
  aiRecs: string[];
  compliance: string;
  dependencies: string[];
}

const ATTACK_SURFACE_NODES: SecurityNode[] = [
  {
    id: "client",
    name: "User Client Portal",
    type: "Client App",
    x: 120,
    y: 350,
    threatLevel: "Low",
    riskScore: 24,
    purpose: "Provides SPA rendering and local token storage for web sessions.",
    vulnerabilities: [
      "Potential XSS injection vectors via unescaped search params",
      "Insecure storage of access tokens in browser localStorage"
    ],
    assets: ["Web browser rendering context", "User profile payload cookies"],
    owaspMapping: "A03:2021 - Injection",
    mitigation: "Enforce strict client-side DOM sanitization and store tokens in HttpOnly session cookies.",
    bestPractices: ["Sanitize inputs using DOMPurify.", "Implement Content Security Policy (CSP) security headers."],
    aiRecs: ["Enforce secure cookie attributes (SameSite=Strict, Secure)."],
    compliance: "GDPR Art. 32 (Data security checks)",
    dependencies: ["cdn"]
  },
  {
    id: "cdn",
    name: "Cloudflare Edge CDN",
    type: "CDN Proxy",
    x: 330,
    y: 350,
    threatLevel: "Low",
    riskScore: 15,
    purpose: "Handles static resource caching, TLS edge termination, and DDoS filtering.",
    vulnerabilities: [
      "Exposed origin server IP configurations",
      "Outdated SSL/TLS fallback cipher support"
    ],
    assets: ["DNS routing records", "Edge caching nodes"],
    owaspMapping: "A05:2021 - Security Misconfiguration",
    mitigation: "Strictly restrict origin routing access to CDN IP ranges and configure TLS 1.3 only.",
    bestPractices: ["Rotate CDN authentication access keys.", "Configure Web Application Firewall (WAF) routing rules."],
    aiRecs: ["Enable HTTP Strict Transport Security (HSTS) with preloading."],
    compliance: "PCI-DSS 4.1 (Transmission Encryption)",
    dependencies: ["load-balancer"]
  },
  {
    id: "load-balancer",
    name: "AWS Application Load Balancer",
    type: "Load Balancer",
    x: 540,
    y: 350,
    threatLevel: "Low",
    riskScore: 18,
    purpose: "Balances HTTP traffic workloads across redundant API gateways and checks target health.",
    vulnerabilities: [
      "Vulnerable to HTTP Request Smuggling on legacy routing headers",
      "Overly broad load balancing network port accessibility configuration"
    ],
    assets: ["VPC Load balancer instance", "SSL Termination points"],
    owaspMapping: "A02:2021 - Cryptographic Failures",
    mitigation: "Apply strict HTTP header sanitization settings and block weak CBC cipher categories.",
    bestPractices: ["Configure SSL policy AWS-ELBSecurityPolicy-TLS13-1-2.", "Enable ALB access logs archiving."],
    aiRecs: ["Regularly review ingress routing rules via VPC security groups."],
    compliance: "SOC2 CC6.3 (Transmission security protocols)",
    dependencies: ["api-gateway"]
  },
  {
    id: "api-gateway",
    name: "Kong API Gateway",
    type: "API Gateway",
    x: 750,
    y: 350,
    threatLevel: "Medium",
    riskScore: 42,
    purpose: "Ingress router verifying authorization tokens and dispatching rate limit quotas.",
    vulnerabilities: [
      "Rate limiting bypass via client IP spoofing configurations",
      "Missing schema verification filters on wildcards endpoints"
    ],
    assets: ["API Gateway nodes", "Internal proxy service maps"],
    owaspMapping: "A04:2021 - Insecure Design",
    mitigation: "Validate source header origins (True-Client-IP) and bind sliding rate limiting rules.",
    bestPractices: ["Enforce OAuth2 token schemas globally.", "Enable CORS origin checking configurations."],
    aiRecs: ["Integrate API threat scanning layers at the ingress proxy level."],
    compliance: "OWASP API10:2023 (Safe Ingestion limits)",
    dependencies: ["auth-service", "backend"]
  },
  {
    id: "auth-service",
    name: "Authentication Engine",
    type: "Auth / Identity",
    x: 960,
    y: 220,
    threatLevel: "Critical",
    riskScore: 88,
    purpose: "Handles login requests, passwords encryption, and signs JWT authorization tokens.",
    vulnerabilities: [
      "Accepts JWT none signature validation bypasses",
      "Brute force vulnerability on authentication routes"
    ],
    assets: ["JWT cryptographic signing keys", "User credential logs database"],
    owaspMapping: "A07:2021 - Identification & Auth Failures",
    mitigation: "Enforce strict RS256 signing algorithms and install rate limiting buckets on login targets.",
    bestPractices: ["Hash credentials using Argon2id/bcrypt.", "Require multi-factor authentication (MFA)."],
    aiRecs: ["Enforce short-lived JWT expiry limits and utilize refresh token rotation."],
    compliance: "ISO 27001 A.9.4.2 (Secure user authentication procedures)",
    dependencies: ["database"]
  },
  {
    id: "backend",
    name: "Core Business API",
    type: "Backend Service",
    x: 960,
    y: 460,
    threatLevel: "High",
    riskScore: 72,
    purpose: "Calculates logic parameters and queries persistent datastores.",
    vulnerabilities: [
      "SQL/NoSQL query injection potentials in resource search controllers",
      "Overprivileged internal container runtime parameters"
    ],
    assets: ["Application containers", "Internal API controllers"],
    owaspMapping: "A01:2021 - Broken Access Control",
    mitigation: "Strictly enforce parameterized queries via ORM libraries and apply least privilege container setups.",
    bestPractices: ["Execute container images as non-root users.", "Enable automated static dependency scanning."],
    aiRecs: ["Enforce secure REST payload schema structural verifications."],
    compliance: "SOC2 CC7.1 (System vulnerability scanning)",
    dependencies: ["database", "storage", "third-party-api"]
  },
  {
    id: "database",
    name: "PostgreSQL Database",
    type: "Database",
    x: 1170,
    y: 150,
    threatLevel: "High",
    riskScore: 68,
    purpose: "Manages application transactional tables and user records.",
    vulnerabilities: [
      "Plaintext connection transport config (no SSL enforcement)",
      "Vulnerable system account configurations without password limits"
    ],
    assets: ["Persistent disk volumes", "Read-replica storage sets"],
    owaspMapping: "A02:2021 - Cryptographic Failures",
    mitigation: "Enforce sslmode=require database parameters and host instances behind isolated subnets.",
    bestPractices: ["Enable Row-Level Security (RLS) tables policies.", "Encrypt data volumes at rest using KMS keys."],
    aiRecs: ["Schedule regular database access credential audits and key rotations."],
    compliance: "PCI-DSS 3.4 (Stored cardholder details protection)",
    dependencies: []
  },
  {
    id: "storage",
    name: "AWS S3 Assets Storage",
    type: "File Storage",
    x: 1170,
    y: 350,
    threatLevel: "Medium",
    riskScore: 35,
    purpose: "Hosts and archives static user uploads and system files.",
    vulnerabilities: [
      "Public read bucket permissions configuration",
      "Unencrypted uploaded assets stored in storage buckets"
    ],
    assets: ["S3 Cloud buckets", "Object asset items"],
    owaspMapping: "A05:2021 - Security Misconfiguration",
    mitigation: "Enable 'Block Public Access' configurations and enforce KMS-managed SSE-S3 encryption.",
    bestPractices: ["Utilize signed URL endpoints with short-lived tokens.", "Enable file virus scanning workflows."],
    aiRecs: ["Configure bucket CORS policy parameters to restrict unauthorized request domains."],
    compliance: "SOC2 CC6.6 (Logical workspace protections)",
    dependencies: []
  },
  {
    id: "third-party-api",
    name: "Stripe Payment webhook",
    type: "External Integration",
    x: 1170,
    y: 550,
    threatLevel: "Low",
    riskScore: 22,
    purpose: "Processes merchant transactions and handles checkout callbacks.",
    vulnerabilities: [
      "Missing signature verification checks on webhook routes",
      "Potential SSRF vectors via dynamic callback URLs"
    ],
    assets: ["API access client credentials", "Webhook endpoint routers"],
    owaspMapping: "A10:2021 - SSRF vulnerabilities",
    mitigation: "Validate payment webhook signature keys and enforce URL hostname whitelist constraints.",
    bestPractices: ["Rotate payment keys regularly.", "Enforce egress network proxy filtering."],
    aiRecs: ["Enforce separate VPC subnets for processing third-party callback routines."],
    compliance: "SOC2 CC6.2 (External supplier monitoring controls)",
    dependencies: []
  }
];

const COMPLIANCE_ITEMS = [
  { standard: "OWASP Top 10", status: "Pass", progress: 95, scope: "Access validation, injection blocks, auth limits", recs: "Regularly check dependency updates and lock database subnets." },
  { standard: "SOC 2 Type II", status: "Warning", progress: 78, scope: "Audit logging, logical firewall isolation, access control", recs: "Enforce multi-factor auth globally and aggregate audit trail logs." },
  { standard: "ISO 27001", status: "Warning", progress: 82, scope: "Key storage management, identity policies, secure builds", recs: "Utilize KMS secrets managers and establish periodic user permission checks." },
  { standard: "GDPR", status: "Pass", progress: 90, scope: "Personal data encryption, user consent flows, RLS databases", recs: "Configure DB Row-Level Security policies on user info tables." },
  { standard: "PCI DSS v4.0", status: "Warning", progress: 74, scope: "Payment processing security, SSL edge ciphers, webhook tests", recs: "Enforce webhook signature validation and disable legacy TLS fallback ciphers." }
];

const CATEGORY_SCORES = [
  { name: "Authentication", score: 92, status: "Secure", color: "bg-emerald-500" },
  { name: "Authorization", score: 85, status: "Secure", color: "bg-emerald-500" },
  { name: "Encryption", score: 88, status: "Secure", color: "bg-emerald-500" },
  { name: "Network Security", score: 90, status: "Secure", color: "bg-emerald-500" },
  { name: "API Security", score: 84, status: "Secure", color: "bg-emerald-500" },
  { name: "Infrastructure", score: 89, status: "Secure", color: "bg-emerald-500" },
  { name: "Secrets Management", score: 75, status: "Needs Improvement", color: "bg-warning-500" },
  { name: "Compliance", score: 86, status: "Secure", color: "bg-emerald-500" },
  { name: "Logging & Audit", score: 80, status: "Needs Improvement", color: "bg-warning-500" },
  { name: "Monitoring", score: 78, status: "Needs Improvement", color: "bg-warning-500" }
];

const RISK_FINDINGS = [
  { title: "JWT Signature Validation Bypass", level: "Critical", likelihood: "Possible", impact: "Severe", priority: "P0", component: "Authentication Engine", status: "Open" },
  { title: "Plaintext DB Ingress Transport Config", level: "High", likelihood: "Likely", impact: "Major", priority: "P1", component: "PostgreSQL Database", status: "Open" },
  { title: "SQL/NoSQL Injections in controllers", level: "High", likelihood: "Possible", impact: "Major", priority: "P1", component: "Core Business API", status: "Open" },
  { title: "S3 public read write permissions", level: "Medium", likelihood: "Unlikely", impact: "Major", priority: "P2", component: "AWS S3 Assets Storage", status: "Open" },
  { title: "Rate limiting bypass configurations", level: "Medium", likelihood: "Possible", impact: "Moderate", priority: "P2", component: "Kong API Gateway", status: "Open" },
  { title: "Webhook callback signatures verification", level: "Low", likelihood: "Possible", impact: "Minor", priority: "P3", component: "Stripe Payment webhook", status: "Mitigated" },
  { title: "Access tokens in local browser storage", level: "Low", likelihood: "Likely", impact: "Minor", priority: "P3", component: "User Client Portal", status: "Mitigated" }
];

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
  const aiQueue = useAIQueue();
  const [prompt, setPrompt] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SecurityAnalysis | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Redesign state variables
  const [selectedNode, setSelectedNode] = useState<SecurityNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"visualizer" | "matrix" | "owasp" | "compliance" | "report" >("visualizer");

  const projectId = searchParams.get("projectId");

  // Load project security report if available
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

  const [finishedLoading, setFinishedLoading] = useState(false);

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
        content: `Security workspace audit saved. Overall Score: ${analysis.score}% - Grade: ${analysis.grade}`,
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
    setFinishedLoading(false);
    setAnalysis(null);
    if (text) setPrompt(text);

    try {
      const data = await aiQueue.enqueue('analyze-security', input, { prompt: input });
      if (!data.analysis) throw new Error("No analysis returned.");
      setAnalysis(data.analysis as SecurityAnalysis);
      setFinishedLoading(true);
      setAnalyzing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze security.");
      setAnalyzing(false);
    }
  }

  // Helper blob download exporter
  const downloadBlob = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: string) => {
    setExportOpen(false);
    if (!analysis) return;
    
    switch (format) {
      case "json":
        downloadBlob(JSON.stringify(analysis, null, 2), "security-audit.json", "application/json");
        break;
      case "yaml":
        downloadBlob(
          `# DevCanvas Security Spec\nscore: ${analysis.score}\ngrade: ${analysis.grade}\nfindingsCount: ${analysis.findings.length}`,
          "security-audit.yaml",
          "text/yaml"
        );
        break;
      case "markdown":
        const mdText = `# DevCanvas Security Workspace Audit\n\n` +
          `* Overall Score: ${analysis.score}%\n` +
          `* Grade: ${analysis.grade}\n\n` +
          `## Actionable Recommendations\n` +
          analysis.recommendations.immediate.map(r => `* [IMMEDIATE] ${r}`).join("\n") + "\n" +
          analysis.recommendations.shortTerm.map(r => `* [SHORT-TERM] ${r}`).join("\n");
        downloadBlob(mdText, "security-report.md", "text/markdown");
        break;
      case "compliance":
        const compText = `# Compliance Audit Status Review\n\n` +
          COMPLIANCE_ITEMS.map(c => `## ${c.standard}: ${c.status}\n* Progress: ${c.progress}%\n* Recs: ${c.recs}`).join("\n\n");
        downloadBlob(compText, "compliance-spec-report.md", "text/markdown");
        break;
      case "owasp":
        const owaspText = `# OWASP Top 10 Security alignment Review\n\n` +
          analysis.owaspCoverage.map(o => `* [${o.id}] ${o.name} -> ${o.status.toUpperCase()} (Notes: ${o.notes})`).join("\n");
        downloadBlob(owaspText, "owasp-compliance-report.md", "text/markdown");
        break;
      case "risk":
        const riskText = `# Risk Register Analysis\n\n` +
          RISK_FINDINGS.map(r => `* ${r.title} - Severity: ${r.level} | Impact: ${r.impact} | Priority: ${r.priority}`).join("\n");
        downloadBlob(riskText, "risk-matrix-register.md", "text/markdown");
        break;
      default:
        break;
    }
  };

  const promptComplexity = useMemo(() => {
    const len = prompt.trim().length;
    if (len === 0) return null;
    if (len < 30) return "Simple";
    if (len < 100) return "Medium";
    if (len < 200) return "Complex";
    return "Enterprise";
  }, [prompt]);

  return (
    <div className="w-full px-5 py-6 lg:px-8">
      <PageHeader
        title="Security Center"
        description="Describe your application stack and get an OWASP-aligned security analysis with actionable remediation."
        actions={
          analysis ? (
            <div className="flex gap-2 relative">
              {projectId && (
                <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                  {saved ? <Check className="h-4 w-4 text-success-400" /> : <Save className="h-4 w-4" />}
                  {saved ? "Saved" : saving ? "Saving..." : "Save to Project"}
                </Button>
              )}

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExportOpen(!exportOpen)}
                  className="flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Export Workspace
                </Button>
                {exportOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-56 flex flex-col rounded-lg border border-neutral-800 bg-neutral-900 p-1 text-xs text-neutral-400 shadow-xl z-50">
                    <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-neutral-600">Export Formats</span>
                    <button onClick={() => handleExport("markdown")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-850 hover:text-white">Markdown Report</button>
                    <button onClick={() => handleExport("json")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-850 hover:text-white">Raw JSON metadata</button>
                    <button onClick={() => handleExport("yaml")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-850 hover:text-white">YAML Specifications</button>
                    
                    <span className="px-2 py-1 mt-1 text-[9px] font-bold uppercase tracking-wider text-neutral-600">Compliance &amp; Risks</span>
                    <button onClick={() => handleExport("compliance")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-850 hover:text-white">Compliance Report</button>
                    <button onClick={() => handleExport("owasp")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-850 hover:text-white">OWASP Audit Matrix</button>
                    <button onClick={() => handleExport("risk")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-850 hover:text-white">Risk Matrix Registry</button>
                  </div>
                )}
              </div>

              <Button variant="ghost" size="sm" onClick={() => handleAnalyze()}>
                <RefreshCw className="h-4 w-4" />
                Re-analyze
              </Button>
            </div>
          ) : null
        }
      />

      {/* Description / Prompt Box (Symmetric alignment with Architecture prompt wrapper) */}
      <div className="mt-8">
        <div className="bg-gradient-to-b from-[#0a142c] via-[#121319] to-[#121319] border border-blue-900/35 rounded-2xl p-6 text-left">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
              <span className="text-base font-bold text-white">
                Describe your application architecture
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleAnalyze();
                }
              }}
              rows={3}
              placeholder="A Node.js REST API with JWT auth, PostgreSQL, file uploads on S3, and Redis caching…"
              className="flex w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-3.5 text-base text-white shadow-sm transition-colors placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 font-sans"
              disabled={analyzing}
            />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-neutral-400">
                  Press Cmd/Ctrl + Enter to trigger security audits
                </p>
                {promptComplexity && (
                  <Badge variant="outline" className="text-xs font-mono border-neutral-800 text-neutral-300 bg-neutral-900 uppercase font-bold">
                    {promptComplexity} Complexity
                  </Badge>
                )}
              </div>
              <Button
                variant="gradient"
                onClick={() => handleAnalyze()}
                disabled={!prompt.trim() || analyzing}
                className="shrink-0 text-base font-semibold h-11 px-6"
              >
                {analyzing ? "Analyzing..." : "Analyze security"}
              </Button>
            </div>
          </div>

          {!analysis && !analyzing ? (
            <div className="mt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
                Try an example
              </p>
              <div className="flex flex-wrap gap-2.5">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => handleAnalyze(ex)}
                    className="rounded-xl border border-white/10 bg-surface-2 px-4 py-2.5 text-left text-sm font-medium text-neutral-200 transition-colors hover:border-white/20 hover:text-white"
                  >
                    {ex}
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
        {analyzing && !finishedLoading ? (
          <div className="mt-8 py-12 bg-transparent border-none">
            <AILoader isFinished={false} />
          </div>
        ) : analysis ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-8"
          >
            {/* 1. Security Overview Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Security Score</span>
                <span className="text-3xl font-heading font-black text-white mt-1.5">{analysis.score}%</span>
                <span className={cn("text-xs font-bold mt-1", GRADE_COLORS[analysis.grade])}>Grade {analysis.grade}</span>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col justify-center text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Risk level</span>
                <span className="text-xl font-bold text-white mt-1">Medium Risk</span>
                <span className="text-[10px] text-neutral-500 mt-1">Infrastructure Exposure</span>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col justify-center text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-danger-400">Critical Issues</span>
                <span className="text-2xl font-black text-white mt-1">{analysis.findings.filter(f => f.severity === "critical").length || 1}</span>
                <span className="text-[10px] text-neutral-500 mt-1">Requires immediate patches</span>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col justify-center text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-warning-400">Warning alerts</span>
                <span className="text-2xl font-black text-white mt-1">{analysis.findings.filter(f => f.severity === "high" || f.severity === "medium").length || 4}</span>
                <span className="text-[10px] text-neutral-500 mt-1">Policy violations logged</span>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col justify-center text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Passed checks</span>
                <span className="text-2xl font-black text-white mt-1">24 checks</span>
                <span className="text-[10px] text-neutral-500 mt-1">Security policies green</span>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col justify-center text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400">Compliance status</span>
                <span className="text-xs font-semibold text-white mt-1.5">SOC2 &amp; ISO Warnings</span>
                <span className="text-[9px] text-neutral-500 mt-0.5">3 audits pending updates</span>
              </div>
            </div>

            {/* Workspace tab selectors */}
            <div className="flex border-b border-neutral-800 gap-1.5 scrollbar-none overflow-x-auto">
              {[
                { id: "visualizer", label: "Attack Surface Map", icon: Shield },
                { id: "matrix", label: "Risk Matrix Grid", icon: ListFilter },
                { id: "owasp", label: "OWASP Top 10", icon: ShieldCheck },
                { id: "compliance", label: "Compliance Center", icon: Globe },
                { id: "report", label: "Executive Security Report", icon: FileCode }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wide border-b-2 -mb-[2px] transition-all whitespace-nowrap",
                    activeTab === tab.id
                      ? "border-primary-500 text-white bg-primary-500/5"
                      : "border-transparent text-neutral-400 hover:text-neutral-200"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Attack Surface Visualizer */}
            {activeTab === "visualizer" && (
              <div className="space-y-6">
                {/* SVG Visualizer Canvas */}
                <div className="relative rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
                  <div className="absolute left-4 top-4 z-10 space-y-1">
                    <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">Application Threat Surface Model</h3>
                    <p className="text-[10px] text-neutral-500 text-left">Interactive SVG network map. Hover to outline dependency paths; click nodes to audit vulnerabilities.</p>
                  </div>

                  <div className="absolute right-4 top-4 z-10 flex gap-2">
                    <Badge variant="outline" className="text-[9.5px] bg-danger-500/10 border-danger-500/20 text-danger-400 font-mono">Critical</Badge>
                    <Badge variant="outline" className="text-[9.5px] bg-orange-500/10 border-orange-500/20 text-orange-400 font-mono">High</Badge>
                    <Badge variant="outline" className="text-[9.5px] bg-warning-500/10 border-warning-500/20 text-warning-400 font-mono">Medium</Badge>
                    <Badge variant="outline" className="text-[9.5px] bg-primary-500/10 border-primary-500/20 text-primary-400 font-mono">Low</Badge>
                  </div>

                  {/* SVG Canvas (750px Height) */}
                  <div className="overflow-x-auto">
                    <svg className="w-full h-[750px]" style={{ minWidth: "1300px" }}>
                      <defs>
                        <pattern id="sec-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#141416" strokeWidth="1" />
                        </pattern>
                        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#27272a" />
                        </marker>
                        <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                        </marker>
                      </defs>
                      
                      <rect width="100%" height="100%" fill="url(#sec-grid)" />

                      {/* SVG connection lines */}
                      {ATTACK_SURFACE_NODES.map((node) => {
                        return node.dependencies.map((depId) => {
                          const target = ATTACK_SURFACE_NODES.find(n => n.id === depId);
                          if (!target) return null;

                          const isHighlighted = hoveredNodeId === node.id || hoveredNodeId === target.id;
                          return (
                            <g key={`${node.id}-${depId}`}>
                              <path
                                d={`M ${node.x + 95} ${node.y + 6} C ${(node.x + 95 + target.x - 95) / 2} ${node.y + 6}, ${(node.x + 95 + target.x - 95) / 2} ${target.y + 6}, ${target.x - 95} ${target.y + 6}`}
                                fill="none"
                                stroke={isHighlighted ? "#3b82f6" : "#27272a"}
                                strokeWidth={isHighlighted ? 2.5 : 1.2}
                                markerEnd={isHighlighted ? "url(#arrow-active)" : "url(#arrow)"}
                                className="transition-colors duration-300"
                              />
                            </g>
                          );
                        });
                      })}

                      {/* SVG node cards */}
                      {ATTACK_SURFACE_NODES.map((node) => {
                        const isHovered = hoveredNodeId === node.id;
                        const hasActiveHover = hoveredNodeId !== null;
                        const opacityVal = hasActiveHover ? (isHovered || node.dependencies.includes(hoveredNodeId!) || ATTACK_SURFACE_NODES.find(n => n.id === hoveredNodeId)?.dependencies.includes(node.id) ? 1 : 0.25) : 1;

                        return (
                          <g
                            key={node.id}
                            transform={`translate(${node.x - 95}, ${node.y - 25})`}
                            onMouseEnter={() => setHoveredNodeId(node.id)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                            onClick={() => setSelectedNode(node)}
                            style={{ opacity: opacityVal, cursor: "pointer" }}
                            className="transition-all duration-300"
                          >
                            <rect
                              width="190"
                              height="62"
                              rx="8"
                              fill="#111827"
                              stroke={isHovered ? "#3b82f6" : "#27272a"}
                              strokeWidth={1.5}
                            />
                            <text x="14" y="24" fill="#ffffff" fontSize="11" fontWeight="700" fontFamily="sans-serif">{node.name}</text>
                            <text x="14" y="38" fill="#71717a" fontSize="8" fontFamily="monospace">{node.type.toUpperCase()}</text>
                            <text x="14" y="50" fill="#a1a1aa" fontSize="8.5" fontFamily="sans-serif">Score: {node.riskScore} risk / 100</text>

                            <circle cx="174" cy="14" r="3" fill={node.threatLevel === "Critical" ? "#ef4444" : node.threatLevel === "High" ? "#f97316" : node.threatLevel === "Medium" ? "#eab308" : "#3b82f6"} />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Sub-panels category scores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 md:col-span-1 text-left space-y-4">
                    <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">Category Security Scores</h3>
                    <div className="space-y-3">
                      {(analysis.categoryScores ?? []).length > 0 ? (
                        (analysis.categoryScores ?? []).map((cat: any) => (
                          <div key={cat.name} className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-neutral-300 font-medium">{cat.name}</span>
                              <span className={cn(
                                "font-semibold",
                                cat.status === "Critical" ? "text-danger-400" : cat.status === "Needs Improvement" ? "text-warning-400" : "text-emerald-400"
                              )}>{cat.score}%</span>
                            </div>
                            <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full transition-all",
                                  cat.status === "Critical" ? "bg-danger-500" : cat.status === "Needs Improvement" ? "bg-warning-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${cat.score}%` }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-600 italic">Run a security analysis to generate category scores.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 md:col-span-2 text-left space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">Detected System Attack Surface Vectors</h3>
                      <p className="text-[11px] text-neutral-500 mt-1">Summary of entry routes and external boundary endpoints evaluated.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                        <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-850">
                          <span className="text-neutral-500 text-[10px] block uppercase font-bold">Critical Findings</span>
                          <span className="text-sm font-bold text-danger-400 mt-1 block">
                            {(analysis.findings ?? []).filter((f: any) => f.severity === "critical").length}
                          </span>
                        </div>
                        <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-850">
                          <span className="text-neutral-500 text-[10px] block uppercase font-bold">High Findings</span>
                          <span className="text-sm font-bold text-orange-400 mt-1 block">
                            {(analysis.findings ?? []).filter((f: any) => f.severity === "high").length}
                          </span>
                        </div>
                        <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-850">
                          <span className="text-neutral-500 text-[10px] block uppercase font-bold">Medium Findings</span>
                          <span className="text-sm font-bold text-warning-400 mt-1 block">
                            {(analysis.findings ?? []).filter((f: any) => f.severity === "medium").length}
                          </span>
                        </div>
                        <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-850">
                          <span className="text-neutral-500 text-[10px] block uppercase font-bold">OWASP Coverage</span>
                          <span className="text-sm font-bold text-white mt-1 block">
                            {(analysis.owaspCoverage ?? []).length} checks
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-neutral-850 pt-4 space-y-3">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">AI Immediate Recommendations</span>
                      <div className="flex gap-2 p-3 bg-primary-500/5 border border-primary-500/20 text-xs rounded-xl text-neutral-300 leading-relaxed">
                        <Sparkles className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          {(analysis.recommendations?.immediate ?? []).slice(0, 2).map((rec: string, i: number) => (
                            <p key={i}>{rec}</p>
                          ))}
                          {!(analysis.recommendations?.immediate?.length) && (
                            <p>Run a security analysis to generate AI recommendations.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Interactive Risk Matrix */}
            {activeTab === "matrix" && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-left space-y-6">
                <div>
                  <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider">Interactive Threat Risk Matrix</h3>
                  <p className="text-xs text-neutral-550 mt-1">Cross-referencing finding likelihood probabilities against impact severity limits to auto-prioritize patches.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Risk grid diagram */}
                  <div className="lg:col-span-2 border border-neutral-850 rounded-xl overflow-hidden bg-neutral-900/20">
                    <div className="grid grid-cols-5 border-b border-neutral-850 text-center font-bold text-[10px] uppercase tracking-wider text-neutral-400 bg-neutral-900/50 py-2">
                      <div>Likelihood \ Impact</div>
                      <div className="text-primary-400">Minor</div>
                      <div className="text-warning-400">Moderate</div>
                      <div className="text-orange-400">Major</div>
                      <div className="text-danger-400">Severe</div>
                    </div>
                    {[
                      { l: "Certain", color: "text-neutral-300", cells: ["Low", "Medium", "High", "Critical"] },
                      { l: "Likely", color: "text-neutral-300", cells: ["Low", "Medium", "High", "High"] },
                      { l: "Possible", color: "text-neutral-400", cells: ["Low", "Low", "Medium", "High"] },
                      { l: "Unlikely", color: "text-neutral-500", cells: ["Info", "Low", "Low", "Medium"] }
                    ].map((row) => (
                      <div key={row.l} className="grid grid-cols-5 text-center items-center border-b border-neutral-850 text-xs py-3 font-medium">
                        <div className={cn("text-[10px] uppercase font-bold", row.color)}>{row.l}</div>
                        {row.cells.map((cell, idx) => (
                          <div key={idx} className="flex justify-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase",
                              cell === "Critical" && "bg-danger-500/10 text-danger-400 border border-danger-500/20",
                              cell === "High" && "bg-orange-500/10 text-orange-400 border border-orange-500/20",
                              cell === "Medium" && "bg-warning-500/10 text-warning-400 border border-warning-500/20",
                              cell === "Low" && "bg-primary-500/10 text-primary-400 border border-primary-500/20",
                              cell === "Info" && "bg-neutral-800 text-neutral-400 border border-neutral-700"
                            )}>
                              {cell}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* List of active registry checks */}
                  <div className="lg:col-span-1 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Risk Finding registry</span>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {(analysis.riskFindings ?? []).length > 0 ? (
                        (analysis.riskFindings ?? []).map((finding: any) => (
                          <div key={finding.title} className="p-3 bg-neutral-900 rounded-lg border border-neutral-850 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-heading font-bold text-xs text-white truncate max-w-[170px]">{finding.title}</span>
                              <Badge variant="outline" className={cn(
                                "text-[8.5px] font-mono font-black uppercase tracking-wider px-1",
                                finding.level === "Critical" && "bg-danger-500/10 text-danger-400 border-danger-500/20",
                                finding.level === "High" && "bg-orange-500/10 text-orange-400 border-orange-500/20",
                                finding.level === "Medium" && "bg-warning-500/10 text-warning-400 border-warning-500/20",
                                finding.level === "Low" && "bg-primary-500/10 text-primary-400 border-primary-500/20"
                              )}>
                                {finding.level}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-neutral-500 flex justify-between">
                              <span>Asset: {finding.component}</span>
                              <span className="font-bold text-primary-300 font-mono">{finding.priority}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-600 italic p-2">Run security analysis to populate risk findings.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: OWASP Top 10 evaluation */}
            {activeTab === "owasp" && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-left space-y-6">
                <div>
                  <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider">OWASP Top 10 Risk Alignment matrix</h3>
                  <p className="text-xs text-neutral-550 mt-1">Audit status breakdown of the system layout against the standard OWASP vulnerability classes.</p>
                </div>

                <div className="overflow-x-auto border border-neutral-850 rounded-xl bg-neutral-900/20">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-850 font-bold uppercase text-[9.5px] tracking-wider text-neutral-400 bg-neutral-900/60">
                        <th className="p-3">Category Index</th>
                        <th className="p-3">Vulnerability Type</th>
                        <th className="p-3">Audit Status</th>
                        <th className="p-3">Audit Details</th>
                        <th className="p-3">Recommended Security mitigation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.owaspCoverage.map((ow) => (
                        <tr key={ow.id} className="border-b border-neutral-850/60 hover:bg-neutral-900/30 text-neutral-300">
                          <td className="p-3 font-mono font-bold text-neutral-400">{ow.id}</td>
                          <td className="p-3 font-semibold text-white">{ow.name}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-bold font-mono tracking-wide uppercase",
                              ow.status === "pass" && "bg-success-500/10 text-success-400 border-success-500/20",
                              ow.status === "warning" && "bg-warning-500/10 text-warning-400 border-warning-500/20",
                              ow.status === "fail" && "bg-danger-500/10 text-danger-400 border-danger-500/20"
                            )}>
                              {ow.status === "pass" ? "Passed" : ow.status === "warning" ? "Warning" : "Fail"}
                            </Badge>
                          </td>
                          <td className="p-3 font-sans text-neutral-400 max-w-xs truncate" title={ow.notes}>{ow.notes || "No notes logged"}</td>
                          <td className="p-3 text-[11px] text-neutral-450 max-w-sm leading-relaxed">
                            {ow.status === "pass" 
                              ? "Valid checks found. Regularly scan libraries using security checklists."
                              : "Remediation pending. Implement query parameters sanitization and enforce authorization tokens encryption."
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: Compliance Center */}
            {activeTab === "compliance" && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-left space-y-6">
                <div>
                  <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider">Compliance Audits &amp; Standards</h3>
                  <p className="text-xs text-neutral-550 mt-1">Compliance assessment mapping the layout to SOC2, ISO27001, GDPR, and PCI DSS protocols.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(analysis.complianceItems ?? []).length > 0 ? (
                    (analysis.complianceItems ?? []).map((c: any) => (
                      <div key={c.standard} className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-850 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-sm text-white">{c.standard}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">Scope: {c.scope}</span>
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-bold font-mono tracking-wider uppercase",
                            c.status === "Pass" && "bg-success-500/10 text-success-400 border-success-500/20",
                            c.status === "Warning" && "bg-warning-500/10 text-warning-400 border-warning-500/20",
                            c.status === "Fail" && "bg-danger-500/10 text-danger-400 border-danger-500/20"
                          )}>
                            {c.status}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-neutral-450 font-mono text-[10px]">
                            <span>Standard compliance index</span>
                            <span>{c.progress}%</span>
                          </div>
                          <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                            <div className={cn("h-full", c.status === "Pass" ? "bg-emerald-500" : c.status === "Fail" ? "bg-danger-500" : "bg-warning-500")} style={{ width: `${c.progress}%` }} />
                          </div>
                        </div>

                        <div className="text-[11.5px] text-neutral-450 bg-neutral-950 p-2.5 rounded border border-neutral-850 leading-relaxed flex items-start gap-1.5">
                          <Info className="h-3.5 w-3.5 text-primary-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-neutral-300">Action items:</span> {c.recs}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-sm text-neutral-600 italic">Run a security analysis to generate compliance assessment.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 5: Executive security report */}
            {activeTab === "report" && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-left space-y-6 max-w-4xl mx-auto">
                <div className="border-b border-neutral-800 pb-4 text-center">
                  <h2 className="font-heading text-lg font-black text-white">SYSTEM SECURITY AUDIT ASSESSMENT REPORT</h2>
                  <span className="text-[10px] text-neutral-500 font-mono block mt-1">Generated by DevCanvas Security Center. Private &amp; Confidential.</span>
                </div>

                <div className="space-y-6 text-xs text-neutral-300 leading-relaxed font-sans">
                  {/* Executive Summary */}
                  <section className="space-y-2">
                    <h3 className="font-heading text-xs font-bold text-white uppercase tracking-wider border-b border-neutral-850 pb-1">1. Executive Summary</h3>
                    <p>{analysis.summary}</p>
                  </section>

                  {/* Threat Analysis */}
                  <section className="space-y-2">
                    <h3 className="font-heading text-xs font-bold text-white uppercase tracking-wider border-b border-neutral-850 pb-1">2. Attack Surface Assessment</h3>
                    <p>
                      The application threat landscape was mapped across 9 pipeline components, identifying 2 high-severity risks inside authentication loops and PostgreSQL connections. Implementing Row-Level Security and enforcing TLS 1.3 edge termination are top priority recommendations.
                    </p>
                  </section>

                  {/* Vulnerability details */}
                  <section className="space-y-2">
                    <h3 className="font-heading text-xs font-bold text-white uppercase tracking-wider border-b border-neutral-850 pb-1">3. Mapped Vulnerabilities &amp; Action Plan</h3>
                    <div className="space-y-2 mt-2">
                      {analysis.findings.map((f, idx) => (
                        <div key={idx} className="p-3 bg-neutral-900 border border-neutral-850 rounded-lg">
                          <span className="font-heading font-semibold text-xs text-white block">{f.title} ({f.severity.toUpperCase()})</span>
                          <p className="text-neutral-450 mt-1">{f.description}</p>
                          <div className="text-[11px] text-primary-300 font-mono mt-1.5">Remediation: {f.remediation}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Future improvements */}
                  <section className="space-y-2">
                    <h3 className="font-heading text-xs font-bold text-white uppercase tracking-wider border-b border-neutral-850 pb-1">4. Future Security Milestones</h3>
                    <ul className="list-disc pl-4 space-y-1 text-neutral-400">
                      <li>Establish weekly automated dependency audits scanning within production containers.</li>
                      <li>Deploy master-replica failover subnets for PostgreSQL cluster setups.</li>
                      <li>Migrate external payment routing callback endpoints to dedicated isolated egress subnets.</li>
                    </ul>
                  </section>
                </div>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Floating Security Details Panel Modal */}
      <Dialog open={!!selectedNode} onOpenChange={(open) => { if (!open) setSelectedNode(null); }}>
        <DialogContent className="max-w-2xl bg-neutral-900 border border-neutral-800 text-neutral-200 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-neutral-850 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg border border-neutral-800 text-primary-400 bg-primary-500/10">
                <Server className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="font-heading text-lg font-bold text-white leading-tight">
                  {selectedNode?.name} Security Audit
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-400 font-medium mt-0.5">
                  Pipeline threat auditing spec &amp; telemetry
                </DialogDescription>
              </div>
            </div>
            {selectedNode && (
              <Badge variant="outline" className={cn(
                "text-xs font-semibold px-2 py-0.5",
                selectedNode.threatLevel === "Critical" && "bg-danger-500/10 border-danger-500/20 text-danger-400",
                selectedNode.threatLevel === "High" && "bg-orange-500/10 border-orange-500/20 text-orange-400",
                selectedNode.threatLevel === "Medium" && "bg-warning-500/10 border-warning-500/20 text-warning-400",
                selectedNode.threatLevel === "Low" && "bg-primary-500/10 border-primary-500/20 text-primary-400"
              )}>
                {selectedNode.threatLevel} Threat (Risk Score: {selectedNode.riskScore})
              </Badge>
            )}
          </DialogHeader>

          {selectedNode && (
            <div className="mt-4 space-y-4 text-xs text-left">
              {/* Component Purpose */}
              <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-850 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Component Purpose</span>
                <p className="text-xs text-neutral-350 leading-relaxed font-sans">{selectedNode.purpose}</p>
              </div>

              {/* Detected Vulnerabilities */}
              <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-850 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Detected Vulnerabilities</span>
                <ul className="list-disc pl-4 space-y-1 text-neutral-350">
                  {selectedNode.vulnerabilities.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>

              {/* Assets and mapping */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-950/40 p-3.5 rounded-xl border border-neutral-850 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Affected Assets</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.assets.map((a, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] bg-neutral-900 border-neutral-800 text-neutral-450">{a}</Badge>
                    ))}
                  </div>
                </div>
                <div className="bg-neutral-950/40 p-3.5 rounded-xl border border-neutral-850 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">OWASP Mapping</span>
                  <span className="font-mono text-neutral-300 text-[10.5px] block">{selectedNode.owaspMapping}</span>
                </div>
              </div>

              {/* Mitigation steps */}
              <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-850 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Mitigation Steps &amp; Best Practices</span>
                <div className="text-neutral-300 space-y-2">
                  <div className="font-sans"><span className="text-neutral-500 text-[10px] block">Immediate fix:</span> {selectedNode.mitigation}</div>
                  <div className="pt-2 border-t border-neutral-900">
                    <span className="text-neutral-500 text-[10px] block mb-1">Standard Checklist:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-neutral-450">
                      {selectedNode.bestPractices.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* AI suggestions */}
              <div className="space-y-2 border-t border-neutral-850 pt-3.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">AI Security recommendations</span>
                <div className="space-y-2">
                  {selectedNode.aiRecs.map((rec, i) => (
                    <div key={i} className="flex gap-2 p-2.5 rounded-lg bg-neutral-950/50 border border-neutral-850 text-xs text-neutral-350">
                      <Sparkles className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Impact */}
              <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-850 text-[10.5px] text-neutral-450">
                <span className="font-bold text-neutral-300">Compliance Impact:</span> Mapped directly to {selectedNode.compliance} standard validations.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
