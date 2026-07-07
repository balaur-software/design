import type { CSSProperties } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { BlockStatus } from "../../organisms/ChatPanel/chat-types";

export type ToolPillStatus = BlockStatus | "idle";

const STATUS: Record<ToolPillStatus, { glyph: string; color: string; label: string; spin?: boolean }> = {
  idle: { glyph: "·", color: "var(--bx-text-6, #5b616e)", label: "idle" },
  running: { glyph: "◐", color: "var(--bx-accent, #46c66d)", label: "running", spin: true },
  done: { glyph: "✓", color: "var(--bx-accent, #46c66d)", label: "done" },
  error: { glyph: "✕", color: "#ff6b6f", label: "error" },
};

/** Keeps the status text out of view while staying readable to AT. */
const VISUALLY_HIDDEN: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  clipPath: "inset(50%)",
  overflow: "hidden",
  whiteSpace: "nowrap",
};

export interface ToolPillProps {
  /** Tool name, shown after the ▸ marker. */
  name: string;
  status?: ToolPillStatus;
  /** Optional click handler (ToolCallBlock toggles expand on click). */
  onClick?: () => void;
  /** Whether the pill is currently expanded (rotates the ▸). */
  expanded?: boolean;
  style?: CSSProperties;
}

/**
 * A `▸ tool_name` chip with a trailing status glyph. The running glyph spins
 * via a CSS rotate animation; the marker rotates 90° when `expanded`. Pure
 * markup + declarative CSS.
 */
export function ToolPill({ name, status = "idle", onClick, expanded = false, style }: ToolPillProps) {
  const s = STATUS[status];
  const reduced = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={onClick ? expanded : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: 12,
        padding: "4px 9px",
        background: "transparent",
        border: "1px solid var(--bx-border, #1c1d24)",
        color: "var(--bx-text-3, #c8cdd6)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          color: "var(--bx-accent, #46c66d)",
          display: "inline-block",
          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform .15s",
        }}
      >
        ▸
      </span>
      <span>{name}</span>
      <span
        aria-hidden="true"
        style={{
          color: s.color,
          display: "inline-block",
          animation: s.spin && !reduced ? "bx-spin 0.9s linear infinite" : undefined,
        }}
      >
        {s.glyph}
      </span>
      <span style={VISUALLY_HIDDEN}>{s.label}</span>
    </button>
  );
}
