import { type CSSProperties, type ReactNode, useId, useRef, useState } from "react";
import { useScramble } from "../../hooks/useScramble";

export interface TooltipProps {
  /** The always-visible trigger label. */
  children: ReactNode;
  /** Tooltip text — scrambles into place on hover/focus. */
  tip: string;
  /** Accent colour for the label and the tip's background. Defaults to the accent CSS var. */
  color?: string;
  /** Colour of the dotted underline under the trigger. Defaults to the accent-tinted border token. */
  underlineColor?: string;
  style?: CSSProperties;
}

/**
 * A hover/focus tooltip whose text resolves out of static via the shared
 * `useScramble` hook. The trigger carries a dotted underline; the CSS-positioned
 * bubble floats above it, centred, fading and rising in on reveal. The tip text
 * is rendered statically (SSR-safe, and reachable via `aria-describedby`); the
 * scramble only repaints it visually on the client once `active` flips true.
 * Escape dismisses the open tip (WCAG 1.4.13).
 */
export function Tooltip({
  children,
  tip,
  color = "var(--bx-accent, #46c66d)",
  underlineColor = "var(--bx-border-accent, #2a3320)",
  style,
}: TooltipProps) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();
  const [open, setOpen] = useState(false);
  useScramble(boxRef, tip, { dur: 440, active: open });

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: APG tooltip pattern — focus/hover show the tip, Escape dismisses
    <span
      // biome-ignore lint/a11y/noNoninteractiveTabindex: tooltip trigger must be focusable for keyboard users (WCAG 1.4.13)
      tabIndex={0}
      aria-describedby={tipId}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
      style={{
        position: "relative",
        fontSize: 13,
        color,
        borderBottom: `1px dotted ${underlineColor}`,
        cursor: "help",
        paddingBottom: 2,
        outline: "none",
        ...style,
      }}
    >
      {children}
      <span
        ref={boxRef}
        id={tipId}
        role="tooltip"
        style={{
          position: "absolute",
          left: "50%",
          bottom: "calc(100% + 9px)",
          transform: open ? "translate(-50%, -5px)" : "translate(-50%, 0)",
          whiteSpace: "nowrap",
          fontSize: 12,
          color: "var(--bx-bg, #08080a)",
          background: color,
          padding: "5px 9px",
          opacity: open ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity .18s ease, transform .18s ease",
        }}
      >
        {tip}
      </span>
    </span>
  );
}
