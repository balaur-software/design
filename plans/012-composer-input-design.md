# Plan 012: DESIGN — real composer input surface (attachments + slash commands) for the agentic chat

> **Executor instructions**: This is a **design plan** — the deliverable is a
> written spec + a prototype story, NOT shipped component API. Nothing lands
> in the public barrel. Follow the steps; honor the STOP conditions. When
> done, update the status row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 74aad33..HEAD -- packages/ui/src/molecules/ChatComposer packages/ui/src/organisms/ChatPanel docs/superpowers/specs`
> On drift, re-read those files before proceeding.

## Status

- **Priority**: P3
- **Effort**: M (design + prototype; build-out is a follow-up plan)
- **Risk**: LOW (no public API changes in this plan)
- **Depends on**: none
- **Category**: direction (design)
- **Planned at**: commit `74aad33`, 2026-07-08

## Why this matters

The agentic chat interface is this library's flagship feature, and its
input/output surfaces are asymmetric: the OUTPUT side is complete (the
`Block` union renders code/document/**image** artifacts; `ChatPanel` has a
full artifact side panel), but the INPUT side only *gestures* at capability —
`ChatComposer`'s `attachHint` prop renders literal `📎 {text}` and `slashHint`
renders a `/` keycap; there is no `onAttach`, no file input, no drop handler,
no slash-command menu (verified by grep across ChatComposer/ChatPanel). A
consumer wiring real chat (the `web/` host already renders `ChatPanel`
server-side) must hand-roll attachments and command invocation around a
component that visually promises both. This plan designs that surface within
the approved spec's constraints.

## Current state

- `packages/ui/src/molecules/ChatComposer/ChatComposer.tsx` — full current
  API (`:7-23`):
  ```ts
  export interface ChatComposerProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    streaming?: boolean;
    onSend: (text: string) => void;
    onStop?: () => void;
    /** Show the attach hint row. */
    attachHint?: string;
    /** Show the slash-command hint. */
    slashHint?: boolean;
    placeholder?: string;
    style?: CSSProperties;
  }
  ```
  Hints render at `:91-94`: `{slashHint && (…kbd…)}` and
  `{attachHint && <span>📎 {attachHint}</span>}` — pure decoration.
  Composer uses `useControllableState` (`:42`) and Enter-to-send (`:52-57`).
- **Binding design constraints** from the approved spec
  (`docs/superpowers/specs/2026-07-07-agentic-chat-design.md` — read it fully
  before designing; key lines):
  - "All components are controlled (props-driven) and transport-agnostic; the
    consuming app owns stream subscription and message state."
  - Non-goals: "No markdown library…", "No transport/network layer, no
    provider SDK…", "No persistent conversation storage or routing."
  - Type model lives in `packages/ui/src/organisms/ChatPanel/chat-types.ts`
    (the `Block` union — `artifact` blocks already model
    `kind: "code" | "document" | "image"`).
  ⇒ Attachments must be a **presentational + callback** model: the app owns
  file handles/uploads; OCTANT renders pending-attachment state and emits
  intents (`onAttach`, `onRemoveAttachment`, `onSend(text, attachments)`).
- Existing building blocks to reuse (inventory before inventing):
  - `atoms/ArtifactChip/` — the visual pattern for a small titled chip with
    kind glyph; a pending `AttachmentChip` should rhyme with it.
  - `organisms/CommandPalette/` — ⌘K palette with filtering + keyboard nav;
    the slash menu is the same interaction anchored to the composer
    (`primitives/FloatingPanel` is the anchored-popup base used by
    Select/Combobox/etc.).
  - `molecules/Textarea/`, `atoms/FillButton`, `atoms/StopButton` — the
    composer's current composition.
- Convention: controlled-or-uncontrolled via
  `hooks/useControllableState.ts`; one component per folder; stories with
  `play` tests; `--bx-*` token styling with canonical fallbacks.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Fast gate | `bun run check` | exit 0 |
| Prototype story | `cd packages/ui && bunx vitest run --project=storybook src/molecules/ChatComposer` | pass |

## Scope

**In scope** (design artifacts only):
- `docs/superpowers/specs/2026-07-08-composer-input-design.md` (create — the spec)
- ONE prototype story file, e.g.
  `packages/ui/src/molecules/ChatComposer/ChatComposer.prototype.stories.tsx`
  (mock-level prototype driven entirely by story-local state/components)

**Out of scope**:
- `ChatComposer.tsx` and every other component source — NO production code.
- `chat-types.ts` — proposed type additions go in the spec document, not the file.
- Barrels/exports; anything the host could import.
- Upload mechanics, file readers, drag-and-drop OS integration details beyond
  the callback contract (transport is the app's, per the spec's non-goals).

## Git workflow

Repo rule: **never commit or push unless the owner explicitly asks.** Working
tree changes + report only.

## Steps

### Step 1: Read the two intent docs and the composer end-to-end

Read `docs/superpowers/specs/2026-07-07-agentic-chat-design.md`,
`docs/superpowers/plans/2026-07-07-agentic-chat.md` (component inventory and
conventions), and `ChatComposer.tsx` fully.

**Verify**: you can state (in the new spec's "Constraints" section) the three
non-goals that bound this design, quoted.

### Step 2: Write the design spec

Create `docs/superpowers/specs/2026-07-08-composer-input-design.md` matching
the structure of the existing spec (Goal / Decisions / Non-goals / Type model
/ Component inventory / Interaction details). It must cover:

1. **Attachment model** (proposed, for `chat-types.ts` later):
   ```ts
   export interface ComposerAttachment {
     id: string;
     name: string;
     kind: "code" | "document" | "image";   // mirror artifact kinds
     /** Optional byte size for display; formatting is the component's job. */
     size?: number;
     status?: "pending" | "ready" | "error"; // app-owned upload lifecycle
   }
   ```
   plus the callback contract: `attachments?: readonly ComposerAttachment[]`
   (controlled, app-owned), `onAttachRequest?: () => void` (the app opens its
   picker — OCTANT never touches `<input type="file">`? or does it? DECIDE and
   justify; leaning: OCTANT renders the button + optional native input for
   convenience, app receives `File` objects via `onFiles?: (files: File[]) => void`,
   never reads them), `onRemoveAttachment?: (id: string) => void`, and
   `onSend(text, attachments)` signature evolution (backward-compatible
   overload vs new prop — decide, justify).
2. **Slash-command model**: `commands?: readonly SlashCommand[]`
   (`{ id, name, hint?, glyph? }`), menu opens when the caret is on a leading
   `/`, filtered as the user types, ↑/↓/Enter/Esc keyboard contract (mirror
   Select's), `onCommand?: (id: string) => void`. Composition question to
   answer: reuse `FloatingPanel` anchored to the textarea vs embed a
   `CommandPalette` variant — inventory both, pick one, record why.
3. **Deprecation path** for the decorative `attachHint`/`slashHint` props
   (they become derived: hints show when the corresponding callbacks/data are
   absent? or are removed pre-1.0? — decide, justify).
4. **Open questions** section — anything genuinely undecidable without the
   owner (e.g. paste-image handling, drop-target scope, multi-file limits).
5. **Follow-up build plan outline** — components/files/tests, sized (S/M/L
   per piece), so the next `/improve plan` or executor run can build it.

**Verify**: spec file exists; contains "Constraints", "Type model",
"Open questions", "Build plan outline" headings.

### Step 3: Prototype story (proof of feel, not of code)

Create `ChatComposer.prototype.stories.tsx` with story-local mock components
(defined inside the story file, NOT exported): a composer wrapper that renders
mock `AttachmentChip`s above the textarea (reuse `ArtifactChip` directly if
its props suffice — try that first), and a mock slash menu on `/` (a
story-local list over `FloatingPanel` is enough). One `play` asserting: typing
`/` shows the menu; Escape hides it; a chip renders with a remove control that
fires a story `fn()`.

Title it `OCTANT/Molecules/ChatComposer/Prototype` and mark the file clearly
as a prototype in its doc comment. It must pass SSR story rendering
(no DOM during render) like every story.

**Verify**: `bun run check` → exit 0;
`cd packages/ui && bunx vitest run --project=storybook src/molecules/ChatComposer` → passes.

### Step 4: Report

Summarize in the plan report: the two or three genuine decisions made
(file-input ownership; slash-menu composition; hint-prop fate), the open
questions for the owner, and the build-plan size estimate.

## Test plan

Design plan — the only executable artifact is the prototype story and its one
play (Step 3). All existing gates stay green.

## Done criteria

- [ ] `docs/superpowers/specs/2026-07-08-composer-input-design.md` exists with the required sections, quoting the inherited non-goals
- [ ] Prototype story exists, passes its play, and SSR-renders (`bun run check` exit 0)
- [ ] No production source file modified (`git status`: only the spec + one story file)
- [ ] Report lists decisions + open questions + build estimate
- [ ] `plans/README.md` status row updated

## STOP conditions

- The approved spec contains language that already decides against composer
  inputs (re-read Non-goals carefully) — surface the contradiction instead of
  designing around it.
- `ArtifactChip`'s props can't render a pending attachment AND a story-local
  chip mock would require copying significant component code — note it as
  "new `AttachmentChip` atom required" in the spec and keep the prototype
  minimal rather than building the atom.

## Maintenance notes

- The follow-up BUILD plan (not this one) should: extend `chat-types.ts`,
  build `AttachmentChip` (atom) + slash menu integration, evolve
  `ChatComposer` props with backward compatibility, and add plays mirroring
  the keyboard contract — sized in this spec's build-plan outline.
- Whoever builds it must respect `exactOptionalPropertyTypes` (optional props
  spread conditionally — the codebase's `{...(x ? { x } : {})}` idiom).
