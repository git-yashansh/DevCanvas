import { BaseEdge, getBezierPath, EdgeProps } from "reactflow";

export function AnimatedConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  // Determine particle color based on edge type or data
  let particleColor = "var(--color-primary-400)"; // Default blue
  if (data?.particleColor === "green") {
    particleColor = "var(--color-success-400)";
  } else if (data?.particleColor === "orange") {
    particleColor = "var(--color-warning-400)"; // Using warning color (orange)
  }

  const isDashed = data?.type === "async";
  const isHighlighted = data?.isHighlighted;
  const isFaded = data?.isFaded;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isHighlighted
            ? "var(--color-primary-500)"
            : isFaded
            ? "rgba(63, 63, 70, 0.15)"
            : "var(--color-neutral-700)",
          strokeWidth: isHighlighted ? 2.5 : 1.5,
          strokeDasharray: isDashed ? "5 5" : "none",
          transition: "stroke 0.3s, stroke-width 0.3s, opacity 0.3s",
        }}
      />
      {/* Animated particle flow */}
      {!isFaded && (
        <circle r={isHighlighted ? "4.5" : "3.5"} fill={particleColor}>
          <animateMotion
            dur={isHighlighted ? "1.2s" : "2.2s"}
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}
    </>
  );
}
