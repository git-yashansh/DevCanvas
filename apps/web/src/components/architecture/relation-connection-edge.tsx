import { BaseEdge, getBezierPath, EdgeProps } from "reactflow";

export function RelationConnectionEdge({
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

  const isHighlighted = data?.isHighlighted;
  const isFaded = data?.isFaded;

  // Relation color
  let relationColor = "var(--color-neutral-700)";
  if (isHighlighted) {
    relationColor = "var(--color-primary-500)";
  } else if (isFaded) {
    relationColor = "rgba(63, 63, 70, 0.1)";
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: relationColor,
          strokeWidth: isHighlighted ? 2.5 : 1.5,
          transition: "stroke 0.3s, stroke-width 0.3s, opacity 0.3s",
        }}
      />
      {/* Smooth flow particle represents key mapping lookups */}
      {isHighlighted && (
        <circle r="4" fill="var(--color-primary-400)">
          <animateMotion
            dur="1.8s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}
    </>
  );
}
