import { type CSSProperties, useRef, useState } from "react";
import { useControllableState } from "../../hooks/useControllableState";

/** Quadrant-block glyphs used when a row omits its own `glyph` (cycled by index). */
const DEFAULT_GLYPHS = ["▛", "▞", "▙", "▟", "▚"];

export interface ListItem {
  /** Primary row label. */
  label: string;
  /** Leading glyph. Falls back to a cycling quadrant block when omitted. */
  glyph?: string;
  /** Right-aligned dim meta text (e.g. a file size). */
  meta?: string;
}

export interface ListProps {
  /** Rows to render. */
  items: ListItem[];
  /** Controlled selected index. Omit for uncontrolled (use `defaultSelected`). */
  selected?: number;
  /** Initially selected index when uncontrolled. Defaults to the first row. */
  defaultSelected?: number;
  onSelect?: (index: number) => void;
  /** Accessible name for the listbox. Default "List". */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * A selectable list of glyph rows. The active row carries the accent on its left
 * border, glyph and text; other rows lift to a faint surface on hover. Selection
 * is via `useControllableState`; all styling is derived at render time so the list
 * is inert and deterministic on the server (no imperative fills or timers).
 */
export function List({
  items,
  selected,
  defaultSelected = 0,
  onSelect,
  ariaLabel = "List",
  className,
  style,
}: ListProps) {
  const [sel, setSel] = useControllableState(selected, defaultSelected, onSelect);
  const [hovered, setHovered] = useState(-1);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // APG listbox keyboard support: one tab stop (the selected option), with
  // arrows / Home / End moving both selection and focus.
  const move = (i: number) => {
    setSel(i);
    btnRefs.current[i]?.focus();
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(Math.min(items.length - 1, sel + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(Math.max(0, sel - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      move(0);
    } else if (e.key === "End") {
      e.preventDefault();
      move(items.length - 1);
    }
  };

  return (
    <div
      role="listbox"
      aria-label={ariaLabel}
      className={className}
      onKeyDown={onKeyDown}
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid var(--bx-border, #1c1d24)",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        ...style,
      }}
    >
      {items.map((item, i) => {
        const on = i === sel;
        const glyph = item.glyph ?? DEFAULT_GLYPHS[i % DEFAULT_GLYPHS.length];
        const bg = on ? "#15161e" : hovered === i ? "#0f1014" : "transparent";
        return (
          <button
            key={i}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            role="option"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => setSel(i)}
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered((h) => (h === i ? -1 : h))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              textAlign: "left",
              fontFamily: "inherit",
              fontSize: 13,
              padding: "11px 13px",
              background: bg,
              border: 0,
              borderLeft: `2px solid ${on ? "var(--bx-accent, #46c66d)" : "transparent"}`,
              borderTop: i > 0 ? "1px solid #15161e" : undefined,
              color: on ? "var(--bx-text-1, #f4f6fb)" : "var(--bx-text-4, #9aa0ad)",
              cursor: "pointer",
              transition: "background .12s",
            }}
          >
            <span style={{ color: on ? "var(--bx-accent, #46c66d)" : "#5b616e", fontSize: 14 }}>{glyph}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.meta !== undefined && <span style={{ color: "#3f424d", fontSize: 11 }}>{item.meta}</span>}
          </button>
        );
      })}
    </div>
  );
}
