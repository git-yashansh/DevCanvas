import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  AlertCircle,
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
  Eye,
  X,
  CheckCircle2,
  FileText,
  FileCode,
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  Info,
  Minimize,
} from "lucide-react";
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@ui/index";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArchitectureDiagram } from "@/components/architecture/architecture-diagram";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useAIQueue } from "@/lib/ai-queue-context";
import { cn } from "@utils/index";
import { AILoader } from "@/components/dashboard/AILoader";
import type {
  Architecture,
  ArchitectureService,
  ArchitectureConnection,
  ServiceType,
} from "@/lib/types/architecture";

const EXAMPLE_PROMPTS = [
  "A multi-tenant SaaS platform with billing, RBAC, and real-time collaboration",
  "An e-commerce marketplace with search, payments, and inventory management",
  "A real-time chat application with presence and message history",
  "A data analytics pipeline processing streaming events with dashboards",
  "A social media app with feed, notifications, and content moderation",
];

const typeIcons: Record<ServiceType, any> = {
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
  api: "text-primary-400 bg-primary-500/10 border-primary-500/20",
  worker: "text-accent-400 bg-accent-500/10 border-accent-500/20",
  gateway: "text-secondary-400 bg-secondary-500/10 border-secondary-500/20",
  database: "text-success-400 bg-success-500/10 border-success-500/20",
  cache: "text-warning-400 bg-warning-500/10 border-warning-500/20",
  queue: "text-accent-400 bg-accent-500/10 border-accent-500/20",
  storage: "text-neutral-400 bg-neutral-500/10 border-neutral-500/20",
  client: "text-primary-400 bg-primary-500/10 border-primary-500/20",
  external: "text-neutral-400 bg-neutral-500/10 border-neutral-500/20",
};

function getServiceLayer(type: ServiceType): number {
  switch (type) {
    case "client":
    case "external":
      return 0;
    case "gateway":
      return 1;
    case "api":
      return 2;
    case "queue":
    case "worker":
      return 3;
    case "database":
    case "cache":
    case "storage":
      return 4;
    default:
      return 2;
  }
}

export function ArchitectureGeneratorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const aiQueue = useAIQueue();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [architecture, setArchitecture] = useState<Architecture | null>(null);
  const [selectedService, setSelectedService] = useState<ArchitectureService | null>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [activeRecommendationId, setActiveRecommendationId] = useState<number | null>(null);
  
  const projectId = searchParams.get("projectId");

  // Load project architecture if available
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

  const [finishedLoading, setFinishedLoading] = useState(false);

  // Generate system architecture via Edge Function
  async function handleGenerate(text?: string) {
    const input = (text ?? prompt).trim();
    if (!input || generating) return;

    setError(null);
    setGenerating(true);
    setFinishedLoading(false);
    setArchitecture(null);
    setSelectedService(null);
    if (text) setPrompt(text);

    try {
      const data = await aiQueue.enqueue('generate-architecture', input, { prompt: input });
      if (!data.architecture) throw new Error("No architecture returned.");

      setArchitecture(data.architecture as Architecture);
      setFinishedLoading(true);
      setGenerating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate architecture.");
      setGenerating(false);
    }
  }

  // Calculate architecture scores dynamically based on generated details
  const scores = useMemo(() => {
    if (!architecture) return null;
    
    // Derived scoring rules
    const hasGateway = architecture.services.some(s => s.type === "gateway");
    const hasCache = architecture.services.some(s => s.type === "cache");
    const hasQueue = architecture.services.some(s => s.type === "queue");
    const hasWorker = architecture.services.some(s => s.type === "worker");
    const isCostHigh = architecture.estimatedCost.monthly > 800;

    const archScore = 80 + (hasGateway ? 10 : 0) + (hasQueue ? 5 : 0);
    const securityScore = 75 + (architecture.considerations.security.length > 2 ? 15 : 5);
    const performanceScore = 70 + (hasCache ? 15 : 0) + (hasGateway ? 10 : 0);
    const scalabilityScore = 75 + (hasWorker ? 15 : 0) + (hasQueue ? 10 : 0);
    const maintainabilityScore = 85 - (architecture.services.length > 8 ? 10 : 0);
    const costEfficiencyScore = isCostHigh ? 72 : 92;

    const overallScore = Math.round(
      (archScore + securityScore + performanceScore + scalabilityScore + maintainabilityScore + costEfficiencyScore) / 6
    );

    return {
      overall: Math.min(overallScore, 99),
      architecture: Math.min(archScore, 99),
      security: Math.min(securityScore, 99),
      performance: Math.min(performanceScore, 99),
      scalability: Math.min(scalabilityScore, 99),
      maintainability: Math.min(maintainabilityScore, 99),
      costEfficiency: Math.min(costEfficiencyScore, 99),
    };
  }, [architecture]);

  // Derived metrics for selected service
  const inspectorMetrics = useMemo(() => {
    if (!architecture || !selectedService) return null;

    const isApi = selectedService.type === "api";
    const isGateway = selectedService.type === "gateway";
    const isDb = selectedService.type === "database";
    const isCache = selectedService.type === "cache";
    const isWorker = selectedService.type === "worker";
    const isQueue = selectedService.type === "queue";
    const isStorage = selectedService.type === "storage";
    const isClient = selectedService.type === "client";
    const isExternal = selectedService.type === "external";

    let purpose = "Provides system interface capabilities.";
    let rps = "N/A";
    let latency = "N/A";
    let cpu = "8% - 12%";
    let memory = "128MB / 256MB";
    let security = "A";
    let health = "Healthy (99.99% uptime)";
    let bottlenecks = "None identified";
    let future = "Continuous logs monitoring integrations";
    let scaling = "Standard scale policies";

    if (isGateway) {
      purpose = "Acts as the primary entry point to authenticate, rate-limit, and route incoming requests.";
      rps = "320 rps";
      latency = "4ms avg";
      cpu = "14% avg";
      memory = "256MB / 512MB";
      security = "A+";
      bottlenecks = "High network throughput limits";
      future = "Migrate routing logic to WebAssembly edge targets";
      scaling = "Scale horizontally based on concurrent TCP connection counts.";
    } else if (isApi) {
      purpose = "Executes business process computations and interfaces with databases/caches.";
      rps = "210 rps";
      latency = "18ms avg";
      cpu = "22% avg";
      memory = "512MB / 1GB";
      security = "A+";
      bottlenecks = "SQL join latency during query spikes";
      future = "Implement graphql schema queries support";
      scaling = "Configure target tracking auto-scaling on 70% CPU.";
    } else if (isDb) {
      purpose = "Manages transactional structures and stores relational user records.";
      rps = "450 queries/sec";
      latency = "2.2ms avg";
      cpu = "34% avg";
      memory = "4GB / 8GB";
      security = "A";
      bottlenecks = "I/O wait limits during bulk data imports";
      future = "Configure master-replica failover groups";
      scaling = "Scale vertically or introduce read replica pools.";
    } else if (isCache) {
      purpose = "Stores temporary cache payloads to accelerate key lookup routines.";
      rps = "850 ops/sec";
      latency = "0.8ms avg";
      cpu = "15% avg";
      memory = "2GB / 4GB";
      security = "A";
      bottlenecks = "Redis replication latency under extreme load";
      future = "Transition to cluster replication mode";
      scaling = "Configure memory eviction strategies (LRU).";
    } else if (isWorker) {
      purpose = "Executes queue-triggered calculations, content processing, and notifications.";
      rps = "45 messages/sec";
      latency = "125ms exec time";
      cpu = "42% avg";
      memory = "1GB / 2GB";
      security = "A-";
      bottlenecks = "Process execution thread waits";
      future = "Separate microservice queues for specialized processes";
      scaling = "Scale horizontally based on active messages in the queue.";
    } else if (isQueue) {
      purpose = "Buffers message traffic to isolate heavy transaction operations.";
      rps = "120 events/sec";
      latency = "1.5ms transit";
      cpu = "5% avg";
      memory = "256MB / 512MB";
      security = "A";
      bottlenecks = "Queue depth growth under slow worker speeds";
      future = "Integrate dead-letter-queues globally";
      scaling = "Scale message brokers based on load.";
    } else if (isStorage) {
      purpose = "Stores object files, images, downloads and static content.";
      rps = "85 rps";
      latency = "12ms avg";
      cpu = "N/A";
      memory = "N/A";
      security = "A+";
      bottlenecks = "Global egress speed thresholds";
      future = "Integrate CDN proxies on target storage domains";
      scaling = "Serverless elastic storage scaling.";
    }

    // Cost matching
    const costItem = architecture.estimatedCost.breakdown.find(
      c => c.service.toLowerCase().includes(selectedService.name.toLowerCase()) || 
           c.service.toLowerCase().includes(selectedService.type)
    );
    const cost = costItem ? costItem.cost : Math.round(architecture.estimatedCost.monthly * 0.15);

    // Incoming/Outgoing
    const incoming = architecture.connections
      .filter(c => c.to === selectedService.id)
      .map(c => architecture.services.find(s => s.id === c.from)?.name || c.from);
  
    const outgoing = architecture.connections
      .filter(c => c.from === selectedService.id)
      .map(c => architecture.services.find(s => s.id === c.to)?.name || c.to);

    // Connected DB / Cache / Queue
    const connectedDBs: string[] = [];
    const connectedCaches: string[] = [];
    const connectedQueues: string[] = [];

    architecture.connections.forEach(c => {
      if (c.from === selectedService.id || c.to === selectedService.id) {
        const otherId = c.from === selectedService.id ? c.to : c.from;
        const otherService = architecture.services.find(s => s.id === otherId);
        if (otherService) {
          if (otherService.type === "database") connectedDBs.push(otherService.name);
          else if (otherService.type === "cache") connectedCaches.push(otherService.name);
          else if (otherService.type === "queue") connectedQueues.push(otherService.name);
        }
      }
    });

    // AI recommendations for the individual service
    const recommendations: string[] = [];
    if (selectedService.type === "database") {
      recommendations.push("Implement read-replicas in secondary regions to reduce load.", "Run automated weekly vacuums and index rebuilding.");
    } else if (selectedService.type === "api") {
      recommendations.push("Introduce JWT token caching to avoid repeated auth DB lookups.", "Rate-limit client IPs to prevent DDoS issues.");
    } else if (selectedService.type === "cache") {
      recommendations.push("Set eviction policy to volatile-lru to keep active sessions.", "Enable cluster replication for high availability.");
    } else if (selectedService.type === "worker") {
      recommendations.push("Queue failed executions into an automated Dead-Letter Queue (DLQ).", "Scale container tasks based on CPU thresholds.");
    } else {
      recommendations.push("Optimize docker image layers to speed up deployments.", "Integrate with AWS CloudWatch or Datadog for active telemetry.");
    }

    return { purpose, rps, latency, cpu, memory, security, health, cost, incoming, outgoing, connectedDBs, connectedCaches, connectedQueues, recommendations, scaling, bottlenecks, future };
  }, [architecture, selectedService]);

  // Derived Cost Categories (Frontend, Backend, Database, Storage, Bandwidth)
  const costBreakdown = useMemo(() => {
    if (!architecture) return null;
    
    const monthlyTotal = architecture.estimatedCost.monthly;
    
    // Dynamically split into categories
    const dbCost = architecture.estimatedCost.breakdown
      .filter(c => c.service.toLowerCase().includes("db") || c.service.toLowerCase().includes("database") || c.service.toLowerCase().includes("cache") || c.service.toLowerCase().includes("redis") || c.service.toLowerCase().includes("postgres"))
      .reduce((sum, item) => sum + item.cost, 0);

    const gatewayCost = architecture.estimatedCost.breakdown
      .filter(c => c.service.toLowerCase().includes("gateway") || c.service.toLowerCase().includes("route53") || c.service.toLowerCase().includes("cdn"))
      .reduce((sum, item) => sum + item.cost, 0);

    const storageCost = architecture.estimatedCost.breakdown
      .filter(c => c.service.toLowerCase().includes("storage") || c.service.toLowerCase().includes("s3") || c.service.toLowerCase().includes("blob"))
      .reduce((sum, item) => sum + item.cost, 0);

    const dbFinal = dbCost > 0 ? dbCost : Math.round(monthlyTotal * 0.4);
    const storageFinal = storageCost > 0 ? storageCost : Math.round(monthlyTotal * 0.1);
    const gatewayFinal = gatewayCost > 0 ? gatewayCost : Math.round(monthlyTotal * 0.1);
    
    const frontendCost = Math.round(monthlyTotal * 0.1);
    const backendCost = monthlyTotal - (dbFinal + storageFinal + gatewayFinal + frontendCost);

    return {
      frontend: frontendCost,
      backend: Math.max(backendCost, 40),
      database: dbFinal,
      storage: storageFinal,
      bandwidth: gatewayFinal,
      monthlyTotal,
      yearlyTotal: monthlyTotal * 12,
    };
  }, [architecture]);

  // Handle saving to DB
  async function handleSave() {
    if (projectId && architecture) {
      await supabase
        .from("projects")
        .update({ architecture })
        .eq("id", projectId);
    }
  }

  // General helper for triggering local downloads
  const downloadBlob = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // EXPORT FORMAT TRIGGERS
  const handleExport = (format: string) => {
    if (!architecture) return;
    setIsExportDropdownOpen(false);

    switch (format) {
      case "json":
        downloadBlob(JSON.stringify(architecture, null, 2), "architecture.json", "application/json");
        break;
      case "yaml":
        const yamlStr = `---\nsummary: "${architecture.summary.replace(/"/g, '\\"')}"\nservices:\n` +
          architecture.services.map(s => `  - id: ${s.id}\n    name: "${s.name}"\n    type: ${s.type}\n    technology: "${s.technology}"\n    scaling: "${s.scaling}"`).join("\n") +
          `\nconnections:\n` +
          architecture.connections.map(c => `  - from: ${c.from}\n    to: ${c.to}\n    label: "${c.label}"\n    type: ${c.type}`).join("\n");
        downloadBlob(yamlStr, "architecture.yaml", "text/yaml");
        break;
      case "react-flow-json":
        const rfNodes = architecture.services.map((s, idx) => ({
          id: s.id,
          type: "serviceNode",
          position: { x: 50 + (idx % 3) * 260, y: 100 + Math.floor(idx / 3) * 110 },
          data: { name: s.name, type: s.type, technology: s.technology, scaling: s.scaling }
        }));
        const rfEdges = architecture.connections.map((c, i) => ({
          id: `edge-${c.from}-${c.to}-${i}`,
          source: c.from,
          target: c.to,
          type: "animatedEdge",
          label: c.label
        }));
        downloadBlob(JSON.stringify({ nodes: rfNodes, edges: rfEdges }, null, 2), "react-flow-architecture.json", "application/json");
        break;
      case "mermaid":
        let mermaidStr = "graph TD\n";
        architecture.services.forEach(s => {
          mermaidStr += `  ${s.id}["[${s.type.toUpperCase()}] ${s.name} (${s.technology})"]\n`;
        });
        architecture.connections.forEach(c => {
          mermaidStr += `  ${c.from} ${c.type === "async" ? "-.->" : "-->"} |"${c.label}"| ${c.to}\n`;
        });
        downloadBlob(mermaidStr, "architecture-mermaid.txt", "text/plain");
        break;
      case "plantuml":
        let plantStr = "@startuml\nskinparam backgroundColor #09090B\nskinparam ArrowColor #3b82f6\n";
        architecture.services.forEach(s => {
          plantStr += `[${s.name}] as ${s.id} <<${s.type}>>\n`;
        });
        architecture.connections.forEach(c => {
          plantStr += `${c.from} --> ${c.to} : ${c.label}\n`;
        });
        plantStr += "@enduml";
        downloadBlob(plantStr, "architecture-plantuml.txt", "text/plain");
        break;
      case "drawio-xml":
        let xmlStr = `<mxfile host="Electron" modified="${new Date().toISOString()}" agent="DevCanvas" version="1.0.0">\n  <diagram id="diagram_1" name="Architecture">\n    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">\n      <root>\n        <mxCell id="0" />\n        <mxCell id="1" parent="0" />\n`;
        architecture.services.forEach((s, idx) => {
          const x = 100 + (idx % 3) * 220;
          const y = 100 + Math.floor(idx / 3) * 150;
          xmlStr += `        <mxCell id="${s.id}" value="[${s.type.toUpperCase()}] ${s.name}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#111827;strokeColor=#374151;fontColor=#F3F4F6;" vertex="1" parent="1">\n          <mxGeometry x="${x}" y="${y}" width="140" height="60" as="geometry" />\n        </mxCell>\n`;
        });
        architecture.connections.forEach((c, idx) => {
          xmlStr += `        <mxCell id="edge_${idx}" value="${c.label}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#3B82F6;fontColor=#9CA3AF;" edge="1" parent="1" source="${c.from}" target="${c.to}">\n          <mxGeometry relative="1" as="geometry" />\n        </mxCell>\n`;
        });
        xmlStr += `      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>`;
        downloadBlob(xmlStr, "architecture-drawio.xml", "text/xml");
        break;
      case "markdown":
        const mdText = document.getElementById("pdf-report-content")?.innerText || "";
        downloadBlob(`# System Architecture Documentation\n\n${mdText}`, "architecture-docs.md", "text/markdown");
        break;
      case "pdf":
        // Trigger browser native print for the report
        const printContent = document.getElementById("pdf-report-content")?.innerHTML;
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(`
            <html>
              <head>
                <title>Architecture Specification Report - DevCanvas</title>
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
                  .highlight { font-weight: 600; color: #111827; }
                  .footer { margin-top: 60px; font-size: 10px; color: #9ca3af; text-align: center; border-t: 1px solid #e5e7eb; pt: 10px; }
                </style>
              </head>
              <body>
                ${printContent}
                <div class="footer">Generated by DevCanvas AI System Architecture Workspace. Private &amp; Confidential.</div>
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
      case "png":
        // Generate SVG and let it download as SVG to preserve quality
        handleExport("svg");
        break;
      case "svg":
        // Standalone SVG Diagram export
        let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1300 650" width="1300" height="650" style="background:#09090B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">\n`;
        svgStr += `  <defs>\n    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">\n      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1d1d20" stroke-width="0.8"/>\n    </pattern>\n  </defs>\n  <rect width="1300" height="650" fill="url(#grid)"/>\n`;

        // Position lookup
        const positions: Record<string, { x: number; y: number }> = {};
        const layerNodes: Record<number, ArchitectureService[]> = {};
        architecture.services.forEach((s) => {
          const l = getServiceLayer(s.type);
          if (!layerNodes[l]) layerNodes[l] = [];
          layerNodes[l].push(s);
        });

        Object.entries(layerNodes).forEach(([layerStr, nodes]) => {
          const layer = parseInt(layerStr);
          const x = 80 + layer * 260;
          const totalHeight = (nodes.length - 1) * 110;
          const startY = Math.max(60, (500 - totalHeight) / 2);

          nodes.forEach((node, index) => {
            positions[node.id] = { x, y: startY + index * 110 };
          });
        });

        // Draw connections
        architecture.connections.forEach(c => {
          const from = positions[c.from] || { x: 0, y: 0 };
          const to = positions[c.to] || { x: 0, y: 0 };
          svgStr += `  <path d="M ${from.x + 190} ${from.y + 37} C ${(from.x + 190 + to.x) / 2} ${from.y + 37}, ${(from.x + 190 + to.x) / 2} ${to.y + 37}, ${to.x} ${to.y + 37}" fill="none" stroke="#27272a" stroke-width="1.8" />\n`;
          svgStr += `  <rect x="${(from.x + 190 + to.x) / 2 - 40}" y="${(from.y + to.y) / 2 + 30}" width="80" height="15" rx="3" fill="#18181b" stroke="#27272a" stroke-width="0.5"/>\n`;
          svgStr += `  <text x="${(from.x + 190 + to.x) / 2}" y="${(from.y + to.y) / 2 + 41}" fill="#71717a" font-size="8" text-anchor="middle" font-weight="500">${c.label}</text>\n`;
        });

        // Draw nodes
        architecture.services.forEach(s => {
          const pos = positions[s.id] || { x: 0, y: 0 };
          svgStr += `  <g transform="translate(${pos.x}, ${pos.y})">\n`;
          svgStr += `    <rect width="190" height="75" rx="10" fill="#111827" stroke="#374151" stroke-width="1.2" />\n`;
          svgStr += `    <text x="15" y="32" fill="#ffffff" font-size="12" font-weight="600">${s.name}</text>\n`;
          svgStr += `    <text x="15" y="50" fill="#22d3ee" font-size="9" font-weight="700" letter-spacing="0.5">${s.type.toUpperCase()}</text>\n`;
          svgStr += `    <text x="15" y="65" fill="#52525b" font-size="8.5" font-family="monospace">${s.technology}</text>\n`;
          svgStr += `  </g>\n`;
        });

        svgStr += `</svg>`;
        downloadBlob(svgStr, "architecture-diagram.svg", "image/svg+xml");
        break;
      
      // SUB-REPORTS
      case "report-summary":
        downloadBlob(`# Executive Summary\n\n${architecture.summary}`, "executive-summary.md", "text/markdown");
        break;
      case "report-infrastructure":
        const infraRep = `# Infrastructure Specification Report\n\n` +
          `Generated specs for generated system architecture:\n\n` +
          architecture.services.map(s => `## ${s.name} (${s.type.toUpperCase()})\n* **Technology**: ${s.technology}\n* **Scaling Strategy**: ${s.scaling}\n* **Recommended Spec**: Virtual Instance size - 2 vCPU, 4GB Memory, auto-scaled.`).join("\n\n");
        downloadBlob(infraRep, "infrastructure-report.md", "text/markdown");
        break;
      case "report-cost":
        const costRep = `# Infrastructure Cost Spec Report\n\n` +
          `Estimated Monthly Cost: $${costBreakdown?.monthlyTotal}.00\n` +
          `Estimated Yearly Cost: $${costBreakdown?.yearlyTotal}.00\n\n` +
          `## Budget Allocations:\n` +
          `* Frontend deployment: $${costBreakdown?.frontend}.00/mo\n` +
          `* Backend compute: $${costBreakdown?.backend}.00/mo\n` +
          `* Databases & Caches: $${costBreakdown?.database}.00/mo\n` +
          `* Object storage storage: $${costBreakdown?.storage}.00/mo\n` +
          `* Network Bandwidth / CDNs: $${costBreakdown?.bandwidth}.00/mo`;
        downloadBlob(costRep, "infrastructure-cost-report.md", "text/markdown");
        break;
      case "report-ai":
        const aiRep = `# AI Engineering Architecture Recommendations\n\n` +
          `Tailored actionable suggestions for the system:\n\n` +
          architecture.considerations.scaling.map(s => `* [SCALING] ${s}`).join("\n") + "\n" +
          architecture.considerations.reliability.map(r => `* [RELIABILITY] ${r}`).join("\n");
        downloadBlob(aiRep, "ai-recommendations.md", "text/markdown");
        break;
      case "report-security":
        const secRep = `# System Security Target Report\n\n` +
          `Active checklists and specifications:\n\n` +
          architecture.considerations.security.map(sec => `* ${sec} - Solution: Set up TLS/SSL endpoints and enable database row-level isolation policies.`).join("\n");
        downloadBlob(secRep, "security-report.md", "text/markdown");
        break;
      default:
        break;
    }
  };

  return (
    <div className="w-full px-5 py-6 lg:px-8">
      {/* Page Header */}
      <PageHeader
        title="Architecture Generator"
        description="Describe your application and get a complete system architecture with services, data flows, and cost estimates."
        actions={
          architecture ? (
            <div className="flex gap-2 relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPresentationMode(true)}
                className="flex items-center gap-1.5"
              >
                <Eye className="h-4 w-4" />
                Presentation Mode
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
                    <button onClick={() => handleExport("pdf")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">PDF Specification Report</button>
                    <button onClick={() => handleExport("png")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">PNG Image (via SVG)</button>
                    <button onClick={() => handleExport("svg")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">SVG Vector Diagram</button>
                    <button onClick={() => handleExport("markdown")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Markdown Documentation</button>
                    <button onClick={() => handleExport("yaml")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">YAML Specs</button>
                    <button onClick={() => handleExport("json")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Raw Architecture JSON</button>
                    <button onClick={() => handleExport("react-flow-json")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">React Flow Schema JSON</button>
                    
                    <span className="px-2 py-1 mt-1 text-[9px] font-bold uppercase tracking-wider text-neutral-600">Design Tools</span>
                    <button onClick={() => handleExport("mermaid")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Mermaid Code Block</button>
                    <button onClick={() => handleExport("plantuml")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">PlantUML Syntax</button>
                    <button onClick={() => handleExport("drawio-xml")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Draw.io XML</button>
                    
                    <span className="px-2 py-1 mt-1 text-[9px] font-bold uppercase tracking-wider text-neutral-600">Engineering Reports</span>
                    <button onClick={() => handleExport("report-summary")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Executive Summary</button>
                    <button onClick={() => handleExport("report-infrastructure")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Infrastructure Spec Report</button>
                    <button onClick={() => handleExport("report-cost")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Budget Allocation Report</button>
                    <button onClick={() => handleExport("report-ai")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">AI Recommendations</button>
                    <button onClick={() => handleExport("report-security")} className="rounded px-2.5 py-1.5 text-left hover:bg-neutral-800 hover:text-white">Security Checklist</button>
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
        <div className="bg-gradient-to-b from-[#0a142c] via-[#121319] to-[#121319] border border-blue-900/35 rounded-2xl p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
              <span className="text-base font-bold text-white">
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
                {generating ? "Generating..." : "Generate architecture"}
              </Button>
            </div>
          </div>

          {!architecture && !generating ? (
            <div className="mt-6">
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

      {/* Main Workspace Panels */}
      <AnimatePresence mode="wait">
        {generating && !finishedLoading ? (
          <div className="mt-8 py-12 bg-transparent border-none">
            <AILoader isFinished={false} />
          </div>
        ) : architecture ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-8"
          >
            {/* 1. Engineering Score Dashboard */}
            {scores && (
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                <div className="col-span-2 md:col-span-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400">Engineering Score</span>
                  <span className="text-3xl font-heading font-black text-white mt-1.5">{scores.overall}%</span>
                  <div className="w-full bg-neutral-850 h-1.5 rounded-full overflow-hidden mt-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${scores.overall}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-primary-500"
                    />
                  </div>
                </div>
                {[
                  { name: "Architecture", val: scores.architecture, color: "bg-indigo-500" },
                  { name: "Security", val: scores.security, color: "bg-emerald-500" },
                  { name: "Performance", val: scores.performance, color: "bg-amber-500" },
                  { name: "Scalability", val: scores.scalability, color: "bg-cyan-500" },
                  { name: "Maintainability", val: scores.maintainability, color: "bg-purple-500" },
                  { name: "Cost Efficiency", val: scores.costEfficiency, color: "bg-pink-500" },
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

            {/* 2. React Flow Centerpiece (Full Width Canvas Workspace) */}
            <div className="w-full">
              <ArchitectureDiagram
                architecture={architecture}
                onSelectService={setSelectedService}
              />
            </div>

            {/* 3. Infrastructure Cost Estimation section */}
            {costBreakdown && (
              <div className="space-y-3">
                <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  Monthly Infrastructure Cost Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                  {[
                    { name: "Frontend", val: costBreakdown.frontend, desc: "Hosting & CDN Edge" },
                    { name: "Backend Compute", val: costBreakdown.backend, desc: "API Gateways & VMs" },
                    { name: "Database & Cache", val: costBreakdown.database, desc: "Relational & Redis" },
                    { name: "Object Storage", val: costBreakdown.storage, desc: "Files & Assets Buckets" },
                    { name: "Bandwidth & DNS", val: costBreakdown.bandwidth, desc: "Egress & DNS Routings" },
                  ].map((cost, i) => (
                    <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-neutral-400 truncate block">{cost.name}</span>
                        <span className="text-neutral-600 text-[9px] mt-0.5 block">{cost.desc}</span>
                      </div>
                      <span className="text-xl font-heading font-black text-neutral-100 mt-4">${cost.val} <span className="text-[10px] text-neutral-500 font-normal">/mo</span></span>
                    </div>
                  ))}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col justify-between col-span-2 md:col-span-1 border-primary-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400">Monthly Total</span>
                      <span className="text-neutral-500 text-[9px] mt-0.5 block">Sum allocations</span>
                    </div>
                    <span className="text-xl font-heading font-black text-primary-400 mt-4">${costBreakdown.monthlyTotal} <span className="text-[10px] text-neutral-500 font-normal">/mo</span></span>
                  </div>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col justify-between col-span-2 md:col-span-1 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Yearly Estimate</span>
                      <span className="text-neutral-500 text-[9px] mt-0.5 block">Estimated annual cost</span>
                    </div>
                    <span className="text-xl font-heading font-black text-emerald-400 mt-4">${costBreakdown.yearlyTotal} <span className="text-[10px] text-neutral-500 font-normal">/yr</span></span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. AI Insights panel */}
            <div className="gradient-border rounded-xl">
              <div className="glass-strong rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-primary-400" />
                    <h3 className="font-heading text-sm font-semibold text-neutral-100">AI Structural Architecture Insights</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-primary-500/5 text-primary-400 border-primary-500/20">
                    Optimized for: Scale &amp; Performance
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      id: 1,
                      title: "Introduce Redis Cache Cluster",
                      desc: "Introduce Redis clusters as the cache tier for critical read targets to minimize query workloads on the primary PostgreSQL database.",
                      impact: "Drastic latency reductions (P99 from 240ms down to 18ms)",
                      severity: "high",
                    },
                    {
                      id: 2,
                      title: "Add Global CDN (Cloudflare / AWS CloudFront)",
                      desc: "Enable asset and static payload cache routing on edge networks. Greatly reduces traffic load on web hosting nodes.",
                      impact: "90% bandwidth savings and faster page boot loads",
                      severity: "medium",
                    },
                    {
                      id: 3,
                      title: "Separate Media Microservice with Object Storage",
                      desc: "Delegate image uploads and large asset compression routines to an independent serverless Worker or media microservice.",
                      impact: "Prevents node thread bottlenecks during uploads",
                      severity: "high",
                    },
                    {
                      id: 4,
                      title: "Integrate Horizontal Auto-Scaling Policy",
                      desc: "Configure target triggers on VM memory or CPU loads. Scales instances from 1 instance up to 5 during transaction spikes.",
                      impact: "99.99% system availability target compliance",
                      severity: "critical",
                    },
                  ].map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => setActiveRecommendationId(activeRecommendationId === rec.id ? null : rec.id)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2",
                        activeRecommendationId === rec.id
                          ? "border-primary-500 bg-neutral-900/60 shadow-[0_0_12px_rgba(59,130,246,0.1)]"
                          : "border-neutral-850 bg-neutral-900/20 hover:border-neutral-800"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={cn("h-4 w-4 shrink-0", activeRecommendationId === rec.id ? "text-primary-400" : "text-neutral-600")} />
                          <h4 className="text-xs font-semibold text-neutral-200 font-heading">{rec.title}</h4>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold uppercase",
                            rec.severity === "critical"
                              ? "bg-danger-500/10 text-danger-400 border-danger-500/20"
                              : rec.severity === "high"
                              ? "bg-warning-500/10 text-warning-400 border-warning-500/20"
                              : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          )}
                        >
                          {rec.severity}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-neutral-400 leading-relaxed">{rec.desc}</p>
                      
                      {activeRecommendationId === rec.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pt-2 border-t border-neutral-850 text-[10px] text-neutral-300 space-y-1.5"
                        >
                          <div className="flex justify-between">
                            <span className="text-neutral-500">System Impact</span>
                            <span className="text-emerald-400 font-semibold">{rec.impact}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Implementation Difficulty</span>
                            <span className="text-neutral-200">Easy (Infrastructure as Code)</span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Detailed Engineering Report below layout (HTML container for PDF exports) */}
            <div id="pdf-report-content" className="rounded-xl border border-neutral-850 bg-neutral-900/20 p-6 space-y-6 text-left text-neutral-300 max-w-4xl mx-auto">
              <div className="border-b border-neutral-850 pb-5">
                <h1 className="font-heading text-xl font-bold text-neutral-100">System Architecture Specification Report</h1>
                <p className="text-xs text-neutral-500 mt-1">Generated dynamically on {new Date().toLocaleDateString()} | Target Platform: AWS/GCP Container Clusters</p>
              </div>

              {/* Summary */}
              <section className="space-y-2">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">1. Executive Summary</h2>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">{architecture.summary}</p>
              </section>

              {/* Component breakdown */}
              <section className="space-y-2">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">2. Service &amp; Component Breakdown</h2>
                <div className="overflow-x-auto rounded-lg border border-neutral-850">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-850 bg-neutral-900/60 text-neutral-300">
                        <th className="px-4 py-2 font-semibold">Service Name</th>
                        <th className="px-4 py-2 font-semibold">Type</th>
                        <th className="px-4 py-2 font-semibold">Technology</th>
                        <th className="px-4 py-2 font-semibold">Scaling Strategy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-850 text-neutral-400">
                      {architecture.services.map((s, idx) => (
                        <tr key={idx} className="hover:bg-neutral-900/10">
                          <td className="px-4 py-3 font-semibold text-neutral-200">{s.name}</td>
                          <td className="px-4 py-3 capitalize">{s.type}</td>
                          <td className="px-4 py-3 font-mono text-[10px]">{s.technology}</td>
                          <td className="px-4 py-3 capitalize">{s.scaling}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Data Flow */}
              <section className="space-y-2.5">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">3. System Data Flow</h2>
                <p className="text-xs text-neutral-400">Following step sequences describe crucial data routing cycles inside the generated workspace:</p>
                {architecture.dataFlows.map((flow, index) => (
                  <div key={index} className="p-3 bg-neutral-900/40 rounded-lg border border-neutral-850 space-y-1.5">
                    <h4 className="text-xs font-semibold text-neutral-200">{flow.name}</h4>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
                      {flow.steps.map((step, sIndex) => (
                        <div key={sIndex} className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-neutral-850 text-neutral-300 font-medium font-mono">{step}</span>
                          {sIndex < flow.steps.length - 1 && <ChevronRight className="h-3 w-3 text-neutral-600" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>

              {/* Considerations scaling/security/reliability */}
              <section className="space-y-3">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">4. Architectural Strategy &amp; Risks</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 p-3 bg-neutral-900/20 border border-neutral-850 rounded-lg">
                    <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                      Scalability Target
                    </h3>
                    <ul className="list-disc pl-4 text-[11px] text-neutral-400 space-y-1">
                      {architecture.considerations.scaling.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 p-3 bg-neutral-900/20 border border-neutral-850 rounded-lg">
                    <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-emerald-400" />
                      Security Strategy
                    </h3>
                    <ul className="list-disc pl-4 text-[11px] text-neutral-400 space-y-1">
                      {architecture.considerations.security.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 p-3 bg-neutral-900/20 border border-neutral-850 rounded-lg">
                    <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      Reliability Targets
                    </h3>
                    <ul className="list-disc pl-4 text-[11px] text-neutral-400 space-y-1">
                      {architecture.considerations.reliability.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Best Practices */}
              <section className="space-y-2 text-xs">
                <h2 className="font-heading text-sm font-semibold text-neutral-100 uppercase tracking-wider text-primary-400">5. Best Practices &amp; Risk Review</h2>
                <div className="space-y-1.5 text-neutral-400">
                  <p><strong>Database Bottleneck Risk:</strong> Multi-join transactions across container nodes can trigger query timeouts. Enable connection pooling (e.g. pgBouncer) immediately.</p>
                  <p><strong>Secrets Security:</strong> Hardcoding auth keys, database configurations or private certificates in images is forbidden. Inject all sensitive values dynamically using secure key vaults (HashiCorp Vault / AWS Secrets Manager).</p>
                  <p><strong>Deployment Isolation:</strong> Target production containers should be placed in independent Virtual Private Clouds (VPCs) with strict ingress whitelist configuration rules.</p>
                </div>
              </section>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* 6. Presentation Mode Modal */}
      {isPresentationMode && scores && architecture && costBreakdown && (
        <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col p-6 animate-fade-in text-left">
          {/* Top panel controls */}
          <div className="flex items-center justify-between border-b border-neutral-850 pb-4 mb-4">
            <div>
              <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">Presentation Mode</span>
              <h2 className="font-heading text-lg font-bold text-white leading-tight">Interactive Architecture Canvas</h2>
            </div>
            <button
              onClick={() => setIsPresentationMode(false)}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Minimize className="h-4 w-4" />
              Exit Presentation
            </button>
          </div>

          {/* Presentation Mode body */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
            {/* The canvas takes 75% width */}
            <div className="lg:col-span-3 h-full">
              <ArchitectureDiagram
                architecture={architecture}
                onSelectService={setSelectedService}
              />
            </div>

            {/* Quick Metrics sidebar takes 25% */}
            <div className="lg:col-span-1 flex flex-col gap-5 overflow-y-auto pr-2">
              {/* Overall Score */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400 block">Overall Engineering Score</span>
                <span className="text-4xl font-heading font-black text-white mt-1 block">{scores.overall}%</span>
                <p className="text-[10px] text-neutral-500 mt-2">Optimal system design rating</p>
              </div>

              {/* Cost Card */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">Budget Allocations</span>
                <div className="space-y-1.5 mt-3 text-xs text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Monthly Cost</span>
                    <span className="font-bold text-white">${costBreakdown.monthlyTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Yearly Total</span>
                    <span className="font-bold text-emerald-400">${costBreakdown.yearlyTotal}</span>
                  </div>
                </div>
              </div>

              {/* Selected service details if available */}
              {selectedService && inspectorMetrics ? (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg border", typeColors[selectedService.type])}>
                      {(() => {
                        const SvgIcon = typeIcons[selectedService.type] || Server;
                        return <SvgIcon className="h-4 w-4" />;
                      })()}
                    </div>
                    <h4 className="text-xs font-bold text-white">{selectedService.name}</h4>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">{selectedService.description}</p>
                  <div className="space-y-1 text-[10px] text-neutral-400 border-t border-neutral-850 pt-2">
                    <div className="flex justify-between">
                      <span>Stack</span>
                      <span className="text-neutral-200">{selectedService.technology}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scaling</span>
                      <span className="text-neutral-200 capitalize">{selectedService.scaling}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>P99 Latency</span>
                      <span className="text-neutral-200">{inspectorMetrics.latency}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-neutral-800 p-4 text-center text-xs text-neutral-500">
                  Click on diagram services during presentation to inspect specifications.
                </div>
              )}

              {/* Key recommendations */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4 space-y-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">Critical Action Items</span>
                <div className="space-y-2">
                  {architecture.considerations.scaling.slice(0, 2).map((rec, i) => (
                    <div key={i} className="flex gap-2 text-[10px] text-neutral-300">
                      <Sparkles className="h-3 w-3 text-primary-400 shrink-0 mt-0.5" />
                      <p>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Details Specifications Modal */}
      <Dialog open={!!selectedService} onOpenChange={(open) => { if (!open) setSelectedService(null); }}>
        <DialogContent className="max-w-4xl bg-[#0B0C0E]/95 backdrop-blur-xl border border-white/10 text-neutral-200 max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 lg:p-7">
          <DialogHeader className="border-b border-white/10 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              {selectedService && (
                <div className={cn("p-2 rounded-lg border", typeColors[selectedService.type])}>
                  {(() => {
                    const SvgIcon = typeIcons[selectedService.type] || Server;
                    return <SvgIcon className="h-5 w-5" />;
                  })()}
                </div>
              )}
              <div className="text-left">
                <DialogTitle className="font-heading text-lg font-bold text-white leading-tight">
                  {selectedService?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-400 font-medium capitalize mt-0.5">
                  {selectedService?.type} Component Specifications
                </DialogDescription>
              </div>
            </div>
            {selectedService && inspectorMetrics && (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {inspectorMetrics.health}
              </Badge>
            )}
          </DialogHeader>

          {selectedService && inspectorMetrics && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px] text-left">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Purpose */}
                <div className="bg-[#121319] p-4 rounded-xl border border-white/10 space-y-1.5">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400">Component Purpose</span>
                  <p className="text-[13px] text-neutral-300 leading-relaxed font-sans">{inspectorMetrics.purpose}</p>
                </div>

                {/* Grid of Specifications */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Est. Traffic", val: inspectorMetrics.rps, icon: Globe },
                    { label: "P99 Latency", val: inspectorMetrics.latency, icon: Zap },
                    { label: "CPU Usage", val: inspectorMetrics.cpu, icon: Cpu },
                    { label: "Memory Usage", val: inspectorMetrics.memory, icon: HardDrive },
                    { label: "Security Rating", val: inspectorMetrics.security, icon: Shield },
                    { label: "Monthly Cost", val: `$${inspectorMetrics.cost}/mo`, icon: DollarSign },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-[#121319] p-3 rounded-lg border border-white/10 flex flex-col justify-between">
                      <span className="text-[11px] text-neutral-450 block">{item.label}</span>
                      <span className="text-[13px] text-neutral-200 font-semibold mt-1.5 flex items-center gap-1.5">
                        <item.icon className="h-4 w-4 text-primary-400 shrink-0" />
                        {item.val}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dependencies and Connections */}
                <div className="bg-[#121319] p-4 rounded-xl border border-white/10 space-y-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 block">Connection Topology</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-neutral-450 block mb-1.5">Incoming Handlers</span>
                      {inspectorMetrics.incoming.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {inspectorMetrics.incoming.map((n, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-neutral-900 border-neutral-800">{n}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-[11px] italic block">No active incoming routes</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-450 block mb-1.5">Outgoing Downstreams</span>
                      {inspectorMetrics.outgoing.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {inspectorMetrics.outgoing.map((n, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-neutral-900 border-neutral-800">{n}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-[11px] italic block">No downstream requests</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Connected storage systems (DB, Cache, Queues) */}
                <div className="bg-[#121319] p-4 rounded-xl border border-white/10 space-y-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 block">Target Storage Connections</span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[11px] text-neutral-450 block mb-1.5">Databases</span>
                      {inspectorMetrics.connectedDBs.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {inspectorMetrics.connectedDBs.map((n, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-400 border-emerald-500/20">{n}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-[11px] italic block">No databases</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-450 block mb-1.5">Caches</span>
                      {inspectorMetrics.connectedCaches.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {inspectorMetrics.connectedCaches.map((n, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-amber-500/5 text-amber-400 border-amber-500/20">{n}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-[11px] italic block">No caches</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-450 block mb-1.5">Queues</span>
                      {inspectorMetrics.connectedQueues.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {inspectorMetrics.connectedQueues.map((n, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-cyan-500/5 text-cyan-400 border-cyan-500/20">{n}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-[11px] italic block">No queues</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scaling, Bottlenecks, and Improvements */}
                <div className="bg-[#121319] p-4 rounded-xl border border-white/10 space-y-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 block">Engineering Optimization Strategy</span>
                  <div className="space-y-2.5 text-[13px]">
                    <div>
                      <span className="text-neutral-400 font-semibold block mb-0.5">Technology Stack Specification</span>
                      <p className="text-neutral-300 font-mono text-[12px]">{selectedService.technology} ({selectedService.scaling} scaling)</p>
                    </div>
                    <div>
                      <span className="text-neutral-400 font-semibold block mb-0.5">Scaling Suggestion</span>
                      <p className="text-neutral-300 font-sans leading-relaxed">{inspectorMetrics.scaling}</p>
                    </div>
                    <div>
                      <span className="text-neutral-400 font-semibold block mb-0.5">Potential Bottlenecks</span>
                      <p className="text-neutral-300 font-sans leading-relaxed">{inspectorMetrics.bottlenecks}</p>
                    </div>
                    <div>
                      <span className="text-neutral-400 font-semibold block mb-0.5">Future Improvements</span>
                      <p className="text-neutral-300 font-sans leading-relaxed">{inspectorMetrics.future}</p>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="bg-[#121319] p-4 rounded-xl border border-white/10 space-y-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 block">AI Architecture Directives</span>
                  <div className="space-y-2">
                    {inspectorMetrics.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-2 p-2 rounded bg-neutral-950/40 border border-neutral-850 text-neutral-300 text-[12px]">
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
