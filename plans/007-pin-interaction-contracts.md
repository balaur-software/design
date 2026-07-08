# Plan 007: Pin the documented interaction contracts — overlay focus/scroll, Select keyboard, Calendar date math

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 74aad33..HEAD -- packages/ui/src/primitives packages/ui/src/molecules/Select packages/ui/src/organisms/Calendar packages/ui/src/organisms/DatePicker`
> On drift, compare the excerpts below against live files; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (additive tests; no source changes)
- **Depends on**: plans/001-wire-storybook-test-gate.md (these plays only run in a gate once 001 lands)
- **Category**: tests
- **Planned at**: commit `74aad33`, 2026-07-08

## Why this matters

`docs/CONSUMING.md` advertises specific accessibility contracts (its
"Accessibility" table): ScrimOverlay provides focus trap, **focus restore**,
Esc/outside-click dismissal, and **body-scroll lock**; Select implements
↑/↓/Enter/Esc with `aria-activedescendant`. Today the ScrimOverlay/
FloatingPanel plays assert only focus-in and Esc; **focus restore, scroll
lock, and outside-click dismissal are asserted nowhere**; Select's play is
click-only — its entire keyboard contract can silently break. Calendar's date
math (leap years, month-length changes, Dec→Jan year rollover) is inlined in
the component and untested at any boundary. These are exactly the regressions
invisible to manual clicking.

## Current state

- `packages/ui/src/primitives/ScrimOverlay.tsx` — scroll lock is a
  module-level ref-count (`:29-43`): first lock saves
  `document.body.style.overflow` and sets it to `"hidden"`; last unlock
  restores the saved value. Focus restore comes from `useFocusTrap` teardown
  (`packages/ui/src/hooks/useFocusTrap.ts:55-58`).
- `packages/ui/src/primitives/ScrimOverlay.stories.tsx:93-110` — the only
  play: asserts dialog opens, has accessible name, focus moves in, Escape
  closes, `onClose` called once. `EndSheet` (`:114`) and `NoFocusTrap`
  (`:124`) are render-only. The demo (`ScrimDemo`) has an "open overlay"
  trigger button — the natural focus-restore target.
- `packages/ui/src/primitives/FloatingPanel.stories.tsx:96-116` — Default play
  covers open, menu role, Escape dismiss via `onOpenChange`. No story asserts
  **outside-click** dismissal. Overlays portal into `document.body`, so plays
  query via `within(document.body)` (see ScrimOverlay's play comment).
- `packages/ui/src/molecules/Select/Select.tsx` keyboard implementation
  (`:69-86`): trigger keydown handles `ArrowDown`/`Enter`/`Space` (open or
  choose), `ArrowUp`, `Escape`; `:115`
  `aria-activedescendant={open && active >= 0 ? \`${baseId}-opt-${active}\` : undefined}`.
- `packages/ui/src/molecules/Select/Select.stories.tsx:30-41` — Default play
  is click-only (click trigger, click option, assert `onChange` + closed).
  Trigger queried as `canvas.getByRole("combobox", { name: /octant · 2×4/i })`.
- `packages/ui/src/organisms/Calendar/Calendar.tsx`:
  - `:81-91` `cells`: `startDow = new Date(year, month, 1).getDay()` leading
    nulls, `dim = new Date(year, month + 1, 0).getDate()` day count.
  - `:93-98` `shiftMonth(delta)`: `new Date(base.getFullYear(), base.getMonth() + delta, 1)`.
  - `:48` `defaultMonth?: Date` prop seeds the view — the fixture hook for
    deterministic boundary tests.
  - Header (`:128`): `` `${MONTHS[view.getMonth()]!} ${view.getFullYear()}` ``;
    nav buttons have `aria-label="Previous month"` / `"Next month"` (`:124,130`).
  - Day buttons have `aria-label` = `` `${date.getDate()} ${MONTHS[...]} ${date.getFullYear()}` `` (`:152`) and `aria-pressed` for selection.
- Existing play conventions: `storybook/test` imports (`expect`, `fn`,
  `waitFor`, `within`), `canvas`/`userEvent` from play context, `/** … */`
  story doc comments, `OCTANT/<Category>/<Name>` titles.
- Every story is also server-rendered by
  `packages/ui/src/__ssr__/ssr-stories.test.tsx` under `bun test` — new
  stories must not touch the DOM during render.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Fast gate | `bun run check` | exit 0 |
| Browser suite | `bun run --filter '@balaur/ui' test-storybook` | exit 0 |
| One story file (faster loop) | `cd packages/ui && bunx vitest run --project=storybook src/molecules/Select/Select.stories.tsx` | passes |

## Scope

**In scope** (story files only):
- `packages/ui/src/primitives/ScrimOverlay.stories.tsx`
- `packages/ui/src/primitives/FloatingPanel.stories.tsx`
- `packages/ui/src/molecules/Select/Select.stories.tsx`
- `packages/ui/src/organisms/Calendar/Calendar.stories.tsx`

**Out of scope**:
- ALL component/hook source files. If an assertion exposes a real bug, STOP.
- `DatePicker.stories.tsx` — DatePicker composes Calendar in a FloatingPanel;
  its date math is Calendar's, covered here. (Deliberate scope cut.)
- The other components in the CONSUMING a11y table (Tabs, Tree, Combobox,
  DropdownMenu, CommandPalette, ResizableSplit) — they already have keyboard
  plays; auditing them for per-row completeness is follow-up, not this plan.

## Git workflow

Repo rule: **never commit or push unless the owner explicitly asks.** Working
tree changes + report only.

## Steps

### Step 1: ScrimOverlay — focus restore, scroll lock, scrim click

Extend the existing `Default` play (or add sibling stories if the flow reads
better) to assert, in order:

1. Before open: capture the trigger (`canvas.getByRole("button", { name: /open overlay/i })`).
2. Open → existing assertions stay. Add:
   `await expect(document.body.style.overflow).toBe("hidden")` (scroll lock).
3. Escape-close → add
   `await waitFor(() => expect(trigger).toHaveFocus())` (focus restore) and
   `await expect(document.body.style.overflow).not.toBe("hidden")`
   (lock released; the saved value is restored — assert not-hidden rather than
   a specific string).
4. New story `ScrimClickDismiss`: open, then click the scrim element itself —
   the scrim is the outermost fixed div; click at the viewport corner via
   `await userEvent.click(document.querySelector('[role="dialog"]')!.parentElement!)`
   is brittle — instead read `ScrimOverlay.tsx` first and target however the
   scrim is addressable (a `data-` attribute, `aria-hidden` sibling, or
   clicking `document.body` coordinates outside the panel). Assert `onClose`
   fires and the dialog leaves the tree. If no reliable selector exists for
   the scrim, add the story using `userEvent.pointer` at coordinates `{ x: 5, y: 5 }`
   relative to viewport; if that also proves flaky twice, drop THIS sub-story
   and note it in the report (the other assertions still land).

**Verify**: `cd packages/ui && bunx vitest run --project=storybook src/primitives/ScrimOverlay.stories.tsx` → all pass.

### Step 2: FloatingPanel — outside-click dismissal

Add story `OutsideClickDismiss`: render the `PanelDemo` next to an unrelated
`<button>OUTSIDE</button>` (extend the render), open the panel, click the
OUTSIDE button, assert `onOpenChange` last called with `false` and the menu
leaves the a11y tree (`waitFor(() => expect(canvas.queryByRole("menu")).toBeNull())`).

**Verify**: `bunx vitest run --project=storybook src/primitives/FloatingPanel.stories.tsx` → all pass.

### Step 3: Select — the documented keyboard contract

Add story `KeyboardNavigation` (args mirroring Default's options +
`onChange: fn()`), play:

1. `trigger.focus()`; `await userEvent.keyboard("{ArrowDown}")` → listbox opens
   (`aria-expanded="true"`).
2. Assert `aria-activedescendant` on the trigger is set and ends with the
   active option index (pattern `-opt-<n>`, per `Select.tsx:115`).
3. `{ArrowDown}` again → activedescendant advances to the next option id.
4. `{Enter}` → `onChange` called with the highlighted option's value; closed
   (`aria-expanded="false"`).
5. Reopen with `{ArrowDown}`; `{Escape}` → closes WITHOUT another `onChange`
   call (assert call count unchanged).

**Verify**: `bunx vitest run --project=storybook src/molecules/Select/Select.stories.tsx` → all pass.

### Step 4: Calendar — boundary fixtures

Add three stories, each seeded via `defaultMonth` (construct dates as
`new Date(2024, 1, 1)` — month is 0-based; note Feb=1, Dec=11):

1. `LeapFebruary`: `defaultMonth: new Date(2024, 1, 1)`, play asserts the
   header reads `FEB 2024` (match `MONTHS` casing — read the `MONTHS` array at
   `Calendar.tsx:5` first) and a day button `29` exists
   (`canvas.getByRole("button", { name: /^29 feb 2024/i })`).
2. `NonLeapFebruary`: `defaultMonth: new Date(2025, 1, 1)`, asserts day 28
   exists and day 29 does NOT (`queryByRole … toBeNull()`).
3. `YearRollover`: `defaultMonth: new Date(2025, 11, 1)` (Dec 2025), play
   clicks `Next month` → header shows `JAN 2026`; clicks `Previous month`
   twice → header shows `NOV 2025`.

**Verify**: `bunx vitest run --project=storybook src/organisms/Calendar/Calendar.stories.tsx` → all pass.

### Step 5: Full sweep, twice

**Verify**: `bun run check` → exit 0 (new stories SSR-render). Then
`bun run --filter '@balaur/ui' test-storybook` twice → both exit 0 (focus
assertions are the flakiest kind; two greens required).

## Test plan

All new coverage is story plays (cases enumerated in Steps 1–4):
focus restore, scroll lock + release, scrim/outside dismissal ×2 surfaces,
Select's 5-step keyboard contract, Calendar leap/non-leap/rollover. Pattern
exemplars: `ScrimOverlay.stories.tsx:93-110` (focus + waitFor),
`Select.stories.tsx:30-41` (args + fn()).

## Done criteria

- [ ] `bun run check` exits 0
- [ ] `bun run --filter '@balaur/ui' test-storybook` exits 0 twice consecutively
- [ ] New/extended plays exist: `grep -c "export const" packages/ui/src/organisms/Calendar/Calendar.stories.tsx` increased by 3; `KeyboardNavigation` in Select stories; `OutsideClickDismiss` in FloatingPanel stories; scroll-lock + focus-restore assertions in ScrimOverlay stories (`grep -n "overflow" packages/ui/src/primitives/ScrimOverlay.stories.tsx` ≥ 1)
- [ ] Zero source-file modifications (`git status` shows only the 4 story files)
- [ ] `plans/README.md` status row updated (note if the scrim-click sub-story was dropped)

## STOP conditions

- Any assertion fails against CURRENT component behavior after you've
  double-checked the assertion matches the documented contract — that's a real
  bug (e.g. focus restore genuinely broken); report with the failing play.
- The Select trigger's accessible name doesn't match
  `/octant · 2×4/i` (stories drifted) — re-derive from the live story args,
  and STOP only if the component API itself changed.
- A new play is flaky (passes/fails alternately) after one timeout/`waitFor`
  adjustment attempt.

## Maintenance notes

- Step 1's scrim-click selector is the fragile spot — reviewer should check it
  targets the scrim robustly, not pixel coordinates (unless the fallback was
  used and reported).
- Follow-up deliberately not done here: row-by-row audit of the CONSUMING.md
  a11y table against existing plays (Tabs/Tree/Combobox/DropdownMenu/
  CommandPalette/ResizableSplit) — those have keyboard plays already; a gap
  analysis is cheap once this plan's pattern is established.
- If Calendar is ever refactored to extract `cells`/`shiftMonth` as pure
  functions, port these boundary cases to `bun test` (faster) and keep one
  play for wiring.
