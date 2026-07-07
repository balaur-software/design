import { type RefObject, useEffect } from "react";

/**
 * Module-level stack of active dismissable layers, most recent last. When
 * overlays nest (Popover inside Modal, Select inside Sheet), only the topmost
 * layer handles Escape / outside-click, so one press peels one layer instead of
 * collapsing the whole stack at once.
 */
const layers: symbol[] = [];

/**
 * Calls `onDismiss` on Escape or a pointer-down outside `ref`. Active only while
 * `active` (usually the open state). Shared by every popover/menu/select/sheet.
 * Layered: with stacked overlays, only the most recently activated layer
 * dismisses per Escape/outside-click.
 */
export function useDismissable(
  ref: RefObject<HTMLElement | null>,
  opts: { onDismiss: () => void; active?: boolean },
): void {
  const { onDismiss, active = true } = opts;
  useEffect(() => {
    if (!active) return;
    const layer = Symbol("dismissable");
    layers.push(layer);
    const isTop = () => layers[layers.length - 1] === layer;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTop()) onDismiss();
    };
    const onDown = (e: PointerEvent) => {
      if (!isTop()) return;
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) onDismiss();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      const i = layers.indexOf(layer);
      if (i >= 0) layers.splice(i, 1);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [ref, onDismiss, active]);
}
