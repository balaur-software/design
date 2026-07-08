# Plan 011: SPIKE — visual regression snapshots on the existing Storybook/Playwright infrastructure

> **Executor instructions**: This is a **design/spike plan** — the deliverable
> is a working proof-of-concept plus a written recommendation, NOT a full
> rollout. Follow the steps; honor the STOP conditions; timebox per step. When
> done, update the status row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 74aad33..HEAD -- packages/ui/vitest.config.ts packages/ui/package.json packages/ui/.storybook`
> On drift, re-read those files before proceeding.

## Status

- **Priority**: P3
- **Effort**: M (spike; timebox ~half a day)
- **Risk**: LOW (additive tooling; a failed spike costs only the timebox)
- **Depends on**: plans/001-wire-storybook-test-gate.md (the browser project must be green and runnable first)
- **Category**: direction (spike)
- **Planned at**: commit `74aad33`, 2026-07-08

## Why this matters

OCTANT is a pixel-identity design system — Unicode octant glyphs in `<pre>`
framebuffers, DepartureMono, hairline borders, a strict dark palette. A 1px or
glyph-cell regression IS a product regression, yet nothing catches one: the
464 interaction tests assert roles and behavior, never pixels. Meanwhile the
expensive part of visual testing is already paid for: 119 story files mount
every component in headless Chromium via `@vitest/browser-playwright`. The
sibling `web/` repo pins releases by tag, so an unnoticed visual break ships
silently into the host. This spike determines the cheapest reliable way to add
per-story screenshot baselines, proves it on a hard subset, and writes the
rollout recommendation.

## Current state

- `packages/ui/vitest.config.ts` — one vitest project, `name: "storybook"`,
  `browser: { enabled: true, headless: true, provider: playwright({}), instances: [{ browser: "chromium" }] }`,
  using `storybookTest({ configDir: … })` from `@storybook/addon-vitest`.
- Installed and relevant: `vitest@4.x`, `@vitest/browser-playwright@4.x`,
  `playwright@1.x`, `storybook@10.4.6`. Nothing screenshot-related exists
  (verified: no `toMatchScreenshot|screenshot|chromatic|percy` matches in
  `packages/ui` source/config).
- Vitest 4's browser mode ships an experimental visual-regression API
  (`expect(locator).toMatchScreenshot()` with configurable comparators and a
  `vitest --update` baseline flow) — **verify the exact API surface against
  the installed version's docs during the spike**, don't trust this line.
- Determinism hazards specific to this repo (the spike's real subject):
  - Animation everywhere: rAF loops (`useRafLoop`, `useOctantCanvas`),
    scramble/typewriter text, blinking cursors (`--bx-blink`), CSS keyframes
    (`bx-blink`, `bx-spin` in `packages/tokens/src/tokens.css`).
  - The library already honors reduced motion globally:
    `packages/ui/src/hooks/useReducedMotion.ts` — under
    `prefers-reduced-motion: reduce`, rAF loops don't start and animations
    render a static first frame. Playwright can force this
    (`emulateMedia`/context option `reducedMotion: "reduce"`) — likely THE
    determinism lever; confirm how to set it through the vitest-browser layer.
  - Font: DepartureMono is self-hosted woff2 (`packages/tokens/fonts/`) —
    loaded via `@font-face` in tokens.css, imported by
    `.storybook/preview.tsx`. Screenshots must wait for `document.fonts.ready`.
  - Randomness: some atoms use `Math.random` (e.g. OctantField's point
    scatter) — such stories may need exclusion or seeding.
- Story accent/background: preview sets accent `green`, background
  `octant-dark` (`.storybook/preview.tsx`) — a single-variant baseline is the
  spike default; matrices are a rollout question.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Browser suite | `bun run --filter '@balaur/ui' test-storybook` | exit 0 |
| Spike loop (one file) | `cd packages/ui && bunx vitest run --project=storybook src/atoms/Badge/Badge.stories.tsx` | pass |
| Baseline update (if vitest VRT) | `bunx vitest run --project=storybook --update` (verify flag name) | writes baselines |

## Scope

**In scope** (spike artifacts only):
- `packages/ui/vitest.config.ts` (spike-config additions)
- A NEW spike test file, e.g. `packages/ui/src/__vrt__/vrt-spike.test.tsx`
  (or per-story screenshot hooks if the chosen approach works that way)
- Committed baseline images under a dedicated dir (e.g.
  `packages/ui/src/__vrt__/__screenshots__/`)
- `plans/011-findings.md` (create — the written recommendation)

**Out of scope**:
- Rolling snapshots out to all 119 story files (that's the FOLLOW-UP plan this
  spike specifies).
- Any component/source change to make something deterministic (record the
  need; don't do it).
- New heavyweight dependencies (Chromatic/Percy SaaS are out by default —
  no external services; note them in the recommendation only as alternatives).
- `.storybook/preview.tsx` — global changes affect all tests; spike config
  stays in the spike files.

## Git workflow

Repo rule: **never commit or push unless the owner explicitly asks.** Working
tree changes + report only.

## Steps

### Step 1: Confirm the API actually available (timebox: 30 min)

Read the installed vitest's browser-mode docs
(`node_modules/vitest/README` / typings — search typings for
`toMatchScreenshot` in `node_modules/@vitest/browser/`; also
`bunx vitest --help | grep -i screenshot`). Establish: does vitest 4.1's
`expect(locator).toMatchScreenshot()` exist here, what baseline path/update
flow does it use, and can it coexist with `storybookTest` stories (which run
plays automatically)? Decide between:
- **(a)** vitest native `toMatchScreenshot` inside a dedicated spike test that
  mounts stories via Storybook's portable-stories API or `page` navigation, or
- **(b)** raw Playwright `page.screenshot()` + a pixel-compare in a plain
  vitest browser test, or
- **(c)** screenshots inside story `play` functions (only if (a)/(b) fail).

**Verify**: a one-paragraph decision with evidence (typings/doc paths) written
into `plans/011-findings.md`.

### Step 2: Prove it on three hard stories (timebox: 2 h)

Target set (deliberately hostile):
1. A static atom (e.g. `Badge` or `Tag`) — the trivial baseline sanity case.
2. A `<pre>`-framebuffer glyph component (e.g. `ProgressBar` or
   `ImportanceMeter`) — font + glyph-cell rendering.
3. An animated one (e.g. `Skeleton` or `Equalizer`) — must become
   deterministic under `reducedMotion: "reduce"` + `document.fonts.ready`,
   or be documented as needing exclusion.

Requirements for the proof: baselines generate; a **deliberate 1px change**
(e.g. temporarily tweak a border width in a spike-local style override) FAILS
the comparison; reverting passes again; two consecutive runs pass with zero
diff (determinism).

**Verify**: `cd packages/ui && bunx vitest run --project=storybook src/__vrt__` (or
the chosen invocation) → pass, twice; the deliberate-change experiment
documented with its diff output in `plans/011-findings.md`.

### Step 3: Write the recommendation (timebox: 1 h)

`plans/011-findings.md` must answer:
- Chosen mechanism + config, with the working spike as evidence.
- Determinism recipe (reduced motion, fonts.ready, any excluded categories —
  e.g. `Math.random` stories) and the flake rate observed across ≥3 runs.
- Baseline storage: repo-committed PNGs (size estimate for 119 stories ×
  variants) vs regenerate-locally; interaction with the tag-pin release flow
  (baselines must update in the same change as intentional redesigns).
- Matrix question: accent variants (green/amber/cyan) × viewports — recommend
  starting scope (likely: single accent, single viewport, all stories).
- The rollout plan outline (the follow-up plan an executor would run).
- OR: "not viable because X" with the evidence — a legitimate spike outcome.

**Verify**: `test -f plans/011-findings.md` and it contains a "Recommendation"
heading with one of GO / NO-GO / GO-WITH-CAVEATS.

## Test plan

The spike IS a test-infrastructure experiment; its own gate is Step 2's
falsifiability proof (deliberate change fails, revert passes, deterministic
across runs). Existing suites must stay green: `bun run check` and the
storybook project with the spike files present.

## Done criteria

- [ ] `plans/011-findings.md` exists with mechanism decision, determinism recipe, flake evidence, and a GO/NO-GO recommendation
- [ ] Spike test file + baselines exist and pass twice consecutively (or NO-GO is documented with failure evidence)
- [ ] The deliberate-1px-change experiment is documented (fail → revert → pass)
- [ ] `bun run check` and `bun run --filter '@balaur/ui' test-storybook` still exit 0 with spike files in place
- [ ] `plans/README.md` status row updated

## STOP conditions

- Step 1 finds no workable screenshot API in the installed stack without new
  dependencies — write the NO-GO findings and stop (do not add deps).
- Font rendering differs across two consecutive runs on THIS machine (true
  environment nondeterminism) — document it; that's a NO-GO for local-baseline
  strategy and the findings should say what would fix it (e.g. containerized
  runner), not implement it.
- The spike exceeds its timebox by 2× — write up partial findings and stop.

## Maintenance notes

- If GO: the follow-up rollout plan should extend `check:full` (plan 001's
  gate) rather than invent another command, and must define the
  baseline-update workflow for intentional visual changes (likely
  `vitest --update` + reviewing the image diff in the PR).
- Screenshot baselines are machine/renderer-sensitive; if CI ever appears,
  baselines must be generated ON the CI image, not developer machines — the
  findings doc should state this explicitly.
