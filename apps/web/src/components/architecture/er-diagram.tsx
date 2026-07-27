import { useState, useMemo, useCallback, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  MiniMap,
  Background,
  useReactFlow,
  Panel,
  BackgroundVariant,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import { RefreshCw } from "lucide-react";
import type {
  DatabaseSchema,
  SchemaTable,
} from "@/lib/types/database-schema";
import { CustomTableNode } from "./custom-table-node";
import { RelationConnectionEdge } from "./relation-connection-edge";

const nodeTypes = {
  tableNode: CustomTableNode,
};

const edgeTypes = {
  relationEdge: RelationConnectionEdge,
};

function layoutTables(tables: SchemaTable[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const cols = Math.min(Math.ceil(Math.sqrt(tables.length)), 3);
  const colSpacing = 320;
  const rowSpacing = 240;

  tables.forEach((table, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions[table.id] = {
      x: 50 + col * colSpacing,
      y: 50 + row * rowSpacing,
    };
  });

  return positions;
}

function ERDiagramInner({
  schema,
  onSelectTable,
  breadcrumb = [],
  onBreadcrumbChange,
}: {
  schema: DatabaseSchema;
  onSelectTable?: (table: SchemaTable) => void;
  breadcrumb?: string[];
  onBreadcrumbChange?: (path: string[]) => void;
}) {
  const { fitView, setCenter } = useReactFlow();
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);

  const tablePositions = useMemo(() => layoutTables(schema.tables), [schema.tables]);

  // Active table is the last item in the relationship breadcrumbs path
  const activeTableId = useMemo(() => {
    return breadcrumb[breadcrumb.length - 1] || null;
  }, [breadcrumb]);

  // Find neighbors of a table node
  const getNeighbors = useCallback((tableId: string) => {
    const neighbors = new Set<string>();
    schema.relations.forEach(r => {
      if (r.from === tableId) neighbors.add(r.to);
      if (r.to === tableId) neighbors.add(r.from);
    });
    return neighbors;
  }, [schema.relations]);

  const activeNeighbors = useMemo(() => {
    if (activeTableId) {
      return getNeighbors(activeTableId);
    }
    if (hoveredTableId) {
      return getNeighbors(hoveredTableId);
    }
    return null;
  }, [activeTableId, hoveredTableId, getNeighbors]);

  // Construct React Flow Nodes
  const nodes = useMemo(() => {
    return schema.tables.map((table) => {
      const isSelected = activeTableId === table.id;
      const isHovered = hoveredTableId === table.id;
      
      let isHighlighted = false;
      let isFaded = false;

      const activeFocusId = activeTableId || hoveredTableId;
      if (activeFocusId) {
        if (table.id === activeFocusId) {
          isHighlighted = true;
        } else if (activeNeighbors?.has(table.id)) {
          isHighlighted = true;
        } else {
          isFaded = true;
        }
      }

      // Foreign key column names in this table
      const fkColumns = schema.relations
        .filter(r => r.from === table.id)
        .map(r => r.fromColumn);

      // Indexed columns in this table
      const indexedColumns = schema.indexes
        .filter(idx => idx.table === table.name)
        .flatMap(idx => idx.columns);

      return {
        id: table.id,
        type: "tableNode",
        position: tablePositions[table.id] || { x: 0, y: 0 },
        data: {
          name: table.name,
          columns: table.columns,
          fkColumns,
          indexedColumns,
          isHovered,
          isHighlighted,
          isFaded,
        },
        selected: isSelected,
      };
    });
  }, [schema.tables, schema.relations, schema.indexes, tablePositions, activeTableId, hoveredTableId, activeNeighbors]);

  // Construct React Flow Edges
  const edges = useMemo(() => {
    return schema.relations.map((rel, i) => {
      const activeFocusId = activeTableId || hoveredTableId;
      let isHighlighted = false;
      let isFaded = false;

      if (activeFocusId) {
        // Highlight edge only if it directly connects to the active/hovered node
        isHighlighted = rel.from === activeFocusId || rel.to === activeFocusId;
        isFaded = !isHighlighted;
      }

      return {
        id: `relation-${rel.from}-${rel.to}-${i}`,
        source: rel.from,
        target: rel.to,
        type: "relationEdge",
        label: rel.type === "many-to-many" ? "M:M" : rel.type === "one-to-many" ? "1:N" : "1:1",
        data: {
          isHighlighted,
          isFaded,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: isHighlighted
            ? "var(--color-primary-500)"
            : isFaded
            ? "rgba(63, 63, 70, 0.15)"
            : "var(--color-neutral-700)",
        },
        labelStyle: { fill: "var(--color-neutral-500)", fontSize: 8, fontWeight: 500 },
        labelBgPadding: [3, 1] as [number, number],
        labelBgBorderRadius: 3,
        labelBgStyle: { fill: "#18181b", color: "#a1a1aa", opacity: 0.8 },
      };
    });
  }, [schema.relations, activeTableId, hoveredTableId]);

  const handleResetZoom = useCallback(() => {
    fitView({ padding: 0.15, duration: 600 });
  }, [fitView]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      // 1. Center camera smoothly
      setCenter(node.position.x + 110, node.position.y + 100, {
        zoom: 1.1,
        duration: 650,
      });

      // Update relationship explorer path
      if (onBreadcrumbChange) {
        const index = breadcrumb.indexOf(node.id);
        if (index !== -1) {
          // Clicked a table already in breadcrumb, truncate path to it
          onBreadcrumbChange(breadcrumb.slice(0, index + 1));
        } else {
          // If breadcrumb is empty, start path.
          // If not empty, check if it's connected to current active table
          if (breadcrumb.length > 0) {
            const activeId = breadcrumb[breadcrumb.length - 1];
            const neighbors = getNeighbors(activeId);
            if (neighbors.has(node.id)) {
              onBreadcrumbChange([...breadcrumb, node.id]);
            } else {
              onBreadcrumbChange([node.id]);
            }
          } else {
            onBreadcrumbChange([node.id]);
          }
        }
      }

      // 2. Open specs modal after transition completes
      setTimeout(() => {
        const table = schema.tables.find((t) => t.id === node.id);
        if (table) {
          onSelectTable?.(table);
        }
      }, 680);
    },
    [schema.tables, breadcrumb, onBreadcrumbChange, onSelectTable, setCenter, getNeighbors]
  );

  const onPaneClick = useCallback(() => {
    // Clear path focus on empty pane click
    if (onBreadcrumbChange) {
      onBreadcrumbChange([]);
    }
  }, [onBreadcrumbChange]);

  const onNodeMouseEnter = useCallback((_event: React.MouseEvent, node: any) => {
    setHoveredTableId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredTableId(null);
  }, []);

  // Autofit on load
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.15, duration: 600 });
    }, 150);
    return () => clearTimeout(timer);
  }, [schema, fitView]);

  return (
    <div className="relative h-[750px] w-full rounded-xl border border-neutral-850 bg-neutral-950 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        minZoom={0.4}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
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

export function ERDiagram({
  schema,
  onSelectTable,
  breadcrumb = [],
  onBreadcrumbChange,
}: {
  schema: DatabaseSchema;
  onSelectTable?: (table: SchemaTable) => void;
  breadcrumb?: string[];
  onBreadcrumbChange?: (path: string[]) => void;
}) {
  return (
    <ReactFlowProvider>
      <ERDiagramInner
        schema={schema}
        onSelectTable={onSelectTable}
        breadcrumb={breadcrumb}
        onBreadcrumbChange={onBreadcrumbChange}
      />
    </ReactFlowProvider>
  );
}
