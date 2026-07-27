import { useState, useMemo, useCallback, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Panel,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";

import { Maximize, Minimize, RefreshCw } from "lucide-react";
import type {
  Architecture,
  ArchitectureService,
  ArchitectureConnection,
  ServiceType,
} from "@/lib/types/architecture";
import { CustomServiceNode } from "./custom-service-node";
import { AnimatedConnectionEdge } from "./animated-connection-edge";

// Custom node and edge type registrations
const nodeTypes = {
  serviceNode: CustomServiceNode,
};

const edgeTypes = {
  animatedEdge: AnimatedConnectionEdge,
};

// Layout tiers for services to organize them in a clean flow left-to-right
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

function layoutNodes(services: ArchitectureService[]): Record<string, { x: number; y: number }> {
  const layerNodes: Record<number, ArchitectureService[]> = {};
  services.forEach((s) => {
    const l = getServiceLayer(s.type);
    if (!layerNodes[l]) layerNodes[l] = [];
    layerNodes[l].push(s);
  });

  const positions: Record<string, { x: number; y: number }> = {};
  const layerWidth = 260;
  const rowHeight = 110;

  Object.entries(layerNodes).forEach(([layerStr, nodes]) => {
    const layer = parseInt(layerStr);
    const x = 50 + layer * layerWidth;
    const totalHeight = (nodes.length - 1) * rowHeight;
    const startY = Math.max(50, (650 - totalHeight) / 2); // Center around y=325

    nodes.forEach((node, index) => {
      positions[node.id] = {
        x,
        y: startY + index * rowHeight,
      };
    });
  });

  return positions;
}

function ArchitectureDiagramInner({
  architecture,
  onSelectService,
  onDoubleClickService,
}: {
  architecture: Architecture;
  onSelectService?: (service: ArchitectureService) => void;
  onDoubleClickService?: (service: ArchitectureService) => void;
}) {
  const { fitView, setCenter } = useReactFlow();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const nodePositions = useMemo(() => layoutNodes(architecture.services), [architecture.services]);

  // Trace the complete dependency chain (transitive closure) on hover
  const activeChain = useMemo(() => {
    if (!hoveredNodeId) return null;
    const chain = new Set<string>([hoveredNodeId]);

    // Tracing downstream (outgoing)
    const queue = [hoveredNodeId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      architecture.connections.forEach((conn) => {
        if (conn.from === curr && !chain.has(conn.to)) {
          chain.add(conn.to);
          queue.push(conn.to);
        }
      });
    }

    // Tracing upstream (incoming)
    const upQueue = [hoveredNodeId];
    while (upQueue.length > 0) {
      const curr = upQueue.shift()!;
      architecture.connections.forEach((conn) => {
        if (conn.to === curr && !chain.has(conn.from)) {
          chain.add(conn.from);
          upQueue.push(conn.from);
        }
      });
    }

    return chain;
  }, [hoveredNodeId, architecture.connections]);

  // Trace the direct connection chain for clicked nodes (highlight related, databases, caches, queues)
  const selectedChain = useMemo(() => {
    if (!selectedNodeId) return null;
    const chain = new Set<string>([selectedNodeId]);

    // 1-hop direct neighbors
    architecture.connections.forEach((conn) => {
      if (conn.from === selectedNodeId) {
        chain.add(conn.to);
      }
      if (conn.to === selectedNodeId) {
        chain.add(conn.from);
      }
    });

    // Deep trace only connected databases, queues, or caches
    const queue = [selectedNodeId];
    const visited = new Set<string>([selectedNodeId]);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      architecture.connections.forEach((conn) => {
        if (conn.from === curr && !visited.has(conn.to)) {
          visited.add(conn.to);
          queue.push(conn.to);

          const target = architecture.services.find((s) => s.id === conn.to);
          if (target && (target.type === "database" || target.type === "queue" || target.type === "cache")) {
            chain.add(conn.to);
          }
        }
      });
    }

    return chain;
  }, [selectedNodeId, architecture.connections, architecture.services]);

  // Construct React Flow Nodes
  const nodes = useMemo(() => {
    return architecture.services.map((s) => {
      const isHovered = hoveredNodeId === s.id;
      const isSelected = selectedNodeId === s.id;

      let isHighlighted = false;
      let isFaded = false;

      if (activeChain) {
        isHighlighted = activeChain.has(s.id);
        isFaded = !isHighlighted;
      } else if (selectedChain) {
        isHighlighted = selectedChain.has(s.id);
        isFaded = !isHighlighted;
      }

      return {
        id: s.id,
        type: "serviceNode",
        position: nodePositions[s.id] || { x: 0, y: 0 },
        data: {
          name: s.name,
          type: s.type,
          technology: s.technology,
          scaling: s.scaling,
          description: s.description,
          isHovered,
          isHighlighted,
          isFaded,
        },
        selected: isSelected,
      };
    });
  }, [architecture.services, nodePositions, hoveredNodeId, selectedNodeId, activeChain, selectedChain]);

  // Construct React Flow Edges
  const edges = useMemo(() => {
    return architecture.connections.map((c, i) => {
      let pColor = "blue";
      const toService = architecture.services.find((s) => s.id === c.to);
      const fromService = architecture.services.find((s) => s.id === c.from);

      if (toService?.type === "database" || toService?.type === "storage" || toService?.type === "cache") {
        pColor = "green";
      } else if (toService?.type === "queue" || fromService?.type === "queue") {
        pColor = "orange";
      }

      let isHighlighted = false;
      let isFaded = false;

      if (activeChain) {
        isHighlighted = activeChain.has(c.from) && activeChain.has(c.to);
        isFaded = !isHighlighted;
      } else if (selectedChain) {
        isHighlighted = selectedChain.has(c.from) && selectedChain.has(c.to);
        isFaded = !isHighlighted;
      }

      return {
        id: `edge-${c.from}-${c.to}-${i}`,
        source: c.from,
        target: c.to,
        type: "animatedEdge",
        label: c.label,
        data: {
          type: c.type,
          particleColor: pColor,
          isHighlighted,
          isFaded,
        },
        labelStyle: { fill: "var(--color-neutral-400)", fontSize: 9, fontWeight: 500 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: "#18181b", color: "#a1a1aa", opacity: 0.8 },
      };
    });
  }, [architecture.connections, architecture.services, activeChain, selectedChain]);

  const handleResetZoom = useCallback(() => {
    fitView({ padding: 0.15, duration: 600 });
  }, [fitView]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id);
      
      // Smoothly focus/zoom the camera onto the clicked node (centering it)
      setCenter(node.position.x + 95, node.position.y + 37, {
        zoom: 1.15,
        duration: 650,
      });

      // Open the details modal/inspector AFTER the camera transition completes
      setTimeout(() => {
        const service = architecture.services.find((s) => s.id === node.id);
        if (service) {
          onSelectService?.(service);
        }
      }, 680);
    },
    [architecture.services, onSelectService, setCenter]
  );

  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      // Zoom closer into the double clicked service node
      setCenter(node.position.x + 95, node.position.y + 37, {
        zoom: 1.45,
        duration: 600,
      });
    },
    [setCenter]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const onNodeMouseEnter = useCallback((_event: React.MouseEvent, node: any) => {
    setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // Center fitView when the canvas loads
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.15, duration: 600 });
    }, 150);
    return () => clearTimeout(timer);
  }, [architecture, fitView]);

  return (
    <div className="relative h-[750px] w-full rounded-xl border border-neutral-850 bg-neutral-950 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        minZoom={0.5}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.95 }}
        fitViewOptions={{ padding: 0.15 }}
      >
        <Background variant={BackgroundVariant.Lines} color="#27272a" gap={16} size={1} />
        <Controls showInteractive={false} className="!bg-neutral-900 border !border-neutral-800 rounded-lg overflow-hidden fill-neutral-400" />
        <MiniMap
          className="!bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden hidden md:block"
          nodeColor="#27272a"
          maskColor="rgba(0,0,0,0.5)"
        />
        <Panel position="top-right" className="flex gap-2">
          <button
            onClick={handleResetZoom}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Fit View
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function ArchitectureDiagram({
  architecture,
  onSelectService,
  onDoubleClickService,
}: {
  architecture: Architecture;
  onSelectService?: (service: ArchitectureService) => void;
  onDoubleClickService?: (service: ArchitectureService) => void;
}) {
  return (
    <ReactFlowProvider>
      <ArchitectureDiagramInner
        architecture={architecture}
        onSelectService={onSelectService}
        onDoubleClickService={onDoubleClickService}
      />
    </ReactFlowProvider>
  );
}
