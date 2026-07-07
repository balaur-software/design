import type { CSSProperties } from "react";

export interface ImportanceMeterProps {
  /** 0 = not applicable for this type; 1..5 otherwise. Values outside clamp. */
  importance: number;
  /** Cell count (the max importance value). Default 5. */
  max?: number;
  /** Filled cell color. Defaults to the accent var. */
  color?: string;
  /** Empty cell color. */
  trackColor?: string;
  /** Show the numeric readout next to the cells. Default true. */
  showValue?: boolean;
  style?: CSSProperties;
}

/**
 * A 5-cell importance meter for a memory node (SCHEMA.md `importance BETWEEN 0
 * AND 5`). Filled cells use the accent; the track is a faint hairline. 0 renders
 * a full row of dim dots (not applicable for this type).
 */
export function ImportanceMeter({
  importance,
  max = 5,
  color = "var(--bx-accent, #46c66d)",
  trackColor = "#2a2c34",
  showValue = true,
  style,
}: ImportanceMeterProps) {
  const v = Math.max(0, Math.min(max, Math.round(importance)));
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: 12,
        ...style,
      }}
    >
      <span aria-hidden="true" style={{ display: "inline-flex", gap: 2 }}>
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: 6,
              height: 12,
              background: i < v ? color : trackColor,
            }}
          />
        ))}
      </span>
      {showValue && <span style={{ color: "#5b616e" }}>{v}</span>}
    </span>
  );
}
