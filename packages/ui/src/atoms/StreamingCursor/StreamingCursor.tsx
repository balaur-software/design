import { useReducedMotion } from "../../hooks/useReducedMotion";

export interface StreamingCursorProps {
  /** Whether the cursor is actively blinking. Default true. */
  active?: boolean;
  /** Glyph to render. Default the full block "█". */
  glyph?: string;
  /** Inline style override (e.g. to match surrounding text color). */
  color?: string;
}

/**
 * A terminal-style cursor block appended to streaming text. Blinks via the
 * global `bx-blink` keyframe; under reduced-motion it stays steady. Pure
 * declarative CSS animation — identical on server and client.
 */
export function StreamingCursor({ active = true, glyph = "█", color }: StreamingCursorProps) {
  const reduced = useReducedMotion();
  return (
    <span
      aria-hidden="true"
      style={{
        color: color ?? "var(--bx-accent, #46c66d)",
        animation: active && !reduced ? "bx-blink 1.1s steps(1) infinite" : undefined,
        marginLeft: 1,
      }}
    >
      {glyph}
    </span>
  );
}
