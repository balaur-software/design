import { type CSSProperties, useEffect, useRef } from "react";
import { useInView } from "../../hooks/useInView";
import { useRafLoop } from "../../hooks/useRafLoop";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export interface WaveTextProps {
  /** Text whose glyphs ripple along a travelling sine wave. */
  text?: string;
  /** Peak vertical displacement per glyph, in px. */
  amplitude?: number;
  /** Angular speed of the wave — higher scrolls the ripple faster. */
  speed?: number;
  /** Per-glyph phase offset; larger values give a tighter wavelength. */
  phaseStep?: number;
  /** Glyph colour. */
  color?: string;
  fontSize?: number;
  style?: CSSProperties;
}

/**
 * A row of glyphs that ride a travelling sine wave — each character is offset in
 * phase from its neighbour, so the whole word oscillates like a ticker. The
 * translateY / opacity are written imperatively per frame via the shared
 * `useRafLoop`, so SSR emits static (flat) text and the ripple starts after
 * mount. `prefers-reduced-motion` freezes it to a legible, level word.
 */
export function WaveText({
  text = "OSCILLATE",
  amplitude = 9,
  speed = 3.6,
  phaseStep = 0.5,
  color = "#2bd9d9",
  fontSize = 28,
  style,
}: WaveTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduced = useReducedMotion();
  const chars = [...text];

  useRafLoop((t) => {
    const el = ref.current;
    if (!el) return;
    const spans = el.children;
    for (let i = 0; i < spans.length; i++) {
      const s = spans[i] as HTMLElement | undefined;
      if (!s) continue;
      const phase = i * phaseStep - t * speed;
      s.style.transform = `translateY(${(Math.sin(phase) * amplitude).toFixed(2)}px)`;
      s.style.opacity = (0.55 + 0.45 * Math.cos(phase)).toFixed(2);
    }
  }, inView && !reduced);

  // When reduced-motion parks the loop mid-ripple, level the word back out so
  // it freezes legible (flat, full opacity) instead of at arbitrary offsets.
  useEffect(() => {
    if (!reduced) return;
    const el = ref.current;
    if (!el) return;
    for (const child of el.children) {
      const s = child as HTMLElement;
      s.style.transform = "";
      s.style.opacity = "";
    }
  }, [reduced]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={text}
      style={{
        display: "flex",
        alignItems: "center",
        height: fontSize + amplitude * 1.8,
        fontSize,
        color,
        lineHeight: 1,
        fontFamily: "var(--bx-font-mono, ui-monospace, monospace)",
        ...style,
      }}
    >
      {chars.map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{ display: "inline-block", willChange: "transform", whiteSpace: "pre" }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </div>
  );
}
