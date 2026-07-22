import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Database,
  Globe,
  Zap,
  HardDrive,
  Layers,
  Cpu,
  Box,
  Cloud,
  type LucideIcon,
} from "lucide-react";
import type {
  Architecture,
  ArchitectureService,
  ServiceType,
} from "@/lib/types/architecture";
import { cn } from "@utils/index";

const typeConfig: Record<ServiceType, { icon: LucideIcon; color: string; bg: string }> = {
  api: { icon: Server, color: "text-primary-400", bg: "bg-primary-500/10" },
  worker: { icon: Cpu, color: "text-accent-400", bg: "bg-accent-500/10" },
  gateway: { icon: Globe, color: "text-secondary-400", bg: "bg-secondary-500/10" },
  database: { icon: Database, color: "text-success-400", bg: "bg-success-500/10" },
  cache: { icon: Zap, color: "text-warning-400", bg: "bg-warning-500/10" },
  queue: { icon: Layers, color: "text-accent-400", bg: "bg-accent-500/10" },
  storage: { icon: HardDrive, color: "text-neutral-400", bg: "bg-neutral-500/10" },
  client: { icon: Box, color: "text-primary-400", bg: "bg-primary-500/10" },
  external: { icon: Cloud, color: "text-neutral-400", bg: "bg-neutral-500/10" },
};

interface NodePosition {
  x: number;
  y: number;
}

function layoutNodes(services: ArchitectureService[]): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  const cols = Math.min(Math.ceil(Math.sqrt(services.length)), 4);
  const colWidth = 200;
  const rowHeight = 130;
  const startX = 80;
  const startY = 60;

  services.forEach((service, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions[service.id] = {
      x: startX + col * colWidth,
      y: startY + row * rowHeight,
    };
  });

  return positions;
}

export function ArchitectureDiagram({
  architecture,
  onSelectService,
}: {
  architecture: Architecture;
  onSelectService?: (service: ArchitectureService) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const positions = useRef(layoutNodes(architecture.services));

  const handleSelect = useCallback(
    (service: ArchitectureService) => {
      setSelected(service.id);
      onSelectService?.(service);
    },
    [onSelectService],
  );

  const maxCols = Math.min(Math.ceil(Math.sqrt(architecture.services.length)), 4);
  const rows = Math.ceil(architecture.services.length / maxCols);
  const svgWidth = Math.max(maxCols * 200 + 120, 400);
  const svgHeight = Math.max(rows * 130 + 120, 300);

  return (
    <div className="relative overflow-x-auto rounded-xl border border-border bg-surface-2">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ minHeight: svgHeight }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="var(--color-neutral-600)" />
          </marker>
          <marker
            id="arrowhead-active"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="var(--color-primary-400)" />
          </marker>
        </defs>

        {architecture.connections.map((conn, i) => {
          const from = positions.current[conn.from];
          const to = positions.current[conn.to];
          if (!from || !to) return null;
          const isActive =
            selected === conn.from ||
            selected === conn.to ||
            hovered === conn.from ||
            hovered === conn.to;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          return (
            <g key={i}>
              <line
                x1={from.x + 60}
                y1={from.y + 20}
                x2={to.x + 60}
                y2={to.y + 20}
                stroke={isActive ? "var(--color-primary-500)" : "var(--color-neutral-700)"}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={conn.type === "async" ? "5 3" : "none"}
                markerEnd={isActive ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                className="transition-all"
              />
              {isActive ? (
                <text
                  x={midX + 55}
                  y={midY + 15}
                  textAnchor="middle"
                  className="fill-primary-300 text-[9px] font-medium"
                >
                  {conn.label}
                </text>
              ) : null}
            </g>
          );
        })}

        {architecture.services.map((service, i) => {
          const pos = positions.current[service.id];
          if (!pos) return null;
          const config = typeConfig[service.type];
          const Icon = config.icon;
          const isSelected = selected === service.id;
          const isHovered = hovered === service.id;
          return (
            <motion.g
              key={service.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              onClick={() => handleSelect(service)}
              onMouseEnter={() => setHovered(service.id)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <rect
                x={pos.x}
                y={pos.y}
                width={120}
                height={40}
                rx={8}
                fill={isSelected || isHovered ? "var(--color-surface)" : "var(--color-neutral-800)"}
                stroke={isSelected ? "var(--color-primary-500)" : "var(--color-border)"}
                strokeWidth={isSelected ? 2 : 1}
                className="transition-all"
              />
              <foreignObject x={pos.x + 6} y={pos.y + 6} width={108} height={28}>
                <div className="flex h-full items-center gap-1.5">
                  <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded", config.bg)}>
                    <Icon className={cn("h-3 w-3", config.color)} />
                  </span>
                  <span className="truncate text-[10px] font-medium text-neutral-200">
                    {service.name}
                  </span>
                </div>
              </foreignObject>
            </motion.g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
        {Object.entries(typeConfig).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <div key={type} className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span className={cn("flex h-4 w-4 items-center justify-center rounded", config.bg)}>
                <Icon className={cn("h-2.5 w-2.5", config.color)} />
              </span>
              <span className="capitalize">{type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
