import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ChatMessage } from "../../molecules/ChatMessage/ChatMessage";
import { EmptyState } from "../../molecules/EmptyState/EmptyState";
import { TypingIndicator } from "../../molecules/TypingIndicator/TypingIndicator";
import type { Agent, ChatMessageData } from "../ChatPanel/chat-types";

export interface ChatThreadProps {
  messages: ChatMessageData[];
  /** Indexed by id; used to resolve `agentId` on agent messages. */
  agents?: Record<string, Agent>;
  /** Show the typing indicator at the bottom (agent producing first block). */
  streaming?: boolean;
  onArtifactOpen?: (id: string) => void;
  style?: CSSProperties;
}

/**
 * The scrollable message list. Auto-follows the bottom when new content arrives
 * unless the user has scrolled up — in which case a "↓ jump to latest" button
 * appears. Shows `TypingIndicator` while `streaming`. Empty thread renders an
 * `EmptyState` prompt.
 */
export function ChatThread({ messages, agents, streaming = false, onArtifactOpen, style }: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  // Auto-follow: when atBottom and messages/streaming change, snap to bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && atBottom) el.scrollTop = el.scrollHeight;
  }, [messages, streaming, atBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(distance < 40);
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setAtBottom(true);
  };

  if (messages.length === 0 && !streaming) {
    return (
      <EmptyState title="NO MESSAGES" description="Start a conversation — the agent will respond here." />
    );
  }

  return (
    <div style={{ position: "relative", height: "100%", ...style }}>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{
          overflowY: "auto",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          padding: 18,
        }}
      >
        {messages.map((m) => {
          const agent = m.agentId ? agents?.[m.agentId] : undefined;
          return (
            <ChatMessage
              key={m.id}
              message={m}
              {...(agent ? { agent } : {})}
              {...(onArtifactOpen ? { onArtifactOpen } : {})}
            />
          );
        })}
        {streaming && <TypingIndicator />}
      </div>
      {!atBottom && (
        <button
          type="button"
          onClick={jumpToLatest}
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            fontFamily: "var(--bx-font-mono, ui-monospace, monospace)",
            fontSize: 11,
            padding: "5px 10px",
            background: "var(--bx-surface-2, #15161e)",
            border: "1px solid var(--bx-border-accent, #2a3320)",
            color: "var(--bx-accent, #46c66d)",
            cursor: "pointer",
          }}
        >
          ↓ latest
        </button>
      )}
    </div>
  );
}
