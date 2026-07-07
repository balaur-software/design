import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDismissable } from "../hooks/useDismissable";
import { useFocusTrap } from "../hooks/useFocusTrap";

export interface ScrimOverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Trap focus within the panel while open (default true). */
  trapFocus?: boolean;
  /** Panel alignment: centered dialog or an edge sheet. */
  align?: "center" | "start" | "end";
  panelStyle?: CSSProperties;
  /** id of an element that labels the dialog (aria-labelledby). */
  ariaLabelledBy?: string | undefined;
  /** Accessible name for the dialog when no labelled child exists (aria-label). */
  ariaLabel?: string | undefined;
}

const JUSTIFY: Record<NonNullable<ScrimOverlayProps["align"]>, CSSProperties["justifyContent"]> = {
  center: "center",
  start: "flex-start",
  end: "flex-end",
};

/**
 * Module-level scroll-lock counter: with stacked overlays closed out of order,
 * per-instance save/restore would unlock the page while an overlay is still
 * open. The first lock saves the inline overflow; the last unlock restores it.
 */
let scrollLocks = 0;
let savedOverflow = "";

function lockBodyScroll(): () => void {
  if (scrollLocks === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLocks += 1;
  return () => {
    scrollLocks -= 1;
    if (scrollLocks === 0) document.body.style.overflow = savedOverflow;
  };
}

/**
 * A portalled full-screen scrim + panel with Escape/outside-click dismissal,
 * body-scroll lock, and focus trapping. The shared shell behind Modal, Sheet, and
 * CommandPalette. Client-only (renders null on the server / when closed).
 */
export function ScrimOverlay({
  open,
  onClose,
  children,
  trapFocus = true,
  align = "center",
  panelStyle,
  ariaLabelledBy,
  ariaLabel,
}: ScrimOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDismissable(panelRef, { onDismiss: onClose, active: open });
  useFocusTrap(panelRef, open && trapFocus);

  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: align === "center" ? "center" : "stretch",
        justifyContent: JUSTIFY[align],
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(8,8,10,0.72)" }} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        style={{ position: "relative", zIndex: 1, ...panelStyle }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
