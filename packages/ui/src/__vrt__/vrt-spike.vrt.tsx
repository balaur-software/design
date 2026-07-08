import { composeStories } from "@storybook/react-vite";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import * as BadgeStories from "../atoms/Badge/Badge.stories.tsx";
import * as ProgressBarStories from "../atoms/ProgressBar/ProgressBar.stories.tsx";
import * as SkeletonStories from "../atoms/Skeleton/Skeleton.stories.tsx";

/**
 * SPIKE (plans/011): proves `expect(locator).toMatchScreenshot()` on the
 * existing vitest-browser + Playwright(Chromium) infrastructure, mounting
 * stories via `composeStories` (Storybook's portable-stories API) instead of
 * through the `storybookTest` auto-discovery plugin. This is a hand-rolled
 * spike harness, NOT the shape a rollout would use for all 119 story files —
 * see plans/011-findings.md for the recommendation.
 *
 * Determinism recipe exercised here:
 *  - `browser.provider` context option `reducedMotion: "reduce"` (set in
 *    vitest.config.ts for the `vrt-spike` project) — every rAF-driven
 *    animation (`useRafLoop`, `useBar8Fill`, both gated by
 *    `useReducedMotion`) renders its static resting frame.
 *  - `await document.fonts.ready` before every screenshot, so DepartureMono
 *    (loaded with `font-display: swap`) has swapped in and glyph-cell
 *    measurement (`measureCell`) is stable.
 *  - Two rAF ticks after mount so `useEffect`-driven measurement/paint
 *    (Skeleton's row measurement, ProgressBar's `useBar8Fill` initial paint)
 *    has committed before the screenshot is taken.
 */

const Badge = composeStories(BadgeStories);
const ProgressBar = composeStories(ProgressBarStories);
const Skeleton = composeStories(SkeletonStories);

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function mount(Story: React.ComponentType): Promise<{ container: HTMLDivElement; root: Root }> {
  const container = document.createElement("div");
  container.setAttribute("data-vrt-root", "");
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<Story />);

  // Fonts first (DepartureMono is `font-display: swap`; glyph-cell math in
  // measureCell() depends on the real font metrics, not the fallback's).
  await document.fonts.ready;
  // Let mount-time effects (measurement, first rAF paint) commit.
  await nextFrame();
  await nextFrame();

  return { container, root };
}

function unmount(container: HTMLDivElement, root: Root): void {
  root.unmount();
  container.remove();
}

describe("VRT spike: toMatchScreenshot on composed stories", () => {
  it("Badge/Default — static atom baseline", async () => {
    const { container, root } = await mount(Badge.Default);
    try {
      await expect(page.elementLocator(container)).toMatchScreenshot("badge-default");
    } finally {
      unmount(container, root);
    }
  });

  it("ProgressBar/Default — pre-framebuffer glyph rendering", async () => {
    const { container, root } = await mount(ProgressBar.Default);
    try {
      await expect(page.elementLocator(container)).toMatchScreenshot("progressbar-default");
    } finally {
      unmount(container, root);
    }
  });

  it("Skeleton/Default — animated component, reduced-motion resting frame", async () => {
    const { container, root } = await mount(Skeleton.Default);
    try {
      await expect(page.elementLocator(container)).toMatchScreenshot("skeleton-default");
    } finally {
      unmount(container, root);
    }
  });
});
