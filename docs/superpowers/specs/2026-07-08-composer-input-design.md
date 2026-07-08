# Composer Input Surface — Attachments + Slash Commands Design Spec

Date: 2026-07-08
Status: Proposed (design-only; no production code in this spec's plan)
Package: `@balaur/ui` (`packages/ui/src/molecules/ChatComposer`)
Supersedes-in-part: `docs/superpowers/specs/2026-07-07-agentic-chat-design.md` §`ChatComposer`

## Goal

Design a real input surface for `ChatComposer` so a consuming app can wire
actual attachments (files) and actual slash-command invocation, replacing the
two decorative hint props (`attachHint`, `slashHint`) that currently only
*render text* ("📎 {text}", a `/` keycap) with no behavior behind them. This
document is the spec; a follow-up build plan (outlined at the end) implements
it. Nothing in `packages/ui/src` is modified by this plan — see Scope in the
originating plan file.

## Constraints

This design is bound by the approved parent spec
(`docs/superpowers/specs/2026-07-07-agentic-chat-design.md`), which is
still in force. Three non-goals from that spec directly bound this design:

> - No markdown library or full markdown parser.
> - No transport/network layer, no provider SDK, no stream subscription logic.
> - No persistent conversation storage or routing.

And the controlling architectural line:

> All components are controlled (props-driven) and transport-agnostic; the
> consuming app owns stream subscription and message state.

Read together, these rule out any design where OCTANT reads file bytes,
uploads anything, manages an attachment queue's lifecycle, or executes a
slash command's effect. OCTANT may only: render pending/attached state the
app hands it, forward raw browser primitives (a `File` handle) up to the app
untouched, and emit intents (`onFiles`, `onCommand`, `onRemoveAttachment`)
for the app to act on. This rules out, for example, an internal `FileReader`
based image-preview pipeline inside OCTANT — see Open Questions for how a
preview could still happen without violating this.

No contradiction was found between this design and the parent spec's
non-goals — attachments-as-callbacks and slash-commands-as-a-controlled-menu
are additive UI surface, not a transport layer, not a markdown parser, and
not persistence. (First STOP condition in plan 012 does not apply.)

## Decisions

### 1. File-input ownership: OCTANT renders the native picker, conditionally

**Choice:** `ChatComposer` gets a paperclip trigger button. Its wiring is
determined by two new, mutually exclusive props:

- `onFiles?: (files: File[]) => void` — OCTANT renders a hidden
  `<input type="file" multiple>` next to the trigger. Clicking the paperclip
  opens the native OS picker; on `change`, the raw `FileList` is forwarded as
  `File[]` to `onFiles` and the input is reset. OCTANT never constructs a
  `FileReader`, never uploads, never inspects file contents — the `File`
  object is an opaque handle exactly like the ones a `<input type="file">`
  already produces for any app, so forwarding it is not "transport."
- `onAttachRequest?: () => void` — for apps that want a custom picker
  (a cloud-drive dialog, an existing upload modal, camera capture, etc.),
  OCTANT skips rendering its own `<input>` entirely and calls this instead
  when the paperclip is clicked. The app owns 100% of the picking UI.

If both are supplied, `onAttachRequest` wins (an app that explicitly wants to
own the picker opted out of the native one; silently ignoring that would be
surprising). If neither is supplied, no paperclip renders at all — mirroring
today's behavior where omitting `attachHint` renders nothing.

**Why not stay input-free (app always owns the trigger + `<input>`)?** The
majority case — local file attach — is currently unimplementable from
`ChatComposer` at all; every consumer would hand-roll an identical hidden
`<input type="file">` + ref + `onChange` dance that has no design-system
touchpoint (no shared trigger button styling, no shared placement next to
the textarea). Rendering it internally, gated behind an explicit callback
prop, costs nothing in transport-agnosticism (a `File` handle carries no
bytes read by OCTANT) and gives most consumers a working attach button for
free. Apps with an unusual picker (non-file-system sources) still get a
first-class escape hatch via `onAttachRequest`.

### 2. `onSend` signature evolution: widen, don't overload

**Choice:** `onSend: (text: string, attachments?: readonly ComposerAttachment[]) => void` —
a single widened signature, not a TS function overload.

**Why:** TypeScript structurally allows a function declared with fewer
parameters to satisfy a type that declares more (trailing) optional
parameters — this is the same rule that lets `.map((x) => x)` satisfy
`(value: T, index: number, array: T[]) => U`. Every existing
`onSend: (text: string) => void` handler already satisfies the widened type
unchanged; no migration, no overload resolution ambiguity, and no runtime
shim required. `ChatComposer` calls `onSend(trimmed, attachments)` only when
there are attachments to report (see Interaction details); handlers that
ignore the second argument keep working exactly as before. An overload
(`onSend(text: string): void; onSend(text: string, attachments: ...): void`)
would add call-site ambiguity for no benefit here, since the parameter is
purely additive and always optional.

### 3. Slash-menu composition: `FloatingPanel`, not a `CommandPalette` variant

**Inventory:**
- `primitives/FloatingPanel` — a relatively-positioned `trigger` + an
  absolutely-positioned `children` panel anchored directly below it
  (`top: 100%`), opacity/translateY transition, Escape/outside-click
  dismiss via `useDismissable`, configurable ARIA `role` (`"listbox"` fits a
  command menu). No portal — it renders in place, right under whatever
  `trigger` node it wraps.
- `organisms/CommandPalette` — a global ⌘K overlay: portals through
  `ScrimOverlay` (full scrim + focus trap), centers a fixed-width card in the
  viewport regardless of where the trigger lives, owns its own search
  `<input>`, and depends on `useToast` (requires a `ToastProvider`
  ancestor) for its action-item side effects.

**Choice:** `FloatingPanel`, anchored under `ChatComposer`'s input row.

**Why:** A slash-command menu is an inline, caret-anchored affordance — the
menu must appear directly under the textarea, in place, the way Slack/
Discord/Notion/Linear all do it. `CommandPalette`'s UX is the opposite: a
full-screen modal centered in the viewport, disconnected from the caret,
built for a global ⌘K action list. Reusing it here would mean popping a
scrim over the whole `ChatPanel` every time a user types `/`, plus forcing
every `ChatComposer` consumer to wrap in `ToastProvider` it doesn't
otherwise need, plus two competing text inputs on screen (`CommandPalette`'s
own search box vs. the textarea the user is actually typing in). None of
that fits "type `/` inline and keep typing." `FloatingPanel` already is the
anchored-popup primitive other components (`Select`, `Combobox`,
`DropdownMenu`) build on for exactly this shape, and composing it costs zero
new dependencies.

**Interaction contract (mirrors `Select`'s / `CommandPalette`'s existing
keyboard pattern):** ↓/↑ move the highlighted row (clamped at both ends, not
wrapping — matching `CommandPalette`'s `Math.min`/`Math.max`, not a wrap
implementation), Enter commits the highlighted command, Escape closes the
menu without commit (focus stays in the textarea throughout — this is a
menu overlaying a live text field, not a modal that steals focus).

### 4. `attachHint` / `slashHint`: remove pre-1.0, do not alias

**Choice:** Both props are removed in the follow-up build (not kept as
deprecated aliases).

**Why:** `packages/ui` is `0.3.0` — pre-1.0, no stability guarantee yet.
There is one existing deprecation precedent in the library
(`Stepper`'s deprecated prop, kept as an alias — see
`packages/ui/src/molecules/Stepper/Stepper.tsx:20`), but that case is a
same-shape rename (old prop name → new prop name, identical value type). This
case isn't: `attachHint` is a single decorative string, `slashHint` is a
decorative boolean; their replacements (`attachments: ComposerAttachment[]`,
`commands: SlashCommand[]`) are structurally different data models, not
renames. An alias would have to fake a string/boolean into a real data
array, which is more confusing than a clean break. Given the parent spec is
still `Approved` and unreleased functionality is being replaced with working
functionality of the same intent, a straight removal is cleaner than
carrying dead decorative props through a deprecation window. Concretely: the
`/` keycap's job is now done by the presence of `commands` (rendering the
affordance only when there's a real menu behind it); the `📎 {text}` hint's
job is now done by rendering actual `attachments` chips.

## Type model

Proposed additions to `packages/ui/src/organisms/ChatPanel/chat-types.ts`
(not written to the file by this plan — for the follow-up build):

```ts
/** A file the user has attached to the composer, app-owned end to end. */
export interface ComposerAttachment {
  id: string;
  name: string;
  /** Mirrors artifact kinds so a sent attachment can become an artifact block. */
  kind: "code" | "document" | "image";
  /** Optional byte size for display; formatting (KB/MB) is the component's job. */
  size?: number;
  /** App-owned upload lifecycle. Absent/undefined reads the same as "ready". */
  status?: "pending" | "ready" | "error";
}

/** One entry in the composer's slash-command menu. */
export interface SlashCommand {
  id: string;
  /** The typed name, matched case-insensitively against the query after `/`. */
  name: string;
  /** Optional one-line description shown beside the name. */
  hint?: string;
  /** Optional leading glyph (mirrors ToolPill/ArtifactChip's glyph-first chip shape). */
  glyph?: string;
}
```

Proposed `ChatComposerProps` shape (superset of today's, for the follow-up
build — not applied to `ChatComposer.tsx` by this plan):

```ts
export interface ChatComposerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  streaming?: boolean;
  /** `attachments` is only passed when non-empty; existing 1-arg handlers are unaffected. */
  onSend: (text: string, attachments?: readonly ComposerAttachment[]) => void;
  onStop?: () => void;

  /** Controlled: the app owns the attachment queue end to end. */
  attachments?: readonly ComposerAttachment[];
  /** Renders a hidden native file input behind the paperclip trigger. */
  onFiles?: (files: File[]) => void;
  /** Custom picker escape hatch; wins over `onFiles` if both are set. */
  onAttachRequest?: () => void;
  onRemoveAttachment?: (id: string) => void;

  /** Non-empty enables the slash-menu affordance and its FloatingPanel. */
  commands?: readonly SlashCommand[];
  onCommand?: (id: string) => void;

  placeholder?: string;
  style?: CSSProperties;
}
```

`attachHint` and `slashHint` are removed from this shape (Decision 4).

## Component inventory

Reused as-is (no changes needed):
- `hooks/useControllableState` — `attachments`/`commands` stay purely
  app-controlled (no internal mirror state needed, unlike `value`); only the
  slash-menu's `open`/`highlightedIndex` and the file input's transient
  "picker open" state are internal `useState`.
- `primitives/FloatingPanel` — the slash-menu anchor/popup shell (Decision 3).
- `molecules/Textarea`, `atoms/FillButton`, `atoms/StopButton` — unchanged;
  the textarea becomes the `FloatingPanel` trigger and also owns the
  slash-query detection (see Interaction details).

**New atom required:** `atoms/ArtifactChip` was inventoried as the candidate
visual base for a pending-attachment chip (per plan 012's Step 3 guidance:
"reuse `ArtifactChip` directly if its props suffice — try that first"). Its
actual props are `{ kind, title, onClick, style }` — the entire chip is a
single `<button>` whose one `onClick` fires for the whole chip. It has:
- no `status` glyph (no way to show "pending upload" vs "ready" vs "error"),
- no size/byte-count slot,
- no separate remove affordance (a chip that is itself one big click target
  can't also host an independent "×" remove button without either nesting
  interactive elements or overloading the single `onClick` to mean
  "remove," which would silently repurpose an atom used elsewhere for
  "open artifact").

This confirms plan 012's second STOP condition: **a new `atoms/AttachmentChip`
is required** for the real build (glyph + title + optional size + status dot
+ a distinct remove control). Per that condition's own instruction, this
spec records the gap and the prototype (Step 3) stays minimal — a
story-local mock, not a production atom, and not a reuse of `ArtifactChip`
for a job its props don't support.

## Interaction details

**Attach flow:**
1. Paperclip renders only if `onFiles` or `onAttachRequest` is passed.
2. Click → if `onAttachRequest` is set, call it and stop. Else (native mode)
   programmatically click the hidden `<input type="file" multiple>`.
3. Native `change` event → `onFiles(Array.from(input.files))`, then reset
   `input.value = ""` so re-selecting the same file still fires `change`.
4. The app is responsible for turning those `File`s into `ComposerAttachment`s
   (assigning `id`, `kind`, uploading, flipping `status`) and passing the
   updated `attachments` array back down — same round-trip shape as
   `value`/`onValueChange`, just uncontrolled-vs-controlled doesn't apply
   here since there is no "default" attachment state to manage internally.
5. `ChatComposer` renders one `AttachmentChip` per entry in `attachments`,
   above the textarea. Each chip's remove control calls
   `onRemoveAttachment?.(id)`; the app removes it from its own state (or,
   for an in-flight upload, cancels it — composer doesn't know or care).
6. On send, if `attachments.length > 0`, `onSend(trimmed, attachments)`;
   otherwise `onSend(trimmed)` (no second argument) — the "only pass
   attachments when present" rule from Decision 2.

**Slash flow:**
1. `commands` non-empty enables the affordance. The textarea is wrapped as
   `FloatingPanel`'s `trigger`; the menu is `FloatingPanel`'s `children`.
2. Query detection: on every keystroke, look at the substring from the start
   of the current line to the caret. The menu opens when that substring
   matches `/^\/(\S*)$/` (a leading slash, optionally followed by
   non-whitespace, nothing after the caret's line-position yet) — i.e., the
   same "leading token" rule Slack/Discord/Linear use, not a slash appearing
   mid-sentence. Typing a space or moving off that line closes the menu.
3. Filtering: `commands.filter(c => c.name.toLowerCase().startsWith(query))`,
   query being the text after `/`. Empty query shows the full list.
4. Keyboard contract (Decision 3): ↓/↑ clamp-move the highlight, Enter
   commits the highlighted command, Escape closes without commit and
   returns focus to the textarea (it never left).
5. Commit: remove the `/query` token from the textarea value (from the `/`
   to the caret) and call `onCommand?.(id)`. The composer does not insert
   any command-specific template text — what happens after invocation
   (inserting args, submitting immediately, opening a sub-form) is the app's
   business per the transport-agnostic constraint.
6. ARIA: mirror `CommandPalette`'s combobox pattern — `role="listbox"` on
   the `FloatingPanel` panel, `aria-expanded`/`aria-controls`/
   `aria-activedescendant` on the textarea itself (this needs a compatibility
   check in the build — `role="combobox"` is conventionally applied to
   `<input>`, and a multi-line `<textarea>` acting as a combobox host is
   less common; flagged again in Open Questions).

## Non-goals (of this design, specifically)

- No upload progress bar/percentage UI — `status: "pending"` is a single
  state; granular progress is an app concern if it wants one (it can just
  keep re-rendering the same attachment with different `name`/`status`).
- No drag-and-drop drop-zone chrome (highlight ring, "drop here" overlay) —
  scoped out per plan 012; see Open Questions.
- No paste-image interception — see Open Questions.
- No command *execution* — `onCommand` fires with just an `id`; running
  whatever the command means is entirely the app's.
- No image thumbnail rendering inside `AttachmentChip` in this pass (see
  Open Questions) — the glyph-only treatment `ArtifactChip` already uses is
  the starting assumption.

## Open questions

These need the owner's call before the follow-up build can size itself
precisely:

1. **Paste-image handling.** Should `ChatComposer` intercept the textarea's
   native `onPaste` to detect `ClipboardItem` image data and surface it
   (e.g. a new `onPasteFiles?: (files: File[]) => void`), or is that
   entirely out of scope until an app asks for it? Doing it well means
   distinguishing "pasting text" from "pasting an image" without ever
   reading the image's bytes (only forwarding the `File`), which is
   consistent with Decision 1's model — but it's new surface not asked for
   in plan 012's Steps.
2. **Drop-target scope.** If drag-and-drop is wanted later, does OCTANT own
   a drop zone on the whole `ChatComposer` (or the whole `ChatPanel`), and
   does it render any visual "drop here" affordance, or does it just expose
   an `onFiles`-shaped callback the app wires to its own `ondrop` listener
   on a ref it holds? This changes whether `ChatComposer` needs a new ref
   forwarding API.
3. **Multi-file / size limits.** Does OCTANT enforce a max attachment count
   or size (disable the paperclip past N, grey out oversized entries), or
   is limit enforcement entirely the app's job via `status: "error"` and a
   toast/message it renders itself? The current model leans "app's job";
   confirm before the build locks the `AttachmentChip` error-state design.
4. **Image thumbnails.** Should an attachment with `kind: "image"` show an
   actual thumbnail (would require the app to hand down a preview URL —
   e.g. `previewUrl?: string` on `ComposerAttachment`, an `object URL` the
   *app* creates via its own `URL.createObjectURL(file)`, never OCTANT) or
   stay glyph-only like `ArtifactChip`'s image treatment today? This is a
   type-model question (an optional field) more than an interaction one.
5. **Textarea-as-combobox a11y.** Is `role="combobox"` on a `<textarea>`
   (rather than the more conventional `<input>`) acceptable, or does the
   build need an accessibility spike to confirm screen-reader behavior
   before locking the ARIA pattern in Interaction details point 6?
6. **Command argument entry.** After a command is committed, should the
   composer support "sticky" argument-taking UX (e.g., an inline pill
   showing "/deploy" persisted while the user types the argument after it),
   or is a plain text clear-and-continue (as designed above) sufficient for
   v1? This affects whether `SlashCommand` needs an `argsHint` field.

## Build plan outline

Sized for a future executor run. Sizes are relative effort (S = under an
hour of focused work, M = a few hours, L = the better part of a session),
not calendar estimates.

| # | Piece | Size | Notes |
|---|---|---|---|
| 1 | `chat-types.ts`: add `ComposerAttachment`, `SlashCommand` | S | Pure type addition, no behavior. |
| 2 | `atoms/AttachmentChip/AttachmentChip.tsx` + `.stories.tsx` | S | New atom per Component inventory: glyph + title + optional size + status dot + separate remove control. Mirror `ArtifactChip`'s visual language but as two independently-clickable regions. |
| 3 | `ChatComposer.tsx`: attachment props + chip row + hidden file input | M | `attachments`, `onFiles`, `onAttachRequest`, `onRemoveAttachment`; widen `onSend`; remove `attachHint`. Wire the hidden `<input type="file">` per Interaction details. |
| 4 | `ChatComposer.tsx`: slash-menu via `FloatingPanel` | L | Caret/leading-slash detection helper (pure function, TDD-able like `tokenizeInline`), filtering, keyboard contract, ARIA wiring, remove `slashHint`. The a11y spike in Open Question 5 should land before or alongside this. |
| 5 | `ChatComposer.stories.tsx`: rewrite | M | New stories: attachments idle/pending/error, remove-attachment interaction, slash-menu open/filter/select/escape, updated Idle/Streaming/WithText stories for the new `onSend` signature. |
| 6 | Unit test: slash-query detector | S | e.g. `getLeadingSlashQuery(text, caretIndex): string | null` — pure logic, `bun:test`, same pattern as `tokenizeInline`/`agentMosaic`. |
| 7 | `ChatPanel.tsx`: thread new composer props through | S | Same pattern as today's `composerValue`/`onSend` forwarding; only needed if `ChatPanel` should expose attachments/commands at its own prop surface. |
| 8 | Barrel updates (`atoms/index.ts`) | S | `export * from "./AttachmentChip/AttachmentChip";` |
| 9 | `bun run check` + manual Storybook pass | S | Gate, per repo convention. |

Rough total: one M-to-L-sized follow-up plan (consistent with this plan's
own "Effort: M" framing) — item 4 (slash-menu + a11y) is the long pole.
