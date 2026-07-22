import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { KeyRound, Link2 } from "lucide-react";
import type {
  DatabaseSchema,
  SchemaTable,
} from "@/lib/types/database-schema";
import { cn } from "@utils/index";

interface TablePosition {
  x: number;
  y: number;
}

const TABLE_WIDTH = 200;
const HEADER_HEIGHT = 32;
const ROW_HEIGHT = 20;
const TABLE_PADDING = 4;

function tableHeight(table: SchemaTable): number {
  return HEADER_HEIGHT + table.columns.length * ROW_HEIGHT + TABLE_PADDING * 2;
}

function layoutTables(tables: SchemaTable[]): Record<string, TablePosition> {
  const positions: Record<string, TablePosition> = {};
  const cols = Math.min(Math.ceil(Math.sqrt(tables.length)), 3);
  const colSpacing = TABLE_WIDTH + 80;
  const rowSpacing = 160;
  const startX = 40;
  const startY = 40;

  let maxRowHeight = 0;

  tables.forEach((table, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions[table.id] = {
      x: startX + col * colSpacing,
      y: startY + row * rowSpacing + (col % 2 === 1 ? 30 : 0),
    };
    maxRowHeight = Math.max(maxRowHeight, tableHeight(table));
  });

  return positions;
}

export function ERDiagram({
  schema,
  onSelectTable,
}: {
  schema: DatabaseSchema;
  onSelectTable?: (table: SchemaTable) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const positions = useRef(layoutTables(schema.tables));

  const handleSelect = (table: SchemaTable) => {
    setSelected(table.id);
    onSelectTable?.(table);
  };

  const maxCols = Math.min(Math.ceil(Math.sqrt(schema.tables.length)), 3);
  const rows = Math.ceil(schema.tables.length / maxCols);
  const svgWidth = Math.max(maxCols * 280 + 80, 400);
  const svgHeight = Math.max(rows * 160 + 120, 300);

  return (
    <div className="relative overflow-x-auto rounded-xl border border-border bg-surface-2">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ minHeight: svgHeight }}
      >
        <defs>
          <marker
            id="er-arrow"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="var(--color-neutral-600)" />
          </marker>
          <marker
            id="er-arrow-active"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="var(--color-primary-400)" />
          </marker>
        </defs>

        {schema.relations.map((rel, i) => {
          const from = positions.current[rel.from];
          const to = positions.current[rel.to];
          if (!from || !to) return null;
          const isActive =
            selected === rel.from ||
            selected === rel.to ||
            hovered === rel.from ||
            hovered === rel.to;
          const fromTable = schema.tables.find((t) => t.id === rel.from);
          const colIndex = fromTable?.columns.findIndex((c) => c.name === rel.fromColumn) ?? 0;
          const fromY = from.y + HEADER_HEIGHT + TABLE_PADDING + colIndex * ROW_HEIGHT + 10;
          const toY = to.y + HEADER_HEIGHT + TABLE_PADDING + 10;
          return (
            <g key={i}>
              <path
                d={`M ${from.x} ${fromY} C ${from.x - 30} ${fromY}, ${to.x + TABLE_WIDTH + 30} ${toY}, ${to.x + TABLE_WIDTH} ${toY}`}
                fill="none"
                stroke={isActive ? "var(--color-primary-500)" : "var(--color-neutral-700)"}
                strokeWidth={isActive ? 2 : 1}
                markerEnd={isActive ? "url(#er-arrow-active)" : "url(#er-arrow)"}
                className="transition-all"
              />
              {isActive ? (
                <g>
                  <rect
                    x={(from.x + to.x + TABLE_WIDTH) / 2 - 40}
                    y={(fromY + toY) / 2 - 8}
                    width={80}
                    height={16}
                    rx={4}
                    fill="var(--color-surface)"
                    stroke="var(--color-primary-500/30)"
                  />
                  <text
                    x={(from.x + to.x + TABLE_WIDTH) / 2}
                    y={(fromY + toY) / 2 + 3}
                    textAnchor="middle"
                    className="fill-primary-300 text-[8px] font-medium"
                  >
                    {rel.type}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}

        {schema.tables.map((table, i) => {
          const pos = positions.current[table.id];
          if (!pos) return null;
          const h = tableHeight(table);
          const isSelected = selected === table.id;
          const isHovered = hovered === table.id;
          return (
            <motion.g
              key={table.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => handleSelect(table)}
              onMouseEnter={() => setHovered(table.id)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <rect
                x={pos.x}
                y={pos.y}
                width={TABLE_WIDTH}
                height={h}
                rx={8}
                fill={isSelected || isHovered ? "var(--color-surface)" : "var(--color-neutral-800)"}
                stroke={isSelected ? "var(--color-primary-500)" : "var(--color-border)"}
                strokeWidth={isSelected ? 2 : 1}
                className="transition-all"
              />
              <rect
                x={pos.x}
                y={pos.y}
                width={TABLE_WIDTH}
                height={HEADER_HEIGHT}
                rx={8}
                fill={isSelected ? "var(--color-primary-500/15)" : "var(--color-surface-2)"}
              />
              <rect
                x={pos.x}
                y={pos.y + HEADER_HEIGHT - 8}
                width={TABLE_WIDTH}
                height={8}
                fill={isSelected ? "var(--color-primary-500/15)" : "var(--color-surface-2)"}
              />
              <foreignObject x={pos.x + 8} y={pos.y + 4} width={TABLE_WIDTH - 16} height={HEADER_HEIGHT - 8}>
                <div className="flex h-full items-center gap-1.5">
                  <span className="truncate text-xs font-semibold text-neutral-100">
                    {table.name}
                  </span>
                </div>
              </foreignObject>
              {table.columns.map((col, ci) => (
                <foreignObject
                  key={col.name}
                  x={pos.x + TABLE_PADDING}
                  y={pos.y + HEADER_HEIGHT + TABLE_PADDING + ci * ROW_HEIGHT}
                  width={TABLE_WIDTH - TABLE_PADDING * 2}
                  height={ROW_HEIGHT}
                >
                  <div className="flex h-full items-center gap-1.5 px-1">
                    {col.primaryKey ? (
                      <KeyRound className="h-2.5 w-2.5 shrink-0 text-warning-400" />
                    ) : col.unique ? (
                      <Link2 className="h-2.5 w-2.5 shrink-0 text-accent-400" />
                    ) : (
                      <span className="w-2.5 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "truncate text-[10px]",
                        col.primaryKey ? "font-semibold text-neutral-100" : "text-neutral-300",
                      )}
                    >
                      {col.name}
                    </span>
                    <span className="ml-auto shrink-0 text-[9px] text-neutral-600">
                      {col.type}
                    </span>
                    {col.nullable ? (
                      <span className="shrink-0 text-[8px] text-neutral-700">?</span>
                    ) : null}
                  </div>
                </foreignObject>
              ))}
            </motion.g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-3 border-t border-border px-4 py-3 text-xs text-neutral-500">
        <div className="flex items-center gap-1.5">
          <KeyRound className="h-3 w-3 text-warning-400" />
          Primary key
        </div>
        <div className="flex items-center gap-1.5">
          <Link2 className="h-3 w-3 text-accent-400" />
          Unique
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-700">?</span>
          Nullable
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-6 bg-neutral-600" />
          <span className="h-0.5 w-6 border-t border-dashed border-neutral-600" />
          Relation (solid / dashed)
        </div>
      </div>
    </div>
  );
}
