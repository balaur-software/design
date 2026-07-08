# Plan 010: Stop allocating a full-frame ImageData every frame in the octant-core painters

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 74aad33..HEAD -- packages/octant-core/src/raster.ts packages/octant-core/src/raster.test.ts`
> On drift, compare the excerpts below against live files; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `74aad33`, 2026-07-08

## Why this matters

All three canvas painters in octant-core allocate a fresh `ImageData` on every
call: `ctx.createImageData(dw, dh)` creates and zero-initializes a
`dw*dh*4`-byte buffer. `paintBuf` is called once per animation frame by
`OctantField` (via `useOctantCanvas`'s rAF loop): a full-bleed field at the
default `dotPx: 4` on a 1440×900 area is ~360×225 cells ≈ 324 KB allocated and
discarded **per frame** ≈ 19 MB/s of garbage at 60fps, per field instance —
steady GC pressure competing with the animation producing it. The fix reuses
one `ImageData` per canvas, clearing it before each paint.

## Current state

- `packages/octant-core/src/raster.ts` — three painters, each with the same
  head (resize canvas if needed, then allocate). `paintBuf` (`:25-50`):
  ```ts
  export function paintBuf(
    c: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    buf: Buf,
    dw: number,
    dh: number,
    r: number,
    g: number,
    b: number,
  ): void {
    if (c.width !== dw || c.height !== dh) {
      c.width = dw;
      c.height = dh;
    }
    const im = ctx.createImageData(dw, dh);
    const d = im.data;
    for (let i = 0, j = 0; i < buf.length; i++, j += 4) {
      if (buf[i]) { d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255; }
    }
    ctx.putImageData(im, 0, 0);
  }
  ```
  `paintLUT` allocates at `:145`, `paintVal` at `:178` — same pattern.
  All three painters **rely on the zero-init** of a fresh buffer (they write
  only lit cells) — a reused buffer MUST be cleared first.
- Package constraints: `@balaur/octant-core` is dependency-free, framework-free
  TypeScript. `bun test` here has **no DOM**: the existing
  `packages/octant-core/src/raster.test.ts` tests `drawLine`/`strokeArc`
  (pure buffer writers) behaviorally, and for the painters only asserts they
  import cleanly (`describe("canvas painters import cleanly (no DOM in bun)")`).
  So the reuse logic must be testable WITHOUT a canvas — hence the pure
  fill-helper extraction below.
- Sole in-repo per-frame caller: `packages/ui/src/atoms/OctantField/OctantField.tsx:44-78`
  (`draw:` callback runs `paintBuf(canvas, ctx, buf, dw, dh, ar, ag, ab)` each
  rAF frame). No call-site changes are needed — the cache lives inside
  raster.ts, keyed per context.
- Conventions: strict TS (`noUncheckedIndexedAccess` — note the existing code
  uses `buf[i]` truthiness and `vbuf[i] ?? 0`); JSDoc on exports; biome
  2-space/lineWidth 110.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Fast gate | `bun run check` | exit 0 |
| This test file | `bun test raster` | all pass incl. new |
| Browser smoke (OctantField story renders through the painter) | `cd packages/ui && bunx vitest run --project=storybook src/atoms/OctantField` | pass |

## Scope

**In scope**:
- `packages/octant-core/src/raster.ts`
- `packages/octant-core/src/raster.test.ts`

**Out of scope**:
- Painter signatures — public API unchanged (no new required params).
- `packages/octant-core/src/index.ts` barrel — only if the new pure helpers
  should be private, do NOT export them from the barrel; they can be exported
  from `raster.ts` for testing without being re-exported by `index.ts`.
  Check first: `grep -n "raster" packages/octant-core/src/index.ts` — if the
  barrel uses `export *`, the helpers become public; that is acceptable, note
  it in the report.
- `OctantField.tsx`, `useOctantCanvas.ts` — no caller changes.

## Git workflow

Repo rule: **never commit or push unless the owner explicitly asks.** Working
tree changes + report only.

## Steps

### Step 1: Extract pure pixel-fill helpers

In `raster.ts`, extract each painter's inner loop into a pure function
operating on a `Uint8ClampedArray` (testable without DOM). For `paintBuf`:

```ts
/** Write lit cells of `buf` into an RGBA pixel array (assumed pre-cleared). */
export function fillRGBA(d: Uint8ClampedArray, buf: Buf, r: number, g: number, b: number): void {
  for (let i = 0, j = 0; i < buf.length; i++, j += 4) {
    if (buf[i]) { d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255; }
  }
}
```

Likewise `fillRGBALut(d, buf, lut)` (from `paintLUT`'s loop) and
`fillRGBAVal(d, vbuf, r, g, b)` (from `paintVal`'s loop, keeping the clamp and
`?? 0` semantics exactly). The painters call these helpers.

**Verify**: `bun run check` → exit 0 (pure refactor, no behavior change).

### Step 2: Add the per-context ImageData cache

At module level in `raster.ts`:

```ts
// One reusable frame per 2D context: painters run per animation frame, and a
// fresh createImageData() per call is ~dw*dh*4 bytes of garbage per frame.
// WeakMap keys on the context so canvases can be GC'd normally.
const frames = new WeakMap<CanvasRenderingContext2D, ImageData>();

function frameFor(ctx: CanvasRenderingContext2D, dw: number, dh: number): ImageData {
  let im = frames.get(ctx);
  if (!im || im.width !== dw || im.height !== dh) {
    im = ctx.createImageData(dw, dh);
    frames.set(ctx, im);
  } else {
    im.data.fill(0); // painters only write lit cells — must clear stale pixels
  }
  return im;
}
```

Replace `const im = ctx.createImageData(dw, dh);` in all three painters with
`const im = frameFor(ctx, dw, dh);`.

**Verify**: `grep -c "createImageData" packages/octant-core/src/raster.ts` →
exactly `1` (inside `frameFor`). `bun run check` → exit 0.

### Step 3: Test the regression that matters — stale pixels must clear

Append to `raster.test.ts` a `describe("fill helpers", …)` (bun test, no DOM):

1. `fillRGBA` writes RGBA at lit indices, leaves unlit at 0 (build a
   `Uint8ClampedArray(4*4*4)`, a `buf` with two lit cells, assert exact bytes).
2. `fillRGBALut` maps codes through the LUT; code 0 and unknown codes leave
   pixels untouched.
3. `fillRGBAVal` clamps `v > 1` to 1 and skips `v <= 0`.
4. **The reuse regression**: simulate two consecutive frames on ONE array —
   fill with frame-A lit cells, then `d.fill(0)`, then fill with frame-B
   (different cells); assert no frame-A pixel survives. (This pins the
   contract `frameFor` relies on; `frameFor` itself needs a DOM and is covered
   by the story smoke in Step 4.)

**Verify**: `bun test raster` → all pass (existing + 4 new).

### Step 4: Browser smoke through the real painter

**Verify**: `cd packages/ui && bunx vitest run --project=storybook src/atoms/OctantField`
→ passes (the story mounts the canvas and runs `paintBuf` through
`frameFor`). If plan 001 landed, finish with
`bun run --filter '@balaur/ui' test-storybook` → exit 0.

## Test plan

- 4 new pure unit tests (Step 3) in `raster.test.ts`, following that file's
  existing buffer-assertion style (`drawLine` tests build small buffers and
  assert cells).
- The DOM-touching path (`frameFor` + `putImageData`) is covered by the
  OctantField story rendering in headless Chromium.

## Done criteria

- [ ] `grep -c "createImageData" packages/octant-core/src/raster.ts` → 1
- [ ] `bun test raster` → all pass, including the stale-pixel regression case
- [ ] `bun run check` exits 0
- [ ] OctantField story passes in the browser project
- [ ] Painter public signatures unchanged (no caller edits anywhere: `git status` shows only the two in-scope files)
- [ ] `plans/README.md` status row updated (note whether the fill helpers became barrel-public)

## STOP conditions

- The painters' loops don't match the excerpts (drifted).
- Visual difference in the OctantField story you can't explain (e.g. ghost
  trails = the clear isn't happening; that's the exact bug the design guards
  against — fix `frameFor`'s clear path, and STOP if it persists).
- `WeakMap<CanvasRenderingContext2D, …>` typing fails under the current TS
  config in a DOM-free package — if `lib` doesn't include DOM types for these
  files, report how the existing painter signatures compile
  (`tsconfig` inspection) rather than adding lib flags yourself.

## Maintenance notes

- If a second canvas consumer ever paints with a DIFFERENT size on the same
  context between frames (not the current pattern), `frameFor` reallocates per
  size flip — fine for correctness, but a size-thrash would negate the reuse;
  keep one painter size per context.
- The pure `fill*` helpers are the unit-testable seam for any future painter
  (e.g. an alpha-blended variant); extend the same test table.
- Reviewer: the only risk worth attention is the `fill(0)` clear — check it's
  on the reuse path and NOT on the fresh-allocation path (createImageData is
  already zeroed; double-clearing is waste, missing-clearing is a ghosting bug).
