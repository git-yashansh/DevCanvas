import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { KeyRound, Link2, Search } from "lucide-react";
import { cn } from "@utils/index";

export const CustomTableNode = memo(({ data, selected }: NodeProps) => {
  const { name, columns, fkColumns = [], indexedColumns = [], isHighlighted, isFaded, isHovered } = data;

  return (
    <div
      className={cn(
        "w-[220px] rounded-xl border bg-neutral-900 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition-all duration-300 text-left",
        "border-neutral-800",
        isHovered && "border-primary-500/50 shadow-[0_0_12px_rgba(59,130,246,0.25)] scale-102 z-10",
        isHighlighted && "border-primary-500/80 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-neutral-900",
        selected && "border-primary-500 ring-2 ring-primary-500/20 bg-neutral-950 scale-102",
        isFaded && "opacity-20 scale-95 saturate-50 blur-[0.2px] hover:opacity-100 hover:scale-100 hover:saturate-100 hover:blur-none"
      )}
    >
      {/* Handles for ER connections */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: selected ? "var(--color-primary-500)" : "var(--color-neutral-600)",
          border: "2px solid var(--color-background)",
          width: "8px",
          height: "8px",
        }}
      />
      
      {/* Table Header */}
      <div className={cn("px-3.5 py-2.5 border-b border-neutral-850 flex items-center justify-between", selected ? "bg-primary-500/10" : "bg-neutral-950/80")}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0" />
          <span className="truncate text-xs font-bold text-neutral-100 font-mono tracking-tight">{name}</span>
        </div>
        <span className="text-[9px] font-mono text-neutral-500 px-1 py-0.2 rounded bg-neutral-850">TBL</span>
      </div>

      {/* Columns List */}
      <div className="py-2.5 space-y-0.5 max-h-[220px] overflow-y-auto">
        {columns.map((col: any) => {
          const isPK = col.primaryKey;
          const isFK = fkColumns.includes(col.name);
          const isIndexed = indexedColumns.includes(col.name);
          const isUnique = col.unique;

          return (
            <div key={col.name} className="flex h-6 items-center gap-1.5 px-3.5 hover:bg-neutral-850/50">
              {/* PK / FK / Unique Icons */}
              {isPK ? (
                <KeyRound className="h-3 w-3 shrink-0 text-warning-400" />
              ) : isFK ? (
                <Link2 className="h-3 w-3 shrink-0 text-primary-400" />
              ) : isUnique ? (
                <Link2 className="h-3 w-3 shrink-0 text-accent-400 opacity-60" />
              ) : (
                <span className="w-3 shrink-0" />
              )}

              {/* Column Name */}
              <span className={cn("truncate text-[10.5px] font-mono", isPK ? "font-semibold text-neutral-100" : "text-neutral-300")}>
                {col.name}
              </span>

              {/* Data Type */}
              <span className="ml-auto text-[9.5px] text-neutral-500 font-mono font-medium truncate max-w-[80px]">
                {col.type}
              </span>

              {/* Constraints/Nullable Badge */}
              <div className="flex gap-0.5 shrink-0 pl-1">
                {isIndexed && (
                  <Search className="h-2.5 w-2.5 text-success-400 shrink-0" />
                )}
                {col.nullable ? (
                  <span className="text-[9px] text-neutral-600 font-bold" title="Nullable">?</span>
                ) : (
                  <span className="text-[9px] text-neutral-700 font-bold" title="NOT NULL">*</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: selected ? "var(--color-primary-500)" : "var(--color-neutral-600)",
          border: "2px solid var(--color-background)",
          width: "8px",
          height: "8px",
        }}
      />
    </div>
  );
});

CustomTableNode.displayName = "CustomTableNode";
