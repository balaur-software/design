import { edgeStyle } from "../../organisms/MemoryExplorer/memory-types";

export interface EdgeArcProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Edge type (links, supersedes, merged_into, derived_from, on_day, no_match). */
  edgeType: string;
  /** The fact stopped being true (validUntil set) — renders faded. */
  closed?: boolean;
  /** Highlight (e.g. part of the selected node's 1-hop subgraph). */
  highlighted?: boolean;
  /** Curve amount as a fraction of the distance; 0 = straight. Default 0. */
  curve?: number;
  /** Stroke width. Default 1. */
  strokeWidth?: number;
  onClick?: () => void;
}

/**
 * A single SVG edge between two graph points. Stroke style (dash, colour) comes
 * from the shared `EDGE_STYLE` map keyed by edge type; closed edges (`validUntil`
 * set — TEMPORAL.md) render at ~40% opacity. A slight quadratic curve avoids
 * overlap on bidirectional pairs.
 */
export function EdgeArc({
  x1,
  y1,
  x2,
  y2,
  edgeType,
  closed = false,
  highlighted = false,
  curve = 0,
  strokeWidth = 1,
  onClick,
}: EdgeArcProps) {
  const s = edgeStyle(edgeType);
  const opacity = (closed ? 0.4 : 1) * s.baseOpacity * (highlighted ? 1 : 0.7);

  let d: string;
  if (curve === 0) {
    d = `M${x1} ${y1} L${x2} ${y2}`;
  } else {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const off = len * curve;
    d = `M${x1} ${y1} Q${mx + nx * off} ${my + ny * off} ${x2} ${y2}`;
  }

  return (
    <path
      d={d}
      fill="none"
      stroke={s.color}
      strokeOpacity={opacity}
      strokeWidth={strokeWidth}
      strokeDasharray={s.dash}
      strokeLinecap="round"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    />
  );
}

export { edgeIsClosed, edgeStyle } from "../../organisms/MemoryExplorer/memory-types";
