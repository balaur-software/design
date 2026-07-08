import type { CSSProperties } from "react";
import { ArtifactChip } from "../../atoms/ArtifactChip/ArtifactChip";
import type { Block } from "../../organisms/ChatPanel/chat-types";
import { CodeBlock } from "../CodeBlock/CodeBlock";

type ArtifactBlockData = Extract<Block, { type: "artifact" }>;

export interface ArtifactPanelProps {
  block: ArtifactBlockData;
  onOpen?: (id: string) => void;
  /** Max height for the preview body before it clips. Default 240. */
  previewMaxHeight?: number;
  style?: CSSProperties;
}

/**
 * An artifact card: an `ArtifactChip` header (clickable → `onOpen`) plus a
 * preview body — `CodeBlock` for code artifacts, preformatted text for
 * documents, and a glyph placeholder for images. Pure static markup.
 */
export function ArtifactPanel({ block, onOpen, previewMaxHeight = 240, style }: ArtifactPanelProps) {
  return (
    <div
      style={{
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-2, #0b0d10)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px",
          borderBottom: "1px solid var(--bx-border, #1c1d24)",
        }}
      >
        <ArtifactChip
          kind={block.kind}
          title={block.title}
          {...(onOpen ? { onClick: () => onOpen(block.id) } : {})}
        />
        {onOpen && (
          <button
            type="button"
            onClick={() => onOpen(block.id)}
            style={{
              fontFamily: "inherit",
              fontSize: 12,
              background: "transparent",
              border: 0,
              color: "var(--bx-accent, #46c66d)",
              cursor: "pointer",
            }}
          >
            open ↗
          </button>
        )}
      </div>
      {/* Focusable so keyboard users can scroll a clipped preview (WCAG 2.1.1). */}
      <div
        role="region"
        aria-label={block.title}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG 2.1.1 — a clipped scrollable region must be keyboard-focusable (axe: scrollable-region-focusable)
        tabIndex={0}
        style={{
          // `Infinity` (= "unclipped") is not a valid CSS length — omit maxHeight instead.
          ...(Number.isFinite(previewMaxHeight) ? { maxHeight: previewMaxHeight } : {}),
          overflow: "auto",
          padding: 8,
        }}
      >
        {block.kind === "code" ? (
          <CodeBlock {...(block.language ? { lang: block.language } : {})}>{block.content}</CodeBlock>
        ) : block.kind === "document" ? (
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              color: "var(--bx-text-3, #c8cdd6)",
              fontSize: 13,
              fontFamily: "var(--bx-font-mono, ui-monospace, monospace)",
            }}
          >
            {block.content}
          </pre>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 120,
              color: "var(--bx-text-6, #5b616e)",
              fontFamily: "var(--bx-font-mono, ui-monospace, monospace)",
            }}
          >
            ▦ image artifact
          </div>
        )}
      </div>
    </div>
  );
}
