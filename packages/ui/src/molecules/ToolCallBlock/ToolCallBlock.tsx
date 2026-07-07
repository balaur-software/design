import { type CSSProperties, useState } from "react";
import { ToolPill } from "../../atoms/ToolPill/ToolPill";
import type { Block } from "../../organisms/ChatPanel/chat-types";
import { CodeBlock } from "../CodeBlock/CodeBlock";

type ToolCallBlockData = Extract<Block, { type: "tool_call" }>;

export interface ToolCallBlockProps {
  block: ToolCallBlockData;
  style?: CSSProperties;
}

function fmtJson(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2) ?? String(v);
  } catch {
    return String(v);
  }
}

/**
 * Format a tool payload for display. Strings render verbatim (agent tool output
 * is usually multi-line plain text — JSON-encoding it would bury the content
 * behind escaped `\n`s); everything else is pretty-printed JSON.
 */
function fmtPayload(v: unknown): string {
  return typeof v === "string" ? v : fmtJson(v);
}

/** Language tag for the CodeBlock header — plain `text` for string payloads. */
function payloadLang(v: unknown): string {
  return typeof v === "string" ? "text" : "json";
}

function fmtDuration(block: ToolCallBlockData): string | null {
  if (block.startedAt == null || block.endedAt == null) return null;
  return `${block.endedAt - block.startedAt}ms`;
}

/**
 * A collapsible tool-call block: a `ToolPill` header (click to toggle) plus the
 * args and result as `CodeBlock` JSON, and a trailing duration line. Collapses
 * to the pill once `status === "done"`; stays expanded while `running` or on
 * `error`. Local state via `useState`.
 */
export function ToolCallBlock({ block, style }: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(block.status !== "done");
  const dur = fmtDuration(block);
  const errColor = block.status === "error" ? "#ff6b6f" : "var(--bx-text-6, #5b616e)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}>
      <ToolPill
        name={block.name}
        status={block.status}
        expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
      />
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 4 }}>
          {block.args !== undefined && (
            <div>
              <div
                style={{
                  color: "var(--bx-text-6, #5b616e)",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                }}
              >
                ARGS
              </div>
              <CodeBlock lang={payloadLang(block.args)}>{fmtPayload(block.args)}</CodeBlock>
            </div>
          )}
          {block.result !== undefined && (
            <div>
              <div style={{ color: errColor, fontSize: 10, letterSpacing: "0.08em", marginBottom: 4 }}>
                {block.status === "error" ? "ERROR" : "RESULT"}
              </div>
              <CodeBlock lang={payloadLang(block.result)}>{fmtPayload(block.result)}</CodeBlock>
            </div>
          )}
          {dur && <div style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 11 }}>{dur}</div>}
        </div>
      )}
    </div>
  );
}
