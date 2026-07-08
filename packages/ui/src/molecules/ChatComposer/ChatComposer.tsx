import {
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type SyntheticEvent,
  useId,
  useRef,
  useState,
} from "react";
import { AttachmentChip } from "../../atoms/AttachmentChip/AttachmentChip";
import { FillButton } from "../../atoms/FillButton/FillButton";
import { StopButton } from "../../atoms/StopButton/StopButton";
import { useControllableState } from "../../hooks/useControllableState";
import type { ComposerAttachment, SlashCommand } from "../../organisms/ChatPanel/chat-types";
import { FloatingPanel } from "../../primitives";
import { Textarea } from "../Textarea/Textarea";
import { getLeadingSlashQuery } from "./slash-query";

export interface ChatComposerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** True while the agent is generating — shows Stop instead of Send. */
  streaming?: boolean;
  /**
   * Fired on Enter (no shift) with the trimmed text. Clear is the caller's job.
   * `attachments` is only passed when non-empty; existing 1-arg handlers are unaffected.
   */
  onSend: (text: string, attachments?: readonly ComposerAttachment[]) => void;
  /** Fired when Stop is pressed. */
  onStop?: () => void;
  /** Controlled: the app owns the attachment queue end to end. */
  attachments?: readonly ComposerAttachment[];
  /** Renders a hidden native file input behind the paperclip trigger. */
  onFiles?: (files: File[]) => void;
  /** Custom picker escape hatch; wins over `onFiles` if both are set. */
  onAttachRequest?: () => void;
  onRemoveAttachment?: (id: string) => void;
  /** Non-empty enables the slash-menu affordance and its FloatingPanel. */
  commands?: readonly SlashCommand[];
  /** Fired with the command id when a slash command is committed. */
  onCommand?: (id: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}

/**
 * The chat input: a `Textarea` + a Send/Stop toggle (by `streaming`), an
 * app-controlled attachment-chip row, a paperclip attach trigger (native
 * hidden file input via `onFiles`, or a custom picker via `onAttachRequest`),
 * and a slash-command menu (`commands`) anchored under the textarea. Enter
 * sends, Shift+Enter inserts a newline; while the menu is open ↓/↑ move the
 * highlight (clamped), Enter commits the highlighted command (removing the
 * `/query` token), and Escape closes without commit. The textarea is disabled
 * while `streaming` (except the Stop button). OCTANT never reads file bytes —
 * `File` handles are forwarded to the app untouched, and the app passes the
 * resulting `attachments` back down.
 */
export function ChatComposer({
  value,
  defaultValue = "",
  onValueChange,
  streaming = false,
  onSend,
  onStop,
  attachments = [],
  onFiles,
  onAttachRequest,
  onRemoveAttachment,
  commands = [],
  onCommand,
  placeholder = "type a message…  (enter to send, shift+enter for newline)",
  style,
}: ChatComposerProps) {
  const [text, setText] = useControllableState(value, defaultValue, onValueChange);
  const [caret, setCaret] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  const slashEnabled = commands.length > 0;
  const query = slashEnabled && !streaming ? getLeadingSlashQuery(text, caret) : null;
  const open = query !== null && !dismissed;
  const filtered =
    query !== null ? commands.filter((c) => c.name.toLowerCase().startsWith(query.toLowerCase())) : [];
  const activeIndex = filtered.length > 0 ? Math.min(active, filtered.length - 1) : -1;

  const handleValueChange = (next: string) => {
    setText(next);
    // A new keystroke re-arms the menu and resets the highlight.
    setDismissed(false);
    setActive(0);
  };

  const trackCaret = (e: SyntheticEvent<HTMLTextAreaElement>) => {
    setCaret(e.currentTarget.selectionStart ?? 0);
  };

  const send = () => {
    const trimmed = text.trim();
    if (trimmed && !streaming) {
      if (attachments.length > 0) onSend(trimmed, attachments);
      else onSend(trimmed);
      setText("");
    }
  };

  /** Commit the highlighted command: strip the `/query` token, then report the id. */
  const commit = (index: number) => {
    const cmd = filtered[index];
    if (!cmd) return;
    const lineStart = text.lastIndexOf("\n", caret - 1) + 1;
    handleValueChange(text.slice(0, lineStart) + text.slice(caret));
    onCommand?.(cmd.id);
  };

  const attach = () => {
    if (onAttachRequest) {
      onAttachRequest();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) onFiles?.(Array.from(files));
    // Reset so re-selecting the same file still fires `change`.
    e.currentTarget.value = "";
  };

  const showPaperclip = Boolean(onFiles || onAttachRequest);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open) {
      if (e.key === "ArrowDown" && filtered.length > 0) {
        e.preventDefault();
        setActive(Math.min(filtered.length - 1, activeIndex + 1));
        return;
      }
      if (e.key === "ArrowUp" && filtered.length > 0) {
        e.preventDefault();
        setActive(Math.max(0, activeIndex - 1));
        return;
      }
      if (e.key === "Enter" && !e.shiftKey && filtered.length > 0) {
        e.preventDefault();
        commit(activeIndex);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setDismissed(true);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const textarea = (
    <Textarea
      value={text}
      onChange={handleValueChange}
      onKeyDown={onKeyDown}
      onKeyUp={trackCaret}
      onSelect={trackCaret}
      placeholder={placeholder}
      disabled={streaming}
      maxLength={8000}
      hint=""
      style={{ minHeight: 64 }}
      {...(slashEnabled
        ? {
            role: "combobox" as const,
            "aria-haspopup": "listbox" as const,
            "aria-autocomplete": "list" as const,
            "aria-expanded": open,
            "aria-controls": open ? listboxId : undefined,
            "aria-activedescendant": open && activeIndex >= 0 ? `${baseId}-opt-${activeIndex}` : undefined,
          }
        : {})}
    />
  );

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
      {attachments.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {attachments.map((a) => (
            <AttachmentChip
              key={a.id}
              id={a.id}
              name={a.name}
              kind={a.kind}
              {...(a.size !== undefined ? { size: a.size } : {})}
              {...(a.status ? { status: a.status } : {})}
              {...(onRemoveAttachment ? { onRemove: onRemoveAttachment } : {})}
            />
          ))}
        </div>
      )}
      {slashEnabled ? (
        <FloatingPanel
          open={open}
          onOpenChange={(next) => {
            if (!next) setDismissed(true);
          }}
          role="listbox"
          panelId={listboxId}
          width={280}
          ariaLabel="slash commands"
          panelStyle={{
            background: "var(--bx-surface-3, #0c0d11)",
            border: "1px solid var(--bx-border, #1c1d24)",
            overflow: "hidden",
          }}
          trigger={textarea}
        >
          {filtered.map((c, i) => (
            <button
              key={c.id}
              id={`${baseId}-opt-${i}`}
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => commit(i)}
              onPointerEnter={() => setActive(i)}
              onPointerMove={() => setActive(i)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "baseline",
                gap: 10,
                textAlign: "left",
                fontFamily: "inherit",
                fontSize: 13,
                padding: "8px 12px",
                background: i === activeIndex ? "var(--bx-surface-6, #15161e)" : "transparent",
                border: 0,
                color: "var(--bx-text-3, #c8cdd6)",
                cursor: "pointer",
              }}
            >
              {c.glyph && (
                <span aria-hidden="true" style={{ color: "var(--bx-accent, #46c66d)" }}>
                  {c.glyph}
                </span>
              )}
              <span>/{c.name}</span>
              {c.hint && <span style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 12 }}>{c.hint}</span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "10px 12px", color: "var(--bx-text-7, #3f424d)", fontSize: 12 }}>
              no matching command
            </div>
          )}
        </FloatingPanel>
      ) : (
        textarea
      )}
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
          {showPaperclip && (
            <button
              type="button"
              aria-label="attach files"
              onClick={attach}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
                fontSize: 11,
                padding: "1px 5px",
                background: "transparent",
                border: "1px solid var(--bx-border, #1c1d24)",
                color: "var(--bx-text-6, #5b616e)",
                cursor: "pointer",
              }}
            >
              📎
            </button>
          )}
          {onFiles && !onAttachRequest && (
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: "none" }}
              aria-hidden="true"
              tabIndex={-1}
            />
          )}
          {slashEnabled && (
            <span style={{ border: "1px solid var(--bx-border, #1c1d24)", padding: "1px 5px" }}>/</span>
          )}
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
