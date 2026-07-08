import type { CSSProperties } from "react";

export type AttachmentKind = "code" | "document" | "image";

/** App-owned upload lifecycle. Absent/`"ready"` renders no dot. */
export type AttachmentStatus = "pending" | "ready" | "error";

const ICON: Record<AttachmentKind, string> = {
  code: "{ }",
  document: "¶",
  image: "▦",
};

const STATUS_DOT: Partial<Record<AttachmentStatus, { color: string; label: string }>> = {
  pending: { color: "var(--bx-ansi-3, #f2c94c)", label: "pending" },
  error: { color: "var(--bx-ansi-9, #ff6b6f)", label: "error" },
};

/** 1234 → "1.2 KB" — byte counts formatted for the chip's size slot. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb >= 10 ? Math.round(kb) : kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
}

export interface AttachmentChipProps {
  id: string;
  name: string;
  kind: AttachmentKind;
  /** Byte size; the chip formats it (B/KB/MB) for display. */
  size?: number;
  /** `pending`/`error` render a coloured status dot; absent/`ready` is neutral. */
  status?: AttachmentStatus;
  /** Fired by the chip's separate × control with the attachment id. */
  onRemove?: (id: string) => void;
  /** Optional body click (e.g. open a preview) — independent of the remove control. */
  onClick?: () => void;
  style?: CSSProperties;
}

/**
 * A composer-attachment chip: type glyph + name + optional formatted size +
 * status dot + a separate remove button. Unlike `ArtifactChip` (one big click
 * target), this chip hosts two independently-clickable regions: the body
 * (optional `onClick`) and the × control (`onRemove(id)`).
 */
export function AttachmentChip({
  id,
  name,
  kind,
  size,
  status,
  onRemove,
  onClick,
  style,
}: AttachmentChipProps) {
  const dot = status ? STATUS_DOT[status] : undefined;

  const body = (
    <>
      <span aria-hidden="true" style={{ color: "var(--bx-accent, #46c66d)" }}>
        {ICON[kind]}
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      {size !== undefined && (
        <span style={{ color: "var(--bx-text-6, #5b616e)", flex: "none" }}>{formatSize(size)}</span>
      )}
    </>
  );

  const bodyStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    fontFamily: "inherit",
    fontSize: "inherit",
    background: "transparent",
    border: 0,
    padding: 0,
    color: "inherit",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: 12,
        padding: "5px 6px 5px 10px",
        background: "var(--bx-surface-2, #0b0d10)",
        border: "1px solid var(--bx-border, #1c1d24)",
        color: "var(--bx-text-3, #c8cdd6)",
        maxWidth: 260,
        ...style,
      }}
    >
      {onClick ? (
        <button type="button" onClick={onClick} style={{ ...bodyStyle, cursor: "pointer" }}>
          {body}
        </button>
      ) : (
        <span style={bodyStyle}>{body}</span>
      )}
      {dot && (
        <span
          role="img"
          aria-label={dot.label}
          style={{ color: dot.color, fontSize: 8, lineHeight: 1, flex: "none" }}
        >
          ●
        </span>
      )}
      <button
        type="button"
        aria-label={`remove ${name}`}
        onClick={() => onRemove?.(id)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          flex: "none",
          fontFamily: "inherit",
          fontSize: 12,
          lineHeight: 1,
          background: "transparent",
          border: 0,
          color: "var(--bx-text-6, #5b616e)",
          cursor: "pointer",
        }}
      >
        ×
      </button>
    </span>
  );
}
