import type { CSSProperties } from "react";
import type { MemoryNode, MemoryStatus, NodeFilter } from "../../organisms/MemoryExplorer/memory-types";
import { NodeSearchBox } from "../NodeSearchBox/NodeSearchBox";
import { Slider } from "../Slider/Slider";
import { ToggleGroup, type ToggleGroupItem } from "../ToggleGroup/ToggleGroup";

const ALL_STATUSES: readonly MemoryStatus[] = [
  "active",
  "proposed",
  "archived",
  "rejected",
  "quarantined",
  "forgotten",
  "merged",
];

const label: CSSProperties = { color: "#5b616e", fontSize: 10, letterSpacing: "0.08em" };

export interface GraphFilterBarProps {
  filter: NodeFilter;
  onFilterChange: (filter: NodeFilter) => void;
  /** Node types available in the vault (for the type multi-select). */
  types: readonly string[];
  /** Search results from the caller's `Store.recall`/`search`. */
  searchResults?: readonly MemoryNode[];
  onSearchSelect?: (id: string) => void;
  style?: CSSProperties;
}

/**
 * The graph scope controls: a `NodeSearchBox`, a type multi-select, a status
 * multi-select, and a minimum-importance slider. Purely presentational — every
 * change composes a new `NodeFilter` and hands it back to the caller.
 */
export function GraphFilterBar({
  filter,
  onFilterChange,
  types,
  searchResults,
  onSearchSelect,
  style,
}: GraphFilterBarProps) {
  const typeItems: ToggleGroupItem[] = types.map((t) => ({ value: t, label: t }));
  const statusItems: ToggleGroupItem[] = ALL_STATUSES.map((s) => ({ value: s, label: s }));

  const patch = (p: Partial<NodeFilter>) => onFilterChange({ ...filter, ...p });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 12,
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-2, #0b0d10)",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        ...style,
      }}
    >
      <NodeSearchBox
        value={filter.query ?? ""}
        onValueChange={(q) => patch({ query: q })}
        {...(searchResults ? { results: searchResults } : {})}
        {...(onSearchSelect ? { onSelect: onSearchSelect } : {})}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={label}>TYPES</span>
        {typeItems.length > 0 ? (
          <ToggleGroup
            items={typeItems}
            multi
            value={filter.types ? [...filter.types] : []}
            onChange={(v) => patch({ types: v })}
          />
        ) : (
          <span style={{ color: "#3f424d", fontSize: 12 }}>no types registered</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={label}>STATUSES</span>
        <ToggleGroup
          items={statusItems}
          multi
          value={filter.statuses ? [...filter.statuses] : []}
          onChange={(v) => patch({ statuses: v as MemoryStatus[] })}
        />
      </div>

      <Slider
        label="MIN IMPORTANCE"
        min={0}
        max={5}
        step={1}
        value={filter.minImportance ?? 0}
        onChange={(v) => patch({ minImportance: v })}
        formatValue={(v) => `${v}`}
      />
    </div>
  );
}
