import type { CSSProperties } from "react";
import { type MemoryStatus, STATUS_STYLE } from "../../organisms/MemoryExplorer/memory-types";

export type { MemoryStatus, StatusStyle } from "../../organisms/MemoryExplorer/memory-types";
export { STATUS_STYLE } from "../../organisms/MemoryExplorer/memory-types";

/** Resolve the glyph character for a status. */
export function statusGlyph(status: MemoryStatus): string {
  return STATUS_STYLE[status].glyph;
}

/** Re-export the shared resolver for convenience. */
export { statusStyle } from "../../organisms/MemoryExplorer/memory-types";

export interface StatusGlyphProps {
  status: MemoryStatus;
  /** Glyph font-size in px. Default 14. */
  size?: number;
  /** Show the uppercase label next to the glyph. Default false. */
  showLabel?: boolean;
  style?: CSSProperties;
}

/**
 * A single status glyph (● ◔ ▽ ✕ ⚠ ◌ ◇) coloured by the memory lifecycle FSM
 * (SCHEMA.md "Status semantics"). Pure markup — the mapping lives in the
 * shared `STATUS_STYLE` table.
 */
export function StatusGlyph({ status, size = 14, showLabel = false, style }: StatusGlyphProps) {
  const s = STATUS_STYLE[status];
  return (
    <span
      // Without the visible label the aria-hidden glyph is the only content;
      // expose the status text to AT via role="img" + aria-label.
      {...(showLabel ? {} : { role: "img", "aria-label": s.label })}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: size,
        color: s.color,
        letterSpacing: "0.06em",
        ...style,
      }}
    >
      <span aria-hidden="true">{s.glyph}</span>
      {showLabel && <span>{s.label}</span>}
    </span>
  );
}
