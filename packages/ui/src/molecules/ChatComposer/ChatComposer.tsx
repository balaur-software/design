import type { CSSProperties, KeyboardEvent } from "react";
import { FillButton } from "../../atoms/FillButton/FillButton";
import { StopButton } from "../../atoms/StopButton/StopButton";
import { useControllableState } from "../../hooks/useControllableState";
import { Textarea } from "../Textarea/Textarea";

export interface ChatComposerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** True while the agent is generating — shows Stop instead of Send. */
  streaming?: boolean;
  /** Fired on Enter (no shift) with the trimmed text. Clear is the caller's job. */
  onSend: (text: string) => void;
  /** Fired when Stop is pressed. */
  onStop?: () => void;
  /** Show the attach hint row. */
  attachHint?: string;
  /** Show the slash-command hint. */
  slashHint?: boolean;
  placeholder?: string;
  style?: CSSProperties;
}

/**
 * The chat input: a `Textarea` + a Send/Stop toggle (by `streaming`) + optional
 * attach and slash-command hints. Enter sends, Shift+Enter inserts a newline.
 * The textarea is disabled while `streaming` (except the Stop button).
 */
export function ChatComposer({
  value,
  defaultValue = "",
  onValueChange,
  streaming = false,
  onSend,
  onStop,
  attachHint,
  slashHint = true,
  placeholder = "type a message…  (enter to send, shift+enter for newline)",
  style,
}: ChatComposerProps) {
  const [text, setText] = useControllableState(value, defaultValue, onValueChange);

  const send = () => {
    const trimmed = text.trim();
    if (trimmed && !streaming) {
      onSend(trimmed);
      setText("");
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 12,
        borderTop: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-1, #0a0b0e)",
        ...style,
      }}
    >
      <Textarea
        value={text}
        onChange={setText}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={streaming}
        maxLength={8000}
        hint=""
        style={{ minHeight: 64 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "var(--bx-text-6, #5b616e)",
            fontSize: 11,
          }}
        >
          {slashHint && (
            <span style={{ border: "1px solid var(--bx-border, #1c1d24)", padding: "1px 5px" }}>/</span>
          )}
          {attachHint && <span>📎 {attachHint}</span>}
        </div>
        {streaming ? (
          <StopButton {...(onStop ? { onClick: onStop } : {})} />
        ) : (
          <FillButton onClick={send} disabled={!text.trim()}>
            send ▸
          </FillButton>
        )}
      </div>
    </div>
  );
}
