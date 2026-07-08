import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { useForceLayout } from "../hooks/useForceLayout";

/**
 * Behavioral regression probe for plan 018 (MemoryGraph's perpetual re-render
 * loop under `prefers-reduced-motion`). Unlike `vrt-stories.vrt.tsx`'s
 * screenshot comparisons, this test asserts on live DOM values to prove two
 * properties a static screenshot can't:
 *
 *  1. `useForceLayout`'s exported `converged` flips `true` under reduced
 *     motion (the internal sim loop that used to be the only thing that ever
 *     set it never runs, so it must no longer be the only path).
 *  2. `pin()` still forces a repaint under reduced motion via `wake()`'s
 *     `forceTick` fallback — `setConverged(false)` alone is a no-op once
 *     `converged` is already `false`, so without the fallback this would
 *     never repaint.
 *
 * Runs in the `vrt` vitest project, which forces `reducedMotion: "reduce"` at
 * the Playwright BrowserContext level (`vitest.config.ts`) — so
 * `useReducedMotion()` really does flip `true` after mount here; this
 * exercises the real reduced-motion path, not a mock.
 */

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Poll `predicate` once per animation frame until it's true, up to
 * `maxFrames`. Needed (not just a fixed frame count) because when this test
 * is the first/only one to touch a fresh browser context, the emulated
 * `prefers-reduced-motion` media feature and `useReducedMotion`'s effect can
 * take a handful of extra frames to settle — empirically observed to need
 * more than 2 frames in isolation, unlike stories deep in the shared
 * `vrt-stories.vrt.tsx` suite where prior tests have already warmed things up.
 * A generous bound still fails fast (and correctly) when the underlying
 * condition never becomes true, e.g. on pre-fix code.
 */
async function waitForFrames(predicate: () => boolean, maxFrames = 90): Promise<void> {
  for (let i = 0; i < maxFrames; i++) {
    if (predicate()) return;
    await nextFrame();
  }
  if (!predicate()) {
    throw new Error(`condition not met within ${maxFrames} animation frames`);
  }
}

function Probe() {
  const { positions, pin, converged } = useForceLayout(["a", "b", "c"], [], { width: 400, height: 300 });
  const a = positions.current.find((n) => n.id === "a");
  return (
    <div>
      <span data-testid="converged">{String(converged)}</span>
      <span data-testid="a-pinned">{String(a?.pinned ?? false)}</span>
      <button type="button" data-testid="pin-a" onClick={() => pin("a")}>
        pin
      </button>
    </div>
  );
}

async function mount(): Promise<{ container: HTMLDivElement; root: Root }> {
  const container = document.createElement("div");
  container.setAttribute("data-vrt-root", "");
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<Probe />);

  // Let `useReducedMotion`'s post-mount effect (matchMedia read) and the
  // hook's reconcile effect commit.
  await nextFrame();
  await nextFrame();

  return { container, root };
}

function unmount(container: HTMLDivElement, root: Root): void {
  root.unmount();
  container.remove();
}

describe("MemoryGraph reduced-motion regression (plan 018)", () => {
  it("stops the sim loop and still repaints pin() under reduced motion", async () => {
    const { container, root } = await mount();
    try {
      const locator = page.elementLocator(container);
      const convergedText = () => locator.getByTestId("converged").element().textContent;
      const pinnedText = () => locator.getByTestId("a-pinned").element().textContent;

      // 1. The perpetual sim loop never starts under reduced motion:
      // `converged` reads true (no `useRafLoop` tick is needed to flip it).
      // FAILS (times out, never becomes "true") on pre-fix code, where
      // `converged` is only ever set by the (never-running-under-reduced-
      // motion) rAF callback.
      await waitForFrames(() => convergedText() === "true");
      expect(convergedText()).toBe("true");

      // 2. Initial state: node "a" isn't pinned.
      expect(pinnedText()).toBe("false");

      // 3. Pin it.
      await locator.getByTestId("pin-a").click();

      // 4. `wake()`'s reduced-motion `forceTick` fallback must force a
      // repaint so the DOM reflects the mutated `pinned` flag — a "stop the
      // loop but don't fix wake()" version leaves this stuck at "false"
      // forever (this wait times out and the assertion below fails).
      await waitForFrames(() => pinnedText() === "true");
      expect(pinnedText()).toBe("true");
    } finally {
      unmount(container, root);
    }
  });
});
