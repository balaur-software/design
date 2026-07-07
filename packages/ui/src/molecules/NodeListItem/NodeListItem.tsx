import type { CSSProperties } from "react";
import { NodeTypeTag } from "../../atoms/NodeTypeTag/NodeTypeTag";
import { StatusGlyph } from "../../atoms/StatusGlyph/StatusGlyph";
import type { MemoryNode } from "../../organisms/MemoryExplorer/memory-types";

export interface NodeListItemProps {
  node: MemoryNode;
  selected?: boolean;
  hovered?: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  /** Right-aligned meta text (e.g. a relative time). */
  meta?: string;
  /** Overrides so composites (e.g. NodeSearchBox) can expose listbox/option semantics. */
  id?: string;
  role?: string;
  tabIndex?: number;
  "aria-selected"?: boolean;
  style?: CSSProperties;
}

/**
 * A compact selectable row for a memory node — status glyph + title + type tag +
 * faint meta. Used in search results, the consent queue, and sidebar lists.
 */
export function NodeListItem({
  node,
  selected,
  hovered,
  onSelect,
  onHover,
  meta,
  id,
  role,
  tabIndex,
  "aria-selected": ariaSelected,
  style,
}: NodeListItemProps) {
  const bg = selected ? "#15161e" : hovered ? "#0f1014" : "transparent";
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role/aria-selected are only supplied together (role="option" in NodeSearchBox's listbox)
    <button
      type="button"
      id={id}
      role={role}
      tabIndex={tabIndex}
      aria-selected={ariaSelected}
      onClick={onSelect ? () => onSelect(node.id) : undefined}
      onPointerEnter={onHover ? () => onHover(node.id) : undefined}
      onPointerLeave={onHover ? () => onHover(null) : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        textAlign: "left",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: 13,
        padding: "9px 12px",
        background: bg,
        border: 0,
        borderLeft: `2px solid ${selected ? "var(--bx-accent, #46c66d)" : "transparent"}`,
        color: selected ? "var(--bx-text-1, #f4f6fb)" : "var(--bx-text-4, #9aa0ad)",
        cursor: onSelect ? "pointer" : "default",
        ...style,
      }}
    >
      <StatusGlyph status={node.status} size={13} />
      <span
        style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {node.title}
      </span>
      <NodeTypeTag type={node.type} showGlyph={false} />
      {meta !== undefined && <span style={{ color: "#3f424d", fontSize: 11 }}>{meta}</span>}
    </button>
  );
}
