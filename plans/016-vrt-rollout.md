# Plan 016: VRT rollout — screenshot baselines for every story's primary export

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> Touch only in-scope files. On any STOP condition, stop and report.
>
> **Drift check (run first)**: your HEAD must contain
> `plans/011-findings.md`, `packages/ui/src/__vrt__/vrt-spike.vrt.tsx`, and
> the `vrt-spike` project in `packages/ui/vitest.config.ts`. If missing, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (baseline determinism at 100+ stories is the open risk the spike measured at ~8% capture-stability flake under load)
- **Depends on**: plans 014 + 015 merged (the story set must be final before baselining)
- **Category**: tests (from direction spike plan 011, verdict GO-WITH-CAVEATS)
- **Planned at**: post-014/015 main, 2026-07-08

## Why this matters

OCTANT's product is pixels; 011's spike proved `toMatchScreenshot()` works on
this stack with zero new dependencies and a falsifiable 1px sensitivity. This
plan scales the proven recipe from 3 stories to **every story file's primary
export** at single accent × single viewport (the spike's recommended phase-1
scope), behind a separate `test-vrt` command that does NOT gate `check:full`
until it has proven stable.

## Current state

**READ FIRST**: `plans/011-findings.md` (committed) — especially
"Determinism recipe", "Matrix scope recommendation", and
"Rollout plan outline" items 1–3 and 6 (items 4, 5, 7 are explicitly deferred:
CI tuning, baseline-review policy, accent/viewport matrix).

- Working spike to generalize: `packages/ui/src/__vrt__/vrt-spike.vrt.tsx`
  (composeStories + createRoot mount + fonts.ready + 2 rAF ticks +
  `toMatchScreenshot`), project config `vrt-spike` in
  `packages/ui/vitest.config.ts` (`reducedMotion: "reduce"` context option,
  `.vrt.tsx` extension so `bun test` never imports browser-only modules —
  keep BOTH conventions).
- Story enumeration pattern: `packages/ui/src/__ssr__/ssr-stories.test.tsx`
  uses `Bun.Glob` — vitest browser mode CANNOT use Bun APIs; use
  `import.meta.glob("../**/*.stories.tsx", { eager: true })` (Vite-native)
  instead.
- "Primary export": the first non-default export of each story module as
  ordered by `composeStories` (deterministic); name each snapshot
  `<dirname>-<storyName>` so baselines are stable across file moves within a
  folder.
- Known-nondeterministic categories to SKIP (findings item 3): stories driven
  by `Math.random` (e.g. OctantField's scatter) and continuously-looping
  animations whose reduced-motion path still varies. Build the skip-list
  empirically: run, identify failures across two consecutive runs, verify
  the failure is genuine nondeterminism (differs run-to-run), add to an
  explicit `SKIP: Set<string>` with a one-line reason comment per entry.
  A skip-list entry without a reason comment fails review.
- 55+ new baselines will be PNGs committed under
  `packages/ui/src/__vrt__/__screenshots__/` — the spike's three were
  2.7–16.3 KB each; expect single-digit MB total. Report the final size.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Generate baselines | `cd packages/ui && bunx vitest run --project=vrt -u` | writes PNGs |
| Compare run | `cd packages/ui && bunx vitest run --project=vrt` | all pass |
| Fast gate | `bun run check` | exit 0 |
| Full gate | `bun run check:full` | exit 0 (unchanged — vrt NOT included) |

## Scope

**In scope**:
- `packages/ui/src/__vrt__/vrt-stories.vrt.tsx` (create — the generalized harness)
- `packages/ui/src/__vrt__/vrt-spike.vrt.tsx` (DELETE — superseded) and its 3 spike baselines
- `packages/ui/src/__vrt__/__screenshots__/**` (new baselines)
- `packages/ui/vitest.config.ts` (rename/extend the project to `vrt`; keep `.vrt.tsx` include)
- `package.json` root + `packages/ui/package.json` (add `test-vrt` scripts)
- `README.md` (one script-list line for `bun run test-vrt`)

**Out of scope**:
- Adding vrt to `check`/`check:full` (findings item 6 — separate until proven).
- Any component/story source change to improve determinism — SKIP-list instead, report candidates.
- Accent/viewport matrices; non-primary story exports.
- CI configuration; baseline-review policy (owner decisions, deferred).

## Steps

### Step 1: Generalize the harness

Create `vrt-stories.vrt.tsx`: enumerate all `*.stories.tsx` via
`import.meta.glob`, `composeStories` each module, take the primary export,
mount with the spike's exact settle recipe (fonts.ready + 2 rAF), one
`toMatchScreenshot(name)` per story file, honoring `SKIP` (initially empty).
Rename the vitest project `vrt-spike` → `vrt` (same config otherwise), delete
the spike file + its baselines.

**Verify**: `cd packages/ui && bunx vitest run --project=vrt -u` → exits 0,
writes ~100+ PNGs (report the exact count).

### Step 2: Prove determinism, build the skip-list

Run the compare twice consecutively. For every failure: re-run that story's
comparison alone; if the diff differs run-to-run it's nondeterminism → add to
`SKIP` with a reason; if it's a capture-stability timeout, retry once before
deciding. Regenerate baselines after skip-list changes. Repeat until two
consecutive full compare runs pass clean.

**Verify**: two consecutive `bunx vitest run --project=vrt` → both exit 0.
Report: total stories baselined, skip-list entries + reasons, total PNG size.

### Step 3: Falsifiability re-proof at scale

Temporarily change one committed baseline PNG (e.g. truncate one byte or swap
two baselines), run compare → MUST fail for exactly that story; restore →
passes. (This proves the harness actually compares at scale, not vacuously.)

**Verify**: documented fail→restore→pass sequence in your report.

### Step 4: Scripts + docs

Add `"test-vrt": "vitest run --project=vrt"` to `packages/ui/package.json`
and `"test-vrt": "bun run --filter '@balaur/ui' test-vrt"` to root
`package.json`. Add one line to README's script list ("visual regression
suite; baselines under `packages/ui/src/__vrt__`; regenerate with
`bunx vitest run --project=vrt -u` after intentional visual changes").

**Verify**: `bun run test-vrt` from root → exit 0. `bun run check:full` →
exit 0 AND its output does NOT include the vrt project.

## Done criteria

- [ ] `bun run test-vrt` exit 0, twice consecutively
- [ ] ≥100 story files baselined (report exact number + skipped count)
- [ ] Every SKIP entry has a reason comment
- [ ] Falsifiability re-proof documented
- [ ] `bun run check` and `bun run check:full` exit 0, vrt not included in either
- [ ] Spike file + spike baselines deleted
- [ ] Only in-scope files changed

## STOP conditions

- `import.meta.glob` + `composeStories` cannot enumerate stories in browser
  mode (architecture blocker the spike didn't hit) — report with evidence.
- The skip-list grows past ~15% of story files — the recipe isn't holding at
  scale; report the failure taxonomy instead of skipping your way to green.
- Baseline directory exceeds ~25 MB — report before committing.

## Maintenance notes

- Intentional visual changes now require regenerating affected baselines in
  the same change — that's the point; the README line documents the command.
- Deferred by design: CI runner baselines (must be generated ON the CI image),
  review policy for PNG diffs, accent/viewport matrix, non-primary exports.
