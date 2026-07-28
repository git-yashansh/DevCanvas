import { useState, useMemo } from "react";
import { Network, Sparkles, Filter, Layers, Database, Code2, ShieldCheck, Rocket } from "lucide-react";
import { Badge } from "@ui/index";
import type { Project } from "@types-pkg/index";
import { cn } from "@utils/index";

interface GraphNode {
  id: string;
  name: string;
  category: "service" | "table" | "endpoint" | "security" | "deployment";
  relatedIds: string[];
  details: string;
}

export function ProjectKnowledgeGraphTab({ project }: { project: Project }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Synthesize relationship graph from actual project artifacts
  const nodes = useMemo(() => {
    const graphNodes: GraphNode[] = [];
    const archServices = project.architecture?.services || [];
    const dbTables = project.database_schema?.tables || [];
    const apiEndpoints = project.api_spec?.endpoints || [];

    // Fallback default nodes if artifacts aren't generated yet
    if (!archServices.length && !dbTables.length && !apiEndpoints.length) {
      return [
        { id: "svc-user", name: "User Service", category: "service", relatedIds: ["tbl-users", "ep-users", "sec-jwt", "dep-docker"], details: "Authentication & User Profile Management" },
        { id: "svc-order", name: "Order Service", category: "service", relatedIds: ["tbl-orders", "ep-orders", "dep-docker"], details: "Order Processing & Workflow Engine" },
        { id: "tbl-users", name: "users (DB)", category: "table", relatedIds: ["svc-user", "ep-users"], details: "PostgreSQL table storing credentials & user records" },
        { id: "tbl-orders", name: "orders (DB)", category: "table", relatedIds: ["svc-order", "ep-orders"], details: "PostgreSQL table storing order transactions" },
        { id: "ep-users", name: "/api/v1/users", category: "endpoint", relatedIds: ["svc-user", "tbl-users", "sec-jwt"], details: "REST endpoint for user profile CRUD" },
        { id: "ep-orders", name: "/api/v1/orders", category: "endpoint", relatedIds: ["svc-order", "tbl-orders"], details: "REST endpoint for order submission" },
        { id: "sec-jwt", name: "JWT Auth Policy", category: "security", relatedIds: ["svc-user", "ep-users"], details: "Bearer token signature validation" },
        { id: "dep-docker", name: "App Container", category: "deployment", relatedIds: ["svc-user", "svc-order"], details: "Docker Compose container definition" },
      ] as GraphNode[];
    }

    // Dynamic generation from actual loaded project artifacts
    archServices.forEach((svc: any) => {
      const svcId = `svc-${svc.name?.toLowerCase().replace(/\s+/g, "-")}`;
      graphNodes.push({
        id: svcId,
        name: `${svc.name || "Service"}`,
        category: "service",
        relatedIds: [],
        details: svc.description || "Microservice architecture node",
      });
    });

    dbTables.forEach((tbl: any) => {
      const tblId = `tbl-${tbl.name?.toLowerCase()}`;
      const relatedSvcs = graphNodes.filter(n => n.category === "service" && tbl.name.toLowerCase().includes(n.name.toLowerCase().replace(/service|app/g, "").trim())).map(n => n.id);
      graphNodes.push({
        id: tblId,
        name: `${tbl.name} (DB)`,
        category: "table",
        relatedIds: relatedSvcs,
        details: `PostgreSQL table with ${(tbl.columns || []).length} columns`,
      });

      // Link back
      relatedSvcs.forEach(svcId => {
        const sNode = graphNodes.find(n => n.id === svcId);
        if (sNode && !sNode.relatedIds.includes(tblId)) sNode.relatedIds.push(tblId);
      });
    });

    apiEndpoints.forEach((ep: any) => {
      const epId = `ep-${ep.path?.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      const matchedTable = graphNodes.find(n => n.category === "table" && ep.path?.toLowerCase().includes(n.name.replace(" (DB)", "")));
      const related = matchedTable ? [matchedTable.id] : [];
      graphNodes.push({
        id: epId,
        name: `${ep.method || "GET"} ${ep.path || "/api"}`,
        category: "endpoint",
        relatedIds: related,
        details: ep.summary || "REST OpenAPI endpoint route",
      });

      if (matchedTable && !matchedTable.relatedIds.includes(epId)) {
        matchedTable.relatedIds.push(epId);
      }
    });

    return graphNodes;
  }, [project]);

  const activeNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, nodes]);

  const highlightedNodeIds = useMemo(() => {
    if (!activeNode) return new Set<string>();
    const set = new Set<string>([activeNode.id, ...activeNode.relatedIds]);
    // Bidirectional links
    nodes.forEach((n) => {
      if (n.relatedIds.includes(activeNode.id)) set.add(n.id);
    });
    return set;
  }, [activeNode, nodes]);

  const categoryColors = {
    service: { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400", activeBg: "bg-indigo-500/20" },
    table: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", activeBg: "bg-violet-500/20" },
    endpoint: { bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400", activeBg: "bg-sky-500/20" },
    security: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", activeBg: "bg-emerald-500/20" },
    deployment: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", activeBg: "bg-orange-500/20" },
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-indigo-400" />
              <h2 className="font-heading text-lg font-bold text-white">AI Project Knowledge Graph</h2>
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10">
                Signature Feature
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
              Interactive relationship map linking Services ↔ Database Tables ↔ API Routes ↔ Security Policies ↔ Deployment Containers. Click any node to highlight upstream &amp; downstream dependencies.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
              <Layers className="h-3.5 w-3.5" /> Services
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-violet-500/10 text-violet-400 font-bold border border-violet-500/20">
              <Database className="h-3.5 w-3.5" /> Tables
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20">
              <Code2 className="h-3.5 w-3.5" /> Endpoints
            </span>
          </div>
        </div>
      </div>

      {/* Graph Visualizer Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border border-white/10 rounded-2xl bg-neutral-950 p-6 min-h-[500px]">
        {/* Nodes Canvas */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Entity Nodes ({nodes.length})
            </span>
            <span className="text-[11px] text-neutral-500">Click node to inspect connections</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {nodes.map((node) => {
              const colors = categoryColors[node.category];
              const isSelected = selectedNodeId === node.id;
              const isHighlighted = highlightedNodeIds.has(node.id);

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                  className={cn(
                    "group cursor-pointer rounded-xl border p-4 transition-all duration-200 space-y-2 select-none",
                    isSelected ? "border-primary-500 bg-primary-500/20 shadow-lg" :
                    isHighlighted ? "border-indigo-400/80 bg-indigo-500/10 scale-[1.02]" :
                    selectedNodeId ? "opacity-30 border-white/5 bg-neutral-900/40" :
                    `${colors.border} ${colors.bg} hover:border-white/20 hover:bg-white/[0.04]`
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-bold truncate", colors.text)}>
                      {node.name}
                    </span>
                    <Badge variant="outline" className="text-[8px] uppercase tracking-wider scale-90">
                      {node.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate">{node.details}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Inspector Sidebar */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-6 space-y-4">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">
            Node Relationship Inspector
          </h3>

          {activeNode ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/10 bg-neutral-900 space-y-2">
                <span className="text-xs font-bold text-white block">{activeNode.name}</span>
                <p className="text-xs text-neutral-400 leading-relaxed">{activeNode.details}</p>
                <Badge variant="outline" className="text-[9px] uppercase">{activeNode.category}</Badge>
              </div>

              <div className="space-y-2">
                <span className="text-[10.5px] font-bold uppercase text-neutral-400 block">
                  Connected Entities ({activeNode.relatedIds.length}):
                </span>
                {activeNode.relatedIds.length > 0 ? (
                  activeNode.relatedIds.map((relId) => {
                    const relNode = nodes.find((n) => n.id === relId);
                    if (!relNode) return null;
                    return (
                      <div key={relId} className="p-2.5 rounded-lg border border-white/5 bg-neutral-900/60 text-xs text-neutral-200 flex justify-between items-center">
                        <span className="truncate">{relNode.name}</span>
                        <Badge variant="outline" className="text-[8px] uppercase">{relNode.category}</Badge>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-neutral-500 italic">No direct connections mapped for this node.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-2">
              <Network className="h-8 w-8 text-neutral-700 mx-auto" />
              <p className="text-xs text-neutral-500">Select any node in the knowledge graph to view its upstream and downstream linkages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
