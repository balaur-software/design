import { type CSSProperties, useState } from "react";
import { type PresenceItem, PresenceStatus } from "../../atoms/PresenceStatus/PresenceStatus";
import { useControllableState } from "../../hooks/useControllableState";
import { ArtifactPanel } from "../../molecules/ArtifactPanel/ArtifactPanel";
import { ChatComposer } from "../../molecules/ChatComposer/ChatComposer";
import { ChatThread } from "../ChatThread/ChatThread";
import type { Agent, Block, ChatBlockRenderer, ChatMessageData } from "./chat-types";

export interface ChatPanelProps {
  messages: ChatMessageData[];
  /** Indexed by id. */
  agents?: Record<string, Agent>;
  streaming?: boolean;
  /** Artifacts to show in the side panel (filtered to `type === "artifact"`). */
  artifacts?: Block[];
  composerValue?: string;
  defaultComposerValue?: string;
  onComposerValueChange?: (value: string) => void;
  onSend: (text: string) => void;
  onStop?: () => void;
  onArtifactOpen?: (id: string) => void;
  /** Header presence rows. Defaults to a single ONLINE/thinking row. */
  presence?: PresenceItem[];
  /** Per-block render override, forwarded through the thread to each message. */
  renderBlock?: ChatBlockRenderer;
  style?: CSSProperties;
}

type ArtifactBlock = Extract<Block, { type: "artifact" }>;

/**
 * The top-level chat surface: a header (agent name + `PresenceStatus`) +
 * `ChatThread` + `ChatComposer`, plus an optional artifact side panel that
 * lists `ArtifactPanel`s. Owns only UI state (composer value, selected
 * artifact tab); all data and stream state are controlled by the caller.
 */
export function ChatPanel({
  messages,
  agents,
  streaming = false,
  artifacts = [],
  composerValue,
  defaultComposerValue = "",
  onComposerValueChange,
  onSend,
  onStop,
  onArtifactOpen,
  presence,
  renderBlock,
  style,
}: ChatPanelProps) {
  const [composer, setComposer] = useControllableState(
    composerValue,
    defaultComposerValue,
    onComposerValueChange,
  );
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);

  const artifactBlocks = artifacts.filter((a): a is ArtifactBlock => a.type === "artifact");
  const activeArtifact = artifactBlocks.find((a) => a.id === selectedArtifact) ?? artifactBlocks[0];
  const presenceRows: PresenceItem[] = presence ?? [
    { label: streaming ? "THINKING" : "ONLINE", state: streaming ? "thinking" : "online" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: 600,
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-bg, #08080a)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--bx-border, #1c1d24)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
            fontSize: 14,
            color: "var(--bx-text-1, #f4f6fb)",
          }}
        >
          OCTANT · CHAT
        </span>
        <PresenceStatus items={presenceRows} />
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <ChatThread
            messages={messages}
            {...(agents ? { agents } : {})}
            streaming={streaming}
            {...(onArtifactOpen ? { onArtifactOpen } : {})}
            {...(renderBlock ? { renderBlock } : {})}
          />
          <ChatComposer
            value={composer}
            onValueChange={setComposer}
            streaming={streaming}
            onSend={onSend}
            {...(onStop ? { onStop } : {})}
          />
        </div>

        {artifactBlocks.length > 0 && (
          <div
            style={{
              width: 320,
              flex: "none",
              borderLeft: "1px solid var(--bx-border, #1c1d24)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "8px 10px",
                borderBottom: "1px solid var(--bx-border, #1c1d24)",
                overflowX: "auto",
              }}
            >
              {artifactBlocks.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedArtifact(a.id)}
                  style={{
                    fontFamily: "inherit",
                    fontSize: 11,
                    padding: "4px 8px",
                    background: a.id === activeArtifact?.id ? "var(--bx-surface-2, #0b0d10)" : "transparent",
                    border: "1px solid var(--bx-border, #1c1d24)",
                    color:
                      a.id === activeArtifact?.id ? "var(--bx-accent, #46c66d)" : "var(--bx-text-4, #9aa0ad)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.title}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 10 }}>
              {activeArtifact && (
                <ArtifactPanel
                  block={activeArtifact}
                  {...(onArtifactOpen ? { onOpen: onArtifactOpen } : {})}
                  previewMaxHeight={Number.POSITIVE_INFINITY}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
