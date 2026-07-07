import type { CSSProperties, ReactNode } from "react";
import { EmptyState } from "../../molecules/EmptyState/EmptyState";
import { NodeListItem } from "../../molecules/NodeListItem/NodeListItem";
import type { MemoryNode, PendingVerdict } from "../MemoryExplorer/memory-types";

export type { PendingVerdict } from "../MemoryExplorer/memory-types";

const VERDICTS: { key: PendingVerdict; label: string; color: string }[] = [
  { key: "approve", label: "✓", color: "var(--bx-accent, #46c66d)" },
  { key: "reject", label: "✕", color: "#ff6b6f" },
  { key: "supersede", label: "↗", color: "#f2c94c" },
  { key: "archive", label: "▽", color: "#7b8290" },
];

export interface PendingQueueProps {
  /** Proposed nodes awaiting the owner's verdict (the consent gate, I1/I4). */
  items: readonly MemoryNode[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Owner's verdict on a proposed node. */
  onVerdict?: (id: string, verdict: PendingVerdict) => void;
  /** Optional header node rendered above the list (e.g. a count strip). */
  header?: ReactNode;
  style?: CSSProperties;
}

/**
 * The consent queue: a list of proposed nodes (`NodeListItem`) each with the
 * four owner verdicts — approve / reject / supersede / archive (I5: compound
 * verdicts run ordered + audited by the caller's `Store.decide`). Purely
 * presentational: the host owns the queue and routes verdicts to `Store`.
 */
export function PendingQueue({ items, selectedId, onSelect, onVerdict, header, style }: PendingQueueProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-2, #0b0d10)",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        ...style,
      }}
    >
      <div
        style={{
          padding: "9px 12px",
          borderBottom: "1px solid var(--bx-border, #1c1d24)",
          color: "#f2c94c",
          fontSize: 11,
          letterSpacing: "0.08em",
        }}
      >
        PENDING · {items.length}
      </div>
      {header}
      {items.length === 0 ? (
        <EmptyState
          title="QUEUE CLEAR"
          description="Nothing awaits your verdict."
          art={null}
          style={{ minHeight: 120 }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.map((n) => (
            <div
              key={n.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: "1px solid var(--bx-border, #1c1d24)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <NodeListItem node={n} selected={selectedId === n.id} {...(onSelect ? { onSelect } : {})} />
              </div>
              {onVerdict && (
                <div style={{ display: "flex", gap: 4, paddingRight: 8 }}>
                  {VERDICTS.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      aria-label={`${v.key} ${n.title}`}
                      title={v.key}
                      onClick={() => onVerdict(n.id, v.key)}
                      style={{
                        fontFamily: "inherit",
                        fontSize: 12,
                        width: 24,
                        height: 24,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "transparent",
                        border: `1px solid var(--bx-border, #1c1d24)`,
                        color: v.color,
                        cursor: "pointer",
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
