import type { CSSProperties } from "react";
import {
  EDGE_TYPE_ORDER,
  edgeStyle,
  type MemoryStatus,
  STATUS_STYLE,
} from "../../organisms/MemoryExplorer/memory-types";

const STATUSES: readonly MemoryStatus[] = [
  "active",
  "proposed",
  "archived",
  "rejected",
  "quarantined",
  "forgotten",
  "merged",
];

export interface GraphLegendProps {
  /** Statuses to render. Defaults to the full FSM. */
  statuses?: readonly MemoryStatus[];
  /** Edge types to render. Defaults to `EDGE_TYPE_ORDER`. */
  edgeTypes?: readonly string[];
  style?: CSSProperties;
}

/**
 * A compact legend mapping the memory graph's visual language: status glyphs
 * (the lifecycle FSM) and edge-type stroke swatches (system edge types +
 * `links`). Renders straight from the shared `STATUS_STYLE` / `EDGE_STYLE`
 * tables so it can never drift from the graph.
 */
export function GraphLegend({ statuses = STATUSES, edgeTypes = EDGE_TYPE_ORDER, style }: GraphLegendProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 18,
        flexWrap: "wrap",
        padding: "8px 12px",
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-2, #0b0d10)",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: 11,
        color: "#7b8290",
        ...style,
      }}
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {statuses.map((s) => {
          const st = STATUS_STYLE[s];
          return (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span aria-hidden="true" style={{ color: st.color }}>
                {st.glyph}
              </span>
              {st.label}
            </span>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {edgeTypes.map((t) => {
          const es = edgeStyle(t);
          return (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <svg width={18} height={6} aria-hidden="true">
                <line
                  x1={1}
                  y1={3}
                  x2={17}
                  y2={3}
                  stroke={es.color}
                  strokeWidth={1.25}
                  strokeDasharray={es.dash}
                />
              </svg>
              {es.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
