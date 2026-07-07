import { type CSSProperties, useEffect, useRef, useState } from "react";
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
  style?: CSSProperties;
}

/**
 * A node-search input with a dropdown of `NodeListItem` results. Purely
 * presentational: the caller owns the query → `Store.recall`/`search` mapping
 * and passes results back. The dropdown opens while focused and there are
 * results; selecting one fires `onSelect` and closes.
 */
export function NodeSearchBox({
  value,
  defaultValue = "",
  onValueChange,
  results = [],
  onSelect,
  placeholder = "search memory…",
  style,
}: NodeSearchBoxProps) {
  const [inner, setInner] = useState(value ?? defaultValue);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) setInner(value);
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const commit = (v: string) => {
    setInner(v);
    onValueChange?.(v);
    setOpen(true);
  };

  const choose = (id: string) => {
    onSelect?.(id);
    setOpen(false);
  };

  return (
    <div ref={rootRef} style={{ position: "relative", ...style }}>
      <input
        type="text"
        value={inner}
        placeholder={placeholder}
        onChange={(e) => commit(e.target.value)}
        onFocus={() => setOpen(true)}
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
      {open && results.length > 0 && (
        <div
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
          {results.map((n) => (
            <NodeListItem
              key={n.id}
              node={n}
              hovered={hovered === n.id}
              onHover={setHovered}
              onSelect={choose}
            />
          ))}
        </div>
      )}
    </div>
  );
}
