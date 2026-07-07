import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { type MemoryNode, nodeRadius, STATUS_STYLE } from "../../organisms/MemoryExplorer/memory-types";
import { typeAccent, typeGlyph } from "../NodeTypeTag/NodeTypeTag";

export type { MemoryNode } from "../../organisms/MemoryExplorer/memory-types";

export interface NodeGlyphProps {
  node: MemoryNode;
  x: number;
  y: number;
  selected?: boolean;
  hovered?: boolean;
  /** Render at reduced opacity (e.g. not in the selected 1-hop subgraph). */
  dimmed?: boolean;
  /** Pinned nodes render as a square instead of a circle. */
  pinned?: boolean;
  /** Show the title label beneath the marker. Default: only when selected/hovered. */
  showLabel?: boolean;
  /** Zoom factor applied to the radius + label. Default 1. */
  zoom?: number;
  onPointerDown?: (e: ReactPointerEvent<SVGGElement>, id: string) => void;
  onPointerEnter?: (id: string) => void;
  onPointerLeave?: (id: string) => void;
  onClick?: (id: string) => void;
  style?: CSSProperties;
}

/**
 * A single SVG node marker for the memory graph. Shape: circle (free) or square
 * (pinned). Radius scales with `importance` (0..5). Fill/stroke colour comes
 * from the status FSM; the leading glyph is the node-type sigil. Selected and
 * hovered states add an accent ring; `dimmed` fades non-neighbour nodes when a
 * selection is active.
 */
export function NodeGlyph({
  node,
  x,
  y,
  selected = false,
  hovered = false,
  dimmed = false,
  pinned = false,
  showLabel,
  zoom = 1,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onClick,
  style,
}: NodeGlyphProps) {
  const r = nodeRadius(node.importance) * zoom;
  const status = STATUS_STYLE[node.status];
  const accent = typeAccent(node.type);
  const glyph = typeGlyph(node.type);
  const label = showLabel ?? (selected || hovered);
  const ring = selected || hovered;

  const opacity = dimmed ? 0.28 : 1;
  const ringColor = selected ? "var(--bx-accent, #46c66d)" : hovered ? "#c8cdd6" : "transparent";
  const fillOpacity = node.status === "forgotten" ? 0.12 : 0.22;

  const shapeProps = {
    fill: status.color,
    fillOpacity,
    stroke: status.color,
    strokeWidth: 1.25,
  } as const;

  const interactive = Boolean(onPointerDown || onClick);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: SVG group carries full APG button semantics (role/tabIndex/aria-label/keydown) when interactive
    <g
      transform={`translate(${x} ${y})`}
      opacity={opacity}
      role={interactive ? "button" : "img"}
      aria-label={`${node.type} ${node.title} — ${status.label}`}
      tabIndex={interactive ? 0 : undefined}
      focusable={interactive ? undefined : "false"}
      style={{ cursor: interactive ? "grab" : "default", ...style }}
      onPointerDown={onPointerDown ? (e) => onPointerDown(e, node.id) : undefined}
      onPointerEnter={onPointerEnter ? () => onPointerEnter(node.id) : undefined}
      onPointerLeave={onPointerLeave ? () => onPointerLeave(node.id) : undefined}
      onClick={onClick ? () => onClick(node.id) : undefined}
      onKeyDown={
        onClick
          ? (e: ReactKeyboardEvent<SVGGElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(node.id);
              }
            }
          : undefined
      }
    >
      {ring && <circle r={r + 4} fill="none" stroke={ringColor} strokeWidth={1} strokeOpacity={0.8} />}
      {pinned ? (
        <rect x={-r} y={-r} width={r * 2} height={r * 2} {...shapeProps} />
      ) : (
        <circle r={r} {...shapeProps} />
      )}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={r * 1.1}
        fill={accent}
        style={{ fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)" }}
      >
        {glyph}
      </text>
      {label && (
        <text
          y={r + 11}
          textAnchor="middle"
          fontSize={10 * zoom}
          fill={selected ? "var(--bx-accent, #46c66d)" : "#9aa0ad"}
          style={{ fontFamily: "var(--bx-font-mono, ui-monospace, monospace)" }}
        >
          {node.title.length > 22 ? `${node.title.slice(0, 21)}…` : node.title}
        </text>
      )}
    </g>
  );
}
