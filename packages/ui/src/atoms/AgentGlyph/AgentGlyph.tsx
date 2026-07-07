import { seededRandom } from "@balaur/octant-core";
import { PALETTE } from "@balaur/tokens";
import type { CSSProperties } from "react";
import type { Agent } from "../../organisms/ChatPanel/chat-types";

/** The quadrant glyphs used to build a 2×2 agent mosaic. */
const QUADRANTS = ["▛", "▜", "▙", "▟", "▚", "▞", "▖", "▗", "▝", "▘", "█", "░"];

/** Deterministically pick a 2×2 mosaic (two lines of two glyphs) from agent.id. */
export function agentMosaic(agent: Agent): string {
  const rnd = seededRandom(agent.id);
  const a = QUADRANTS[Math.floor(rnd() * QUADRANTS.length)]!;
  const b = QUADRANTS[Math.floor(rnd() * QUADRANTS.length)]!;
  const c = QUADRANTS[Math.floor(rnd() * QUADRANTS.length)]!;
  const d = QUADRANTS[Math.floor(rnd() * QUADRANTS.length)]!;
  return `${a}${b}\n${c}${d}`;
}

/** Deterministically pick an ANSI palette hue for the agent, or the override. */
export function agentAccent(agent: Agent): string {
  if (agent.accent) return agent.accent;
  const rnd = seededRandom(agent.id);
  const idx = Math.floor(rnd() * PALETTE.length) % PALETTE.length;
  return PALETTE[idx]?.hex ?? "var(--bx-accent, #46c66d)";
}

export interface AgentGlyphProps {
  agent: Agent;
  /** Glyph font-size in px. Default 15. */
  size?: number;
  /** Show the agent name beneath the mosaic. Default true. */
  showLabel?: boolean;
}

/**
 * A 2×2 octant-mosaic sigil for a named agent, hashed from `agent.id` so each
 * agent in a multi-agent thread gets a stable, distinct glyph + ANSI hue.
 * Pure static markup — deterministic across server and client.
 */
export function AgentGlyph({ agent, size = 15, showLabel = true }: AgentGlyphProps) {
  const mosaic = agent.glyph ?? agentMosaic(agent);
  const accent = agentAccent(agent);
  const preStyle: CSSProperties = {
    margin: "0 0 8px",
    fontSize: size,
    lineHeight: 0.9,
    color: accent,
    whiteSpace: "pre",
    letterSpacing: 0,
    fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
  };
  return (
    <div style={{ textAlign: "center" }}>
      <pre aria-hidden="true" style={preStyle}>
        {mosaic}
      </pre>
      {showLabel && <span style={{ color: "#7b8290", fontSize: 11 }}>{agent.name}</span>}
    </div>
  );
}
