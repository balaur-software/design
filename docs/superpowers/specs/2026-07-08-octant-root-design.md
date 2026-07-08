# `<OctantRoot>` — Design Spec (Plan 013)

Date: 2026-07-08
Status: Proposed (design + prototype only — no shipped component)
Package: `@balaur/ui` (`packages/ui/src/providers`, if approved)
Plan: `plans/013-octantroot-design.md`
Prototype: `packages/ui/src/providers/OctantRoot.prototype.stories.tsx`

## Goal

Design (and prototype the riskiest part of) a single `<OctantRoot>` component
that absorbs the hand-rolled "App-root wiring" recipe every host currently
copies out of `docs/CONSUMING.md`: import `tokens.css`, nest `ToastProvider`
around `AccentProvider`, mount the font directory. Determine, with evidence
rather than assumption, which pieces of that recipe a component can safely
absorb and which must stay explicit host responsibilities.

## Constraints

Established by reading `docs/CONSUMING.md`, `docs/RELEASE.md`,
`AccentProvider.tsx`, `ToastProvider.tsx`, root `package.json`, and (for
real-world evidence) the `web/` consumer's actual SSR wiring.

- **Relative-import rule** (`docs/RELEASE.md`, "Cross-package dependencies
  inside this repo"): *"Intra-repo cross-package imports inside `@balaur/ui`
  use **relative paths** (not `@balaur/tokens` etc.), so the single package is
  self-contained — no `workspace:*` leaks into the host's install graph."* Any
  `OctantRoot` living in `packages/ui/src/providers/` must reach the tokens
  package via `../../../tokens/src/...` (verified path depth — see
  "Prototype evidence" below), never via the workspace-internal
  `@balaur/tokens` specifier Storybook's `.storybook/preview.tsx` uses.
- **`useToast()` consumers — corrected list.** `docs/CONSUMING.md` names six
  components: `CommandPalette`, `DropdownMenu`, `ContextMenu`, `Popover`,
  `ScrambleButton`, `DeployButton`. Grepping the actual source
  (`grep -rn "useToast(" packages/ui/src`) finds a **different** set of six:
  `DropdownMenu`, `CommandPalette`, `Menubar`, `ContextMenu`,
  `Toast` (the molecule), `Popover`. Neither `ScrambleButton` nor
  `DeployButton` calls `useToast()` today; `Menubar` and the `Toast` molecule
  do but aren't documented. **This is doc drift, not a blocker** — noted here
  so whoever ships `OctantRoot`'s docs also fixes `CONSUMING.md`'s list.
- **`useToast()` failure mode without a provider — corrected.**
  `docs/CONSUMING.md`'s framing implies forgetting `ToastProvider` makes
  `useToast()` "throw." Reading `ToastProvider.tsx`:
  `const ToastContext = createContext<(opts: ToastOptions) => void>(() => {})`.
  The default context value is a **no-op function**, not `undefined` and not a
  throw. So the real failure mode is: `toast({...})` calls silently do
  nothing — no error, no toast, no console warning. This is arguably *worse*
  than a throw for debugging (nothing signals the missing provider), which
  strengthens rather than weakens the case for an `OctantRoot` that makes the
  correct wiring the path of least resistance.
- **`AccentProvider` is optional today.** It only sets `--bx-accent` /
  `--bx-accent-bright` on a wrapper `<div>`
  (`packages/ui/src/providers/AccentProvider/AccentProvider.tsx`); `:root` in
  `packages/tokens/src/tokens.css` already defines both
  (`--bx-accent: #46c66d`, `--bx-accent-bright: #74e692` — the green default),
  so components render correctly without it. It exists only to reskin a
  subtree.
- **CSS mechanics.** Root `package.json` declares
  `"sideEffects": ["**/*.css"]` and exposes `./tokens/tokens.css` /
  `./tokens/fonts/*` as subpath exports. `tokens.css`'s `@font-face` references
  the font with a **relative** `url("../fonts/departure-mono.woff2")`, so it
  resolves against wherever the CSS itself is served from — a helper can make
  the font path discoverable but cannot serve it.

## API proposal

```tsx
export interface OctantRootProps {
  /** Accent name or hex; forwarded to AccentProvider. Default "green". */
  accent?: AccentName | string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}
```

Implementation shape (see "Nesting order decision" for why this order, not the
one currently documented):

```tsx
function OctantRoot({ accent = "green", children, className, style }: OctantRootProps) {
  return (
    <AccentProvider accent={accent} className={className} style={style}>
      <ToastProvider>{children}</ToastProvider>
    </AccentProvider>
  );
}
```

No `tokens.css` import inside this component — see "CSS decision" below for
why that stays a separate, explicit host step.

## Nesting order decision

`docs/CONSUMING.md`'s current documented recipe nests
`<ToastProvider><AccentProvider>{app}</AccentProvider></ToastProvider>`
(`ToastProvider` outer). Reading `ToastProvider.tsx`'s render output:

```tsx
<ToastContext.Provider value={value}>
  {children}
  <div style={{ position: "fixed", right: 16, bottom: 16, ... }}>
    {toasts.map(...)}
  </div>
</ToastContext.Provider>
```

`ToastContext.Provider` produces no DOM node — `{children}` and the toast-stack
`<div>` become **DOM siblings** at whatever position `<ToastProvider>` itself
occupies in its parent's tree; the toast stack is *not* rendered inside
`{children}`. CSS custom-property inheritance follows the real DOM tree, so:

- **`ToastProvider` outer, `AccentProvider` inner** (today's documented
  recipe): DOM = `[AccentProviderDiv(app), ToastStackDiv]` as siblings under
  wherever `ToastProvider` sits. The toast stack is **not** a descendant of
  `AccentProvider`'s div, so it never inherits a non-default accent — toasts
  always render with `:root`'s default green regardless of the app's chosen
  accent.
- **`AccentProvider` outer, `ToastProvider` inner** (this proposal): DOM =
  `AccentProviderDiv > [app, ToastStackDiv]` — the toast stack *is* now a
  descendant of `AccentProvider`'s div and correctly inherits the accent.

Nobody has noticed this in practice because `docs/CONSUMING.md`'s own example
always passes `accent="green"`, which is identical to `:root`'s default —
the bug is invisible until a host picks a non-default accent (amber/cyan/hex).

**Decision: `AccentProvider` outer, `ToastProvider` inner.** This is the
opposite of the currently-documented order and should be corrected in
`CONSUMING.md` independent of whether `OctantRoot` ships.

Neither of the plan's STOP conditions apply here: the order is wrong in only
**one** direction (today's documented order), not both, and the other order
(this proposal) demonstrably reskins toasts correctly — see prototype evidence
below.

## CSS decision

This is the load-bearing decision the prototype exists to inform: should
`OctantRoot` `import "tokens.css"` itself (zero-step adoption), or should CSS
stay an explicit, separate consumer import (one manual step remains)?

### Evidence

1. **Prototype, Storybook/Vite environment.** `OctantRootPrototype` in
   `packages/ui/src/providers/OctantRoot.prototype.stories.tsx` imports
   `tokens.css` via the workspace-relative path
   (`import "../../../tokens/src/tokens.css"`) exactly as a published
   `OctantRoot` would have to. It typechecks (`bun run typecheck` — a
   `declare module "*.css"` ambient type already exists at
   `packages/ui/types/css.d.ts`), passes Biome, SSR-renders cleanly under the
   `ssr-stories.test.tsx` gate (Bun's own dynamic `import()` of a `.tsx` file
   with a `.css` side-effect import resolves without error — verified
   separately with a throwaway `bun test` script; the import is simply inert
   at that layer, never throws), and passes its Storybook/Vitest browser-mode
   plays (real Chromium via Playwright) — **so a `.tsx`-level CSS side-effect
   import does not break a Vite-bundled consumer** (Storybook, or any host
   built on Vite/webpack/Next, which already extract/inject CSS imports found
   anywhere in the module graph). Caveat: Storybook's own
   `.storybook/preview.tsx` already imports `@balaur/tokens/tokens.css`
   globally for every story, so this prototype's import is redundant in this
   harness — it demonstrates "resolves and doesn't break anything," not "this
   is the only thing providing the styling."
2. **Real Bun-native SSR host (`web/`), direct evidence.** `web/apps/web/src/octant/OctantDemo.tsx`
   (the actual `/octant` integration spike) renders `ChatPanel` under
   `ToastProvider`/`AccentProvider` but contains **no CSS import of any kind**.
   The CSS is wired entirely outside the React tree, in
   `web/apps/web/src/server.tsx` and `Document.tsx`:
   ```ts
   // server.tsx
   const tokensCssPath = Bun.resolveSync("@balaur/octant/tokens/tokens.css", dir);
   const monoFontPath = Bun.resolveSync("@balaur/octant/tokens/fonts/departure-mono.woff2", dir);
   // ...
   if (pathname === "/tokens.css") {
     return new Response(Bun.file(tokensCssPath), { headers: { "content-type": "text/css; ..." } });
   }
   ```
   ```tsx
   // Document.tsx
   <link rel="stylesheet" href="/tokens.css" />
   ```
   This is the production pattern for exactly the host class `OctantRoot` is
   meant to help most (a Bun-native, no-bundler SSR host). It resolves the
   package path with `Bun.resolveSync` and serves it as a static route with an
   explicit `<link>` tag in the server-rendered `<head>` — a mechanism that
   lives entirely **outside** any component's render tree. A `.tsx`-level
   `import "tokens.css"` inside `OctantRoot` would, in this host, execute as
   an inert no-op (same behavior verified in evidence #1): no error, but also
   **no client-visible effect**, because nothing analyzes Bun's server-side
   module graph to extract CSS and inject a `<link>` — that only happens in
   bundler pipelines (evidence #1). `web/` already solved this correctly
   without any component-level help, using primitives (`Bun.resolveSync` +
   manual route) that already exist today.
3. **Double-import safety.** CSS is idempotent by nature (`@font-face` /
   custom-property declarations don't conflict when repeated), and Vite
   dedupes identical resolved module imports in its graph, so if `OctantRoot`
   *did* import the CSS and a host *also* imported it explicitly, the bundler
   case would cost nothing but redundant bytes — not a correctness problem.
   This removes double-import risk as an argument against baking the import
   in, but it doesn't help the no-bundler case, which is the deciding factor
   below.

### Decision matrix

| Host class | `.tsx`-level CSS import in `OctantRoot`? | Outcome |
|---|---|---|
| Vite-bundled (Storybook, Vite apps, Next w/ `transpilePackages`) | Works | Bundler extracts/injects the CSS; redundant if host also imports it explicitly, but harmless (idempotent, deduped) |
| Bun-native, no-bundler SSR (`web/`, today's only real consumer) | Inert no-op | Zero benefit — `web/` already delivers CSS via `Bun.resolveSync` + a manual static route + `<link>`, a mechanism entirely outside the component tree that a baked-in import cannot replace or simplify |

### Decision

**Do not import `tokens.css` inside `OctantRoot`.** The one host class this
plan is nominally solving for (`web/`, Bun-native SSR) gets zero benefit from
a component-level import — it already has, and needs, a server-level
mechanism a React component cannot provide. Baking the import in would help
only bundler-based hosts marginally (where the explicit import is already a
single well-documented line) while adding a maintenance surface (a CSS import
living inside a component that ships to every consumer, including ones like
`web/` where it silently does nothing). CSS import stays an explicit,
one-line consumer step, exactly as documented today. `OctantRoot`'s value is
the provider composition (nesting order, above) and font-path discoverability
(below), not CSS delivery.

This does **not** trigger STOP condition 1 ("CSS import can't work AND
`OctantRoot` becomes too thin to justify") — the provider-nesting fix alone
(a real, currently-undocumented bug) justifies the component regardless of the
CSS answer.

## Font ergonomics

No new serving mechanism is proposed (out of scope — serving is a host HTTP
concern). The gap is **discoverability of the exact subpath string**, not a
missing resolution mechanism: `web/server.tsx` already proves
`Bun.resolveSync("@balaur/octant/tokens/fonts/departure-mono.woff2", dir)`
works today with zero new code. The proposal is to make that string
discoverable instead of hand-typed/guessed:

- Export a constant from `packages/tokens/src/index.ts` (already the typed
  token entry point), e.g.:
  ```ts
  /** Subpath (relative to the package root) of the self-hosted DepartureMono font. */
  export const FONT_MONO_SUBPATH = "tokens/fonts/departure-mono.woff2";
  ```
  so a host writes
  `Bun.resolveSync(\`@balaur/octant/${FONT_MONO_SUBPATH}\`, dir)` instead of a
  hardcoded literal, and a future font swap doesn't require every host to
  notice and update a string by hand.
- Document the exact `Bun.resolveSync` / `import.meta.resolve` recipe (ESM
  standard, works in any Bun or modern Node host) directly in
  `docs/CONSUMING.md`'s font paragraph, using `web/server.tsx`'s pattern as
  the canonical example since it's already proven in production.

`docs/CONSUMING.md`'s "App-root wiring" section would shrink from three
prose-explained steps to:

```tsx
import { AccentProvider, ToastProvider } from "@balaur/octant"; // or <OctantRoot>
```
with the CSS import and font-mount paragraph unchanged (still explicit,
still separate) but the *provider nesting* no longer something a host can get
backwards.

## Composability guarantee

`AccentProvider` and `ToastProvider` remain exported from the root barrel and
documented for standalone subtree use exactly as today (e.g. reskinning one
panel to cyan, or wrapping only the part of an app that needs toasts).
`OctantRoot` is pure sugar over the correct nesting of both — never a gate
components require. Nothing about SSR-safety, prop shape, or existing call
sites changes for consumers who don't adopt `OctantRoot`.

## Open questions

For the owner to decide before/during the follow-up build:

1. **Default `color`/`fontFamily` wrapper?** `.storybook/preview.tsx`'s
   decorator wraps every story in
   `<div style={{ color: "#c8cdd6", fontFamily: "var(--bx-font-mono, ...)" }}>`
   — evidence that consumers currently need this too (`web/`'s `style.css`
   independently sets the same `body { color; font-family }` pair). Should
   `OctantRoot` own a default text-color/font wrapper `<div>`, or is that
   correctly a host's own global CSS concern (as `web/style.css` currently
   treats it)? Leaning toward "host's global CSS," since `OctantRoot` adding
   an extra wrapper `<div>` has DOM/layout implications (`display`, margins)
   a provider-only component doesn't currently have.
2. **Should `OctantRoot` also fix and re-export the corrected `CONSUMING.md`
   `useToast()` component list** as part of its own doc comment, so the
   authoritative list lives next to the code that needs it rather than only
   in prose?
3. **Naming**: `OctantRoot` vs. `AppRoot` vs. `OctantProvider` — `OctantRoot`
   was used throughout this plan; worth confirming against any existing naming
   convention before the build plan locks it in.
4. Should the font-path constant (`FONT_MONO_SUBPATH` or similar) live in
   `packages/tokens/src/index.ts` (typed layer, matches "font ergonomics"
   above) or in a new `packages/tokens/src/fonts.ts` module — the tokens
   package currently has no fonts-specific module, only the raw asset
   directory and the CSS `@font-face`.

## Build plan outline (follow-up, sized)

If approved, a separate implementation plan should cover:

1. **Component** (`S`): create `packages/ui/src/providers/OctantRoot/OctantRoot.tsx`
   with the shape above (`AccentProvider` outer, `ToastProvider` inner, no CSS
   import), re-exported from `packages/ui/src/providers/index.ts` and the root
   barrel.
2. **Stories** (`S`): promote the prototype's plays (renders without throwing,
   fires a toast, accent reaches both the ordinary descendant and the toast
   stack) into the real component's `.stories.tsx`; delete the prototype file
   and the `OctantRootWrongOrderRepro` repro (its job is done once the real
   component ships with the corrected order).
3. **`CONSUMING.md` rewrite** (`S`): fix the `useToast()` component list (six
   corrected names), rewrite "App-root wiring" to lead with `<OctantRoot>`
   while keeping `AccentProvider`/`ToastProvider` documented for standalone
   use, add the `FONT_MONO_SUBPATH` discoverability note, and correct the
   nesting-order example if it's kept as a fallback/manual-composition
   reference.
4. **`web/` migration note** (`XS`, no code change required): `web/`'s
   `OctantDemo.tsx` can adopt `<OctantRoot accent="green">` in place of its
   manual `<ToastProvider><AccentProvider>` nesting; `server.tsx`/`Document.tsx`
   are unaffected (CSS/font wiring stays exactly as-is, per the CSS decision).
5. **Version bump + release note** (`XS`): per `docs/RELEASE.md`, since this
   adds a new export.

Total estimate: **S** (small) — the design work (this spec) and prototype
(Step 3) are the majority of the effort; the follow-up build is mostly moving
already-proven code into a real component + doc edits.

## Prototype evidence (Step 3)

`packages/ui/src/providers/OctantRoot.prototype.stories.tsx` (not exported
from any barrel) defines `OctantRootPrototype` (chosen shape) and
`OctantRootWrongOrderRepro` (today's documented order, for negative evidence),
plus a `Probe` child (`useToast()` + a `Tag` accent-consuming atom). Three
stories:

- `Default` — plays 1+2: probe renders without throwing (`ToastProvider` is
  wired), firing a toast shows it (`role="status"`, message visible).
- `CyanAccentReachesToast` — play 3: `accent="cyan"` changes
  `getComputedStyle(...).color` for **both** the `Tag`'s label
  (`--bx-accent-bright`) and the toast's "ok" glyph (`--bx-accent`) — proof the
  chosen nesting threads the accent to `ToastProvider`'s own sibling div, not
  just to `{children}`.
- `WrongNestingRepro` — negative control: renders the *currently-documented*
  nesting order with `accent="cyan"` and asserts the toast glyph stays
  `:root`'s default green — concrete, executable proof of the bug this design
  fixes.

## Verification run in this session

- `bun install` — 235 packages installed, clean.
- `bun run check` (root) — typecheck (3/3 packages), Biome (0 errors, 1 unrelated
  pre-existing deprecation info), `bun test` — 242 pass / 0 fail (was 241/0
  before this change; +1 test file entry from the new story via the SSR gate).
- `cd packages/ui && bun run typecheck` — 0 errors (after fixing three
  `exactOptionalPropertyTypes` forwarding issues in the prototype using the
  repo's existing `...(x !== undefined ? { x } : {})` pattern, precedent:
  `ToastProvider.stories.tsx`).
- `cd packages/ui && bunx vitest run --project=storybook src/providers` — first
  run failed both the new file and the pre-existing, untouched
  `AccentProvider.stories.tsx` with `Vite unexpectedly reloaded a test`
  (documented cold dependency-optimization-cache flake); retried once per the
  known issue and **8/8 tests passed** (5 `AccentProvider` stories + 3
  `OctantRootPrototype` stories) with real Chromium via Playwright.
- `git status` after all edits: only the spec file (new) and the one
  prototype story file (new) — no production source touched.

## STOP-condition check

Neither STOP condition in the plan fired:

1. *CSS import can't work + fallback makes `OctantRoot` too thin*: the CSS
   import **can** work (in bundler-based hosts) but provides no benefit in the
   one real host that matters most (`web/`) — however `OctantRoot` remains
   justified independent of the CSS answer, because it fixes a real,
   previously-undocumented provider-nesting bug (see "Nesting order
   decision"). Not a stop.
2. *`ToastProvider`'s markup makes the nesting order wrong in both
   directions*: it's wrong in exactly **one** direction (today's documented
   order) and demonstrably correct in the other (this proposal), proven by
   the `CyanAccentReachesToast` / `WrongNestingRepro` prototype stories. Not a
   stop.
