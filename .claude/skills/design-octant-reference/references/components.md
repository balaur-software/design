# OCTANT component inventory

Counted from `packages/ui/src/{atoms,molecules,organisms}/` on 2026-07-07 at HEAD `74aad33`:
**41 atoms + 39 molecules + 31 organisms = 111 components**, plus 3 primitives, 1 provider,
16 hooks, and the `ComponentCatalog`. Re-count with:

```bash
for d in atoms molecules organisms; do
  echo "$d: $(ls /home/alex/projects/balaur/design/packages/ui/src/$d | grep -vc index.ts)"
done
```

Every component lives at `packages/ui/src/<category>/<Name>/<Name>.tsx` with a
sibling `<Name>.stories.tsx`. Descriptions below are condensed from each file's
own doc comment; where the name says it all, no phrase is given.

## Atoms (41)

Smallest single-purpose units; compose no other custom component.

| Component | What it is (when not obvious) |
|---|---|
| AgentGlyph | 2x2 octant-mosaic sigil for a named agent, hashed from `agent.id`; deterministic server/client |
| ArtifactChip | clickable chip for an artifact: type glyph + title |
| Avatar | procedural deterministic identicon from a hash |
| Badge | labeled badge, tinted hairline border |
| BrailleSpinner | single-glyph loading spinner cycling a block-frame ramp |
| CellAvatar | `<pre>` octant-mosaic avatar (2x2 quadrant glyphs) |
| Checkbox | box "fills" with a `bar8` micro-octant animation |
| Clock | terminal clock, live `HH:MM:SS` |
| DecodeScramble | scrambled glyph field resolving left-to-right ("decode" effect) |
| EdgeArc | single SVG edge between two graph points; stroke style from `EDGE_STYLE` |
| Equalizer | spectrum analyser of vertical eighth-block bars |
| FillButton | button that "charges" on hover over a `<pre>` framebuffer |
| GlyphReference | the glyph-primitives explainer (2x4 octant cell doc panel) |
| ImportanceMeter | 5-cell meter for a memory node's importance (0..5) |
| IndeterminateBar | comet head sweeps endlessly across a track |
| InlineCitation | superscript citation chip; source of `CitationSourceProps` used by the chat `citations` block |
| Keycaps | keyboard-shortcut keycap chips |
| Marquee | horizontally scrolling ticker |
| ModelBadge | model-name pill (usage/model panel) |
| NodeGlyph | SVG node marker for the memory graph (circle = free, square = pinned) |
| NodeTypeTag | type chip for a memory node; accent + glyph hashed from the type name |
| OctantField | cursor-reactive particle-flow background field |
| PaletteChip | ANSI palette swatch chips |
| PresenceStatus | stack of presence rows (status dot + label + right-aligned value) |
| ProgressBar | determinate bar as a row of eighth-block glyphs |
| ScanButton | button with a scanline sweep on hover |
| ScrambleHeading | heading that decodes itself on first scroll into view |
| ScrollReveal | wrapper revealing children on first scroll into view |
| Skeleton | loading placeholder filled with octant shade glyphs |
| Sparkline | scrolling eighth-block sparkline + live value readout |
| StatusDots | colored status-dot legend (ONLINE / IDLE / ...) |
| StatusGlyph | single glyph for a memory lifecycle status, colored per `STATUS_STYLE` |
| StopButton | square cancel-generation counterpart to FillButton |
| StreamingCursor | blinking terminal cursor appended to streaming text |
| SurfacingIndicator | `always`/`ask`/`never` glyph for memory surfacing |
| Switch | toggle whose track is a row of octant cells |
| Tag | removable status chip; `x` scrambles the label into dot-noise |
| Ticker | stat counter that spins up when scrolled into view |
| ToolPill | `> tool_name` chip with trailing status glyph (spins while running) |
| Typewriter | types text char-by-char behind a `>` prompt |
| WaveText | glyph row riding a travelling sine wave |

## Molecules (39)

Small functional units; may compose atoms and primitives.

| Component | What it is (when not obvious) |
|---|---|
| Alert | dismissible status banner, kind-tinted left rule |
| ArtifactPanel | artifact card: `ArtifactChip` header + body |
| BlockRenderer | THE dispatch point for a chat `Block` — delegates each block type to its renderer |
| Breadcrumb | |
| BreadcrumbPath | memory-explorer node breadcrumb: `MEMORY > type > title` |
| ChatComposer | chat input: `Textarea` + Send/Stop toggle (by `streaming`); IME-guarded |
| ChatMessage | one chat message row: avatar + blocks (this is where `renderBlock` is consulted) |
| CodeBlock | terminal-style code shell with `lang - filename` header (NO highlighting — see renderBlock) |
| DeployButton | commit-style button with a braille-block "comet" sweep |
| EdgeRow | labeled edge line for the node detail panel |
| EmptyState | centered octant-art empty-state card |
| GraphFilterBar | graph scope controls: search + type/status multi-select + importance |
| GraphLegend | legend for the memory graph's visual language |
| HoverCard | inline handle revealing a floating entity-preview card |
| MessageBubble | chat message bubble shell |
| NodeCard | full summary card for one memory node |
| NodeListItem | compact selectable memory-node row |
| NodeSearchBox | node-search input + dropdown of `NodeListItem` results (caller runs the search) |
| OTPInput | six-cell one-time-passcode field |
| Pager | pagination row |
| Popover | trigger button unrolling a `FloatingPanel`; needs `ToastProvider` for its demo actions |
| RadioGroup | |
| ReasoningBlock | collapsible "THINKING" trace with chevron toggle |
| ScrambleButton | label decodes with the shared `useScramble` reveal |
| SegmentedControl | option row with sliding accent underline |
| Select | button unrolling a floating option menu |
| Slider | drag slider; track is a single-line `bar8` fill |
| SpecList | key/value spec rows |
| Stepper | numeric stepper visualised as a `bar8` fill |
| Steps | horizontal pipeline stepper |
| Textarea | multi-line field with live character counter |
| TextBlock | text block with MINIMAL inline formatting (`code`, **bold**) — deliberately not markdown |
| TextInput | the `useControllableState` reference implementation |
| Toast | demo panel firing toasts through `useToast` |
| ToggleGroup | single- or multi-select toggle button row |
| ToolCallBlock | collapsible tool call: `ToolPill` header + args/result body; string results render verbatim |
| Tooltip | hover/focus tooltip resolving out of static |
| TypingIndicator | `BrailleSpinner` + label agent-thinking row |
| ValidatedField | single-line field with live regex validation |

## Organisms (31)

Complex stateful compositions.

| Component | What it is (when not obvious) |
|---|---|
| Accordion | |
| AgentPlan | ordered plan steps with pending/running/done/error status (`PlanStep` from chat-types) |
| BarChart | horizontal bars drawn as `<pre>` octant rows |
| BootOverlay | fullscreen boot splash (scramble-decoded BIOS log) |
| Calendar | month grid with today/selection markers |
| Carousel | |
| ChatPanel | THE top-level chat surface: header + `ChatThread` + `ChatComposer` + optional artifact side panel |
| ChatThread | scrollable message list; auto-follows the bottom |
| Combobox | text input filtering `options` on the fly |
| CommandPalette | Cmd-K filterable command list; fires `useToast` |
| ContextMenu | right-click floating menu; fires `useToast` |
| DatePicker | read-only field unrolling a floating `Calendar` |
| DoctorStrip | compact health strip mirroring memory's `Store.doctor()` — reports, never acts |
| DropdownMenu | button unrolling a floating action list; `FloatingPanel` + `useToast` |
| Heatmap | calendar-style density-glyph grid |
| List | selectable list of glyph rows |
| LogStream | streaming color-coded event log with a command line |
| MemoryExplorer | THE memory navigation shell: header + left rail (type tree + `PendingQueue`) + center (`GraphFilterBar` + `MemoryGraph` + `GraphLegend`) + right rail (`NodeDetailPanel`) |
| MemoryGraph | Obsidian-style force-directed SVG vault graph; pan/zoom, drag-to-pin |
| Menubar | app-shell menu strip (FILE / EDIT / ...); `FloatingPanel` + `useToast` |
| Modal | confirm dialog on the shared `ScrimOverlay` shell |
| NavMenu | nav bar whose triggers unroll floating mega panels |
| NodeDetailPanel | right-rail panel for the selected memory node: `NodeCard` + Edges/Provenance/History tabs |
| PendingQueue | the consent queue: proposed nodes with approve/reject/supersede/archive verdicts |
| ResizableSplit | two panels with a draggable divider |
| Sheet | edge drawer on the shared `ScrimOverlay` shell |
| Sidebar | collapsible rail of octant sections + content pane |
| Table | sortable zebra-striped data table (keyboard sorting) |
| Tabs | tab strip with sliding accent underline |
| Timeline | activity feed on a vertical rail |
| Tree | tree view with roving tabindex |

## Primitives (3) — `packages/ui/src/primitives/`

| Primitive | Role |
|---|---|
| FloatingPanel | shared floating-surface shell (positioning, dismissal, closed panels hidden with `visibility` + `inert`). Built on by: Combobox, DatePicker, DropdownMenu, HoverCard, Menubar, NavMenu, Popover, Select (verified by grep, 2026-07-07) |
| ScrimOverlay | portal + scrim + focus shell for Modal and Sheet; renders null when closed and on the server |
| ToastProvider | imperative toast service via context + a fixed bottom-right stack. `useToast()` consumers: CommandPalette, ContextMenu, DropdownMenu, Menubar, Popover, Toast. The context default is a NO-OP `() => {}` — components render fine without the provider, toasts just never appear |

## Provider (1) — `packages/ui/src/providers/`

**AccentProvider** — wraps children in a div carrying `accentVars(accent)`
(`--bx-accent` + `--bx-accent-bright`), so descendants re-skin via CSS variable
inheritance. Accepts an `AccentName` (`"green" | "amber" | "cyan"`) or any hex.
Default `"green"`.

## Hooks (16) — `packages/ui/src/hooks/`

| Hook | Purpose |
|---|---|
| useBar8Fill | animated eighth-block fill level |
| useCellMetrics | measure monospace cell size (`measureCell` also exported) |
| useCollapse | height-animated collapse/expand |
| useControllableState | controlled-or-uncontrolled state (see SKILL.md pattern) |
| useDismissable | outside-click / Escape dismissal |
| useFocusTrap | trap focus inside an overlay |
| useForceLayout | force-directed graph simulation (also `initLayout`, `stepLayout`, `pinById`, `releaseById`; has its own unit test) |
| useGraphSelection | selection + hover + 1-hop neighbourhood state for graphs |
| useInView | first-scroll-into-view trigger (also exports `useOnVisible`) |
| useOctantCanvas | rAF-driven `<pre>` framebuffer painter over octant-core |
| usePointerCell | pointer position in cell coordinates |
| useRafLoop | requestAnimationFrame loop with cleanup |
| useReducedMotion | tracks `prefers-reduced-motion`; SSR-safe (starts `false`, reads `matchMedia` in an effect) |
| useScramble | shared glyph-scramble text reveal |
| useSlidingIndicator | measures and animates the sliding accent underline (Tabs, SegmentedControl) |
| useTypewriter | char-by-char text typing state |

## ComponentCatalog — `packages/ui/src/ComponentCatalog/`

A grouped index of the whole library (`CATALOG_GROUPS`), used as the discovery
surface in Storybook (`OCTANT/ComponentCatalog`). As of HEAD `74aad33`
(2026-07-07) it IS exported from the barrel (`src/index.ts` re-exports it) and
IS included in the published `files` set — earlier notes saying it was
Storybook-only are stale.

## Screens (story-only) — `packages/ui/src/screens/`

`ChatApp.stories.tsx`, `MemoryConsole.stories.tsx`, `OpsDashboard.stories.tsx`
— full-app composition demos under `OCTANT/Screens/*`. NOT components: no
`.tsx` implementation files, not in the barrel, and excluded from the published
package (`!packages/ui/src/screens` in root `package.json` `files`).
