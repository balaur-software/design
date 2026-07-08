import type { CSSProperties } from "react";

export type ArtifactKind = "code" | "document" | "image";

const ICON: Record<ArtifactKind, string> = {
  code: "{ }",
  document: "¶",
  image: "▦",
};

export interface ArtifactChipProps {
  kind: ArtifactKind;
  title: string;
  onClick?: () => void;
  style?: CSSProperties;
}

/**
 * A small clickable chip representing an artifact: a type glyph + title. The
 * whole chip is the click target. Pure static markup.
 */
export function ArtifactChip({ kind, title, onClick, style }: ArtifactChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: 12,
        padding: "5px 10px",
        background: "var(--bx-surface-2, #0b0d10)",
        border: "1px solid var(--bx-border, #1c1d24)",
        color: "var(--bx-text-3, #c8cdd6)",
        cursor: onClick ? "pointer" : "default",
        maxWidth: 240,
        ...style,
      }}
    >
      <span aria-hidden="true" style={{ color: "var(--bx-accent, #46c66d)" }}>
        {ICON[kind]}
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
    </button>
  );
}
