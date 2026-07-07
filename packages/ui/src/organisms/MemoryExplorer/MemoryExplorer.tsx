import { type CSSProperties, useMemo, useState } from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { useGraphSelection } from "../../hooks/useGraphSelection";
import { BreadcrumbPath } from "../../molecules/BreadcrumbPath/BreadcrumbPath";
import { EmptyState } from "../../molecules/EmptyState/EmptyState";
import { GraphFilterBar } from "../../molecules/GraphFilterBar/GraphFilterBar";
import { GraphLegend } from "../../molecules/GraphLegend/GraphLegend";
import { type CommandGroup, CommandPalette } from "../CommandPalette/CommandPalette";
import { type DoctorMetricKey, type DoctorReportProps, DoctorStrip } from "../DoctorStrip/DoctorStrip";
import { MemoryGraph } from "../MemoryGraph/MemoryGraph";
import { NodeDetailPanel } from "../NodeDetailPanel/NodeDetailPanel";
import { PendingQueue } from "../PendingQueue/PendingQueue";
import type {
  MemoryEdge,
  MemoryHistorySnapshot,
  MemoryNode,
  NodeFilter,
  PendingVerdict,
} from "./memory-types";

export interface MemoryExplorerProps {
  /** The full vault projection (host's `Store` reads). */
  nodes: readonly MemoryNode[];
  edges: readonly MemoryEdge[];
  /** Proposed nodes awaiting verdict (consent gate). */
  pendingItems?: readonly MemoryNode[];
  /** Doctor health snapshot (reports, never acts). */
  doctorReport?: DoctorReportProps;
  /** Search results for the filter bar's search box (caller runs recall/search). */
  searchResults?: readonly MemoryNode[];
  /** History snapshots for the selected node (TEMPORAL.md). */
  selectedHistory?: readonly MemoryHistorySnapshot[];
  /** Controlled selection. Omit for uncontrolled. */
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  /** Controlled filter. Omit for uncontrolled. */
  filter?: NodeFilter;
  defaultFilter?: NodeFilter;
  onFilterChange?: (filter: NodeFilter) => void;
  onVerdict?: (id: string, verdict: PendingVerdict) => void;
  onSearchSelect?: (id: string) => void;
  onMetricClick?: (key: DoctorMetricKey) => void;
  style?: CSSProperties;
}

const label: CSSProperties = { color: "#5b616e", fontSize: 10, letterSpacing: "0.08em" };

/** Apply the type/status/importance filters client-side (query is handled by the caller's recall). */
function filterNodes(nodes: readonly MemoryNode[], filter: NodeFilter): MemoryNode[] {
  return nodes.filter((n) => {
    if (filter.types && filter.types.length > 0 && !filter.types.includes(n.type)) return false;
    if (filter.statuses && filter.statuses.length > 0 && !filter.statuses.includes(n.status)) return false;
    if (filter.minImportance !== undefined && n.importance < filter.minImportance) return false;
    if (filter.query && !n.title.toLowerCase().includes(filter.query.toLowerCase())) return false;
    return true;
  });
}

/**
 * The top-level memory navigation shell: a header (brand + breadcrumb +
 * doctor strip + ⌘K trigger), a left rail (type tree with counts + pending
 * queue), a center (filter bar + force-directed `MemoryGraph` + legend), and a
 * right rail (`NodeDetailPanel`). All data is controlled by the caller; the
 * shell owns only UI state (selection, hover, pins, filter, palette open).
 */
export function MemoryExplorer({
  nodes,
  edges,
  pendingItems = [],
  doctorReport,
  searchResults,
  selectedHistory,
  selectedId,
  defaultSelectedId,
  onSelect,
  filter,
  defaultFilter = {},
  onFilterChange,
  onVerdict,
  onSearchSelect,
  onMetricClick,
  style,
}: MemoryExplorerProps) {
  const [sel, setSel] = useControllableState<string | null>(
    selectedId ?? null,
    defaultSelectedId ?? null,
    (id) => {
      if (id !== null) onSelect?.(id);
    },
  );
  const [flt, setFlt] = useControllableState<NodeFilter>(filter, defaultFilter, onFilterChange);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { hoveredId, pinnedIds, setHovered, togglePin, isPinned } = useGraphSelection();

  const types = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of nodes) counts.set(n.type, (counts.get(n.type) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [nodes]);

  const visibleNodes = useMemo(() => filterNodes(nodes, flt), [nodes, flt]);
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () => edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target)),
    [edges, visibleIds],
  );

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n] as const)), [nodes]);
  const selectedNode = sel !== null ? (nodeById.get(sel) ?? null) : null;

  const selectedEdges = useMemo(
    () => (sel !== null ? edges.filter((e) => e.source === sel || e.target === sel) : []),
    [edges, sel],
  );
  const neighbours = useMemo(() => {
    const m = new Map<string, MemoryNode>();
    if (sel === null) return m;
    for (const e of selectedEdges) {
      const otherId = e.source === sel ? e.target : e.source;
      const n = nodeById.get(otherId);
      if (n) m.set(otherId, n);
    }
    return m;
  }, [sel, selectedEdges, nodeById]);

  const breadcrumb = useMemo(() => {
    if (sel === null || !selectedNode) return [];
    return [{ id: selectedNode.id, title: selectedNode.title, type: selectedNode.type }];
  }, [sel, selectedNode]);

  const commandGroups: CommandGroup[] = useMemo(() => {
    const navItems = nodes.slice(0, 80).map((n) => ({
      glyph: n.status === "proposed" ? "◔" : "●",
      label: n.title,
      to: n.id,
    }));
    const typeItems = types.map(([t]) => ({
      glyph: "▸",
      label: `filter: ${t}`,
      to: `filter:type:${t}`,
    }));
    return [
      { group: "NODES", items: navItems },
      { group: "FILTERS", items: typeItems },
    ];
  }, [nodes, types]);

  const handleNavigate = (to: string) => {
    if (to.startsWith("filter:type:")) {
      const type = to.slice("filter:type:".length);
      const next = new Set(flt.types ?? []);
      next.add(type);
      setFlt({ ...flt, types: [...next] });
      return;
    }
    setSel(to);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: 720,
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-bg, #0a0b0e)",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "10px 14px",
          borderBottom: "1px solid var(--bx-border, #1c1d24)",
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--bx-accent, #46c66d)", fontSize: 14, letterSpacing: "0.04em" }}>
          █ MEMORY
        </span>
        <BreadcrumbPath path={breadcrumb} onNavigate={handleNavigate} style={{ flex: 1, minWidth: 200 }} />
        <CommandPalette
          commands={commandGroups}
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          onNavigate={handleNavigate}
          triggerLabel="search"
        />
      </div>

      {doctorReport && <DoctorStrip report={doctorReport} {...(onMetricClick ? { onMetricClick } : {})} />}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left rail: type tree + pending queue */}
        <div
          style={{
            width: 220,
            flex: "none",
            borderRight: "1px solid var(--bx-border, #1c1d24)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "8px 12px", ...label }}>
            TYPES · {visibleNodes.length}/{nodes.length}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {types.map(([type, count]) => {
              const on = flt.types?.includes(type) ?? false;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    const next = new Set(flt.types ?? []);
                    if (next.has(type)) next.delete(type);
                    else next.add(type);
                    setFlt({ ...flt, types: [...next] });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    textAlign: "left",
                    fontFamily: "inherit",
                    fontSize: 12,
                    padding: "7px 14px",
                    background: on ? "#15161e" : "transparent",
                    border: 0,
                    borderLeft: `2px solid ${on ? "var(--bx-accent, #46c66d)" : "transparent"}`,
                    color: on ? "var(--bx-text-1, #f4f6fb)" : "#9aa0ad",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ flex: 1 }}>{type}</span>
                  <span style={{ color: "#3f424d", fontSize: 11 }}>{count}</span>
                </button>
              );
            })}
          </div>
          {pendingItems.length > 0 && (
            <div
              style={{ borderTop: "1px solid var(--bx-border, #1c1d24)", maxHeight: 220, overflowY: "auto" }}
            >
              <PendingQueue
                items={pendingItems}
                {...(sel !== null ? { selectedId: sel } : {})}
                onSelect={setSel}
                {...(onVerdict ? { onVerdict } : {})}
              />
            </div>
          )}
        </div>

        {/* Center: filter + graph + legend */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <GraphFilterBar
            filter={flt}
            onFilterChange={setFlt}
            types={types.map(([t]) => t)}
            {...(searchResults ? { searchResults } : {})}
            {...(onSearchSelect ? { onSearchSelect } : {})}
          />
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            {visibleNodes.length === 0 ? (
              <EmptyState
                title="NO NODES"
                description="No nodes match this filter. Clear the filter bar or register a type."
                style={{ height: "100%" }}
              />
            ) : (
              <MemoryGraph
                nodes={visibleNodes}
                edges={visibleEdges}
                {...(sel !== null ? { selectedId: sel } : {})}
                {...(hoveredId !== null ? { hoveredId } : {})}
                {...(pinnedIds.size > 0 ? { pinnedIds } : {})}
                onSelect={setSel}
                onHover={setHovered}
                onPinChange={(id, p) => {
                  if (p !== isPinned(id)) togglePin(id);
                }}
              />
            )}
          </div>
          <GraphLegend />
        </div>

        {/* Right rail: detail panel */}
        <div style={{ width: 340, flex: "none", borderLeft: "1px solid var(--bx-border, #1c1d24)" }}>
          {selectedNode ? (
            <NodeDetailPanel
              node={selectedNode}
              edges={selectedEdges}
              neighbours={neighbours}
              {...(selectedHistory ? { history: selectedHistory } : {})}
              onNavigate={handleNavigate}
              style={{ height: "100%" }}
            />
          ) : (
            <EmptyState
              title="NO SELECTION"
              description="Click a node in the graph, a type in the rail, or a search result to inspect it."
              style={{ height: "100%", minHeight: 240 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Re-export the memory status type so callers can type filter values.
export type { MemoryStatus } from "./memory-types";
