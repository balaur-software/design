import type { CSSProperties, KeyboardEvent } from "react";
import { ImportanceMeter } from "../../atoms/ImportanceMeter/ImportanceMeter";
import { NodeTypeTag } from "../../atoms/NodeTypeTag/NodeTypeTag";
import { StatusGlyph } from "../../atoms/StatusGlyph/StatusGlyph";
import { SurfacingIndicator } from "../../atoms/SurfacingIndicator/SurfacingIndicator";
import type { MemoryNode } from "../../organisms/MemoryExplorer/memory-types";

export type { MemoryNode } from "../../organisms/MemoryExplorer/memory-types";

const faint = "#3f424d";
const label: CSSProperties = { color: "#5b616e", fontSize: 10, letterSpacing: "0.08em" };

function fmtDate(iso: string): string {
  // ISO-8601 UTC — show the date + HH:MM slice.
  return iso.length >= 16 ? iso.slice(0, 16).replace("T", " ") : iso;
}

export interface NodeCardProps {
  node: MemoryNode;
  /** Click the whole card (e.g. navigate to the node). */
  onClick?: () => void;
  style?: CSSProperties;
}

/**
 * A full summary card for one memory node: title, type tag, status glyph,
 * importance meter, surfacing policy, scheduled moment + created/updated,
 * provenance, use count. The detail panel and the consent queue both reuse it.
 */
export function NodeCard({ node, onClick, style }: NodeCardProps) {
  return (
    <div
      {...(onClick
        ? {
            role: "button",
            tabIndex: 0,
            onClick,
            onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                // Prevent Space from scrolling the page (native button semantics).
                e.preventDefault();
                onClick();
              }
            },
          }
        : {})}
      style={{
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-3, #0c0d11)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        cursor: onClick ? "pointer" : "default",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <StatusGlyph status={node.status} size={16} />
        <span
          style={{
            color: "var(--bx-text-1, #f4f6fb)",
            fontSize: 15,
            lineHeight: 1.3,
            flex: 1,
            minWidth: 0,
            wordBreak: "break-word",
          }}
        >
          {node.title}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <NodeTypeTag type={node.type} />
        <ImportanceMeter importance={node.importance} />
        <SurfacingIndicator surfacing={node.surfacing} showLabel />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11 }}>
        {node.when !== null && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={label}>WHEN</span>
            <span style={{ color: "#9aa0ad" }}>{fmtDate(node.when)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={label}>CREATED</span>
          <span style={{ color: faint }}>{fmtDate(node.created)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={label}>UPDATED</span>
          <span style={{ color: faint }}>{fmtDate(node.updated)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={label}>USE_COUNT</span>
          <span style={{ color: faint }}>{node.useCount}</span>
        </div>
      </div>

      {(node.origin !== "" || node.author !== "") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11 }}>
          {node.origin !== "" && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={label}>ORIGIN</span>
              <span style={{ color: faint }}>{node.origin}</span>
            </div>
          )}
          {node.author !== "" && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={label}>AUTHOR</span>
              <span style={{ color: faint }}>{node.author}</span>
            </div>
          )}
        </div>
      )}

      {node.aliases && node.aliases.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={label}>ALIASES</span>
          {node.aliases.map((a) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
