import { seededRandom } from "@balaur/octant-core";
import { PALETTE } from "@balaur/tokens";
import type { CSSProperties } from "react";

/** Deterministic accent color for a node type, hashed from its name. */
export function typeAccent(type: string): string {
  const rnd = seededRandom(`type:${type}`);
  const idx = Math.floor(rnd() * PALETTE.length) % PALETTE.length;
  // Skip the black / br.black entries (idx 0 and 8) — too dark to read.
  const safe = idx === 0 || idx === 8 ? (idx + 2) % PALETTE.length : idx;
  return PALETTE[safe]?.hex ?? "var(--bx-accent, #46c66d)";
}

/** A deterministic single-glyph sigil for a node type. */
export function typeGlyph(type: string): string {
  const GLYPHS = ["▛", "▜", "▙", "▟", "▚", "▞", "▖", "▗", "▝", "▘", "█", "░", "▓", "▒"];
  const rnd = seededRandom(`type:${type}`);
  return GLYPHS[Math.floor(rnd() * GLYPHS.length)] ?? "█";
}

export interface NodeTypeTagProps {
  type: string;
  /** Override the deterministic accent. */
  accent?: string;
  /** Render the deterministic glyph prefix. Default true. */
  showGlyph?: boolean;
  style?: CSSProperties;
}

/**
 * A type chip for a memory node — a deterministic accent + glyph hashed from
 * the type name (the same trick as `AgentGlyph`), so each registered type
 * (`memory`, `skill`, `note`, `person`, …) reads consistently across the
 * graph, sidebar, and detail panel.
 */
export function NodeTypeTag({ type, accent, showGlyph = true, style }: NodeTypeTagProps) {
  const color = accent ?? typeAccent(type);
  const glyph = typeGlyph(type);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: 11,
        padding: "2px 8px",
        border: `1px solid ${color}55`,
        color,
        letterSpacing: "0.06em",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {showGlyph && <span aria-hidden="true">{glyph}</span>}
      <span>{type}</span>
    </span>
  );
}
