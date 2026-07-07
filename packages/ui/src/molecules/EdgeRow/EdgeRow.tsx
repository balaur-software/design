import type { CSSProperties } from "react";
import type { MemoryEdge } from "../../organisms/MemoryExplorer/memory-types";
import { edgeIsClosed, edgeStyle } from "../../organisms/MemoryExplorer/memory-types";

export type { MemoryEdge } from "../../organisms/MemoryExplorer/memory-types";

function fmtDate(iso: string | null): string {
  if (iso === null) return "—";
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

export interface EdgeRowProps {
  edge: MemoryEdge;
  /** Direction label, e.g. `source → target` titles. */
  fromTitle: string;
  toTitle: string;
  /** This row points OUT of the focal node. Default true. */
  outgoing?: boolean;
  onClick?: (id: string) => void;
  style?: CSSProperties;
}

/**
 * One labeled edge line for the detail panel: a small SVG swatch in the edge
 * type's stroke style, the edge-type label, the `from → to` titles, and the
 * world-time validity window (`validFrom..validUntil` or "still true" —
 * TEMPORAL.md). Closed edges render faded.
 */
export function EdgeRow({ edge, fromTitle, toTitle, outgoing = true, onClick, style }: EdgeRowProps) {
  const s = edgeStyle(edge.type);
  const closed = edgeIsClosed(edge);
  const validity =
    edge.validFrom === null && edge.validUntil === null
      ? "undated · still true"
      : `${fmtDate(edge.validFrom)} → ${closed ? fmtDate(edge.validUntil) : "now"}`;

  const rowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    textAlign: "left",
    fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
    fontSize: 12,
    padding: "7px 10px",
    background: "transparent",
    border: 0,
    borderBottom: "1px solid var(--bx-border, #1c1d24)",
    color: closed ? "#3f424d" : "var(--bx-text-4, #9aa0ad)",
    cursor: onClick ? "pointer" : "default",
    ...style,
  };

  const body = (
    <>
      <svg width={26} height={10} aria-hidden="true" style={{ flex: "none" }}>
        <line
          x1={1}
          y1={5}
          x2={25}
          y2={5}
          stroke={s.color}
          strokeOpacity={closed ? 0.4 : 0.9}
          strokeWidth={1.25}
          strokeDasharray={s.dash}
        />
      </svg>
      <span style={{ color: s.color, opacity: closed ? 0.5 : 1, letterSpacing: "0.06em", flex: "none" }}>
        {s.label}
      </span>
      <span
        style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {outgoing ? `${fromTitle} → ${toTitle}` : `${toTitle} → ${fromTitle}`}
      </span>
      <span style={{ color: "#3f424d", fontSize: 10, flex: "none" }}>{validity}</span>
    </>
  );

  // Only render a focusable button when the row is actually interactive.
  if (!onClick) {
    return <div style={rowStyle}>{body}</div>;
  }
  return (
    <button type="button" onClick={() => onClick(outgoing ? edge.target : edge.source)} style={rowStyle}>
      {body}
    </button>
  );
}
