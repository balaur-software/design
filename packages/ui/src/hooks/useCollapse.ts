import { type RefObject, useEffect } from "react";

/**
 * Drives a max-height disclosure transition on an element: `open` sets
 * `max-height` to the scroll height, closed sets it to 0. Pair with a CSS
 * `transition: max-height …` on the element. Once the opening transition ends,
 * max-height is released to `none` so content that grows afterwards (nested
 * disclosures, async content, reflow) is never clipped by the stale
 * measurement. Used by Accordion, Tree, Select/Combobox lists, menu panels,
 * chat tool/think cards, etc.
 */
export function useCollapse(ref: RefObject<HTMLElement | null>, open: boolean): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.overflow = "hidden";
    if (open) {
      el.style.maxHeight = `${el.scrollHeight}px`;
      const onEnd = (e: TransitionEvent) => {
        if (e.target === el && e.propertyName === "max-height") el.style.maxHeight = "none";
      };
      el.addEventListener("transitionend", onEnd);
      return () => {
        el.removeEventListener("transitionend", onEnd);
      };
    }
    if (el.style.maxHeight === "none") {
      // Re-fix to the measured height so the closing transition has a start value.
      el.style.maxHeight = `${el.scrollHeight}px`;
      void el.offsetHeight; // flush so the browser transitions from the fixed height
    }
    el.style.maxHeight = "0px";
  }, [ref, open]);
}
