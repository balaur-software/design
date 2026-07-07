import { type RefObject, useEffect } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab focus within `ref` while `active`, focuses the first focusable on
 * activation, and restores focus to the previously-active element on teardown.
 * Net-new a11y over the reference (which never trapped focus). Use for Modal,
 * Sheet, CommandPalette.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((x) => x.offsetParent !== null);
    const focusContainer = () => {
      // APG dialog fallback: no focusable descendants — focus the container itself.
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus();
    };
    const first0 = focusables()[0];
    if (first0) first0.focus();
    else focusContainer();

    // Listen on document, not the container: if focus ever lands outside the
    // trap (e.g. a click on non-focusable text moves focus to body), a
    // container-scoped listener would never fire again and Tab would escape.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = focusables();
      if (f.length === 0) {
        e.preventDefault();
        focusContainer();
        return;
      }
      const first = f[0]!;
      const last = f[f.length - 1]!;
      const current = document.activeElement;
      if (!current || !el.contains(current)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [ref, active]);
}
