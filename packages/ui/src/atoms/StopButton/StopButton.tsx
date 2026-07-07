import type { ButtonHTMLAttributes, CSSProperties } from "react";

export interface StopButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  /** Inline style override. */
  style?: CSSProperties;
}

/**
 * A square "stop" button — the cancel-generation counterpart to FillButton.
 * Renders a filled square glyph in the red `--bx-ansi-9` family. Pure static
 * markup; disabled state dims to the dim-text ramp.
 */
export function StopButton({ style, disabled, ...rest }: StopButtonProps) {
  return (
    <button
      type="button"
      aria-label="Stop generation"
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 38,
        height: 38,
        flex: "none",
        fontFamily: "inherit",
        fontSize: 14,
        background: "var(--bx-surface-2, #15161e)",
        border: "1px solid var(--bx-border-red, #3a2020)",
        color: disabled ? "var(--bx-text-6, #5b616e)" : "#ff6b6f",
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
      {...rest}
    >
      ■
    </button>
  );
}
