import type { CSSProperties, ReactNode } from "react";
import { StreamingCursor } from "../../atoms/StreamingCursor/StreamingCursor";

export type InlineToken =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "link"; text: string; href: string };

/**
 * Minimal inline tokenizer for text blocks: backtick `code`, **bold**, and
 * bare http(s) URLs as links. No markdown dependency. Unmatched markers stay
 * literal. Returns tokens in source order.
 */
export function tokenizeInline(text: string): InlineToken[] {
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(https?:\/\/[^\s]+)/g;
  const tokens: InlineToken[] = [];
  let last = 0;
  let m: RegExpExecArray | null = re.exec(text);
  while (m !== null) {
    if (m.index > last) tokens.push({ kind: "text", text: text.slice(last, m.index) });
    const seg = m[0];
    if (seg.startsWith("`")) tokens.push({ kind: "code", text: seg.slice(1, -1) });
    else if (seg.startsWith("**")) tokens.push({ kind: "bold", text: seg.slice(2, -2) });
    else tokens.push({ kind: "link", text: seg, href: seg });
    last = m.index + seg.length;
    m = re.exec(text);
  }
  if (last < text.length) tokens.push({ kind: "text", text: text.slice(last) });
  return tokens;
}

function renderInline(text: string): ReactNode[] {
  return tokenizeInline(text).map((t, i) => {
    switch (t.kind) {
      case "code":
        return (
          <code
            key={i}
            style={{
              fontFamily: "var(--bx-font-mono, ui-monospace, monospace)",
              background: "var(--bx-surface-2, #15161e)",
              border: "1px solid var(--bx-border, #1c1d24)",
              padding: "0 4px",
              fontSize: "0.92em",
              color: "var(--bx-accent, #46c66d)",
            }}
          >
            {t.text}
          </code>
        );
      case "bold":
        return (
          <strong key={i} style={{ color: "var(--bx-text-1, #f4f6fb)" }}>
            {t.text}
          </strong>
        );
      case "link":
        return (
          <a key={i} href={t.href} style={{ color: "var(--bx-accent, #46c66d)" }}>
            {t.text}
          </a>
        );
      default:
        return <span key={i}>{t.text}</span>;
    }
  });
}

export interface TextBlockProps {
  text: string;
  /** Append a blinking StreamingCursor (for in-progress stream text). */
  streaming?: boolean;
  style?: CSSProperties;
}

/**
 * Renders a text block with minimal inline formatting — `code`, **bold**, and
 * bare URLs as links — across `text.split("\n")` lines. When `streaming`, a
 * `StreamingCursor` sits at the end of the last line. No markdown dependency.
 */
export function TextBlock({ text, streaming = false, style }: TextBlockProps) {
  const lines = text.split("\n");
  const body: CSSProperties = {
    color: "var(--bx-text-2, #dfe3ea)",
    fontSize: 13,
    lineHeight: 1.55,
    fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    ...style,
  };
  return (
    <div style={body}>
      {lines.map((line, i) => (
        <div key={i}>
          {renderInline(line)}
          {streaming && i === lines.length - 1 && <StreamingCursor />}
        </div>
      ))}
    </div>
  );
}
