import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  Server,
  Database,
  Globe,
  Zap,
  Layers,
  HardDrive,
  Cpu,
  Box,
  Cloud,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@utils/index";
import type { ServiceType } from "@/lib/types/architecture";

const typeConfig: Record<ServiceType, { icon: LucideIcon; color: string; bg: string; border: string }> = {
  api: { icon: Server, color: "text-primary-400", bg: "bg-primary-500/10", border: "border-primary-500/20" },
  worker: { icon: Cpu, color: "text-accent-400", bg: "bg-accent-500/10", border: "border-accent-500/20" },
  gateway: { icon: Globe, color: "text-secondary-400", bg: "bg-secondary-500/10", border: "border-secondary-500/20" },
  database: { icon: Database, color: "text-success-400", bg: "bg-success-500/10", border: "border-success-500/20" },
  cache: { icon: Zap, color: "text-warning-400", bg: "bg-warning-500/10", border: "border-warning-500/20" },
  queue: { icon: Layers, color: "text-accent-400", bg: "bg-accent-500/10", border: "border-accent-500/20" },
  storage: { icon: HardDrive, color: "text-neutral-400", bg: "bg-neutral-500/10", border: "border-neutral-500/20" },
  client: { icon: Box, color: "text-primary-400", bg: "bg-primary-500/10", border: "border-primary-500/20" },
  external: { icon: Cloud, color: "text-neutral-400", bg: "bg-neutral-500/10", border: "border-neutral-500/20" },
};

export const CustomServiceNode = memo(({ data, selected }: NodeProps) => {
  const { name, type, technology, isHighlighted, isFaded, isHovered } = data;
  const config = typeConfig[type as ServiceType] || typeConfig.api;
  const Icon = config.icon;

  const isCache = type === "cache";

  return (
    <div
      className={cn(
        "relative w-[190px] rounded-xl border bg-neutral-900 px-3.5 py-3 transition-all duration-300 text-left",
        // Base borders and shadows
        "border-neutral-800 shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
        // Pulsing for Cache nodes
        isCache && "animate-[pulse-slow_4s_ease-in-out_infinite]",
        // Hover glow
        isHovered && "border-primary-500/50 shadow-[0_0_12px_rgba(59,130,246,0.25)] scale-102 z-10",
        // Active dependency chain highlight
        isHighlighted && "border-primary-500/80 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-neutral-900",
        // Selected glow
        selected && "border-primary-500 ring-2 ring-primary-500/20 bg-neutral-950 scale-102",
        // Faded state for unrelated nodes
        isFaded && "opacity-35 scale-95 saturate-50 blur-[0.2px] hover:opacity-100 hover:scale-100 hover:saturate-100 hover:blur-none"
      )}
    >
      {/* Handles */}
      {type !== "client" && type !== "external" && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            background: selected ? "var(--color-primary-500)" : "var(--color-neutral-600)",
            border: "2px solid var(--color-background)",
            width: "8px",
            height: "8px",
          }}
          className="transition-colors duration-200"
        />
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                config.bg,
                config.border
              )}
            >
              <Icon className="h-4.5 w-4.5 text-neutral-100" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-neutral-100 leading-tight">
                {name}
              </p>
              <p className="text-[10px] text-neutral-500 font-medium capitalize mt-0.5">
                {type}
              </p>
            </div>
          </div>

          {/* Healthy pulse dot */}
          <div className="flex h-3 w-3 items-center justify-center shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/40 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {/* Technical stack information */}
        <div className="mt-1 border-t border-neutral-800/60 pt-1.5 flex items-center justify-between">
          <span className="truncate text-[10px] text-neutral-400 font-mono font-medium">
            {technology}
          </span>
          <span className="text-[9px] rounded bg-neutral-800 px-1 py-0.2 font-mono text-neutral-500 shrink-0">
            v1.0
          </span>
        </div>
      </div>

      {type !== "database" && type !== "cache" && type !== "storage" && type !== "external" && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            background: selected ? "var(--color-primary-500)" : "var(--color-neutral-600)",
            border: "2px solid var(--color-background)",
            width: "8px",
            height: "8px",
          }}
          className="transition-colors duration-200"
        />
      )}
    </div>
  );
});

CustomServiceNode.displayName = "CustomServiceNode";
