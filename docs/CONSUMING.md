# Consuming `@balaur/octant`

How to use the OCTANT design system from `web/` (or any Bun-native host).
Companion to [../README.md](../README.md) (install/link) and
[RELEASE.md](RELEASE.md) (release runbook).

## Package

`@balaur/octant` is published as a **single package** (one repo, one tag, one
tarball). It re-exports three logical layers via subpath `exports`:

| Subpath | What you import |
|---|---|
| `@balaur/octant` | All React components, hooks, primitives, providers |
| `@balaur/octant/tokens` | `tokens`/`accentVars` (typed TS); `@balaur/octant/tokens/tokens.css` (CSS custom properties + `@font-face`) |
| `@balaur/octant/core` | Pure encoder (`bar8`, `noise`, `VBLOCKS`…) — usually only needed internally |

Everything ships raw TypeScript. There is **no build step**; Bun consumes `src/`
directly via the root `exports` map. No bundler, no `dist/`. `react` /
`react-dom` are `peerDependencies`, so the host's single React is used — this is
what makes cross-repo consumption work (see
[Cross-repo consumption](#cross-repo-consumption) below).

### Consumer TypeScript requirements

Because the package ships `.ts` sources (not `.d.ts` + JS), the consumer's
`tsconfig.json` type-checks them directly — `skipLibCheck` does not apply. The
sources use `.ts`-extension import specifiers and this repo's strict flags, so
a consuming tsconfig needs:

```jsonc
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true, // sources import "./x.ts"
    "noEmit": true,                     // required by allowImportingTsExtensions
    "jsx": "react-jsx"
  }
}
```

Bun runs the code natively regardless — these flags only matter for `tsc`
type-checking. Strictness flags are one-way-compatible: the library type-checks
under `exactOptionalPropertyTypes` / `noUncheckedIndexedAccess`, so consumers
may enable or omit those freely. Bundler-based hosts (Vite, Bun.build) need no
extra wiring; a Next.js host must add `transpilePackages: ["@balaur/octant"]`.

## App-root wiring

Three things, once, at the root of your app:

```tsx
import "@balaur/octant/tokens/tokens.css";   // 1. tokens + @font-face for DepartureMono
import { AccentProvider } from "@balaur/octant"; // 2. accent skin
import { ToastProvider } from "@balaur/octant";  // 3. toasts (only if you use Toast/CommandPalette/DropdownMenu/ContextMenu)

// render once:
<ToastProvider>
  <AccentProvider accent="green">
    {/* app */}
  </AccentProvider>
</ToastProvider>
```

Notes:

- `tokens.css` defines `:root { --bx-* … }` defaults **and** `@font-face` for
  DepartureMono. The font files are served from `@balaur/octant/tokens/fonts/*`
  (see the root [package.json](../package.json) `exports`). Bun serves these as
  static assets from the resolved package path; in `web/`, mount the
  `@balaur/octant/tokens/fonts` directory at a public URL and override
  `--bx-font-mono` if you serve it elsewhere.
- `AccentProvider` only sets `--bx-accent` / `--bx-accent-bright` on a wrapper
  div. Because `:root` already defines accent defaults, **components render
  correctly without it** — `AccentProvider` is only needed to reskin a subtree
  (e.g. per-user accent, or a cyan agent panel). See
  [packages/ui/src/providers/AccentProvider/AccentProvider.tsx](../packages/ui/src/providers/AccentProvider/AccentProvider.tsx).
  Accents: `"green" | "amber" | "cyan"`, or any hex string.
- `ToastProvider` is required by any component that calls `useToast()`:
  `CommandPalette`, `DropdownMenu`, `ContextMenu`, `Popover`, `ScrambleButton`,
  `DeployButton`. Wrap at the root.
- Global keyframes (`bx-blink`, `bx-spin`) live in
  [tokens.css](../packages/tokens/src/tokens.css) — they ship with the CSS
  import, no extra stylesheet needed.

## Importing components

```tsx
import { Modal, FillButton, ChatPanel, type Block, type ChatMessageData } from "@balaur/octant";
```

Everything is re-exported from the root barrel
([packages/ui/src/index.ts](../packages/ui/src/index.ts)) via category barrels
(`atoms/`, `molecules/`, `organisms/`, `primitives/`, `hooks/`, `providers/`).
Types are exported alongside their components (`type Block`, `type Agent`,
`type PlanStep` from `ChatPanel/chat-types`, etc.).

There are **no component-level subpath exports** (`@balaur/octant/Modal`). The
single barrel is intentional for a no-build setup; Bun resolves the raw TS graph
on demand. The only subpaths are the three layer entry points (`./core`,
`./tokens`, and `.` = UI). If you want to discover the full inventory, open the
`ComponentCatalog` story in Storybook (`OCTANT/ComponentCatalog`) — it renders
one example of every component.

## Controlled-state convention

Form and selection components are **controlled-or-uncontrolled** via the shared
[useControllableState](../packages/ui/src/hooks/useControllableState.ts) hook:

```tsx
// controlled
<TextInput value={x} onChange={setX} />
<Select options={…} value={v} onChange={setV} />
// uncontrolled
<TextInput defaultValue="" onChange={console.log} />
<Tabs tabs={…} defaultIndex={0} onChange={…} />
```

The pattern is uniform across `TextInput`, `Textarea`, `Select`, `Combobox`,
`Checkbox`, `Switch`, `Slider`, `RadioGroup`, `ToggleGroup`, `SegmentedControl`,
`OTPInput`, `Tabs`, `Popover`, `Sheet`, `Modal`, `BootOverlay`,
`CommandPalette`, `ResizableSplit`. Reference implementation:
[TextInput](../packages/ui/src/molecules/TextInput/TextInput.tsx).

## Theming

All styling reads `--bx-*` custom properties with hardcoded fallbacks, so a
component never breaks if a token is missing. The token surface (defined in
[packages/tokens/src/tokens.css](../packages/tokens/src/tokens.css)):

| Group | Tokens |
|---|---|
| Page/surface | `--bx-bg`, `--bx-surface-1..7`, `--bx-surface-hover`, `--bx-surface-stripe` |
| Borders | `--bx-border`, `--bx-border-strong`, `--bx-border-mid`, `--bx-border-bright`, `--bx-border-accent`, `--bx-border-cyan`, `--bx-border-magenta`, `--bx-border-yellow`, `--bx-border-red`, `--bx-border-width(-strong)` |
| Text | `--bx-text-1..7` (brightest→dimmest), `--bx-text-dim-1..4` (off-ramp grays) |
| Tints | `--bx-accent-tint`, `--bx-danger-tint` |
| Accent | `--bx-accent`, `--bx-accent-bright` (swap via `accentVars()` / `AccentProvider`) |
| ANSI 16 | `--bx-ansi-0..15` |
| Type | `--bx-font-mono`, `--bx-fs-hero/h2/body/control/small`, `--bx-lh-*` |
| Space | `--bx-space-3xs..3xl` |
| Motion | `--bx-ease`, `--bx-dur-fast/base/slow/slower`, `--bx-blink`, `@keyframes bx-blink/bx-spin` |
| Misc | `--bx-radius` |

To reskin, override any of these on a wrapper (or on `:root`). For typed access
in TS, `import { tokens, accentVars } from "@balaur/tokens"`.

## SSR

`web/` renders with `Bun.serve` + `renderToReadableStream`. The library is
**SSR-disciplined**:

- Every access to `window` / `document` / `navigator` / `localStorage` /
  `matchMedia` lives inside `useEffect` or event handlers — never during render.
  Audited files (all safe): `Marquee`, `BootOverlay`, `BarChart`, `Sparkline`,
  `Skeleton`, `ResizableSplit`, `NodeSearchBox`, plus the hooks `useReducedMotion`,
  `useDismissable`, `useFocusTrap`, `useCellMetrics`, `useOctantCanvas`,
  `useSlidingIndicator`.
- [useReducedMotion](../packages/ui/src/hooks/useReducedMotion.ts) starts `false`
  on the server and refines after mount — no hydration mismatch.
- Portalled overlays (`Modal`, `Sheet`, `CommandPalette`) render `null` when
  closed / on the server (`typeof document === "undefined"` guard in
  [ScrimOverlay](../packages/ui/src/primitives/ScrimOverlay.tsx)).
- [Tabs](../packages/ui/src/organisms/Tabs/Tabs.tsx) is the only component using
  `useId` for stable DOM ids. No component generates ids from `Math.random` or
  counters in render.
- Imperative animation hooks (`useBar8Fill`, `useScramble`, `useRafLoop`) write
  to refs after mount; the server emits a static first frame (empty `<pre>`,
  plain text, empty bars) and the effect populates it. This is the documented
  contract on `FillButton`, `BarChart`, `Sparkline`, `Skeleton`, `Marquee`.

A smoke test verifying this lives at
[packages/ui/src/__ssr__/ssr-smoke.test.tsx](../packages/ui/src/__ssr__/ssr-smoke.test.tsx).

## Cross-repo consumption

`@balaur/octant` is consumed by `web/` as a **published dependency**, not via
`bun link`. This is the same pattern `web/` uses for `balaur-memory`:

```jsonc
// web/package.json
"dependencies": {
  "@balaur/octant": "github:balaur-software/design#v0.1.0"
}
```

### Why published, not `bun link`

Linking the design source into `web/` via `bun link` resolves at runtime but
**produces two React module instances**: `@balaur/ui` source lives under
`design/`, so its `import "react"` resolves to `design/node_modules/.bun/react`,
while `web/`'s `react-dom/server` resolves `react` to
`web/node_modules/.bun/react`. Same version, two physical files, two separate
`ReactSharedInternals` — hooks throw `resolveDispatcher() is null` when a
component runs inside web's renderer. Typecheck and lint are unaffected; this is
a **runtime** issue only. The `bun link react` shared-instance technique does
**not** fix it — Bun's resolver maps `react` to each repo's own `.bun` cache
regardless of top-level `node_modules/react` symlinks.

Publishing fixes it via normal **peer-dependency dedupe**: `@balaur/octant`
declares `react`/`react-dom` as `peerDependencies`, so when `web/` installs it,
Bun hoists a single `react` into `web/node_modules` and `@balaur/octant`'s
`import "react"` resolves to that one copy. One instance, hooks work. Verified:
the `/octant` route in `web/` renders `ChatPanel` server-side with HTTP 200 and
no `resolveDispatcher` errors; `web/node_modules` contains exactly one
`react@19`.

### Release shape

One repo, one package, one tag per release. `design/` remains a Bun workspace
internally (for Storybook / per-package `typecheck` / tests), but the
**published unit is the root package** `@balaur/octant`, whose `exports` point
at `packages/{ui,octant-core,tokens}/src/index.ts`. Intra-repo cross-package
imports inside `@balaur/ui` use relative paths (not `@balaur/tokens` etc.), so
the single package is self-contained. See [RELEASE.md](RELEASE.md) for the
tag-and-publish runbook.

### Dev workflow

Pinning `web/` to a tag means design changes only land in `web/` on a new
release. For active design iteration, point `web/` at the local design
**directory** instead of the tag — this keeps `react` hoisted to a single
instance (unlike `bun link`, which reintroduces the dual-React bug) at the cost
of a re-install after each edit:

```jsonc
// web/package.json — dev
"@balaur/octant": "file:../design"
```

```bash
# after editing something in design/:
cd web && bun install     # recopies @balaur/octant into web's graph (~120ms)
```

`file:../design` installs a **copy** (not a symlink), so edits do not propagate
until `bun install` re-runs. It still resolves `react` as a peer dep into
`web/`'s single graph — that is the property that matters. Switch back to the
pinned tag for committed/CI/prod state:

```jsonc
// web/package.json — committed
"@balaur/octant": "github:balaur-software/design#v0.1.0"
```

Do **not** use `bun link @balaur/octant` to shadow the dep — it overrides
`node_modules/@balaur/octant` with a symlink into `design/`, whose `import
"react"` then resolves to `design/node_modules/.bun/react`, recreating the
two-instance hook crash. `file:../design` is the safe dev override.

## Accessibility

Interactive components are built on two shared primitives:

- [ScrimOverlay](../packages/ui/src/primitives/ScrimOverlay.tsx) — `role="dialog"`
  + `aria-modal`, focus trap, focus restore, Esc / outside-click dismissal,
  body-scroll lock. Used by `Modal`, `Sheet`, `CommandPalette`.
- [FloatingPanel](../packages/ui/src/primitives/FloatingPanel.tsx) — anchored
  popup with Esc / outside-click dismissal. Used by `Select`, `Combobox`,
  `DropdownMenu`, `Popover`, `HoverCard`, `Menubar`, `NavMenu`, `DatePicker`.

| Component | Status |
|---|---|
| `Tabs` | Full WAI-ARIA tabs pattern: `role="tablist/tab/tabpanel"`, `aria-selected/controls`, roving `tabindex`, ←/→/Home/End, `useId`. |
| `Modal` / `Sheet` | `role="dialog"`, `aria-modal`, focus trap + restore, Esc, scroll lock. `aria-labelledby` on the dialog is wired from the `title`. |
| `CommandPalette` | Dialog shell; ↑/↓/Enter/Esc; ⌘K toggle; highlighted row scrolled into view. |
| `DropdownMenu` / `ContextMenu` | `role="menu"`, `role="menuitem"`, `aria-haspopup/expanded`, ↑/↓/Home/End + roving `tabindex`, Esc. |
| `Select` | `aria-haspopup="listbox"`, `role="listbox/option"`, `aria-selected`, ↑/↓/Enter/Esc, `aria-activedescendant`. |
| `Combobox` | `role="combobox"`, `aria-expanded`, `aria-autocomplete="list"`, `aria-controls`/`aria-activedescendant`, ↑/↓/Enter/Esc. |
| `Popover` | `aria-haspopup="dialog"`, `aria-expanded`, Esc/outside-click. |
| `Tree` | `role="tree/treeitem/group"`, `aria-expanded`, roving `tabindex`, ↑/↓/←/→/Home/End, Enter/Space to toggle. |
| `ResizableSplit` | `role="separator"`, `aria-orientation`, `aria-valuenow/min/max`, ←/→ nudge, `tabindex`. |

Storybook's a11y addon (`@storybook/addon-a11y`) **is** installed and
registered in [packages/ui/.storybook/main.ts](../packages/ui/.storybook/main.ts):
use its Accessibility panel on any story, alongside the per-component keyboard
stories and manual testing.

## Known token-hygiene issues (non-blocking)

- Several components reference `var(--bx-bg, #0a0b0e)` while `--bx-bg` is
  `#08080a`; the fallback only fires if `tokens.css` is absent, so this is
  cosmetic. The `#0a0b0e` fallback equals `--bx-surface-1`.
- `--bx-text-dim` (no number) is referenced by `CommandPalette` but only
  `--bx-text-dim-1..4` are defined. A legacy alias is provided in `tokens.css`
  so the reference resolves; new code should use `--bx-text-7` / `--bx-text-dim-2`.

## Versioning / linking

`web/` pins the single `@balaur/octant` package: the committed state is a
tagged release (`"@balaur/octant": "github:balaur-software/design#vX.Y.Z"`);
active design iteration uses `"@balaur/octant": "file:../design"` plus a
`bun install` after each edit. `bun link` is never used (see
[Cross-repo consumption](#cross-repo-consumption) above). For the tagged
release runbook see [RELEASE.md](RELEASE.md). Per workspace `AGENTS.md`: if you
change an API surface in `design/`, run `bun run check` in `web/` to confirm it
still compiles.
