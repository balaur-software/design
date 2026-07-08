# Plan 008: Preserve force-layout positions across node-set changes (stop the filter-toggle re-scatter)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 74aad33..HEAD -- packages/ui/src/hooks/useForceLayout.ts packages/ui/src/hooks/use-force-layout.test.ts packages/ui/src/organisms/MemoryGraph/MemoryGraph.tsx`
> On drift, compare the excerpts below against live files; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (touches the layout engine under the flagship MemoryExplorer surface)
- **Depends on**: none (do this BEFORE plan 009 — both touch this subsystem)
- **Category**: bug
- **Planned at**: commit `74aad33`, 2026-07-08

## Why this matters

In `MemoryExplorer`, toggling any filter (type, importance, search query)
recomputes `visibleNodes`, which changes the id list passed to
`useForceLayout` — and the hook's re-seed effect responds by **throwing away
every node's position** and re-placing all of them on the deterministic init
circle. The settled layout the user was reading re-animates from scratch, and
manually dragged/pinned arrangements are destroyed (pins are re-applied to the
newly scattered coordinates, not the user's). Adding or removing a single
node re-places all N. The fix: on id-set change, keep existing nodes where
they are, seed only genuinely new ids, drop removed ones.

## Current state

- `packages/ui/src/hooks/useForceLayout.ts:227-234` — the re-seed effect:
  ```ts
  // Re-seed when the id set changes (added/removed nodes).
  const key = ids.join("\n");
  useEffect(() => {
    positions.current = initLayout(ids, initOpts());
    setConverged(false);
    forceTick((t) => (t + 1) % 1_000_000);
  }, [key, opts.width, opts.height, seed]);
  ```
  Note this effect ALSO runs on mount (double-seeding after the lazy init at
  `:218-224` — harmless today because both produce identical output, but the
  fix must keep mount behavior identical).
- `initLayout` (`:38-59`) — pure; places each id on a circle at an angle
  hashed from `seededRandom(\`${seed}:${id}\`)`. Per-id deterministic, so
  seeding ONLY new ids yields the same position a full re-seed would give
  them.
- `LayoutNode` shape (from `organisms/MemoryExplorer/memory-types.ts`):
  `{ id, x, y, vx, vy, pinned }`.
- Dead code to remove while here: `activeRef` (`:246`, written at `:252` and
  in `wake` `:258`, **never read** — the loop's on/off switch is the
  `!reduced && !converged` argument to `useRafLoop` at `:248-254`).
- The consumer chain that triggers the bug:
  `packages/ui/src/organisms/MemoryExplorer/MemoryExplorer.tsx:98`
  (`const visibleNodes = useMemo(() => filterNodes(nodes, flt), [nodes, flt])`)
  → `MemoryGraph` → `packages/ui/src/organisms/MemoryGraph/MemoryGraph.tsx:60-61`
  (`ids` memo → `useForceLayout(ids, edges, { width, height })`).
- Pins: `MemoryGraph.tsx:92-99` re-syncs `pinnedIds` into the layout via an
  effect that pins nodes **at their current coordinates** — after a re-scatter
  those are the WRONG (newly hashed) coordinates; with this fix they become
  the preserved ones, which is the desired behavior.
- `reseed()` (`:273-277`) is part of the hook's public API
  (`UseForceLayoutResult.reseed` — "Bump to re-seed positions") and has no
  in-repo caller; it must keep its full-re-scatter semantics (hosts may call
  it deliberately).
- Existing test file + conventions: `packages/ui/src/hooks/use-force-layout.test.ts`
  (bun test, tests the PURE functions `initLayout`/`stepLayout`/`pinById`
  directly — no React renderer). New pure logic goes in the same file style.
- Repo conventions: strict TS (`noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`); biome 2-space/lineWidth 110; JSDoc comments
  on exported functions (match the file's existing style).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Fast gate | `bun run check` | exit 0 |
| Just this test file | `bun test use-force-layout` | all pass, incl. new |
| Browser suite (post-001) | `bun run --filter '@balaur/ui' test-storybook` | exit 0 |

## Scope

**In scope**:
- `packages/ui/src/hooks/useForceLayout.ts`
- `packages/ui/src/hooks/use-force-layout.test.ts`

**Out of scope**:
- `MemoryGraph.tsx`, `MemoryExplorer.tsx` — no changes needed; the fix is
  entirely inside the hook. (Plan 009 modifies MemoryGraph — keep the plans'
  diffs separate.)
- `stepLayout`, `initLayout`, `pinById`, `releaseById` — unchanged.
- The `reseed()` API and its semantics.

## Git workflow

Repo rule: **never commit or push unless the owner explicitly asks.** Working
tree changes + report only.

## Steps

### Step 1: Add a pure `reconcileLayout` function

In `useForceLayout.ts`, next to `initLayout`, add:

```ts
/**
 * Reconcile an existing layout with a new id set: retained ids keep their
 * position/velocity/pin, new ids get their deterministic `initLayout`
 * placement, removed ids are dropped. Preserves user arrangement across
 * filter changes — a full re-scatter is only for explicit `reseed()`.
 */
export function reconcileLayout(
  prev: readonly LayoutNode[],
  ids: readonly string[],
  opts: { width?: number; height?: number; seed?: string } = {},
): LayoutNode[] {
  const byId = new Map(prev.map((n) => [n.id, n]));
  const fresh = initLayout(ids, opts);
  return fresh.map((seeded) => byId.get(seeded.id) ?? seeded);
}
```

(`initLayout` hashes per-id, so a new id gets the same spot it would get in a
full re-seed; retained nodes are the SAME object references, which keeps any
in-flight mutation semantics identical to today's within-frame behavior.)

**Verify**: `bun run check` → exit 0 (function exported, unused-yet is fine —
it's exported).

### Step 2: Unit-test `reconcileLayout`

Append to `use-force-layout.test.ts` a `describe("reconcileLayout", …)` with:

1. **retains positions**: init 5 ids, mutate `byId(l,"c").x = 999`, pin "d";
   reconcile with the same 5 ids → "c".x is 999, "d".pinned true.
2. **drops removed ids**: reconcile to `["a","b"]` → length 2, no "c".
3. **seeds new ids deterministically**: reconcile `["a","b","f"]` → "f"
   position equals `byId(initLayout(["a","b","f"]), "f")` position ("a"/"b"
   keep their mutated/settled values).
4. **empty→some and some→empty** edge cases: reconcile from `[]` equals
   `initLayout(ids)`; reconcile to `[]` is `[]`.

Follow the file's existing helpers (`byId`) and bun-test idioms (excerpt of
the file's head for reference):

```ts
import { describe, expect, it } from "bun:test";
import { initLayout, type LayoutNode, pinById, stepLayout } from "./useForceLayout";
```

**Verify**: `bun test use-force-layout` → all pass (existing + 4 new).

### Step 3: Use it in the re-seed effect

Replace the effect body at `:227-234`:

```ts
  // Reconcile when the id set changes: keep settled/dragged/pinned positions
  // for retained ids, seed only new ids, drop removed ones. (Full re-scatter
  // remains available via `reseed()`.)
  const key = ids.join("\n");
  useEffect(() => {
    positions.current = reconcileLayout(positions.current, ids, initOpts());
    setConverged(false);
    forceTick((t) => (t + 1) % 1_000_000);
  }, [key, opts.width, opts.height, seed]);
```

Mount behavior is unchanged: on first run `positions.current` already holds
`initLayout(ids, …)` from the lazy init, and reconciling it with the same ids
returns the same nodes.

Note on `opts.width/height/seed` in the dependency array: when only the
**dimensions** change (same ids), reconcile keeps every existing position —
that changes today's behavior, which re-scattered to the new circle. That is
the intended fix (a container resize must not destroy layout); flag it in
your report so the reviewer sees it explicitly. When `seed` changes with the
same ids, positions are likewise retained — acceptable, since `reseed()`
exists for forcing a fresh placement.

**Verify**: `bun run check` → exit 0.

### Step 4: Remove the dead `activeRef`

Delete the `activeRef` declaration (`const activeRef = useRef(!reduced && !converged);`)
and its two writes (in the `useRafLoop` callback's converged branch and in
`wake`). Nothing reads it.

**Verify**: `grep -n "activeRef" packages/ui/src/hooks/useForceLayout.ts` →
no matches. `bun run check` → exit 0.

### Step 5: Behavioral smoke via the graph stories

Run the MemoryGraph/MemoryExplorer stories' tests (they exercise mount,
drag-pin wiring, and selection):

**Verify**: `bun run --filter '@balaur/ui' test-storybook` → exit 0 (or, if
plan 001 hasn't landed, `cd packages/ui && bunx vitest run --project=storybook src/organisms/MemoryGraph src/organisms/MemoryExplorer` → passes).
Then open Storybook manually if a human is available — optional, not a gate.

## Test plan

- New: 4 `reconcileLayout` unit cases (Step 2) in
  `use-force-layout.test.ts`, following that file's existing structure.
- Regression: the full existing suite (`bun run check`), plus graph story
  plays in the browser suite.
- The user-visible claim ("filter toggle no longer re-scatters") is covered
  structurally by test 1 (retained ids keep mutated positions) — the hook path
  is a one-line delegation to the tested function.

## Done criteria

- [ ] `bun run check` exits 0
- [ ] `bun test use-force-layout` → existing tests + 4 new reconcile tests pass
- [ ] `grep -n "reconcileLayout" packages/ui/src/hooks/useForceLayout.ts` → ≥2 matches (definition + effect use)
- [ ] `grep -n "activeRef" packages/ui/src/hooks/useForceLayout.ts` → 0 matches
- [ ] `reseed()` still performs a full `initLayout` re-scatter (unchanged lines `:273-277`)
- [ ] Only the two in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated; report notes the resize-behavior change from Step 3

## STOP conditions

- The re-seed effect at `:227-234` doesn't match the excerpt (plan 009 or
  other work landed first and reshaped it) — reconcile the plans before
  editing.
- Any existing `use-force-layout` test fails after Step 3 — the reconcile
  semantics broke an invariant the suite pins; report, don't loosen the test.
- Graph story plays fail in Step 5 in a way that reproduces twice.

## Maintenance notes

- Plan 009 (MemoryGraph render-loop rework) builds directly on this file's
  behavior; land this first and re-verify 009's excerpts.
- If the host ever wants "re-layout visible subset around the filter" UX
  (deliberate re-scatter on filter), that's what the public `reseed()` is
  for — wire it to a UI affordance, don't revert this fix.
- Reviewer: confirm object identity is preserved for retained nodes (the
  `byId.get(...) ?? seeded` line) — MemoryGraph's drag handler mutates nodes
  through `positions.current.find(...)`, so replacing retained nodes with
  clones would subtly break an in-progress drag across a filter change.
