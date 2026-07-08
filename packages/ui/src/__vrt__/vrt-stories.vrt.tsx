/// <reference types="vite/client" />
import { composeStories } from "@storybook/react-vite";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";

/**
 * VRT rollout (plan 016): generalizes the plans/011 spike's proven recipe
 * from 3 hand-picked stories to every story file's primary export, at single
 * accent (`green`, the Storybook preview default) x single viewport (no
 * explicit viewport override) — the spike's recommended phase-1 scope. See
 * plans/011-findings.md for the full writeup and plans/016-vrt-rollout.md for
 * this rollout's scope.
 *
 * Enumeration: `import.meta.glob` (Vite-native) instead of `Bun.Glob` (used by
 * the sibling `packages/ui/src/__ssr__/ssr-stories.test.tsx`) because this
 * file runs under vitest **browser mode**, which cannot use Bun APIs.
 *
 * "Primary export": the first composed story of each module, in
 * `composeStories`'s key order. NOTE: this is deterministic but is NOT
 * declaration order — `composeStories` returns story components keyed off
 * the underlying CSF module's named exports, and an ES module namespace
 * object's own string keys are spec-sorted ascending (code-point order), not
 * insertion order. In practice this means the "primary" export is whichever
 * story name sorts alphabetically first in a given file, which is often
 * (but not always) `Default` — e.g. `ProgressBar.stories.tsx` picks
 * `Animated` (alphabetically before `Default`), `Accordion.stories.tsx`
 * picks `AllClosed`. Still deterministic (same pick every run), just not
 * what "primary" might otherwise imply.
 *
 * Snapshot naming: `<file-basename>-<storyName>` (lowercased), NOT
 * `<parent-dir-name>-<storyName>` as originally proposed — the repo has three
 * directories (`hooks/`, `primitives/`, `screens/`) that hold multiple
 * sibling `*.stories.tsx` files directly (no per-component subdirectory), so
 * "parent dir name" collides (e.g. `primitives/FloatingPanel.stories.tsx` and
 * `primitives/ScrimOverlay.stories.tsx` would both key to `primitives-...`).
 * The file's own basename is unique repo-wide (verified: no two
 * `*.stories.tsx` files share a basename) and equals the parent-dir name in
 * every case where a component has its own subdirectory, so this is a
 * strict, backward-compatible refinement of the plan's naming intent.
 *
 * Determinism recipe carried over verbatim from the spike:
 *  - `reducedMotion: "reduce"` Playwright context option (vitest.config.ts,
 *    `vrt` project) — every rAF-driven animation renders its static resting
 *    frame instead of a mid-animation one.
 *  - `await document.fonts.ready` before every screenshot.
 *  - Two `requestAnimationFrame` ticks after mount so mount-time effects
 *    (measurement, first paint) have committed.
 */

const modules = import.meta.glob<Record<string, unknown>>("../**/*.stories.tsx", { eager: true });

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function mount(Story: React.ComponentType): Promise<{ container: HTMLDivElement; root: Root }> {
  const container = document.createElement("div");
  container.setAttribute("data-vrt-root", "");
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<Story />);

  // Fonts first (DepartureMono is `font-display: swap`).
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

/**
 * Known-nondeterministic stories, excluded from the sweep below. Each entry
 * is the snapshot key that would otherwise be generated
 * (`<file-basename>-<storyName>`, lowercased). A skip entry without a reason
 * comment fails review (plan 016). Built empirically per plan 016 Step 2:
 * populated only after observing genuine run-to-run divergence.
 */
const SKIP = new Set<string>([
  // `ProgressBar.stories.tsx`'s alphabetically-first export is `Animated`
  // (composeStories's key order follows ES module-namespace-object key
  // ordering, which sorts string keys ascending — NOT declaration order —
  // so this file's "primary" export per plan 016's literal rule is
  // `Animated`, not `Default`). Its `LoopingBars` demo component drives its
  // own `requestAnimationFrame` loop unconditionally, with no
  // `useReducedMotion` gate at all, so the page is still animating for as
  // long as the test runs. Confirmed empirically: 3 consecutive isolated
  // runs (`-t "progressbar-animated"`) all failed identically with
  // "Could not capture a stable screenshot within 5000ms" — a continuously-
  // looping animation whose reduced-motion path still varies (plan 016's
  // pre-identified SKIP category), not a transient capture-stability flake.
  "progressbar-animated",
  // `OctantField.tsx`'s alphabetically-first export is `Amber`. Its
  // `onResize` handler seeds the particle simulation with `Math.random()`
  // (unseeded, new positions every mount) and its `draw` callback redraws
  // the curl-noise flow field every animation frame via the shared
  // `useOctantCanvas` engine — unconditionally, with no `useReducedMotion`
  // gate. Confirmed empirically: failed on 2 of 3 consecutive `--project=vrt`
  // compare runs with genuine pixel-count mismatches (not timeouts).
  "octantfield-amber",
  // `Sparkline.tsx`'s mount effect seeds its ring buffer with
  // `Array.from({ length: samples }, () => Math.random())` (line ~67) on
  // every mount, independent of `useReducedMotion` (only the *scrolling*
  // push-loop is gated, not the initial seed) — the rendered eighth-block
  // glyphs differ every run. Confirmed empirically: failed on all 3
  // consecutive `--project=vrt` compare runs with genuine pixel mismatches.
  "sparkline-default",
  // `LogStream.tsx`'s initial entries are generated via `pick()`
  // (`Math.random()`-indexed message selection) and `stamp()` (formats
  // `new Date()` — real wall-clock time) at mount, both independent of
  // `useReducedMotion`. Confirmed empirically: failed on all 3 consecutive
  // `--project=vrt` compare runs with genuine pixel mismatches.
  "logstream-customfeed",
  // `Timeline.tsx`'s mount effect seeds its initial entries with
  // `ts: fmt(new Date(now - i * 47000))` where `now = Date.now()` — real
  // wall-clock time baked directly into the rendered text, independent of
  // `useReducedMotion`. Confirmed empirically: failed on all 3 consecutive
  // `--project=vrt` compare runs with genuine pixel mismatches.
  "timeline-customevents",
  // `screens/OpsDashboard.stories.tsx`'s `Default` export composes a
  // `<LogStream>` directly (see `logstream-customfeed` above for its root
  // cause: `Math.random()` message pick + wall-clock timestamp at mount) —
  // the same nondeterminism surfaces at the screen level. Confirmed
  // empirically: failed on all 3 consecutive `--project=vrt` compare runs.
  "opsdashboard-default",
  // `Ticker.tsx`'s number count-up and `useBar8Fill` bar-fill both correctly
  // snap to their final value under `useReducedMotion` (both gate on
  // `reduced`), but only after `useOnVisible`'s `IntersectionObserver`
  // callback fires and flips `started` to `true` — an async browser callback
  // whose timing isn't controlled by this harness's fixed
  // fonts.ready + 2-rAF-tick settle window, so it can still be resolving
  // while the comparator's own capture-stability polling is in progress.
  // Confirmed empirically over ~13 trials across both isolated (`-t`) and
  // full-suite runs, via both `bunx vitest run --project=vrt` and
  // `bun run test-vrt`: `atoms/Ticker/Ticker.stories.tsx`'s `AnsiHues` story
  // (its alphabetically-first export) failed roughly 60% of the time, always
  // with "Could not capture a stable screenshot within 5000ms" — far above
  // the ~8% general capture-stability flake rate plans/011-findings.md
  // measured for the rest of the suite, and reproducible independent of
  // invocation method or machine load at the time. Determinism candidate for
  // a future fix (out of scope here): await the observer's first callback
  // explicitly (e.g. poll `numRef.current.textContent` for the expected
  // formatted value) before screenshotting, instead of a fixed frame count.
  "ticker-ansihues",
]);

interface Entry {
  key: string;
  rel: string;
  Story: React.ComponentType;
}

const entries: Entry[] = Object.entries(modules)
  .map(([path, mod]) => {
    const composed = composeStories(mod as never) as Record<string, React.ComponentType>;
    const [name, Story] = Object.entries(composed)[0] ?? [];
    if (!name || !Story) return null;
    const base = (path.split("/").pop() ?? path).replace(/\.stories\.tsx$/, "");
    const key = `${base}-${name}`.toLowerCase();
    return { key, rel: path.replace(/^\.\.\//, ""), Story };
  })
  .filter((e): e is Entry => e !== null)
  .sort((a, b) => a.rel.localeCompare(b.rel));

describe("VRT: primary export of every story file", () => {
  expect(entries.length).toBeGreaterThan(0);

  for (const { key, rel, Story } of entries) {
    const run = SKIP.has(key) ? it.skip : it;
    run(`${rel} — ${key}`, async () => {
      const { container, root } = await mount(Story);
      try {
        await expect(page.elementLocator(container)).toMatchScreenshot(key);
      } finally {
        unmount(container, root);
      }
    });
  }
});
