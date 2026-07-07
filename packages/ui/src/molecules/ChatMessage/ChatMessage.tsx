import { type CSSProperties, Fragment } from "react";
import { AgentGlyph } from "../../atoms/AgentGlyph/AgentGlyph";
import { CellAvatar } from "../../atoms/CellAvatar/CellAvatar";
import type { Agent, ChatBlockRenderer, ChatMessageData } from "../../organisms/ChatPanel/chat-types";
import { BlockRenderer } from "../BlockRenderer/BlockRenderer";

export interface ChatMessageProps {
  message: ChatMessageData;
  /** The agent that produced this message, if `role === "agent"` and `agentId` is set. */
  agent?: Agent;
  onArtifactOpen?: (id: string) => void;
  /** Per-block render override; falls back to `BlockRenderer` when it returns nullish. */
  renderBlock?: ChatBlockRenderer;
  style?: CSSProperties;
}

/**
 * One chat message row: an avatar (CellAvatar for user/tool/system, AgentGlyph
 * for a named agent) + name + time + the block list via `BlockRenderer`. Agent
 * messages are accent-tinted and left-aligned; user messages neutral and
 * right-aligned; system centered/dimmed; tool left-aligned with a tool avatar.
 * An `error` status paints a red hairline + ERR badge. Pure render.
 */
export function ChatMessage({ message, agent, onArtifactOpen, renderBlock, style }: ChatMessageProps) {
  const isAgent = message.role === "agent";
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isTool = message.role === "tool";
  const errored = message.status === "error";

  const avatar =
    isAgent && agent ? (
      <AgentGlyph agent={agent} size={13} showLabel={false} />
    ) : (
      <CellAvatar kind={isUser ? "user" : isTool ? "tool" : "system"} size={13} />
    );

  const name =
    message.name ?? (isAgent ? (agent?.name ?? "AGENT") : isUser ? "USER" : isTool ? "TOOL" : "SYSTEM");

  if (isSystem) {
    return (
      <div
        style={{
          textAlign: "center",
          color: "var(--bx-text-6, #5b616e)",
          fontSize: 11,
          padding: "6px 0",
          fontFamily: "var(--bx-font-mono, ui-monospace, monospace)",
          ...style,
        }}
      >
        {message.blocks.map((b, i) =>
          b.type === "text" ? <div key={i}>{b.text}</div> : <BlockRenderer key={i} block={b} />,
        )}
      </div>
    );
  }

  const bubble = (
    <div
      style={{
        maxWidth: "82%",
        minWidth: 0,
        border: `1px solid ${
          errored
            ? "var(--bx-border-red, #3a2020)"
            : isAgent
              ? "var(--bx-border-accent, #2a3320)"
              : "var(--bx-border, #1c1d24)"
        }`,
        background: isAgent ? "#0e140e" : "#12131a",
        padding: "11px 13px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 9, alignItems: "baseline", fontSize: 11 }}>
        <span
          style={{
            color: isAgent ? "var(--bx-accent, #46c66d)" : "var(--bx-text-4, #9aa0ad)",
            letterSpacing: "0.08em",
          }}
        >
          {name}
        </span>
        {errored && (
          <span
            style={{ color: "#ff6b6f", border: "1px solid var(--bx-border-red, #3a2020)", padding: "0 5px" }}
          >
            ERR
          </span>
        )}
        {message.time != null && <span style={{ color: "#3f424d" }}>{message.time}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {message.blocks.map((block, i) => {
          const custom = renderBlock?.(block);
          return (
            <Fragment key={i}>
              {custom ?? <BlockRenderer block={block} {...(onArtifactOpen ? { onArtifactOpen } : {})} />}
            </Fragment>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        justifyContent: isUser ? "flex-end" : "flex-start",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        ...style,
      }}
    >
      {isUser ? (
        <>
          {bubble}
          {avatar}
        </>
      ) : (
        <>
          {avatar}
          {bubble}
        </>
      )}
    </div>
  );
}
