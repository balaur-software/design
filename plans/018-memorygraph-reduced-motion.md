# Plan 018: Fix MemoryGraph's perpetual re-render loop under prefers-reduced-motion

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> Touch only in-scope files. On any STOP condition, stop and report.
>
> **Drift check (run first)**: your worktree may be based on `origin/main`
> (behind local). Run `git merge main --no-edit` to fast-forward to local main
> (`68355e0`), then verify `git rev-parse --short HEAD` → `68355e0` and that
> `packages/ui/src/__vrt__/vrt-stories.vrt.tsx` contains `"memorygraph-default"`
> in its SKIP set. If the merge conflicts or that string is absent, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (touches a shared layout hook + the flagship graph render path; a naive version of this fix silently regresses reduced-motion redraws — this plan carries the corrected, adversarially-verified fix)
- **Depends on**: none (builds on merged plans 008 + 009, already in main)
- **Category**: bug / perf
- **Planned at**: commit `68355e0`, 2026-07-08

## Why this matters

Under `prefers-reduced-motion: reduce`, MemoryGraph re-renders its entire SVG
tree at ~60fps **forever** — the exact opposite of what reduced motion should
do. The VRT rollout (plan 016) had to SKIP `memorygraph-default` for precisely
this reason (screenshot instability from the perpetual re-render). This fix
stops the loop AND — critically — preserves the redraw paths that the loop was
accidentally powering (new nodes on filter change, double-click pin toggle,
external `pinnedIds` sync). A one-file "just stop the loop" fix was tried and
**rejected by adversarial review** because it silently breaks those redraws;
the correct fix is two files, below.

## Root cause (confirmed end-to-end)

1. `useReducedMotion()` returns `reduced` (false on server, flips true after
   mount when the media query matches).
2. `useForceLayout.ts` — the ONLY call to `setConverged(true)` is inside the
   `useRafLoop` callback (`:264-268`), and that loop's `active` argument is
   `!reduced && !converged` (`:269`). Under reduced motion `active` is `false`
   forever, so the callback never fires, so `setConverged(true)` is never
   reached — internal `converged` is stuck `false`.
3. `MemoryGraph.tsx:61` destructures `converged`; `:66-76` runs a
   `requestAnimationFrame` loop calling `setTick` every frame, gated
   `if (converged) return;`. Since `converged` is `false` forever, the loop
   never stops → 60fps whole-tree re-render.

**The trap (why the naive fix is wrong):** MemoryGraph paints node/edge
geometry and the pinned flag out of `posById` (`:237-242`), a `useMemo` keyed
on `[positions, tickFrame.current]`. `positions` is a stable ref;
`tickFrame.current` is MemoryGraph's OWN ref, bumped only by the setTick loop
(`:71`) and the drag handler (`:191-192`). The hook's `forceTick` re-renders
MemoryGraph but does NOT bump `tickFrame.current`, so `posById` returns its
CACHED value. Today, reconcile (new nodes), double-click pin, and `pinnedIds`
sync all repaint ONLY because the perpetual loop bumps `tickFrame.current`
every frame. Stop the loop without fixing `posById` and those three redraws
silently break under reduced motion — and no static screenshot test would
catch it.

## Current state (exact code)

**`packages/ui/src/hooks/useForceLayout.ts`:**
- `:225` `const reduced = useReducedMotion();`
- `:242` `const [converged, setConverged] = useState(false);`
- `:264-269`:
  ```ts
  useRafLoop(() => {
    const energy = stepLayout(positions.current, adj, merged);
    if (energy < merged.settleThreshold) {
      setConverged(true);
    }
  }, !reduced && !converged);
  ```
- `:271-273`:
  ```ts
  const wake = () => {
    setConverged(false);
  };
  ```
- The hook's return (near `:292`): `return { positions, pin, release, settle, converged, reseed };`
  (`forceTick` is the setter from `const [, forceTick] = useState(0);` at `:241`.)

**`packages/ui/src/organisms/MemoryGraph/MemoryGraph.tsx`:**
- `:61` `const { positions, pin, release, converged } = useForceLayout(ids, edges, { width, height });`
- `:62-63`:
  ```ts
  const [, setTick] = useState(0);
  const tickFrame = useRef(0);
  ```
- `:66-76` the tick loop (gated `if (converged) return;`), calling
  `setTick(...)` and `tickFrame.current++` each frame.
- `:191-192` inside `onNodeMove` (drag): `tickFrame.current++;` then `setTick(...)`.
- `:237-242`:
  ```ts
  const posById = useMemo(() => {
    const m = new Map<string, { x: number; y: number; pinned: boolean }>();
    for (const l of positions.current) m.set(l.id, { x: l.x, y: l.y, pinned: l.pinned });
    return m;
    // Rebuild every render so we read fresh positions during the sim.
  }, [positions, tickFrame.current]);
  ```
  (The comment states the intent — "rebuild every render" — but the memo key
  doesn't achieve it; that IS the bug.)

**`packages/ui/src/__vrt__/vrt-stories.vrt.tsx`:** `"memorygraph-default"` is
in the `SKIP` set (~`:147`) with a comment explaining the perpetual-loop
instability. That comment/entry is removed by this plan (Step 4).

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Fast gate | `bun run check` | exit 0 |
| VRT suite | `bun run test-vrt` | exit 0 (was 115 pass/8 skip → becomes 116 pass/7 skip + the new probe) |
| Regenerate a baseline | `cd packages/ui && bunx vitest run --project=vrt -u` | writes PNGs |
| Full gate | `bun run check:full` | exit 0 |

## Scope

**In scope**:
- `packages/ui/src/hooks/useForceLayout.ts` (converged return + wake)
- `packages/ui/src/organisms/MemoryGraph/MemoryGraph.tsx` (posById inline; remove dead tickFrame)
- `packages/ui/src/__vrt__/vrt-stories.vrt.tsx` (un-skip memorygraph-default)
- `packages/ui/src/__vrt__/reduced-motion.vrt.tsx` (create — the behavioral probe)
- `packages/ui/src/__vrt__/__screenshots__/vrt-stories.vrt.tsx/memorygraph-default-*.png` (new baseline)

**Out of scope**:
- The `useRafLoop` sim-loop gate (`:269`) — leave `!reduced && !converged` exactly as-is.
- The reconcile effect (`:248-252`), `reseed`, `settle`, `pin`, `release` bodies (except `wake`).
- `NodeGlyph`/`EdgeArc` (plan 009's memoized atoms) — unchanged.
- The other 7 VRT skips — not this plan.
- Any perf rewrite of the graph's render model (deferred).

## Steps

### Step 1: Stop the loop under reduced motion (hook)

In `useForceLayout.ts`, change the hook's **return** so the exported
`converged` is `true` whenever reduced-motion is active (the layout is
permanently at rest — the sim never runs):

```ts
return { positions, pin, release, settle, converged: reduced || converged, reseed };
```

Do NOT change the `useRafLoop` gate at `:269` — internal `converged` still
drives it, and `!reduced` already keeps the sim from starting under reduced
motion.

**Verify**: `bun run check` → exit 0.

### Step 2: Make wake() force a repaint under reduced motion (hook)

Under reduced motion, internal `converged` is already `false`, so
`setConverged(false)` is a no-op that triggers no re-render — meaning
`pin()`/`release()` (which call `wake()`) would never repaint. Fix `wake`:

```ts
const wake = () => {
  setConverged(false);
  // Under reduced motion the sim loop is off and setConverged(false) is a
  // no-op (already false), so nothing would re-render; force one repaint.
  if (reduced) forceTick((t) => (t + 1) % 1_000_000);
};
```

**Verify**: `bun run check` → exit 0.

### Step 3: Rebuild posById every render (MemoryGraph)

Replace the `posById` `useMemo` (`:237-242`) with an inline rebuild every
render — implementing the code's own stated intent, so any re-render (the
hook's `forceTick`, MemoryGraph's `setTick`, pan/zoom/hover) reflects fresh ref
positions:

```ts
// Built every render (not memoized): the sim mutates `positions.current` in
// place, so node geometry + pin flags must be read fresh each render. Cheap
// (one Map of N nodes); the memoized NodeGlyph/EdgeArc children skip when
// their own props are unchanged.
const posById = new Map<string, { x: number; y: number; pinned: boolean }>();
for (const l of positions.current) posById.set(l.id, { x: l.x, y: l.y, pinned: l.pinned });
```

Then remove the now-dead `tickFrame` ref: delete the `const tickFrame = useRef(0);`
declaration (`:63`), the `tickFrame.current++;` line in the tick loop (`:71`),
and the `tickFrame.current++;` line in `onNodeMove` (`:191`). **Keep every
`setTick(...)` call** — those force the re-renders; only the `tickFrame` bumps
are removed. Remove `useMemo` from the React import if it is now unused
(check: `grep -c "useMemo" MemoryGraph.tsx` — there are OTHER useMemos, e.g.
`ids`, `neighbours`, `grid`, so it likely stays; only remove if the count hits 0).

**Verify**: `grep -n "tickFrame" packages/ui/src/organisms/MemoryGraph/MemoryGraph.tsx`
→ 0 matches. `bun run check` → exit 0.

### Step 4: Un-skip memorygraph-default in VRT + baseline

In `packages/ui/src/__vrt__/vrt-stories.vrt.tsx`, remove `"memorygraph-default"`
from the `SKIP` set and its explanatory comment block. Then regenerate its
baseline:

```bash
cd packages/ui && bunx vitest run --project=vrt -u
```

**Verify**: a new PNG `memorygraph-default-*.png` exists under
`__screenshots__/vrt-stories.vrt.tsx/`; `grep -c "memorygraph-default" src/__vrt__/vrt-stories.vrt.tsx` → 0.
Then run the compare twice: `bunx vitest run --project=vrt` twice → both exit 0,
`memorygraph-default` now among the passing (not skipped) tests. (Retry once on
a cold-cache "Vite unexpectedly reloaded a test" or a capture-stability timeout,
per the known-flake policy; if `memorygraph-default` fails the COMPARE twice in
a row with a real pixel diff, the loop is not actually stopped — STOP and report.)

### Step 5: Behavioral regression probe (the redraw paths the screenshot can't cover)

Create `packages/ui/src/__vrt__/reduced-motion.vrt.tsx`. It runs in the `vrt`
vitest project, which forces `contextOptions: { reducedMotion: "reduce" }`, so
it exercises the REAL reduced-motion path. Model the mount on the existing
`vrt-stories.vrt.tsx` harness (it uses `@vitest/browser/context` + a manual
React root; reuse that pattern — do NOT add new deps like @testing-library).

The probe component uses `useForceLayout` directly and renders two observable
attributes plus a pin trigger:

```tsx
function Probe() {
  const { positions, pin, converged } = useForceLayout(["a", "b", "c"], [], { width: 400, height: 300 });
  const a = positions.current.find((n) => n.id === "a");
  return (
    <div>
      <span data-testid="converged">{String(converged)}</span>
      <span data-testid="a-pinned">{String(a?.pinned ?? false)}</span>
      <button type="button" data-testid="pin-a" onClick={() => pin("a")}>pin</button>
    </div>
  );
}
```

The test (after mounting and awaiting a couple of frames so `useReducedMotion`'s
post-mount effect has flipped `reduced` true):

1. `converged` reads `"true"` — the loop can't start under reduced motion.
   (FAILS on today's code: converged is `false` there.)
2. `a-pinned` reads `"false"` initially.
3. Click `pin-a`, await a frame.
4. `a-pinned` now reads `"true"` — the pin forced a repaint under reduced
   motion. (FAILS on a "stop the loop but don't fix wake()" version: with the
   loop stopped, `setConverged(false)` is a no-op → no re-render → the ref
   change never paints → still `"false"`.)

This probe discriminates all three states: today's bug (assert 1 fails),
a half-fix (assert 4 fails), the full fix (all pass).

**Verify**: `bun run test-vrt` → exit 0, the probe passes. Confirm it actually
fails pre-fix by temporarily reverting Step 1 (`converged` return to plain
`converged`) → the probe's assert 1 fails → restore Step 1. (Document this
fail→restore→pass in your report; do not leave the revert in place.)

### Step 6: Full gates

**Verify**: `bun run check` → exit 0; `bun run check:full` → exit 0 (unchanged,
490 storybook tests); `bun run test-vrt` twice → both exit 0.

## Test plan

- VRT un-skip of `memorygraph-default` (Step 4) — the direct regression guard
  for the perpetual loop (screenshot instability → stable).
- New `reduced-motion.vrt.tsx` probe (Step 5) — guards the two interactive
  redraw regressions (loop-stops + wake-repaints) that a static screenshot
  cannot see. Discriminates buggy / half-fixed / fixed.
- The animated (non-reduced) path is unchanged: `converged` is `false` there,
  so MemoryGraph's loop still runs the settle animation exactly as before;
  `posById` rebuilds each frame as it did (the memo invalidated every frame
  via `tickFrame` before; now inline — same cost), and plan 009's memoized
  atoms still skip unchanged children.

## Done criteria

- [ ] `bun run check` exit 0; `bun run check:full` exit 0
- [ ] `bun run test-vrt` exit 0, twice; `memorygraph-default` now passes (not skipped)
- [ ] `grep -n "tickFrame" MemoryGraph.tsx` → 0; `grep -n "memorygraph-default" vrt-stories.vrt.tsx` → 0
- [ ] `useForceLayout` return has `converged: reduced || converged`; `wake` has the `if (reduced) forceTick` line
- [ ] `posById` is an inline rebuild (no `useMemo` on it)
- [ ] `reduced-motion.vrt.tsx` probe exists and passes; report documents the pre-fix failure of assert 1
- [ ] Only in-scope files changed (+ the one new baseline PNG)

## STOP conditions

- After Step 3, `grep "tickFrame"` finds a reader you didn't expect (something
  besides the loop/drag bumps + the posById key) — report it before removing.
- `memorygraph-default` fails the VRT COMPARE twice with a genuine pixel diff
  after the fix — the loop isn't actually stopping; report the diff.
- The probe's assert 4 (`a-pinned` → true after pin) can't be made to pass —
  the wake() repaint isn't working; report rather than deleting the assertion.
- The non-reduced-motion animated settle visibly breaks (any storybook
  MemoryGraph/MemoryExplorer play fails) — the return change leaked into the
  animated path; STOP.

## Maintenance notes

- If the graph's render model is ever rewritten to drive node transforms
  imperatively (the deferred plan-009 follow-up), this `posById`/`setTick`
  machinery goes away and this fix with it — leave a breadcrumb in that plan.
- The `reduced-motion.vrt.tsx` probe is the template for testing any other
  reduced-motion behavior: it's the only project with the media feature forced.
- `test-vrt` is not in `check:full`; these reduced-motion guards run there, so
  release/CI must run `test-vrt` (already noted in plan 016 + docs/RELEASE.md's
  gate list should include it when CI lands).
