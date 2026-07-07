import { type CSSProperties, useId } from "react";
import { useControllableState } from "../../hooks/useControllableState";
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
 * the way unless the reader wants it. Collapsed state flows through
 * `useControllableState`, so the `collapsed` prop stays authoritative when set.
 */
export function ReasoningBlock({
  text,
  defaultCollapsed = true,
  collapsed,
  onCollapsedChange,
  style,
}: ReasoningBlockProps) {
  const [isCollapsed, set] = useControllableState(collapsed, defaultCollapsed, onCollapsedChange);
  const bodyId = useId();
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
        aria-expanded={!isCollapsed}
        aria-controls={isCollapsed ? undefined : bodyId}
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
        <div id={bodyId} style={{ marginTop: 8 }}>
          <TextBlock text={text} style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 12 }} />
        </div>
      )}
    </div>
  );
}
