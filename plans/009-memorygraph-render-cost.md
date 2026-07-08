# Plan 009: Cut MemoryGraph's per-frame render cost — memoize the SVG atoms, fix the drag-path scan

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 74aad33..HEAD -- packages/ui/src/organisms/MemoryGraph/MemoryGraph.tsx packages/ui/src/atoms/NodeGlyph/NodeGlyph.tsx packages/ui/src/atoms/EdgeArc/EdgeArc.tsx`
> Plan 008 intentionally lands first and touches `useForceLayout.ts` — that
> drift is expected and fine. On drift in THESE three files, compare excerpts
> before proceeding; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (touches interaction wiring on the flagship graph surface)
- **Depends on**: plans/008-forcelayout-preserve-positions.md (same subsystem; sequential diffs)
- **Category**: perf
- **Planned at**: commit `74aad33`, 2026-07-08

## Why this matters

While the force simulation settles (every mount, and every node-set change),
`MemoryGraph` runs a rAF loop calling `setTick` — a full React re-render of
the component 60×/s. Each render re-runs the render body of every `EdgeArc`
and `NodeGlyph` (~75 elements at the mock-vault scale, ~4,500 component
renders/second; the public API accepts uncapped node arrays, so 150 nodes ≈
27k/s) and rebuilds a `posById` Map. During a drag, the same full-tree render
fires on **every pointermove**, plus a linear scan of the positions array.
`useForceLayout`'s own docstring says positions live in a ref precisely "so we
don't trigger React re-renders 60×/s" — the graph re-introduces them.

This plan is the pragmatic 80%: `React.memo` the two SVG atoms so only nodes
whose props changed re-render (during drag: the dragged node + its edges,
instead of everything), and remove the per-move linear scan. A full
imperative-transform rewrite (zero re-renders during settle) is deliberately
deferred — see maintenance notes.

## Current state

- `packages/ui/src/organisms/MemoryGraph/MemoryGraph.tsx:62-76` — the tick loop:
  ```tsx
  const [, setTick] = useState(0);
  const tickFrame = useRef(0);

  // Re-render while the sim is awake so we read fresh positions each frame.
  useEffect(() => {
    if (converged) return;
    let raf = 0;
    const loop = () => {
      setTick((t) => (t + 1) % 1_000_000);
      tickFrame.current++;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [converged]);
  ```
  This loop STAYS (it is how fresh ref positions reach React). What changes is
  how much work each tick causes downstream.
- `MemoryGraph.tsx:172-191` — `onNodeMove` does
  `positions.current.find((l) => l.id === d.id)` per pointermove, then `pin()`
  + `setTick`.
- `MemoryGraph.tsx:234-239` — `posById` Map rebuilt per render (fine — keep;
  it reads the ref freshly by design, keyed on `tickFrame.current`).
- `MemoryGraph.tsx:273-291` renders `<EdgeArc … />` per edge with only
  primitives/strings as props; `:293-328` renders `<NodeGlyph … />` per node
  inside a `<g>` that owns all pointer handlers — NodeGlyph's props are
  `{ node, x: 0, y: 0, selected, hovered, pinned, dimmed, zoom }` where `node`
  is the caller's `MemoryNode` object (stable identity per item unless the
  caller rebuilds the array).
- `packages/ui/src/atoms/NodeGlyph/NodeGlyph.tsx` — plain exported function
  component (`export function NodeGlyph(props…)`), pure render from props
  (verify when editing: no hooks with external state besides its own
  animation, no context reads — read the file before wrapping).
- `packages/ui/src/atoms/EdgeArc/EdgeArc.tsx` — plain exported function
  component; props are coordinates + `edgeType`/`closed`/`highlighted`/`curve`.
- There are ZERO `React.memo` usages in `packages/ui/src` today — you are
  introducing the first ones; follow the naming/export pattern below so the
  public API (named exports `NodeGlyph`, `EdgeArc`) is unchanged.
- Conventions: strict TS, biome (2-space, lineWidth 110), JSDoc on exports,
  no default exports.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Fast gate | `bun run check` | exit 0 |
| Graph stories | `cd packages/ui && bunx vitest run --project=storybook src/organisms/MemoryGraph src/organisms/MemoryExplorer src/atoms/NodeGlyph src/atoms/EdgeArc` | pass |
| Full browser suite | `bun run --filter '@balaur/ui' test-storybook` | exit 0 |

## Scope

**In scope**:
- `packages/ui/src/atoms/NodeGlyph/NodeGlyph.tsx`
- `packages/ui/src/atoms/EdgeArc/EdgeArc.tsx`
- `packages/ui/src/organisms/MemoryGraph/MemoryGraph.tsx` (only `onNodeMove`
  and, if needed, the drag ref — NOT the tick loop, NOT the render structure)

**Out of scope**:
- `useForceLayout.ts` (plan 008's file — already landed by dependency order).
- The `setTick` rAF loop and `posById` rebuild — they are the designed
  mechanism, not the waste; removing them is the deferred imperative rewrite.
- `ChatThread`/`ChatMessage` memoization (audit finding PERF-03) — different
  surface, deliberately not bundled here.
- Any story file except adding an assertion if a play breaks legitimately
  (should not happen; treat as STOP).

## Git workflow

Repo rule: **never commit or push unless the owner explicitly asks.** Working
tree changes + report only.

## Steps

### Step 1: Memoize NodeGlyph

Read `NodeGlyph.tsx` fully first. Confirm the component is a pure render of
its props (no context, no non-deterministic values during render). Then wrap:

```tsx
import { memo } from "react";
// … existing imports …

/** (keep the existing JSDoc) */
function NodeGlyphImpl({ node, x, y, selected, hovered, pinned, dimmed, zoom }: NodeGlyphProps) {
  // existing body unchanged
}

/**
 * Memoized: MemoryGraph re-renders every animation frame while the force sim
 * settles; memo lets settled/unchanged nodes skip their render body.
 */
export const NodeGlyph = memo(NodeGlyphImpl);
```

Default shallow comparison is correct: all props are primitives except `node`
(stable object identity from the caller's array). Do NOT write a custom
comparator that deep-compares `node` — if the caller rebuilds node objects
each render, memo simply won't help; it must not hide real changes.

**Verify**: `bun run check` → exit 0; NodeGlyph stories pass:
`cd packages/ui && bunx vitest run --project=storybook src/atoms/NodeGlyph` → pass.

### Step 2: Memoize EdgeArc

Same pattern in `EdgeArc.tsx` (`EdgeArcImpl` + `export const EdgeArc = memo(EdgeArcImpl)`);
all props are primitives.

**Verify**: `bun run check` → exit 0; EdgeArc stories pass.

### Step 3: Fix the per-pointermove linear scan

In `MemoryGraph.tsx` `onNodeMove` (`:172-191`), replace
`positions.current.find((l) => l.id === d.id)` with a lookup that doesn't
scan per move. Simplest correct shape: capture the layout node once at drag
start — in `onNodeDown` (`:166-170`), resolve
`const lay = positions.current.find((l) => l.id === id) ?? null` and stash it
on the drag ref (`dragRef.current = { id, moved: false, lay }`); `onNodeMove`
then uses `d.lay`. IMPORTANT (post-plan-008): retained nodes keep object
identity across id-set reconciliation, but a node can still be REMOVED
mid-drag (filter toggle) — guard `if (!d.lay) return;` and also bail if
`!positions.current.includes(d.lay)` is too costly per move; instead accept
the stale-object write (harmless: the object is disconnected) OR re-resolve
on `d.moved` transition only. Choose the stash-once + null-guard shape; note
the removed-mid-drag edge in a one-line comment.

Update the `dragRef` type accordingly
(`useRef<{ id: string; moved: boolean; lay: LayoutNode | null } | null>(null)`)
— import `type LayoutNode` from `../../hooks/useForceLayout` (it is re-exported
there).

**Verify**: `bun run check` → exit 0. Graph story plays (drag/pin/selection)
pass: `cd packages/ui && bunx vitest run --project=storybook src/organisms/MemoryGraph src/organisms/MemoryExplorer` → pass.

### Step 4: Full sweep

**Verify**: `bun run --filter '@balaur/ui' test-storybook` → exit 0
(119+ files). `bun run check` → exit 0.

## Test plan

- No new test files: the graph's existing story plays (drag-to-pin, select,
  hover — in `MemoryGraph.stories.tsx` / `MemoryExplorer.stories.tsx`) are the
  behavioral regression net; they must stay green through all steps.
- The perf claim is structural, not asserted by a test: memo on pure-prop
  atoms provably skips render bodies whose props are unchanged. Manual
  spot-check (optional, non-gating): open Storybook, React DevTools profiler
  on the MemoryGraph story, confirm settled nodes don't re-render during a
  drag.

## Done criteria

- [ ] `grep -n "memo(" packages/ui/src/atoms/NodeGlyph/NodeGlyph.tsx packages/ui/src/atoms/EdgeArc/EdgeArc.tsx` → 1 match each
- [ ] `NodeGlyph`/`EdgeArc` remain NAMED exports with unchanged prop types (`bun run check` exits 0 proves the consumers compile)
- [ ] `grep -n "positions.current.find" packages/ui/src/organisms/MemoryGraph/MemoryGraph.tsx` → 1 match at most (in `onNodeDown`, not `onNodeMove`)
- [ ] `bun run check` exits 0
- [ ] `bun run --filter '@balaur/ui' test-storybook` exits 0
- [ ] Only the three in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `NodeGlyph.tsx` turns out NOT to be a pure props render (context reads,
  module state, or its own rAF that depends on parent re-renders) — memo could
  change behavior; report what you found.
- Any graph story play fails after memoization — memo revealed a hidden
  dependency on parent re-renders; do not "fix" by removing memo silently.
- Plan 008 has not landed (check `plans/README.md`) — order matters here.

## Maintenance notes

- **Deferred follow-up (the other 20%)**: a full imperative rework — sim rAF
  writes `transform`/path `d` directly through element refs; React renders
  only on discrete state changes (selection/hover/pin/zoom/converged). That
  eliminates settle-phase re-renders entirely but re-threads pan/zoom/drag;
  do it only if profiling still shows jank at real vault sizes.
- Related-but-separate: `ChatThread` re-renders all messages per streaming
  update (audit PERF-03) — same memo pattern applies to `ChatMessage` if that
  surface is picked up later.
- Reviewer: check the memo wrappers preserve the exported names/types exactly
  (the package's public API is the barrel's named exports) and that the drag
  ref's stashed node doesn't outlive removal in a way that breaks pin state
  (Step 3's guard).
