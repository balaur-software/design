import { type CSSProperties, type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { useControllableState } from "../../hooks/useControllableState";
import type { MemoryNode } from "../../organisms/MemoryExplorer/memory-types";
import { NodeListItem } from "../NodeListItem/NodeListItem";

export interface NodeSearchBoxProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Search results (caller runs `Store.recall`/`search`). */
  results?: readonly MemoryNode[];
  onSelect?: (id: string) => void;
  placeholder?: string;
  /** Accessible name for the search combobox. */
  ariaLabel?: string;
  style?: CSSProperties;
}

/**
 * A node-search input with a dropdown of `NodeListItem` results. Purely
 * presentational: the caller owns the query → `Store.recall`/`search` mapping
 * and passes results back. The dropdown opens while focused and there are
 * results; selecting one fires `onSelect` and closes. The input is an APG
 * combobox: ArrowUp/ArrowDown move the active option (aria-activedescendant),
 * Enter picks it, Escape closes the list.
 */
export function NodeSearchBox({
  value,
  defaultValue = "",
  onValueChange,
  results = [],
  onSelect,
  placeholder = "search memory…",
  ariaLabel = "Search memory",
  style,
}: NodeSearchBoxProps) {
  const [inner, setInner] = useControllableState(value, defaultValue, onValueChange);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [hovered, setHovered] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  const expanded = open && results.length > 0;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const commit = (v: string) => {
    setInner(v);
    setActive(-1);
    setOpen(true);
  };

  const choose = (id: string) => {
    onSelect?.(id);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      const target = expanded ? results[active] : undefined;
      if (target) {
        e.preventDefault();
        choose(target.id);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div ref={rootRef} style={{ position: "relative", ...style }}>
      <input
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={expanded}
        aria-controls={expanded ? listboxId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 ? `${baseId}-opt-${active}` : undefined}
        value={inner}
        placeholder={placeholder}
        onChange={(e) => commit(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        style={{
          width: "100%",
          fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
          fontSize: 13,
          color: "var(--bx-text-1, #f4f6fb)",
          background: "var(--bx-surface-2, #0b0d10)",
          border: "1px solid var(--bx-border, #1c1d24)",
          padding: "9px 11px",
          outline: "none",
          caretColor: "var(--bx-accent, #46c66d)",
        }}
      />
      {expanded && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 2,
            marginTop: 2,
            border: "1px solid var(--bx-border, #1c1d24)",
            background: "var(--bx-surface-3, #0c0d11)",
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {results.map((n, i) => (
            <NodeListItem
              key={n.id}
              id={`${baseId}-opt-${i}`}
              role="option"
              tabIndex={-1}
              aria-selected={i === active}
              node={n}
              hovered={hovered === n.id || i === active}
              onHover={setHovered}
              onSelect={choose}
            />
          ))}
        </div>
      )}
    </div>
  );
}
