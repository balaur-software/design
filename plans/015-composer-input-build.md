# Plan 015: Build the composer input surface — attachments + slash commands

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> Touch only in-scope files. On any STOP condition, stop and report.
>
> **Drift check (run first)**: your HEAD must contain
> `docs/superpowers/specs/2026-07-08-composer-input-design.md` and
> `packages/ui/src/molecules/ChatComposer/ChatComposer.prototype.stories.tsx`.
> If either is missing, STOP.

## Status

- **Priority**: P2
- **Effort**: L (the slash menu + its keyboard/ARIA contract is the long pole)
- **Risk**: MED (evolves a shipped component's props; removes two decorative props pre-1.0)
- **Depends on**: merged main ≥ `586b319` (contains the approved design spec + prototype)
- **Category**: feature (from direction design plan 012)
- **Planned at**: commit `586b319`, 2026-07-08

## Why this matters

The chat interface renders artifacts out but offers no way to attach anything
in, and advertises slash commands it can't invoke — decorative `attachHint`/
`slashHint` props on the flagship surface. The approved spec (on main) defines
the full contract: app-controlled `attachments` + `onFiles`/`onAttachRequest`/
`onRemoveAttachment`, an `AttachmentChip` atom (ArtifactChip's props were
proven insufficient), a `FloatingPanel`-based slash menu with Select-style
keyboard nav, and a widened `onSend(text, attachments?)`.

## Current state

**READ FIRST — the spec is the source of truth**:
`docs/superpowers/specs/2026-07-08-composer-input-design.md` (committed, in
your worktree). Implement its "Type model" (ComposerAttachment, SlashCommand,
the exact ChatComposerProps shape), "Decisions" 1–4, "Component inventory"
(new AttachmentChip atom — required), and **"Interaction details" verbatim**
(attach flow steps 1–6, slash flow steps 1–6 including the
`/^\/(\S*)$/` leading-token rule and the commit-removes-the-token behavior).

- `packages/ui/src/molecules/ChatComposer/ChatComposer.tsx` — current
  component (Textarea + FillButton/StopButton, `useControllableState`,
  Enter-to-send). `attachHint`/`slashHint` props are REMOVED by this plan
  (spec Decision 4 — pre-1.0, no alias).
- `packages/ui/src/organisms/ChatPanel/chat-types.ts` — where
  `ComposerAttachment` + `SlashCommand` go (exported; the root barrel already
  re-exports chat-types via the organisms barrel).
- Prototype to supersede + delete:
  `packages/ui/src/molecules/ChatComposer/ChatComposer.prototype.stories.tsx`.
- Pattern references: `atoms/ArtifactChip/ArtifactChip.tsx` (visual language
  for the new chip — but two independently-clickable regions per the spec),
  `molecules/Select/Select.tsx` (keyboard contract + `aria-activedescendant`
  pattern), `primitives/FloatingPanel.tsx` (anchored popup),
  `molecules/TextBlock/TextBlock.tsx` + `text-block.test.ts` (pure-function +
  bun-test pattern for the slash-query detector).
- ChatPanel threading (spec build item 7) is DEFERRED — do not touch
  `ChatPanel.tsx` beyond what compiles (it doesn't pass the removed hint
  props — verify with grep; if it DOES pass them, update those call sites
  minimally and report).
- Conventions: strict TS (`exactOptionalPropertyTypes` — the repo's
  `{...(x ? { x } : {})}` idiom), biome 2-space/110, one component per
  folder, stories `OCTANT/<Level>/<Name>`, plays via `storybook/test`,
  token fallbacks must equal tokens.css values exactly, kebab-case test files.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Fast gate | `bun run check` | exit 0 |
| Slash-detector test | `bun test slash` (or your chosen filename) | pass |
| Composer stories | `cd packages/ui && bunx vitest run --project=storybook src/molecules/ChatComposer src/atoms/AttachmentChip` | pass |
| Full gate | `bun run check:full` | exit 0 |

## Scope

**In scope**:
- `packages/ui/src/organisms/ChatPanel/chat-types.ts` (add 2 types)
- `packages/ui/src/atoms/AttachmentChip/AttachmentChip.tsx` + `.stories.tsx` (create)
- `packages/ui/src/atoms/index.ts` (add export)
- `packages/ui/src/molecules/ChatComposer/ChatComposer.tsx` (evolve per spec)
- `packages/ui/src/molecules/ChatComposer/ChatComposer.stories.tsx` (rewrite/extend)
- `packages/ui/src/molecules/ChatComposer/slash-query.ts` + `slash-query.test.ts`
  (create — the pure detector, name at your discretion but kebab-case)
- `packages/ui/src/molecules/ChatComposer/ChatComposer.prototype.stories.tsx` (DELETE)

**Out of scope**:
- `ChatPanel.tsx` prop-surface threading (deferred; minimal compile fixes only, reported).
- `CommandPalette`, `ArtifactChip`, `FloatingPanel`, `Textarea` sources.
- Any transport/upload/FileReader logic — forbidden by the parent spec's non-goals.
- Version bump.

## Steps

### Step 1: Types

Add `ComposerAttachment` and `SlashCommand` to `chat-types.ts` exactly per the
spec's Type model (JSDoc included).

**Verify**: `bun run check` → exit 0.

### Step 2: Pure slash-query detector, test-first

Create `slash-query.ts` exporting
`getLeadingSlashQuery(text: string, caretIndex: number): string | null`
implementing the spec's slash flow rule 2 (`/^\/(\S*)$/` on the substring from
start-of-current-line to caret; null when a space follows the token or the
caret is off the token's line). Write `slash-query.test.ts` FIRST
(pattern: `text-block.test.ts`), covering: leading `/` on line start; `/qu`
partial; `/` mid-sentence → null; token followed by space → null; caret on a
different line than the slash → null; multiline text with slash on second
line; empty string; caret at 0.

**Verify**: `bun test slash-query` → all pass. `bun run check` → exit 0.

### Step 3: AttachmentChip atom

Create per the spec's Component inventory: glyph (by `kind`) + name +
optional formatted size + status dot (`pending`/`error` visible states;
absent/`ready` neutral) + a **separate** remove button
(`aria-label="remove <name>"`, calls `onRemove(id)`). Visual language rhymes
with `ArtifactChip`. Stories with one play (remove fires with id; status
variants render). Add the atoms-barrel export.

**Verify**: `cd packages/ui && bunx vitest run --project=storybook src/atoms/AttachmentChip`
→ pass. `bun run check` → exit 0.

### Step 4: ChatComposer — attachments

Evolve `ChatComposer.tsx` per spec Decisions 1–2 and attach-flow 1–6:
`attachments`/`onFiles`/`onAttachRequest`/`onRemoveAttachment` props, chip row
above the textarea, hidden `<input type="file" multiple>` (reset `value` after
`change`), paperclip trigger renders only when a callback is present,
`onSend(trimmed, attachments)` only when non-empty. REMOVE `attachHint`.

**Verify**: `bun run check` → exit 0 (catches any consumer of the removed prop).

### Step 5: ChatComposer — slash menu

Per spec Decision 3 + slash-flow 1–6: `commands`/`onCommand` props,
`FloatingPanel` anchored under the textarea, filtering
(`startsWith`, case-insensitive), ↓/↑ clamp + Enter commit + Escape close,
commit removes the `/query` token from the value and calls `onCommand(id)`,
ARIA per flow rule 6 (listbox panel + `aria-expanded`/`aria-controls`/
`aria-activedescendant` on the textarea; follow Select.tsx's id pattern).
REMOVE `slashHint`.

**Verify**: `bun run check` → exit 0.

### Step 6: Stories rewrite + delete prototype

Extend/rewrite `ChatComposer.stories.tsx`: keep/adapt existing stories to the
new prop surface; add plays for (a) attachment chips render + remove fires,
(b) hidden-input mode: clicking paperclip is present when `onFiles` set
(don't attempt real file dialogs in a play — assert the input element exists
with `type="file"` and that `onAttachRequest` mode calls the callback),
(c) slash menu: type `/`, menu opens with options; type more, list filters;
↓ then Enter → `onCommand` called with the highlighted id AND the token
removed from the textarea value; Escape closes without a call.
Then `git rm` the prototype story file.

**Verify**: `cd packages/ui && bunx vitest run --project=storybook src/molecules/ChatComposer`
→ all pass. `bun run check` → exit 0 (SSR-renders everything).

### Step 7: Full gate ×2

**Verify**: `bun run check:full` twice → both exit 0 (retry per flake policy;
say if retried).

## Done criteria

- [ ] `bun run check:full` exit 0 (twice)
- [ ] `bun test slash-query` → ≥8 cases pass
- [ ] `grep -n "attachHint\|slashHint" packages/ui/src` → 0 matches
- [ ] AttachmentChip exported from atoms barrel; ComposerAttachment/SlashCommand from chat-types
- [ ] Prototype story deleted
- [ ] Plays cover: remove-attachment, slash open/filter/commit(+token removal)/escape
- [ ] Only in-scope files changed (plus minimal reported compile fixes if any)

## STOP conditions

- The spec is absent from HEAD.
- `grep -rn "attachHint\|slashHint" packages/ui/src` (before you start) shows
  consumers OUTSIDE ChatComposer's own folder + ChatPanel — removing the props
  would break unknown surface; report the list.
- The textarea-as-combobox ARIA wiring fails a11y smoke in a way you cannot
  resolve with the Select pattern — implement the listbox panel without the
  textarea combobox role, and report (the spec flags this as its open
  question 5; degrading gracefully is the planned fallback).
- Any existing ChatComposer story's play cannot be adapted without changing
  component behavior beyond the spec.

## Maintenance notes

- ChatPanel prop threading (spec item 7) deliberately deferred — do it when a
  host actually wants panel-level attachments/commands.
- The spec's open questions (paste-image, drop targets, size limits,
  thumbnails, command arguments) remain owner decisions; nothing here
  precludes them.
