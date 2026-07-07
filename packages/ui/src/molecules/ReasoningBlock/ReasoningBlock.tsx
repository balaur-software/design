import { type CSSProperties, useState } from "react";
import { TextBlock } from "../TextBlock/TextBlock";

export interface ReasoningBlockProps {
  text: string;
  /** Initial collapsed state. Default true. */
  defaultCollapsed?: boolean;
  /** Controlled collapsed state. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  style?: CSSProperties;
}

/**
 * A collapsible "THINKING" trace. A `▸`/`▾` chevron toggles a dimmed body
 * rendered via `TextBlock`. Collapsed by default so the reasoning stays out of
 * the way unless the reader wants it. Pure local state via `useState`.
 */
export function ReasoningBlock({
  text,
  defaultCollapsed = true,
  collapsed,
  onCollapsedChange,
  style,
}: ReasoningBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed ?? defaultCollapsed);
  const set = (v: boolean) => {
    setIsCollapsed(v);
    onCollapsedChange?.(v);
  };
  return (
    <div
      style={{
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-1, #0a0b0e)",
        padding: "8px 12px",
        ...style,
      }}
    >
      <button
        type="button"
        onClick={() => set(!isCollapsed)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "inherit",
          fontSize: 11,
          background: "transparent",
          border: 0,
          color: "var(--bx-text-6, #5b616e)",
          cursor: "pointer",
          letterSpacing: "0.08em",
        }}
      >
        <span aria-hidden="true" style={{ display: "inline-block" }}>
          {isCollapsed ? "▸" : "▾"}
        </span>
        THINKING
      </button>
      {!isCollapsed && (
        <div style={{ marginTop: 8 }}>
          <TextBlock text={text} style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 12 }} />
        </div>
      )}
    </div>
  );
}
