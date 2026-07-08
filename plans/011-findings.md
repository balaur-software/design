# Plan 011 findings: visual regression snapshots on the existing Storybook/Playwright infrastructure

Spike executed at commit `26bcec1` (main + plan 001's merged branch), in worktree
`worktree-agent-a9e94500209677752`. Installed versions actually verified in this
worktree: `vitest@4.1.10`, `@vitest/browser@4.1.10`, `@vitest/browser-playwright@4.1.10`,
`storybook@10.4.6`, `playwright-core@1.61.1`.

## Recommendation: GO-WITH-CAVEATS

Vitest 4's native `expect(locator).toMatchScreenshot()` works on this stack with
**zero new dependencies**, produces correct pixel-diff failures, and — with the
determinism recipe below — is stable enough for local/dev use. The caveat is a
measured, non-zero flake rate tied to this specific machine's concurrent CPU
load (see "Flake evidence"), which should be re-measured on the actual CI
runner before a full rollout commits to zero-retry gating.

## Step 1: mechanism decision

Chose **(a)**: vitest's native `toMatchScreenshot()` matcher, in a dedicated
spike test file that mounts stories via Storybook's portable-stories API
(`composeStories` from `@storybook/react-vite`, which re-exports
`@storybook/react`) plus a manual `react-dom/client` mount — not the
`storybookTest` auto-discovery plugin, and not raw ad-hoc `page.screenshot()`.

Evidence, all found in the installed packages (no version guessing):

- The matcher's real signature is documented in
  `node_modules/@vitest/browser/jest-dom.d.ts:717-723`:
  ```ts
  toMatchScreenshot<ComparatorName extends keyof ScreenshotComparatorRegistry>(
    options?: ScreenshotMatcherOptions<ComparatorName>,
  ): Promise<R>
  toMatchScreenshot<ComparatorName extends keyof ScreenshotComparatorRegistry>(
    name?: string,
    options?: ScreenshotMatcherOptions<ComparatorName>,
  ): Promise<R>
  ```
  with the options shape (`comparatorName`, `comparatorOptions` — default
  comparator `pixelmatch` — `screenshotOptions`, `timeout` default `5000`,
  `strict`) in `node_modules/@vitest/browser/context.d.ts:155-193`.
- Baseline path/filename convention:
  `node_modules/@vitest/browser/dist/index.js:2074` resolves the default path
  as `${root}/${testFileDirectory}/${screenshotDirectory}/${testFileName}/${arg}-${browserName}-${platform}${ext}`,
  default `screenshotDirectory` = `__screenshots__` (same file, ~line 2102).
  Confirmed empirically: baselines landed at
  `packages/ui/src/__vrt__/__screenshots__/vrt-spike.vrt.tsx/badge-default-chromium-linux.png`.
- Update flow: `bunx vitest --help` (this repo, this version) shows
  `-u, --update [type]` — the standard vitest snapshot-update flag, confirmed
  to write baselines when none exist (used to generate all three baselines
  below).
- `contextOptions` (the determinism lever for reduced motion, see below) is
  typed in `node_modules/@vitest/browser-playwright/dist/index.d.ts:28` as
  `Omit<BrowserContextOptions, "ignoreHTTPSErrors"|"serviceWorkers">`, and
  Playwright's `BrowserContextOptions.reducedMotion?: "reduce"|"no-preference"`
  is confirmed in `node_modules/playwright-core/types/types.d.ts:23888`.
- Coexistence with `storybookTest`: it does **not** coexist in the same
  project without conflict-by-design — `storybookTest` auto-generates one
  test per story from the configured Storybook `stories` glob and doesn't
  expose a hook to inject a `toMatchScreenshot()` call into that generated
  test. The spike therefore runs as a **second, independent vitest project**
  (`vrt-spike`) alongside the existing `storybook` project in
  `packages/ui/vitest.config.ts`, sharing the same `browser.enabled` +
  Playwright + Chromium setup but pointed at a hand-written test file instead
  of the `storybookTest` plugin. `bun run test-storybook`
  (`vitest run --project=storybook`) is therefore completely unaffected — the
  two projects are selected independently by `--project`.
- (b) (raw `page.screenshot()` + manual pixel diff) and (c) (screenshots
  inside story `play` functions) were not pursued once (a) was confirmed
  working — no need for a manual comparator when vitest ships one.

## Step 2: proof on three hard stories

File: `packages/ui/src/__vrt__/vrt-spike.vrt.tsx`. Config:
`packages/ui/vitest.config.ts` (new `vrt-spike` project). Baselines:
`packages/ui/src/__vrt__/__screenshots__/vrt-spike.vrt.tsx/*.png`.

| # | Story | Why it's hard | Result |
|---|---|---|---|
| 1 | `Badge` / `Default` | Trivial static-atom sanity case | Baseline generated, passes |
| 2 | `ProgressBar` / `Default` | `<pre>` eighth-block glyph framebuffer + font metrics (`measureCell`) | Baseline generated, passes |
| 3 | `Skeleton` / `Default` | rAF shimmer animation (`useRafLoop`, gated by `useInView`/`useReducedMotion`) | Baseline generated, passes under forced reduced-motion |

Run command used throughout:
`cd packages/ui && bunx vitest run --project=vrt-spike` (add `-u` only to
(re)generate baselines).

### Determinism recipe (what made these three deterministic)

1. **Reduced motion at the Playwright context level** — `vitest.config.ts`'s
   `vrt-spike` project sets
   `provider: playwright({ contextOptions: { reducedMotion: "reduce" } })`.
   This is the lever the plan predicted. Confirmed effective: `Skeleton`'s
   `useRafLoop(paint, inView && !reduced)` never starts under this context
   (verified via `useReducedMotion`'s `window.matchMedia("(prefers-reduced-motion: reduce)")`
   picking up the emulated media feature), and its `useEffect(() => { if (reduced) paint(0) }, ...)`
   paints exactly one deterministic resting frame (`off = i * 2.3` per row —
   no dependence on wall-clock time).
2. **`await document.fonts.ready`** before every screenshot — DepartureMono is
   loaded with `font-display: swap` (`packages/tokens/src/tokens.css:15`), so
   an early screenshot risks a fallback-font frame with wrong glyph-cell
   width (`measureCell` in `packages/ui/src/hooks/useCellMetrics.ts` measures
   `ctx.measureText("█")` against whatever font is actually active).
3. **Two `requestAnimationFrame` ticks after mount** before the screenshot,
   so mount-time `useEffect`s (Skeleton's row measurement/`ResizeObserver`
   settle loop, `ProgressBar`'s `useBar8Fill` initial paint) have committed.
   (`ProgressBar`'s `useBar8Fill` is additionally self-stabilizing regardless
   of reduced motion for a *non-looping* story: `fracRef` is initialized to
   `target`, so the eased animation's very first tick already satisfies its
   own exit condition — no visible transient. The *looping* `Animated` story,
   which continuously changes `value`, was **not** included in the spike's
   three targets and would need exclusion or a frozen-time strategy in a
   rollout.)
4. **No `Math.random` story was in the three-story target set** — noted per
   the plan as a category needing exclusion or seeding in a rollout (e.g.
   `OctantField`'s point scatter); not proven here.

### Falsifiability proof (deliberate 1px change)

Per Step 2's requirement, a spike-local style override — **no change to
`Badge.tsx` source** — widened the rendered badge's hairline border by 1px
inside the test file only, immediately before the screenshot assertion:

```ts
const badgeEl = container.querySelector("span");
if (badgeEl) badgeEl.style.borderWidth = "2px";
```

Result — the comparator caught it:

```
Error: expect(element).toMatchScreenshot()

Screenshot does not match the stored reference.
39 pixels (ratio 0.01) differ.

Reference screenshot: .../badge-default-chromium-linux.png
Actual screenshot:    .../.vitest-attachments/.../badge-default-actual-chromium-linux.png
Diff image:           .../.vitest-attachments/.../badge-default-diff-chromium-linux.png
```

The generated diff mask (viewed) shows exactly the border pixels affected — a
tight, correct localization, not a whole-image false positive. The override
was then reverted and two consecutive runs passed with zero diff, confirming
the comparator is neither too strict (false positives on the unmodified
component) nor too loose (missed the deliberate regression). This experiment
was temporary; the committed `vrt-spike.vrt.tsx` contains no trace of it.

### Flake evidence (the important caveat)

Across this session, the spike suite (3 tests) was run **24 times** as a
pure pass/fail check (excluding the deliberate-failure experiment, which was
expected to fail, and excluding `-u` baseline-generation runs):

- **22 passed cleanly** (~0.4–1s test time each — the fast, expected path).
- **2 failed**, both with anomalously long test durations (12.4s and a
  timed-out capture respectively) and the message:
  `Could not capture a stable screenshot within 5000ms` — vitest's own
  internal "wait for the page to stop changing" retry loop
  (`ScreenshotMatcherOptions.timeout`, default 5000ms) giving up. Neither
  failure was a genuine pixel-mismatch against a correct baseline; both were
  the capture-stability heuristic timing out.
- **Correlated cause, observed directly**: `uptime` during this session
  showed load average **9.1–14.0 on a 4-core box** (`nproc` = 4), consistent
  with the environment note that other executors run concurrently on this
  machine. One of the two failures reproduced immediately after a full
  `git merge` + fresh dependency-optimization cycle; a bare retry on both
  occasions passed cleanly on the very next invocation.
- The environment's documented "KNOWN FLAKE" (`Vite unexpectedly reloaded a
  test` on the first fresh-worktree browser run) did **not** reproduce for
  the `vrt-spike` project directly, but a related first-run flake **did**
  hit the pre-existing `storybook` project: the first `bun run
  test-storybook` in this worktree failed 3 of 119 story files with
  `Vitest failed to find the current suite` (a Vite/Vitest race, same family
  of first-run-under-load flake) after an 8.9-minute `setup` phase; a retry
  is documented separately in this session (see final report) — this
  confirms the flakiness is a property of the shared, contended machine and
  the vitest-browser stack in general, not something introduced by the
  spike's config or test file.

**Flake rate observed for the spike itself: ~8% (2/24)**, entirely in the
"capture didn't stabilize in time" category, zero false-positive or
false-negative *comparisons*. This is a machine-contention signal, not
evidence of true font/pixel nondeterminism — no run ever produced a
pixel-diff against a baseline that should have matched. Recommend
re-measuring on the dedicated CI runner (uncontended) before deciding
whether rollout needs a retry policy; if CI is similarly shared/contended, a
`retry: 1` (vitest supports per-test/config retries) or raising
`ScreenshotMatcherOptions.timeout` are both cheap mitigations, not blockers.

## Baseline storage

Three PNGs generated (full mounted-container screenshots, `octant-dark`
background, not cropped to component bounds):

| Story | Size |
|---|---|
| `badge-default-chromium-linux.png` | 2,784 B |
| `progressbar-default-chromium-linux.png` | 3,627 B |
| `skeleton-default-chromium-linux.png` | 16,331 B |

Average ≈ 7.6 KB/screenshot (dark, mostly-flat backgrounds compress very
well under PNG). The repo has **119 story files** and **464 individual story
exports** (verified via `grep -c "^export const .*: Story"` across
`*.stories.tsx`, matching the plan's count of interaction tests).

- **Single accent, single viewport, all 464 stories**: ≈ 464 × 7.6 KB ≈
  **3.5 MB** committed. Trivially affordable in-repo.
- **3 accents × 4 viewports (12× matrix)**: ≈ **42 MB**. Still plausible but
  worth deciding deliberately rather than defaulting into it — recommend
  starting scope below.
- Regenerate-locally (no committed PNGs) was considered and rejected as the
  default: it defeats the purpose for CI (a PR's CI run would have no
  baseline to compare against) and reintroduces the exact "nothing catches a
  pixel regression" gap this spike exists to close. Recommend **committed
  PNGs**, regenerated deliberately (`-u`) in the same commit as an
  intentional visual change — mirroring how the sibling `web/` repo's
  tag-pin release flow already expects deliberate, reviewed version bumps.
  A rollout should add a CI check that fails if `git status` shows modified
  baseline PNGs were *not* accompanied by an explicit "intentional visual
  change" marker (e.g., commit message convention or PR label) — a policy
  question for the follow-up plan, not solved here.

## Matrix scope recommendation

Start with **single accent (`green`, the existing preview default) × single
viewport (the default Storybook canvas size, no explicit viewport override)
× all 119 story files' primary/`Default`-equivalent export** for the first
rollout wave. Rationale:
- The spike's 3-story proof only exercised one accent/one viewport; a matrix
  multiplies the flake surface (Step 2's flake evidence) before the
  determinism recipe has been proven at scale.
- Accent and viewport variance are legitimate follow-up expansions once the
  single-variant baseline is green and stable in CI for a few weeks —
  natural phase 2, not phase 1.
- Every story export (not just `Default`) is a further, separate expansion
  after that — 464 vs. 119 screenshots is a 4× cost multiplier for coverage
  that mostly re-exercises the same rendering paths with different props;
  prioritize by component novelty, not blanket coverage.

## Rollout plan outline (for the follow-up plan)

1. Replace the spike's hand-rolled `composeStories` + manual `createRoot`
   mount with a generated/looped harness over all `*.stories.tsx` files
   (mirroring `packages/ui/src/__ssr__/ssr-stories.test.tsx`'s `Bun.Glob`
   pattern, adapted to vitest browser mode) — one `toMatchScreenshot()` per
   story's primary export.
2. Carry over the `vrt-spike` project's config verbatim: `reducedMotion:
   "reduce"` context option, `document.fonts.ready` wait, a settle-frame
   wait after mount. Consider hoisting the mount/settle helper into a shared
   `.storybook/vitest-vrt-setup.ts` or similar, reusing the existing
   `.storybook/vitest.setup.ts` project-annotations wiring.
3. Enumerate and exclude (or seed) `Math.random`-driven stories (e.g.
   `OctantField`) and any continuously-looping "Animated"/demo stories (e.g.
   `ProgressBar`'s `Animated` story, `Equalizer`'s default sweep) — the spike
   deliberately did not attempt these; they need either a frozen-clock
   strategy or an explicit skip-list.
4. Add the retry/timeout mitigation for the observed ~8% capture-stability
   flake (measure fresh on the CI runner first; don't over-fit to this
   contended dev box).
5. Decide and implement the baseline-update-review policy (a CI check or
   PR-label convention gating "did you mean to change these PNGs").
6. Wire a new `bun run` script (e.g. `test-vrt`) and a `check:full`-style
   composite gate once the above is stable; keep it separate from
   `test-storybook` until proven, exactly as this spike kept `vrt-spike`
   separate from `storybook`.
7. Expand the matrix (accent × viewport) only after the single-variant
   baseline has run stably in real CI for a representative period.

## Scope compliance

Only spike-scoped files were touched beyond plan 001's merge:
- `packages/ui/vitest.config.ts` (new `vrt-spike` project block)
- `packages/ui/src/__vrt__/vrt-spike.vrt.tsx` (new)
- `packages/ui/src/__vrt__/__screenshots__/vrt-spike.vrt.tsx/*.png` (new,
  committed baselines)
- `plans/011-findings.md` (this file)

No component/source change was made to force determinism (per the plan's
"out of scope" — the reduced-motion/fonts-ready recipe lives entirely in the
spike's test/config files). `.storybook/preview.tsx` was not touched. No new
dependencies were added (`@vitejs/plugin-react` was already an existing
devDependency, only newly *used* by the spike project's Vite plugin list —
verified via `packages/ui/package.json`, not installed fresh).
