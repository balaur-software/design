# Plan 013: DESIGN — `<OctantRoot>` to absorb the hand-rolled app-root wiring

> **Executor instructions**: This is a **design plan** — deliverable is a
> written proposal + a working prototype story, NOT a shipped component.
> Follow the steps; honor the STOP conditions. When done, update the status
> row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 74aad33..HEAD -- packages/ui/src/providers packages/ui/src/primitives/ToastProvider.tsx docs/CONSUMING.md packages/tokens`
> On drift, re-read those files before proceeding.

## Status

- **Priority**: P3
- **Effort**: S–M (design + prototype)
- **Risk**: LOW (no public API changes in this plan)
- **Depends on**: none
- **Category**: direction (design)
- **Planned at**: commit `74aad33`, 2026-07-08

## Why this matters

Adopting `@balaur/octant` requires every host to hand-assemble the same
app-root recipe from prose in `docs/CONSUMING.md`: import `tokens.css`, stack
`ToastProvider` around `AccentProvider`, and mount the packaged font directory
at a public URL (SSR hosts). Two of the failure modes are silent-until-runtime:
forget `ToastProvider` and `useToast()` throws inside six components
(`CommandPalette`, `DropdownMenu`, `ContextMenu`, `Popover`, `ScrambleButton`,
`DeployButton`); serve fonts from the wrong path and the terminal aesthetic
falls back to system mono. This is the most error-prone step of adoption,
re-implemented by every host starting with `web/`. The design question: what
single `<OctantRoot>` (plus font-serving story) removes that recipe without
constraining hosts that need the pieces separately?

## Current state

- The recipe being absorbed — `docs/CONSUMING.md` "App-root wiring":
  ```tsx
  import "@balaur/octant/tokens/tokens.css";
  import { AccentProvider } from "@balaur/octant";
  import { ToastProvider } from "@balaur/octant";

  <ToastProvider>
    <AccentProvider accent="green">
      {/* app */}
    </AccentProvider>
  </ToastProvider>
  ```
  Plus the font note: "Bun serves these as static assets from the resolved
  package path; in `web/`, mount the `@balaur/octant/tokens/fonts` directory
  at a public URL and override `--bx-font-mono` if you serve it elsewhere."
- `packages/ui/src/providers/AccentProvider/AccentProvider.tsx` — the whole
  component (a div applying `accentVars(accent)` from
  `../../../../tokens/src/index.ts`; props: `accent?`, `children`,
  `className?`, `style?`). Note the doc: components render correctly WITHOUT
  it because `:root` defines accent defaults.
- `packages/ui/src/primitives/ToastProvider.tsx` — context provider
  (`ToastProvider({ children })`), `useToast()` hook; throws without the
  provider (verify the exact failure mode when reading it).
- CSS import mechanics: root `package.json` declares
  `"sideEffects": ["**/*.css"]`, and subpath exports
  `./tokens/tokens.css` + `./tokens/fonts/*`. The workspace-internal
  equivalent import used by Storybook is `@balaur/tokens/tokens.css`
  (`packages/ui/.storybook/preview.tsx`), but **published** consumers import
  `@balaur/octant/tokens/tokens.css`. An `OctantRoot` living in
  `packages/ui/src` can only use RELATIVE imports for cross-package files
  (repo rule from `docs/RELEASE.md`: intra-repo cross-package imports use
  relative paths so the published root package is self-contained) — i.e.
  `import "../../../tokens/src/tokens.css"` — and whether a CSS side-effect
  import from a `.tsx` file works in ALL consumer bundlers (Vite yes;
  Bun-native no-bundler hosts?? — this is Open Question #1) is exactly what
  the prototype must answer.
- Fonts: `packages/tokens/fonts/` (woff2 + README), referenced by tokens.css
  as `url("../fonts/departure-mono.woff2")` — a RELATIVE url, so it resolves
  against wherever the CSS is served from. That is why hosts must mount the
  directory; a helper can only make the path discoverable, not serve it.
- SSR constraint: everything must render inert server-side
  (`packages/ui/src/__ssr__/ssr-stories.test.tsx` renders every story).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Fast gate | `bun run check` | exit 0 |
| Prototype story | `cd packages/ui && bunx vitest run --project=storybook src/providers` | pass |

## Scope

**In scope** (design artifacts only):
- `docs/superpowers/specs/2026-07-08-octant-root-design.md` (create)
- ONE prototype story file, e.g.
  `packages/ui/src/providers/OctantRoot.prototype.stories.tsx`, with the
  prototype component defined INSIDE the story file (not exported from any
  barrel)

**Out of scope**:
- Creating `packages/ui/src/providers/OctantRoot/` as a real component — that
  is the follow-up build plan.
- Changing `AccentProvider`, `ToastProvider`, `tokens.css`, `package.json`
  exports, or `docs/CONSUMING.md`.
- Solving font SERVING (an HTTP concern owned by hosts) — only path
  discovery/documentation ergonomics are in play.

## Git workflow

Repo rule: **never commit or push unless the owner explicitly asks.** Working
tree changes + report only.

## Steps

### Step 1: Establish the constraints from the docs and both providers

Read `docs/CONSUMING.md` (App-root wiring + SSR + Cross-repo sections),
`docs/RELEASE.md` (relative-import rule), `AccentProvider.tsx`,
`ToastProvider.tsx` (note what exactly happens when `useToast` runs without a
provider), and root `package.json` (`exports`, `sideEffects`).

**Verify**: the spec's "Constraints" section quotes the relative-import rule
and lists the six `useToast` components.

### Step 2: Write the design spec

Create `docs/superpowers/specs/2026-07-08-octant-root-design.md` covering:

1. **API proposal**:
   ```tsx
   export interface OctantRootProps {
     /** Accent name or hex; forwarded to AccentProvider. Default "green". */
     accent?: AccentName | string;
     children: ReactNode;
     className?: string;
     style?: CSSProperties;
   }
   // <OctantRoot> = ToastProvider > AccentProvider (that nesting order — toasts
   // must not re-skin with a subtree accent unless the owner wants them to;
   // DECIDE and record which order and why, checking how ToastProvider styles
   // its toasts today).
   ```
2. **The CSS question** (the load-bearing decision): should `OctantRoot`
   import `tokens.css` itself (zero-step adoption; but double-import safety,
   bundler-dependence, and the no-bundler Bun host case must be analyzed) or
   should CSS stay an explicit consumer import (one manual step remains,
   maximum compatibility)? Prototype evidence required (Step 3). Record the
   decision matrix.
3. **Font ergonomics**: proposal for making the font path discoverable —
   e.g. documenting `import.meta.resolve("@balaur/octant/tokens/fonts/departure-mono.woff2")`
   for Bun hosts, or an exported constant with the subpath string — and what
   CONSUMING.md's wiring section would shrink to. No serving code.
4. **Composability guarantee**: `AccentProvider`/`ToastProvider` stay exported
   and documented for subtree use; `OctantRoot` is sugar, not a gate.
5. **Open questions** for the owner (e.g. should `OctantRoot` also own a
   default `color`/`fontFamily` wrapper like `.storybook/preview.tsx`'s
   decorator does? That decorator is evidence consumers currently need one).
6. **Follow-up build plan outline** (component + stories + CONSUMING rewrite +
   web/ migration note), sized.

**Verify**: spec exists with "Constraints", "CSS decision", "Open questions",
"Build plan outline" headings.

### Step 3: Prototype the riskiest assumption

In the prototype story file, define `OctantRootPrototype` implementing the
chosen shape (including the CSS side-effect import variant if that's the
proposal — via the workspace-relative path) and render a probe child using
`useToast()` + an accent-consuming atom (e.g. a `Tag` or `FillButton`).
Plays: (1) the probe renders without throwing (ToastProvider wired), (2)
firing a toast via a button shows the toast, (3) the accent prop changes the
rendered accent variable (`getComputedStyle(...).getPropertyValue("--bx-accent")`).
Must SSR-render cleanly (the ssr-stories test will catch violations).

**Verify**: `bun run check` → exit 0;
`cd packages/ui && bunx vitest run --project=storybook src/providers` → passes.

### Step 4: Report

Decisions made (nesting order, CSS ownership, font ergonomics), open
questions, build-plan estimate.

## Test plan

Design plan — executable artifact is the prototype story + 3 plays (Step 3).
Existing gates stay green throughout.

## Done criteria

- [ ] Spec exists with the four required headings and a defensible CSS decision backed by prototype evidence
- [ ] Prototype story passes its plays and SSR-renders (`bun run check` exit 0)
- [ ] No production source modified (`git status`: spec + one story file only)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The CSS side-effect import from a `.tsx` cannot work for the documented
  consumer classes (breaks the ssr test, or analysis shows the no-bundler Bun
  host can't process it) AND the fallback (explicit CSS import stays manual)
  makes `OctantRoot` too thin to justify — write that up as the
  recommendation (possibly "document better instead of new API") and stop;
  that is a valid outcome.
- `ToastProvider`'s current markup/styling makes the proposed nesting order
  wrong in both directions (toasts unstyled either way) — surface it.

## Maintenance notes

- If built, `OctantRoot` becomes the FIRST thing CONSUMING.md shows; the
  providers section demotes to "advanced/subtree use". The `web/` host should
  migrate on its next design bump to validate the ergonomics.
- The nesting-order decision interacts with any future theming work (a
  per-subtree accent inside toasts) — record it clearly in the spec.
