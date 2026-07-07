import { type CSSProperties, type ReactNode, useRef } from "react";
import { useDismissable } from "../hooks/useDismissable";

/** ARIA role the popup panel adopts. `none` renders no role (e.g. Combobox, which houses its own `listbox`). */
export type FloatingPanelRole = "menu" | "listbox" | "dialog" | "group" | "none";

export interface FloatingPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The clickable anchor (button, input…). */
  trigger: ReactNode;
  children: ReactNode;
  /** Horizontal anchor edge. Default "start". */
  align?: "start" | "end";
  /** Panel width; defaults to auto (content). */
  width?: CSSProperties["width"];
  panelStyle?: CSSProperties;
  /** ARIA role for the popup panel. Default "menu" (DropdownMenu). Use "listbox" for Select, "dialog" for Popover, "none" for Combobox. */
  role?: FloatingPanelRole;
  /** id for the panel so a trigger can reference it via `aria-controls`. */
  panelId?: string | undefined;
  /** Accessible name for the panel when no labelled child exists. */
  ariaLabel?: string | undefined;
  /** id of an element that labels the panel. */
  ariaLabelledBy?: string | undefined;
}

/**
 * An anchored popup: a relatively-positioned trigger with an absolutely-positioned
 * panel that reveals below it (opacity + translateY, matching the OCTANT CSS-transition
 * aesthetic — no measurement library). Dismisses on Escape / outside click. The
 * shared base for Select, DropdownMenu, Popover, HoverCard, Menubar, NavMenu,
 * Combobox, DatePicker. The panel role is configurable so each consumer presents
 * the correct semantics (menu / listbox / dialog) rather than always "menu".
 */
export function FloatingPanel({
  open,
  onOpenChange,
  trigger,
  children,
  align = "start",
  width,
  panelStyle,
  role = "menu",
  panelId,
  ariaLabel,
  ariaLabelledBy,
}: FloatingPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useDismissable(rootRef, { onDismiss: () => onOpenChange(false), active: open });

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-block" }}>
      {trigger}
      <div
        id={panelId}
        role={role === "none" ? undefined : role}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        style={{
          position: "absolute",
          top: "100%",
          [align === "start" ? "left" : "right"]: 0,
          marginTop: 6,
          width,
          zIndex: 30,
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-5px)",
          pointerEvents: open ? "auto" : "none",
          transition:
            "opacity .12s var(--bx-ease, cubic-bezier(.5,0,.2,1)), transform .12s var(--bx-ease, cubic-bezier(.5,0,.2,1))",
          ...panelStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
