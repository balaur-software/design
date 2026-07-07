import { type ButtonHTMLAttributes, type CSSProperties, useEffect, useRef } from "react";
import { WAVE } from "../../../../octant-core/src/index.ts";
import { useReducedMotion } from "../../hooks/useReducedMotion";

/** Number of comet cells swept during the deploy progress animation. */
const CELLS = 11;

/** Keeps the live status announcement out of view while staying readable to AT. */
const VISUALLY_HIDDEN: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  clipPath: "inset(50%)",
  overflow: "hidden",
  whiteSpace: "nowrap",
};

export interface DeployButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style" | "onClick" | "children"> {
  /** Idle label. Shown on the server and restored after the deploy cycle ends. */
  label?: string;
  /** Fired once the comet finishes and the button reads "✓ DEPLOYED". */
  onDeploy?: () => void;
  /** Resting label / border colour. Defaults to the accent CSS var. */
  accent?: string;
  /** Colour used for the "✓ DEPLOYED" confirmation flash. */
  accentBright?: string;
  /** Border colour. Defaults to the accent-tinted border token. */
  borderColor?: string;
  style?: CSSProperties;
}

/**
 * A commit-style button: click launches a braille-block "comet" that sweeps the
 * label, resolves to "✓ DEPLOYED", then reverts to idle after ~1.1s. The progress
 * frames are written imperatively (ref + setInterval) so SSR emits a static,
 * accessible label and the animation only runs on the client. `prefers-reduced-
 * motion` skips straight to the confirmation flash.
 */
export function DeployButton({
  label = "DEPLOY ▸",
  onDeploy,
  accent = "var(--bx-accent, #46c66d)",
  accentBright = "var(--bx-accent-bright, #74e692)",
  borderColor = "var(--bx-border-accent, #2a3320)",
  disabled,
  style,
  ...rest
}: DeployButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const busyRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion();

  // Mirror componentWillUnmount: stop any in-flight timers.
  useEffect(
    () => () => {
      if (intervalRef.current != null) clearInterval(intervalRef.current);
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const finish = () => {
    const lab = labelRef.current;
    const btn = btnRef.current;
    if (lab) lab.textContent = "✓ DEPLOYED";
    if (btn) {
      btn.style.color = accentBright;
      btn.style.cursor = "pointer";
      btn.removeAttribute("aria-busy");
    }
    if (statusRef.current) statusRef.current.textContent = "deployed";
    onDeploy?.();
    timeoutRef.current = setTimeout(() => {
      if (lab) lab.textContent = label;
      if (statusRef.current) statusRef.current.textContent = label;
      if (btn) btn.style.color = accent;
      busyRef.current = false;
      timeoutRef.current = null;
    }, 1100);
  };

  const start = () => {
    if (disabled || busyRef.current) return;
    const lab = labelRef.current;
    if (!lab) return;
    busyRef.current = true;
    const btn = btnRef.current;
    if (btn) {
      btn.style.cursor = "progress";
      btn.setAttribute("aria-busy", "true");
    }
    if (statusRef.current) statusRef.current.textContent = "deploying…";

    if (reduced) {
      finish();
      return;
    }

    const t0 = performance.now();
    if (intervalRef.current != null) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const t = (performance.now() - t0) / 1000;
      const head = (t * 9) % CELLS;
      let s = "";
      for (let i = 0; i < CELLS; i++) {
        let d = i - head;
        if (d < -CELLS / 2) d += CELLS;
        if (d > CELLS / 2) d -= CELLS;
        d = Math.abs(d);
        s += d < 0.8 ? "█" : d < 1.8 ? "▓" : d < 2.8 ? "░" : "·";
      }
      lab.textContent = `${WAVE[((t * 12) | 0) % WAVE.length]!} ${s}`;
      if (t > 2.1) {
        if (intervalRef.current != null) clearInterval(intervalRef.current);
        intervalRef.current = null;
        finish();
      }
    }, 45);
  };

  return (
    <button
      ref={btnRef}
      type="button"
      disabled={disabled}
      {...rest}
      onClick={start}
      style={{
        fontFamily: "inherit",
        fontSize: 13,
        letterSpacing: "0.1em",
        padding: "12px 20px",
        background: disabled ? "transparent" : "#15161e",
        border: `1px solid ${disabled ? "var(--bx-border, #1c1d24)" : borderColor}`,
        color: disabled ? "var(--bx-text-dim-3, #4b505c)" : accent,
        cursor: disabled ? "not-allowed" : "pointer",
        minWidth: 158,
        textAlign: "center",
        ...style,
      }}
    >
      {/* Decorative frames (comet glyphs) — the live region below carries the accessible name. */}
      <span ref={labelRef} aria-hidden="true" style={{ whiteSpace: "pre" }}>
        {label}
      </span>
      <span ref={statusRef} aria-live="polite" style={VISUALLY_HIDDEN}>
        {label}
      </span>
    </button>
  );
}
