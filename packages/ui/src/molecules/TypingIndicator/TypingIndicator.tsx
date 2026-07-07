import type { CSSProperties } from "react";
import { BrailleSpinner } from "../../atoms/BrailleSpinner/BrailleSpinner";

export interface TypingIndicatorProps {
  /** Label beside the spinner. Default "thinking". */
  label?: string;
  style?: CSSProperties;
}

/**
 * A compact agent-thinking row: a `BrailleSpinner` + a label + animated
 * trailing dots. Shown at the bottom of `ChatThread` while the agent is
 * producing its first block. Pure declarative CSS animation.
 */
export function TypingIndicator({ label = "thinking", style }: TypingIndicatorProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: 12,
        color: "var(--bx-text-6, #5b616e)",
        ...style,
      }}
    >
      <BrailleSpinner variant="pulse" size={14} />
      <span>{label}</span>
      <span style={{ letterSpacing: "0.2em", animation: "bx-blink 1.1s steps(1) infinite" }}>…</span>
    </div>
  );
}
