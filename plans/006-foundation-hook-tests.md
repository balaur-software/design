# Plan 006: Characterize the foundation hooks — useControllableState and useFocusTrap

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 74aad33..HEAD -- packages/ui/src/hooks/useControllableState.ts packages/ui/src/hooks/useFocusTrap.ts`
> On drift, compare the excerpts below against live files; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (additive tests only; no source changes)
- **Depends on**: plans/001-wire-storybook-test-gate.md (the new tests are
  story `play` functions — without 001 they exist but never run in a gate)
- **Category**: tests
- **Planned at**: commit `74aad33`, 2026-07-08

## Why this matters

`useControllableState` is imported by **35** non-test modules — it encodes the
controlled/uncontrolled contract for nearly every form/selection component
(Select, Tabs, Switch, Combobox, Modal, …). `useFocusTrap` has five distinct
behavior branches (focus-first, container fallback, Tab wrap both directions,
escaped-focus recovery, restore-on-teardown) guarding every dialog. Neither
has a single test; the only hook test in the package is
`use-force-layout.test.ts`. A regression in either hook corrupts dozens of
components while `bun run check` stays green. These tests are also the
characterization safety net any future refactor of the overlay/menu components
needs (they were the top "characterization tests first" candidates in the
audit).

## Current state

- `packages/ui/src/hooks/useControllableState.ts` — the whole hook (23 lines):
  ```ts
  export function useControllableState<T>(
    controlled: T | undefined,
    defaultValue: T,
    onChange?: (value: T) => void,
  ): [T, (value: T) => void] {
    const isControlled = controlled !== undefined;
    const [internal, setInternal] = useState(defaultValue);
    const value = isControlled ? controlled : internal;
    const set = useCallback(
      (next: T) => {
        if (!isControlled) setInternal(next);
        onChange?.(next);
      },
      [isControlled, onChange],
    );
    return [value, set];
  }
  ```
  Contract to pin: controlled → `set` never changes the rendered value, only
  calls `onChange`; uncontrolled → `set` updates internal state AND calls
  `onChange`; `undefined` controlled prop means uncontrolled (so a component
  can't be controlled to `undefined` — that IS the contract, pin it).
- `packages/ui/src/hooks/useFocusTrap.ts` — branches to pin (full source is
  60 lines; read it before writing tests):
  - `:25-27` on activation: focus first focusable, else focus the container
    (setting `tabindex="-1"` on it if absent).
  - `:35-38` Tab with zero focusables: preventDefault + refocus container.
  - `:43-45` focus escaped the container: Tab pulls it back (first, or last if
    Shift+Tab).
  - `:46-52` Tab on last wraps to first; Shift+Tab on first wraps to last.
  - `:55-58` teardown: removes listener and restores focus to the previously
    active element.
- **Testing infrastructure constraint (important)**: `bun test` has NO DOM —
  do not add happy-dom/jsdom globally; the `__ssr__` tests depend on
  `typeof document === "undefined"` server semantics and a global DOM would
  corrupt them. The repo's established way to test interactive behavior in a
  real DOM is **story `play` functions** (98 story files already do this),
  which run in headless Chromium via `vitest --project=storybook`
  (`bun run check:full` after plan 001).
- Story conventions (from existing files, e.g.
  `packages/ui/src/primitives/ScrimOverlay.stories.tsx`):
  - `import type { Meta, StoryObj } from "@storybook/react-vite";`
  - test utils from `storybook/test` (`expect`, `fn`, `waitFor`, `within`)
  - `userEvent`/`canvas` arrive via the `play` context
  - title pattern `OCTANT/<Category>/<Name>`; a `/** … */` doc comment per story
  - Storybook glob is `../src/**/*.stories.@(ts|tsx)` — any location under
    `src/` is picked up. `packages/ui/src/__ssr__/ssr-stories.test.tsx`
    server-renders EVERY story, so probe components must render cleanly with
    no DOM access during render (interact only inside `play`/effects).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Fast gate (includes SSR render of new stories) | `bun run check` | exit 0 |
| Browser suite | `bun run --filter '@balaur/ui' test-storybook` | exit 0, +2 story files |
| Full gate (post-001) | `bun run check:full` | exit 0 |

## Scope

**In scope** (create only; no existing file changes):
- `packages/ui/src/hooks/UseControllableState.stories.tsx` (create)
- `packages/ui/src/hooks/UseFocusTrap.stories.tsx` (create)

**Out of scope**:
- `useControllableState.ts`, `useFocusTrap.ts` — characterization means pin
  CURRENT behavior; if a test reveals a genuine bug, STOP and report, don't fix.
- `bunfig.toml`, vitest config, any DOM-registration for `bun test`.
- The components that consume these hooks.

## Git workflow

Repo rule: **never commit or push unless the owner explicitly asks.** Working
tree changes + report only.

## Steps

### Step 1: Probe stories for useControllableState

Create `packages/ui/src/hooks/UseControllableState.stories.tsx` with:

- A small probe component:
  ```tsx
  function Probe({ value, defaultValue = "a", onChange }: {
    value?: string; defaultValue?: string; onChange?: (v: string) => void;
  }) {
    const [v, set] = useControllableState(value, defaultValue, onChange);
    return (
      <div>
        <output data-testid="value">{v}</output>
        <button type="button" onClick={() => set("b")}>set b</button>
      </div>
    );
  }
  ```
- `Meta` with `title: "OCTANT/Hooks/useControllableState"`,
  `component: Probe`, and `tags: ["!autodocs"]` if autodocs errors on a
  non-exported probe (try without first).
- Four stories, each with a `play` pinning one quadrant:
  1. **Uncontrolled**: click "set b" → `value` output becomes `b`, `onChange`
     (a `fn()` arg) called with `"b"`.
  2. **Controlled**: `value="a"` fixed → click "set b" → output STAYS `a`,
     `onChange` called with `"b"` (parent owns the update).
  3. **ControlledRerender**: render probe under a stateful wrapper that
     applies `onChange` to its own state → click → output becomes `b`
     (the full controlled loop works).
  4. **UndefinedMeansUncontrolled**: `value={undefined}` explicitly → behaves
     as uncontrolled (output changes on click).

**Verify**: `bun run check` → exit 0 (SSR story render covers the probes).
`bun run --filter '@balaur/ui' test-storybook` → new story file passes.

### Step 2: Probe stories for useFocusTrap

Create `packages/ui/src/hooks/UseFocusTrap.stories.tsx` with a probe that has
an external "open" button (the focus-restore target), a toggleable trapped
`<div ref>` region, and configurable children; stories + plays:

  1. **FocusFirstOnActivate**: activate trap → first button inside has focus
     (`waitFor(() => expect(...).toHaveFocus())`).
  2. **WrapsForward**: with 2 focusables, focus the last, `userEvent.tab()` →
     first has focus.
  3. **WrapsBackward**: focus the first, `userEvent.tab({ shift: true })` →
     last has focus.
  4. **NoFocusablesFallsBackToContainer**: trapped region with only text →
     container itself has focus and `tabindex="-1"` attribute was added.
  5. **RestoresFocusOnDeactivate**: activate (focus moves in), deactivate via
     the external toggle → the toggle button has focus again.

  Keep the trapped region visible (the hook filters `offsetParent !== null`;
  hidden elements don't count as focusables — don't fight that in the probe).

**Verify**: `bun run check` → exit 0.
`bun run --filter '@balaur/ui' test-storybook` → both new files, all plays green.

### Step 3: Run the suite twice

Flake check for the new focus-heavy plays (focus tests are the flakiest kind).

**Verify**: `bun run --filter '@balaur/ui' test-storybook` twice → both exit 0.

## Test plan

The plan IS tests: 9 new play-tested stories across 2 files, cases listed in
Steps 1–2. Structural pattern: `primitives/ScrimOverlay.stories.tsx` (play
with `waitFor` + focus assertions) and any story using `fn()` args. All new
stories also get free SSR smoke coverage via `__ssr__/ssr-stories.test.tsx`.

## Done criteria

- [ ] `bun run check` exits 0 (241+ existing tests, plus new stories SSR-render)
- [ ] `bun run --filter '@balaur/ui' test-storybook` exits 0 twice consecutively, story-file count ≥ 121
- [ ] The 9 stories exist with the exact behaviors listed (grep: `grep -c "export const" packages/ui/src/hooks/UseControllableState.stories.tsx` → 4; same for UseFocusTrap → 5)
- [ ] No modifications to any existing file (`git status` shows only the 2 new files)
- [ ] `plans/README.md` status row updated

## STOP conditions

- A play assertion fails because the HOOK's actual behavior differs from the
  contract described in "Current state" — that is a real bug discovery;
  report it (with the failing story) instead of adjusting the assertion to
  match broken behavior.
- `userEvent.tab()` is unavailable in the installed `storybook/test` API —
  report; do not hand-roll keyboard event dispatching.
- The SSR story test (`bun test ssr-stories`) fails on a probe story —
  the probe accesses DOM during render; fix the probe, and if it still fails
  twice, STOP.

## Maintenance notes

- These stories are characterization tests: if `useControllableState` or
  `useFocusTrap` behavior is deliberately changed later, these plays must be
  updated in the same change — that is the point.
- The probe-story pattern (hooks tested via `OCTANT/Hooks/*` stories) is new
  to this repo; if more hooks need DOM tests (`useDismissable`,
  `useCollapse`), follow it rather than adding a DOM to `bun test`.
- Reviewer: check the Controlled story really asserts the value did NOT
  change — that's the assertion that catches the classic controlled-state
  regression.
