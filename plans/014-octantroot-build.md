# Plan 014: Build `<OctantRoot>` — component, stories, CONSUMING.md rewrite, font-path constant

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> Touch only in-scope files. On any STOP condition, stop and report.
>
> **Drift check (run first)**: your HEAD must contain
> `docs/superpowers/specs/2026-07-08-octant-root-design.md` and
> `packages/ui/src/providers/OctantRoot.prototype.stories.tsx`. If either is
> missing, STOP.

## Status

- **Priority**: P2
- **Effort**: S–M
- **Risk**: LOW (new component is proven prototype code; doc rewrite is the larger surface)
- **Depends on**: merged main ≥ `586b319` (contains the approved design spec + prototype)
- **Category**: feature (from direction design plan 013)
- **Planned at**: commit `586b319`, 2026-07-08

## Why this matters

The design spec (approved, on main) proved two things: (1) every host
hand-assembles the same provider recipe from prose, and (2) the recipe as
currently documented is **wrong** — `ToastProvider`-outer renders the toast
stack as a DOM sibling of the app, so toasts never inherit a non-default
accent. This plan ships the real `<OctantRoot>` (AccentProvider outer,
ToastProvider inner), fixes the documentation (including the stale
`useToast()` consumer list), and adds the `FONT_MONO_SUBPATH` constant so
hosts stop hand-typing the font path.

## Current state

**READ FIRST — the spec is the source of truth**:
`docs/superpowers/specs/2026-07-08-octant-root-design.md` (in your worktree,
committed). Sections you will implement: "API proposal" (the exact component
shape), "Nesting order decision" (AccentProvider OUTER — the opposite of what
CONSUMING.md currently documents), "Font ergonomics" (the `FONT_MONO_SUBPATH`
constant + `Bun.resolveSync` recipe), "Build plan outline" items 1–3.

- Prototype with proven plays: `packages/ui/src/providers/OctantRoot.prototype.stories.tsx`
  (3 stories: Default, CyanAccentReachesToast, WrongNestingRepro). The real
  stories promote the first two; the WrongNestingRepro negative-control gets
  deleted with the prototype (its job is done).
- `packages/ui/src/providers/AccentProvider/AccentProvider.tsx` — folder
  pattern to copy (`Name/Name.tsx`); providers barrel at
  `packages/ui/src/providers/index.ts` currently exports only AccentProvider.
- The CORRECT `useToast()` consumer list (verified by grep during design):
  `DropdownMenu`, `CommandPalette`, `Menubar`, `ContextMenu`, `Toast`,
  `Popover`. CONSUMING.md currently lists
  `CommandPalette, DropdownMenu, ContextMenu, Popover, ScrambleButton, DeployButton` — wrong
  (re-verify with `grep -rln "useToast(" packages/ui/src --include="*.tsx" | grep -v stories | grep -v prototype`
  before writing; use what the grep says).
- `packages/tokens/src/index.ts` — typed token entry point where
  `FONT_MONO_SUBPATH` goes.
- `docs/CONSUMING.md` "App-root wiring" section — the rewrite target. Also
  its SSR-note paragraph about fonts (add the resolveSync recipe there).
- Conventions: one component per folder; JSDoc on exports; stories titled
  `OCTANT/Providers/OctantRoot`; play conventions per any existing story;
  token fallbacks must match tokens.css exactly; strict TS
  (`exactOptionalPropertyTypes` — conditional prop spreads).

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Fast gate | `bun run check` | exit 0 |
| Providers stories | `cd packages/ui && bunx vitest run --project=storybook src/providers` | pass |
| Full gate | `bun run check:full` | exit 0 |

## Scope

**In scope**:
- `packages/ui/src/providers/OctantRoot/OctantRoot.tsx` (create)
- `packages/ui/src/providers/OctantRoot/OctantRoot.stories.tsx` (create)
- `packages/ui/src/providers/OctantRoot.prototype.stories.tsx` (DELETE)
- `packages/ui/src/providers/index.ts` (add export)
- `packages/tokens/src/index.ts` (add `FONT_MONO_SUBPATH`)
- `docs/CONSUMING.md` (App-root wiring rewrite + useToast list fix + font recipe)

**Out of scope**:
- `AccentProvider.tsx`, `ToastProvider.tsx` — unchanged.
- `tokens.css`, root `package.json` exports — the CSS decision keeps imports explicit.
- The sibling `web/` repo (its migration is a note in the spec, not this repo's work).
- Version bump (a separate release-prep plan owns it).

## Steps

### Step 1: The component

Create `packages/ui/src/providers/OctantRoot/OctantRoot.tsx` exactly per the
spec's "API proposal" + "Implementation shape" (AccentProvider outer,
ToastProvider inner, NO css import). JSDoc must state the nesting rationale in
one sentence (toast stack must sit inside AccentProvider's div to inherit the
accent). Export `OctantRootProps`. Add
`export * from "./OctantRoot/OctantRoot";` to `packages/ui/src/providers/index.ts`.

**Verify**: `bun run check` → exit 0.

### Step 2: Real stories, delete prototype

Create `OctantRoot.stories.tsx` (title `OCTANT/Providers/OctantRoot`)
promoting the prototype's Default + CyanAccentReachesToast stories/plays
against the REAL component (adapt imports; keep the computed-color assertions
against `ACCENTS`). Then `git rm packages/ui/src/providers/OctantRoot.prototype.stories.tsx`.

**Verify**: `cd packages/ui && bunx vitest run --project=storybook src/providers`
→ all pass (AccentProvider + new OctantRoot stories; prototype gone).
`bun run check` → exit 0.

### Step 3: `FONT_MONO_SUBPATH`

Add to `packages/tokens/src/index.ts` per the spec's Font ergonomics:

```ts
/** Subpath (relative to the package root) of the self-hosted DepartureMono font. */
export const FONT_MONO_SUBPATH = "tokens/fonts/departure-mono.woff2";
```

**Verify**: `grep -n "FONT_MONO_SUBPATH" packages/tokens/src/index.ts` → 1 match;
`bun run check` → exit 0.

### Step 4: CONSUMING.md rewrite

In `docs/CONSUMING.md`:
1. "App-root wiring": lead with `<OctantRoot accent="green">` (CSS import
   stays a separate explicit line above it); keep a "manual composition"
   sub-note documenting `AccentProvider` OUTER / `ToastProvider` INNER with
   one sentence on why the old order was wrong.
2. Fix the `useToast()` consumer list to the grep-verified six.
3. In the font note, add the `FONT_MONO_SUBPATH` + `Bun.resolveSync`/
   `import.meta.resolve` recipe per the spec.

**Verify**: `grep -n "OctantRoot" docs/CONSUMING.md` → ≥2 matches;
`grep -n "ScrambleButton" docs/CONSUMING.md` → 0 matches in the useToast list
context; `grep -n "FONT_MONO_SUBPATH" docs/CONSUMING.md` → ≥1.

### Step 5: Full gate

**Verify**: `bun run check:full` → exit 0.

## Done criteria

- [ ] `bun run check:full` exit 0
- [ ] `OctantRoot` exported from the root barrel (import test: `grep -rn "OctantRoot" packages/ui/src/providers/index.ts`)
- [ ] Prototype story file deleted
- [ ] New stories assert accent reaches the toast glyph (computed-color assertion present)
- [ ] CONSUMING.md: OctantRoot-first wiring, corrected useToast list, font recipe
- [ ] `FONT_MONO_SUBPATH` exported from tokens
- [ ] Only in-scope files changed

## STOP conditions

- The spec or prototype file is absent from your HEAD (wrong base).
- The useToast grep yields a different set than both the spec's six AND
  CONSUMING's old six — report the actual list before writing docs.
- Any play from the promoted stories fails against the real component.

## Maintenance notes

- `web/` should migrate `OctantDemo.tsx` to `<OctantRoot>` on its next design
  bump (spec build-outline item 4 — different repo).
- If a light theme or per-subtree toast skinning ever lands, the nesting
  decision here is the interaction point.
