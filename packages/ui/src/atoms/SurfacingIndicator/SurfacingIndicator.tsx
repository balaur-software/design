import type { CSSProperties } from "react";
import { type MemorySurfacing, SURFACING_STYLE } from "../../organisms/MemoryExplorer/memory-types";

export type { MemorySurfacing } from "../../organisms/MemoryExplorer/memory-types";

export interface SurfacingIndicatorProps {
  surfacing: MemorySurfacing;
  /** Show the uppercase label next to the glyph. Default false. */
  showLabel?: boolean;
  style?: CSSProperties;
}

/**
 * Always / ask / never (I2): a single glyph (◉ ◑ ○) coloured by surfacing
 * policy — whether an active node may appear without being explicitly asked
 * for. The mapping lives in the shared `SURFACING_STYLE` table.
 */
export function SurfacingIndicator({ surfacing, showLabel = false, style }: SurfacingIndicatorProps) {
  const s = SURFACING_STYLE[surfacing];
  return (
    <span
      // Without the visible label the aria-hidden glyph is the only content;
      // expose the policy text to AT via role="img" + aria-label.
      {...(showLabel ? {} : { role: "img", "aria-label": s.label })}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: 12,
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
