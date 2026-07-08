---
name: design-octant-reference
description: Use when working in the design/ repo on the OCTANT design system (@balaur/octant) — adding or changing components in packages/ui, questions about --bx-* tokens, AccentProvider/accentVars, octant-core glyph encoding, chat Block types or renderBlock, MemoryGraph/MemoryExplorer/PendingQueue/DoctorStrip props, running Storybook on port 6006, SSR failures in ssr-smoke.test.tsx or ssr-stories.test.tsx, gen-barrel.mjs, barrel exports, or locating any component or hook.
---

# OCTANT design system reference

OCTANT is the design system of the balaur workspace, at
`/home/alex/projects/balaur/design/`. It is a **dark-only, terminal-aesthetic**
React 19 component library whose signature medium is the Unicode "octant"
glyph: a character cell subdivided into a 2x4 grid of sub-pixels, each glyph
encoding one 8-bit pixel mask. Meters, spinners, avatars, charts, and button
fills are drawn as text in `<pre>` framebuffers rather than as images.

There is deliberately **no light theme** (`tokens.css` sets
`color-scheme: dark`), **no border radius** (`--bx-radius: 0`), **no build
step** (consumers import raw `.ts`/`.tsx` source), and **no runtime
dependencies** — react/react-dom are peers, everything else is inline.

## When NOT to use this skill

| You are doing... | Use instead |
|---|---|
| Releasing, tagging, bumping the version, consuming @balaur/octant from web/, dual-React doctrine, `file:../design` dev loop, gate/lint-debt policy | **design-change-and-release** |
| Wiring or debugging the web app itself (SSR server, WS protocol, pi agent) | **web-app-reference** |
| Memory schema/invariant semantics behind the memory-nav components | **memory-domain-reference** |
| Cross-repo architecture, doc precedence, drift ledger | **balaur-workspace-map** |
| Starting servers/ports/Herdr panes on this box | **balaur-run-and-operate** |

## Repo layout and package model

The repo is a Bun workspace, but the **published unit is the ROOT package**
`@balaur/octant` (v0.3.0 as of 2026-07-08; HEAD is unreleased — consumers on
the `v0.3.0` tag do not see the two post-tag commits). The three `packages/*` workspaces
are internal; consumers only ever see the root's export map
(verified in `/home/alex/projects/balaur/design/package.json`):

| Export | Resolves to |
|---|---|
| `.` | `./packages/ui/src/index.ts` (the component barrel) |
| `./core` | `./packages/octant-core/src/index.ts` |
| `./tokens` | `./packages/tokens/src/index.ts` |
| `./tokens/tokens.css` | the CSS custom-property sheet |
| `./tokens/fonts/*` | self-hosted font files (`departure-mono.woff2`) |

- `peerDependencies`: `react: ^19`, `react-dom: ^19`. The library must never
  gain its own react copy (see design-change-and-release for the dual-React
  incident doctrine).
- `files` whitelist ships the three packages' `src/` (+ `packages/tokens/fonts`,
  `packages/ui/types`) and excludes `*.stories.tsx`, `*.test.*`,
  `packages/ui/src/__ssr__`, and `packages/ui/src/screens`.
- Consumption is by **git tag pin** only (never npm). How to cut a tag, how
  web/ pins it, and the `file:../design` dev-iteration loop are owned by
  **design-change-and-release** — do not improvise from here.

### Gate state (volatile)

As of 2026-07-08, HEAD is `74aad33` ("Storybook 10 + Storybook Test, SSR
gates, and full library audit fixes"), **two** commits past tag `v0.3.0`. The
SOURCE gate is green — typechecks exit 0, `bun test` = 241 tests / 17 files /
0 fail, biome scoped to the source reports 0 err / 0 warn / 1 info — but
verbatim `bun run check` currently exits 1 at the lint step: 12 leftover
`.claude/worktrees/agent-*` git worktrees (untracked session residue) carry
nested `biome.json` files that make `biome check .` abort. Environmental, not
a source regression — details and the scoped workaround are in
**design-change-and-release §1**, the gate state of record. The earlier red
HEAD (`7073f40`, 2 TS errors in story files) was fixed by `74aad33` — notes
calling design's source red are stale.

```bash
cd /home/alex/projects/balaur/design && bun run check   # the universal gate
```

(`bun` is at `~/.bun/bin/bun` on this box — machine-specific; there is no
`/usr/local/bin/bun`.)

`bunfig.toml` pins `linker = "hoisted"`: bun's isolated linker duplicates
vitest through circular peer deps and breaks the Storybook test runner. Do not
remove it.

## The three workspaces

### 1. `@balaur/octant-core` — the pure encoder

Zero-dependency, framework-agnostic. `packages/octant-core/src/` modules
(verified from its `index.ts`):

| Module | Exports (digest) |
|---|---|
| `encode.ts` | `OCTANT_BASE = 0x1cd00` (Unicode "Legacy Computing Supplement" octant block base), `bit` (sub-pixel weights, row-major x-fastest: top-left = 1 ... bottom-right = 128), `octChar(mask)` mask -> single code point, `sext`, `glyphSupported` |
| `bars.ts` | `bar8`, `E` — eighth-block horizontal fills |
| `color.ts` | `hexRGB`, `rgbHex`, `lighten`, type `RGB` |
| `field.ts` | `noise`, `sphereLum`, `BAYER`, `V` — background-field math |
| `ramps.ts` | glyph ramps: `G`, `SHADE`, `VBLOCKS`, `EQC`, `GROW`, `ORBIT`, `PULSE`, `WAVE` |
| `rand.ts` | `seededRandom`, `noiseBars` |
| `raster.ts` | `paintBuf`, `paintLUT`, `paintVal`, `drawLine`, `strokeArc` + `Buf`/`LUT` types — `<pre>` framebuffer painting |
| `sample.ts` | `octantMaskField` |
| `text.ts` | `scrambleFrame`, `SCRAMBLE_GLYPHS` — the decode/scramble text effect |

16 masks that coincide with BMP quadrant glyphs (`▘▝▀▌█`...) are mapped to
those characters so fallback fonts still render correctly; `octChar` was fixed
against UnicodeData 16.0 in `74aad33` with an exhaustive 256-mask test.

### 2. `@balaur/tokens` — the token layer

Typed TS tokens mirrored **1:1** by `--bx-*` CSS custom properties in
`packages/tokens/src/tokens.css` (89 `--bx-*` declarations as of 2026-07-08).
Import the CSS once at the app root: `import "@balaur/tokens/tokens.css";`.

Key TS exports (from `packages/tokens/src/index.ts`): the aggregated `tokens`
object, `ACCENTS`, `accentVars()`, `PALETTE` (+ `byIdx`, `byName`), `surfaces`,
`borders`, `text`, `fonts`, `space`, and friends.

**The accent system**: one user-selectable hue with a hardcoded paired bright
variant (not computed):

| Name | hex | bright |
|---|---|---|
| green (default) | `#46c66d` | `#74e692` |
| amber | `#ffb000` | `#ffc94d` |
| cyan | `#2bd9d9` | `#6ff2f2` |

`accentVars(nameOrHex)` returns the `--bx-accent` / `--bx-accent-bright` style
object; `AccentProvider` applies it on a wrapper div so descendants re-skin by
CSS inheritance. `tokens.css` ships the green default; no CSS edit is needed
to re-skin.

**Font**: DepartureMono, self-hosted at `packages/tokens/fonts/`
(`departure-mono.woff2`; license/source in that dir's README), declared via
`@font-face` in tokens.css and stacked in `--bx-font-mono`.

#### `--bx-*` quick reference (full detail: read tokens.css itself)

| Axis | Variables |
|---|---|
| Page/surfaces | `--bx-bg`, `--bx-surface-1..7` (darkest -> lightest), `--bx-surface-hover`, `--bx-surface-stripe` |
| Status tints | `--bx-accent-tint`, `--bx-danger-tint` |
| Borders | `--bx-border`, `-strong`, `-mid`, `-bright`, per-hue `-accent/-cyan/-magenta/-yellow/-red`, widths `--bx-border-width[-strong]` |
| Text ramp | `--bx-text-1..7` (brightest -> dimmest; 1-5 meet WCAG AA on `--bx-bg`, 6-7 decorative only), off-ramp `--bx-text-dim-1..4`, legacy alias `--bx-text-dim` |
| ANSI 16 | `--bx-ansi-0..15` + zero-padded aliases `--bx-ansi-00..09` (so `--bx-ansi-${idx}` with padded indices always resolves) |
| Accent | `--bx-accent`, `--bx-accent-bright` |
| Type | `--bx-font-mono`, `--bx-fs-hero/h2/body/control/small`, `--bx-lh-hero/tight/body/relaxed` |
| Space | `--bx-space-3xs..3xl` (2/4/7/10/12/18/24/32/48px), `--bx-radius: 0` |
| Motion | `--bx-ease`, `--bx-dur-fast/base/slow/slower`, `--bx-blink`; keyframes `bx-blink`, `bx-spin` |

### 3. `@balaur/ui` — the components

**111 components: 41 atoms / 39 molecules / 31 organisms** (recounted
2026-07-08 at `74aad33`), plus 3 primitives (`FloatingPanel`, `ScrimOverlay`,
`ToastProvider`), `AccentProvider`, 16 hooks, and `ComponentCatalog`. Full
annotated inventory, primitive/hook tables, and which components need
`ToastProvider`: see [references/components.md](references/components.md).

Note (corrects older notes): as of `74aad33`, `ComponentCatalog` IS exported
from the barrel and ships in the package. The `screens/` directory is
story-only demo compositions — excluded from both the barrel and the published
`files`.

## Adding a component — the checklist

Every convention below is load-bearing; violating any of them either breaks
the published package or fails a gate.

1. **One folder per component**: `packages/ui/src/<category>/<Name>/<Name>.tsx`
   plus `<Name>.stories.tsx` in the same folder. Category = `atoms` (no custom
   component composition), `molecules` (small functional units), `organisms`
   (complex stateful compositions).
2. **Story title**: `OCTANT/<Category>/<Name>` — e.g. `OCTANT/Atoms/Badge`,
   `OCTANT/Organisms/ChatPanel`. Primitives use `OCTANT/Primitives/<Name>`,
   screen demos `OCTANT/Screens/<Name>`.
3. **Add to the CATEGORY barrel BY HAND**: append
   `export * from "./<Name>/<Name>";` to `packages/ui/src/<category>/index.ts`
   (alphabetical order). The root barrel `src/index.ts` re-exports the category
   barrels and rarely changes.
4. **LANDMINE — never run `packages/ui/scripts/gen-barrel.mjs`.** It predates
   the atomic (atoms/molecules/organisms) refactor: it scans only the TOP
   level of `src/` for `<Name>/<Name>.tsx` (verified by reading the script —
   `readdirSync(src)` filtered by `existsSync(join(src, name, name + ".tsx"))`),
   so today it would match only `ComponentCatalog` and **overwrite
   `src/index.ts`** with a barrel that drops all 110 other components. If it
   was run by accident: `git diff packages/ui/src/index.ts` and restore the
   hand-maintained content from git (ask the owner before any git restore if
   other changes are in flight).
5. **Imports are RELATIVE, with extensions.** `allowImportingTsExtensions` is
   on; every relative import carries `.ts`/`.tsx`. Cross-package imports go
   relatively into the sibling package's source, e.g. from a ui atom:
   `import { bar8 } from "../../../../octant-core/src/index.ts";`
   **Never** import `@balaur/octant-core` / `@balaur/tokens` / `@balaur/ui`
   package names inside `packages/*/src` — the published root package must be
   self-contained, and workspace names don't resolve for tag-pin consumers.
   Re-verified 2026-07-08: zero real `from "@balaur/` imports in
   `packages/*/src` (the one grep hit is a JSDoc usage example in
   `packages/tokens/src/index.ts`, not code).
   The ONLY place package names are allowed is `packages/ui/.storybook/`
   (e.g. `preview.tsx` imports `@balaur/tokens`).
6. **Styling = inline styles reading `--bx-*` with hex fallbacks**:
   `color: "var(--bx-accent, #46c66d)"`. No CSS files per component, no CSS-in-JS
   dep. The fallback hex keeps the component legible if tokens.css was not
   imported.
7. **Controlled-or-uncontrolled state** via the shared hook — reference
   implementation `molecules/TextInput/TextInput.tsx`:

   ```ts
   import { useControllableState } from "../../hooks/useControllableState";
   // (controlled, defaultValue, onChange) => [value, set]
   const [value, setValue] = useControllableState(valueProp, defaultValue, onChange);
   ```

   Expose the triple `x?` / `defaultX?` / `onXChange?` in props. When
   forwarding optional callbacks/props under `exactOptionalPropertyTypes`,
   use the conditional-spread idiom you'll see in ChatPanel:
   `{...(renderBlock ? { renderBlock } : {})}`.
8. **SSR-safe by construction** — see the next section. Your story is
   automatically SSR-gated the moment it exists.
9. **Accessibility**: keyboard reachability and ARIA state are exercised by
   story `play` functions; closed floating panels must stay out of the tab
   order (FloatingPanel handles this with `visibility` + `inert` — build on it
   rather than rolling your own overlay).
10. Run `bun run check` from the repo root (typecheck + biome + bun test).
    Commit/PR/release flow: **design-change-and-release**.

## SSR discipline

The design system must render under React's `renderToReadableStream` with no
DOM (that is exactly how `web/` serves it). Rules:

- Browser APIs (`window`, `document`, `matchMedia`, canvas, observers) only
  inside `useEffect` or event handlers — never during render or module init.
- Portalled overlays (`ScrimOverlay`, hence Modal/Sheet; closed
  `FloatingPanel`s) render `null` when closed and on the server.
- `useReducedMotion` starts `false` and reads `matchMedia` in an effect
  (verified in `packages/ui/src/hooks/useReducedMotion.ts`).
- Animation hooks emit a deterministic static first frame; the animated
  behavior starts in effects (e.g. `AgentGlyph` is "deterministic across
  server and client").

Two test files pin this (`packages/ui/src/__ssr__/`, run by plain `bun test`):

| Test | What it pins |
|---|---|
| `ssr-smoke.test.tsx` | representative components (FillButton, TextInput, Tabs, Table, ChatPanel, ToolCallBlock) stream-render AND contain expected content |
| `ssr-stories.test.tsx` | EVERY story of EVERY component (`**/*.stories.tsx`, 119 files as of 2026-07-08) server-renders via portable stories. Empty output is allowed (closed overlays); throwing is not |

If your change makes `bun test` fail with a `window is not defined` /
`document is not defined` style error naming one of these files, you accessed
a browser API at render time. Fix the component, don't skip the test.

## The agentic chat block model

Types live in `packages/ui/src/organisms/ChatPanel/chat-types.ts` (verified
2026-07-07; file unchanged at 2026-07-08 HEAD):

- `BlockStatus = "running" | "done" | "error"` (tool calls / plan steps).
- `Block` is a discriminated union on `type` with **six variants**:
  `text` (`text`, `streaming?`), `reasoning` (`text`, `defaultCollapsed?`),
  `tool_call` (`id`, `name`, `args?`, `result?`, `status: BlockStatus`,
  `startedAt?`, `endedAt?`), `code` (`language?`, `code`),
  `artifact` (`id`, `title`, `kind: "code" | "document" | "image"`,
  `language?`, `content`), `citations` (`sources: CitationSourceProps[]`).
- `ChatMessageData` = one thread row: `id`, `role: "user" | "agent" | "system"
  | "tool"`, `agentId?` (multi-agent), `name?`, `time?`, `blocks: Block[]`,
  `status?: "streaming" | "complete" | "error"`.
- `Agent` = `{ id, name, accent?, glyph? }` for multi-agent threads.
- `PlanStep` for `AgentPlan`.

Composition: `ChatPanel` (header + artifact side panel + composer, all data
controlled by the caller) -> `ChatThread` (scrolling list, bottom-follow) ->
`ChatMessage` (avatar + blocks) -> `BlockRenderer` (dispatch on `block.type`).

**The `renderBlock` escape hatch** (`ChatBlockRenderer = (block) => ReactNode`,
added for v0.3.0): a prop on ChatPanel/ChatThread/ChatMessage. Return a node
to render a block your own way; return `null`/`undefined` to fall back to the
built-in `BlockRenderer`. This is deliberate dependency policy: **OCTANT has
NO markdown or syntax-highlighting dependency** — `TextBlock` does only
minimal inline `code`/**bold**, `CodeBlock` is an unhighlighted shell. Hosts
that want markdown or highlighting own that dep and implement it via
`renderBlock` (they can still compose OCTANT molecules inside it). Do not
"fix" this by adding a markdown dep to the design system.

## The memory-navigation suite

Purpose-built assets for the memory campaign (see balaur-memory-web-campaign):
`MemoryGraph`, `MemoryExplorer`, `NodeDetailPanel`, `PendingQueue`,
`DoctorStrip` (organisms) + `NodeCard`, `NodeListItem`, `NodeSearchBox`,
`EdgeRow`, `GraphFilterBar`, `GraphLegend`, `BreadcrumbPath` (molecules) +
`NodeGlyph`, `StatusGlyph`, `SurfacingIndicator`, `ImportanceMeter`,
`NodeTypeTag`, `EdgeArc` (atoms).

Two facts to hold on to (both verified 2026-07-07):

1. **NO runtime dep on balaur-memory.** All types are re-declared locally in
   `packages/ui/src/organisms/MemoryExplorer/memory-types.ts` as plain
   JSON-safe projections of memory's `Node`/`Edge` (ids are plain `string`,
   not branded). The HOST maps its `Store` reads into these shapes. The
   vocabulary mirrors memory's SCHEMA.md 1:1 — semantics live in
   **memory-domain-reference**.
2. **Built but unconsumed** as of 2026-07-08 (re-grepped: only a demo-fixture
   STRING in `web/apps/web/src/octant/demo-fixture.ts` mentions MemoryGraph)
   — nothing in `web/` imports them yet; they exist ahead of the campaign.

What the key types actually accept (digest of `memory-types.ts`):

| Type | Shape |
|---|---|
| `MemoryStatus` | `proposed / active / archived / rejected / quarantined / forgotten / merged` |
| `MemorySurfacing` | `always / ask / never` |
| `MemoryNode` | `id, type, title, body?, status, surfacing, importance (0..5), when (ISO or null), created, updated, useCount, origin, author, aliases?` |
| `MemoryEdge` | `id, source, target, type, validFrom, validUntil, created` (system types: `on_day, supersedes, merged_into, no_match, derived_from`; default `links`) |
| `PendingVerdict` | `approve / reject / supersede / archive` |
| `MemoryHistorySnapshot` | `seq, title, body, when, actor (owner/agent/system), action, at` |
| `NodeFilter` | `types?, statuses?, minImportance?, query?` |

Also exported there: `STATUS_STYLE` / `SURFACING_STYLE` / `EDGE_STYLE` visual
maps (single source of truth for glyphs + colors across StatusGlyph, NodeGlyph,
GraphLegend, EdgeArc).

Component contracts (all purely presentational — caller owns all data and
routes verdicts/searches to its own Store):

- `MemoryGraph({ nodes, edges, selectedId?, hoveredId?, pinnedIds?, onSelect?,
  onHover?, onPinChange?, width=800, height=600, showGrid?, style? })` —
  force-directed SVG canvas via `useForceLayout`; sim settles then goes inert.
- `MemoryExplorer` — the whole shell; controlled-or-uncontrolled `selectedId`
  and `filter`; takes `pendingItems?`, `doctorReport?`, `searchResults?`
  (caller runs recall/search), `selectedHistory?`, and `onVerdict?/
  onSearchSelect?/onMetricClick?` callbacks. Its client-side filter applies
  types/statuses/minImportance; `query` filtering beyond title-substring is
  the caller's job.
- `PendingQueue({ items, selectedId?, onSelect?, onVerdict?, header?, style? })`.
- `NodeDetailPanel({ node, edges, neighbours: ReadonlyMap<string, MemoryNode>,
  history?, onNavigate?, style? })`.
- `DoctorStrip({ report, onMetricClick?, style? })` where `report` mirrors
  memory's `Store.doctor()` output (`activeCount`, `pendingCount`,
  `acceptRate30d: number|null`, `deadWeightCandidates`, `staleCandidates`,
  `duplicateCandidates`, `dueCandidates`, `queueOldestDays: number|null`,
  `integrityOk`). Reports, never acts.

## Storybook operations

Storybook **10.4.6** with the `react-vite` framework (upgraded from 8 in
`74aad33`; older notes saying "Storybook 8" are stale).

```bash
cd /home/alex/projects/balaur/design
bun run storybook          # -> storybook dev -p 6006 --no-open (in @balaur/ui)
bun run build-storybook    # static build (packages/ui/storybook-static/)
```

Port 6006 is the Storybook convention on this box (machine-specific; check
occupancy with `ss -ltnp | grep 6006`). Long-running servers belong in their
own Herdr pane — see balaur-run-and-operate.

Config (`packages/ui/.storybook/`, verified 2026-07-07):

- `main.ts`: stories = `../src/**/*.stories.@(ts|tsx)`; addons: a11y, docs,
  vitest.
- `preview.tsx`: global **autodocs** tag; the **accent toolbar global**
  (paintbrush icon — green/amber/cyan from `ACCENTS` plus a "custom: violet"
  hex `#c061ff`, applied by wrapping every story in `AccentProvider`);
  **backgrounds** `octant-dark` `#08080a` (default) / `panel` `#0f1015` /
  `ink` `#ffffff`; viewports mobile/tablet/desktop/wide; a11y axe checks set
  to `test: "todo"` (surfaced, not failing — flip to `"error"` once the
  backlog is clean, per the config's own comment).
- Discovery surface: the `OCTANT/ComponentCatalog` story indexes the whole
  library by group.

**Storybook Test** (browser-mode story tests): wired in `74aad33` via
`@storybook/addon-vitest` + `packages/ui/vitest.config.ts` (vitest 4 browser
mode, headless Playwright Chromium). Run with:

```bash
cd /home/alex/projects/balaur/design/packages/ui && bun run test-storybook
```

Caveats: it is **NOT part of `bun run check`**; it needs a Playwright Chromium
install; the `74aad33` commit message reports 464 story tests green (102 play
functions), but this has **still not been re-run** as of 2026-07-08 (heavy
browser run) — treat current green-ness as unverified until you run it. The
wiring itself is verified at HEAD: the `test-storybook` script, `@storybook/
addon-vitest` dep, `packages/ui/vitest.config.ts`, and
`.storybook/vitest.setup.ts` all exist. The plain-`bun test` SSR story gate
(above) is the cheap always-on proxy.

## Related skills

- **design-change-and-release** — releasing, tag pins, gate policy, dual-React
  doctrine, `file:../design` dev loop, lint debt. Anything that changes what
  consumers see goes through it.
- **web-app-reference** — how the web app consumes and SSRs these components.
- **memory-domain-reference** — the schema/invariants the memory-nav suite's
  vocabulary mirrors.
- **balaur-memory-web-campaign** — the campaign the memory-nav suite was
  built for.
- **balaur-workspace-map** — where this repo sits in the three-repo workspace.

## Provenance and maintenance

All facts verified 2026-07-07 against HEAD `74aad33` (2 commits past
`v0.3.0`); re-verified 2026-07-08 — HEAD unchanged, tracked tree clean, so
per-file claims still hold byte-for-byte. Drift-prone facts and their one-line
re-checks (run from `/home/alex/projects/balaur/design`):

| Fact (as of 2026-07-08) | Re-verify with |
|---|---|
| HEAD `74aad33`, 2 past `v0.3.0` | `git log --oneline -3 && git describe --tags` |
| Root pkg `@balaur/octant` v0.3.0, exports map, peer react ^19 | `cat package.json` |
| Source gate green (`bun test` 241 / 17; typecheck 0) but verbatim `bun run check` exits 1 on leftover worktrees — see design-change-and-release §1 | `bun run check; git worktree list` |
| 41 / 39 / 31 = 111 components | `for d in atoms molecules organisms; do ls packages/ui/src/$d \| grep -vc index.ts; done` |
| 16 hooks | `ls packages/ui/src/hooks/*.ts \| grep -v index \| grep -vc test` |
| 119 story files | `find packages -name "*.stories.tsx" \| wc -l` |
| Storybook 10.4.6 | `grep '"version"' node_modules/storybook/package.json` |
| 89 `--bx-*` declarations | `grep -c "^\s*--bx-" packages/tokens/src/tokens.css` |
| No `@balaur/*` imports in package src | `grep -rEn '^\s*import .* from "@balaur/' packages/*/src` (expect empty) |
| gen-barrel.mjs still stale (top-level `<Name>/<Name>.tsx` scan) | `cat packages/ui/scripts/gen-barrel.mjs` |
| ComponentCatalog exported from barrel | `grep ComponentCatalog packages/ui/src/index.ts` |
| Memory-nav suite unconsumed by web/ | `grep -rn "import .*\(MemoryExplorer\|MemoryGraph\|PendingQueue\)" ../web/apps/web/src` (expect empty; a demo-fixture STRING mentioning MemoryGraph is fine) |
| Block union has 6 variants | `grep -c "type: \"" packages/ui/src/organisms/ChatPanel/chat-types.ts` |
| Port 6006 free/occupied (machine-specific) | `ss -ltnp \| grep 6006` |

Open / unverified as of 2026-07-08:

- Storybook Test (`test-storybook`) green-ness — reported green in `74aad33`'s
  commit message; still not re-run (wiring verified, run not).
- The a11y `test: "todo"` backlog size — read the vitest/Storybook output when
  you next run it.
- `balaur-octant-0.1.0.tgz` at the repo root and the `docs/superpowers/` spec:
  release-history artifacts; see design-change-and-release before touching.
