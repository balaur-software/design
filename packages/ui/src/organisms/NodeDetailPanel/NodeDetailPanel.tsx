import { type CSSProperties, type ReactNode, useState } from "react";
import { EdgeRow } from "../../molecules/EdgeRow/EdgeRow";
import { EmptyState } from "../../molecules/EmptyState/EmptyState";
import { NodeCard } from "../../molecules/NodeCard/NodeCard";
import type { MemoryEdge, MemoryHistorySnapshot, MemoryNode } from "../MemoryExplorer/memory-types";

type TabKey = "edges" | "provenance" | "history";

const TABS: { key: TabKey; label: string }[] = [
  { key: "edges", label: "EDGES" },
  { key: "provenance", label: "PROVENANCE" },
  { key: "history", label: "HISTORY" },
];

const label: CSSProperties = { color: "#5b616e", fontSize: 10, letterSpacing: "0.08em" };
const row: CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 12 };

function fmtDate(iso: string | null): string {
  if (iso === null) return "—";
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

export interface NodeDetailPanelProps {
  node: MemoryNode;
  /** All edges touching the node (in + out). */
  edges: readonly MemoryEdge[];
  /** Lookup for neighbour node titles (id → node). */
  neighbours: ReadonlyMap<string, MemoryNode>;
  /** Pre-mutation history snapshots (TEMPORAL.md). */
  history?: readonly MemoryHistorySnapshot[];
  /** Navigate to a neighbour by id (clicked edge or alias). */
  onNavigate?: (id: string) => void;
  style?: CSSProperties;
}

/**
 * The right-rail detail panel for the selected memory node: a `NodeCard`
 * header, then a lightweight inline tab strip (Edges / Provenance / History).
 * Edges group into outgoing + incoming `EdgeRow`s; Provenance shows origin,
 * author, and aliases; History lists pre-mutation snapshots. Purely
 * presentational — the caller supplies the node, its edges, neighbours, and
 * history from `Store` reads.
 */
export function NodeDetailPanel({
  node,
  edges,
  neighbours,
  history,
  onNavigate,
  style,
}: NodeDetailPanelProps) {
  const [tab, setTab] = useState<TabKey>("edges");

  const outgoing = edges.filter((e) => e.source === node.id);
  const incoming = edges.filter((e) => e.target === node.id);
  const titleOf = (id: string) => neighbours.get(id)?.title ?? id;

  let body: ReactNode;
  if (tab === "edges") {
    body =
      outgoing.length === 0 && incoming.length === 0 ? (
        <EmptyState title="NO EDGES" description="This node has no links yet." art={null} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {outgoing.length > 0 && (
            <>
              <div style={{ ...label, padding: "6px 10px" }}>OUTGOING · {outgoing.length}</div>
              {outgoing.map((e) => (
                <EdgeRow
                  key={e.id}
                  edge={e}
                  fromTitle={node.title}
                  toTitle={titleOf(e.target)}
                  outgoing
                  {...(onNavigate ? { onClick: onNavigate } : {})}
                />
              ))}
            </>
          )}
          {incoming.length > 0 && (
            <>
              <div style={{ ...label, padding: "6px 10px", marginTop: 8 }}>INCOMING · {incoming.length}</div>
              {incoming.map((e) => (
                <EdgeRow
                  key={e.id}
                  edge={e}
                  fromTitle={titleOf(e.source)}
                  toTitle={node.title}
                  outgoing={false}
                  {...(onNavigate ? { onClick: onNavigate } : {})}
                />
              ))}
            </>
          )}
        </div>
      );
  } else if (tab === "provenance") {
    const aliases = node.aliases ?? [];
    body = (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 10px 10px" }}>
        <div style={row}>
          <span style={label}>ORIGIN</span>
          <span style={{ color: "#9aa0ad" }}>{node.origin || "—"}</span>
        </div>
        <div style={row}>
          <span style={label}>AUTHOR</span>
          <span style={{ color: "#9aa0ad" }}>{node.author || "owner"}</span>
        </div>
        <div style={row}>
          <span style={label}>CREATED</span>
          <span style={{ color: "#9aa0ad" }}>{fmtDate(node.created)}</span>
        </div>
        <div style={row}>
          <span style={label}>UPDATED</span>
          <span style={{ color: "#9aa0ad" }}>{fmtDate(node.updated)}</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
          <span style={label}>ALIASES</span>
          {aliases.length === 0 ? (
            <span style={{ color: "#3f424d", fontSize: 12 }}>none</span>
          ) : (
            aliases.map((a) => (
              <span
                key={a}
                style={{
                  fontSize: 11,
                  color: "#7b8290",
                  border: "1px solid var(--bx-border, #1c1d24)",
                  padding: "1px 6px",
                }}
              >
                {a}
              </span>
            ))
          )}
        </div>
      </div>
    );
  } else {
    body =
      !history || history.length === 0 ? (
        <EmptyState
          title="NO HISTORY"
          description="Pre-mutation snapshots appear here (TEMPORAL.md)."
          art={null}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {history.map((h) => (
            <div
              key={h.seq}
              style={{
                padding: "8px 10px",
                borderBottom: "1px solid var(--bx-border, #1c1d24)",
                fontSize: 12,
                color: "var(--bx-text-4, #9aa0ad)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={label}>{h.action.toUpperCase()}</span>
                <span style={{ color: "#3f424d" }}>{fmtDate(h.at)}</span>
              </div>
              <div style={{ color: "var(--bx-text-2, #dfe3ea)", marginTop: 3 }}>{h.title}</div>
              <div style={{ color: "#5b616e", marginTop: 2 }}>
                {h.actor} · {fmtDate(h.when)}
              </div>
            </div>
          ))}
        </div>
      );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-2, #0b0d10)",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        ...style,
      }}
    >
      <NodeCard node={node} {...(onNavigate ? { onClick: () => onNavigate(node.id) } : {})} />
      <div style={{ display: "flex", borderBottom: "1px solid var(--bx-border, #1c1d24)" }}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                fontFamily: "inherit",
                fontSize: 11,
                letterSpacing: "0.08em",
                padding: "10px 8px",
                background: "transparent",
                border: 0,
                borderBottom: `2px solid ${on ? "var(--bx-accent, #46c66d)" : "transparent"}`,
                color: on ? "var(--bx-text-1, #f4f6fb)" : "#5b616e",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>{body}</div>
    </div>
  );
}
