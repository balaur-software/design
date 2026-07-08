# Plan 003: Hygiene bundle — RadioGroup tab stop, delete gen-barrel.mjs, token-fallback sweep, BlockRenderer exhaustiveness

> **Executor instructions**: Follow this plan step by step. The four parts are
> independent — verify each before starting the next. Run every verification
> command and confirm the expected result. If anything in the "STOP conditions"
> section occurs, stop and report — do not improvise. When done, update the
> status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 74aad33..HEAD -- packages/ui/src/molecules/RadioGroup packages/ui/scripts packages/ui/src/molecules/BlockRenderer packages/ui/src/organisms/ChatPanel/chat-types.ts`
> On any drift, compare the "Current state" excerpts against live code before
> proceeding; on a mismatch, treat as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M (four small fixes; each S alone)
- **Risk**: LOW
- **Depends on**: none (Part A's new story `play` test only *runs* in a gate once plan 001 lands, but it is valid to add regardless)
- **Category**: bug / tech-debt / tests
- **Planned at**: commit `74aad33`, 2026-07-08

## Why this matters

Four small, verified defects: (A) a controlled `RadioGroup` with no matching
value has **zero keyboard tab stops** — the whole control drops out of the tab
order, violating the WAI-ARIA radio pattern its siblings implement correctly;
(B) `packages/ui/scripts/gen-barrel.mjs` is a committed script that, if run,
**overwrites the public barrel and drops ~115 components** from the package's
API (it predates the atomic-design reorg); (C) 55 inline-style token fallbacks
encode a **different token's hex** than `tokens.css` defines, so the
stylesheet-missing path renders materially wrong colors and greping "what
color is X" gives two answers; (D) `BlockRenderer`'s `default:` branch
silently swallows any newly added `Block` variant — no compile-time
exhaustiveness, no dispatch test.

## Current state

### Part A — RadioGroup

- `packages/ui/src/molecules/RadioGroup/RadioGroup.tsx:48-54`:
  ```ts
  const [selected, setSelected] = useControllableState(
    value,
    defaultValue ?? options[0]?.value ?? "",
    onChange,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndex = options.findIndex((o) => o.value === selected);
  ```
  When `value` is controlled to `""` (or any value not in `options`),
  `activeIndex` is `-1` and no option renders `selected`.
- Each option (`RadioGroup.tsx:130-137`, inside the `RadioOption` child
  component) renders:
  ```tsx
  tabIndex={disabled ? -1 : selected ? 0 : -1}
  ```
  With nothing selected, **every** radio gets `tabIndex=-1`; the
  `role="radiogroup"` container (`:89-94`) has no tabIndex of its own and its
  `onKeyDown` arrow handling becomes unreachable.
- The sibling components already solve this — match them:
  - `packages/ui/src/molecules/SegmentedControl/SegmentedControl.tsx:34`:
    `const active = Math.max(0, options.indexOf(selected));`
  - `packages/ui/src/molecules/ToggleGroup/ToggleGroup.tsx:60-64`:
    ```ts
    // Roving tabindex anchor for single-select mode: the lit item, else the first.
    const activeIndex = Math.max(0, items.findIndex((item) => isOn(item.value)));
    ```
- `RadioOption` currently receives `selected: boolean` and derives tabIndex
  from it; the fix threads a `tabbable: boolean` prop instead (see Step A1).

### Part B — gen-barrel.mjs

- `packages/ui/scripts/gen-barrel.mjs` (git-tracked, 34 lines) scans
  **top-level** `src/` dirs, skips `hooks`/`primitives`, and emits
  `export * from "./<Name>/<Name>.tsx"` for any `src/<Name>/<Name>.tsx`. Since
  the tree moved to `src/{atoms,molecules,organisms,providers}/…`, only
  `src/ComponentCatalog/ComponentCatalog.tsx` matches — running it rewrites
  `src/index.ts` to hooks + primitives + ComponentCatalog and **deletes every
  component export**.
- The real, hand-maintained barrel is `packages/ui/src/index.ts:17-23`
  (category re-exports: `./atoms`, `./molecules`, `./organisms`, `./providers`,
  `./primitives`, `./hooks`, `./ComponentCatalog/ComponentCatalog`).
- No package.json script references gen-barrel
  (`grep -rn "gen-barrel" packages/ui/package.json package.json` → nothing).
  The in-repo skill `.claude/skills/design-octant-reference/SKILL.md` mentions
  it as stale.

### Part C — divergent token fallbacks

Canonical values from `packages/tokens/src/tokens.css`; divergent usages
measured across `packages/ui/src/**/*.tsx` at `74aad33` (counts are
occurrences, components + stories):

| Usage (fix the fallback hex) | Count | Canonical |
|---|---|---|
| `var(--bx-surface-2, #15161e)` | 17 | `#0b0d10` |
| `var(--bx-bg, #0a0b0e)` | 12 | `#08080a` |
| `var(--bx-text-3, #5b616e)` | 7 | `#c8cdd6` |
| `var(--bx-text-2, #9aa0ad)` | 7 | `#dfe3ea` |
| `var(--bx-text-3, #7b8290)` | 4 | `#c8cdd6` |
| `var(--bx-text-dim-2, #3f424d)` | 1 | `#6b7180` |
| `var(--bx-text-4, #5b616e)` | 1 | `#9aa0ad` |
| `var(--bx-text-2, #cfd3db)` | 1 | `#dfe3ea` |
| `var(--bx-surface-3, #08090c)` | 1 | `#0c0d11` |
| `var(--bx-border-mid, #23252e)` | 1 | `#2a2c34` |
| `var(--bx-border-cyan, #2bd9d9)` | 1 | `#1d3540` |
| `var(--bx-border-cyan, #2b6cb0)` | 1 | `#1d3540` |
| `var(--bx-border-magenta, #d94ec6)` | 1 | `#3a2540` |

Why aligning the **fallback** (not the var) is correct: whenever `tokens.css`
is loaded — Storybook, every documented consumer — the `var()` value wins, so
the shipped appearance already uses the canonical color. Changing the fallback
only fixes the stylesheet-missing path and cannot change any real app's look.
(The three `border-cyan`/`border-magenta` rows have *bright* fallbacks that
suggest the author may have wanted a bright border var instead — do NOT act on
that suspicion; align the fallback and flag them in your report, see Step C2.)

Note: spacing inside `var()` in source is `var(--bx-x, #hex)` (space after
comma); the counts above were collected ignoring whitespace.

### Part D — BlockRenderer

- `packages/ui/src/molecules/BlockRenderer/BlockRenderer.tsx:20-67` — a
  `switch (block.type)` over the 6 variants of `Block`
  (`packages/ui/src/organisms/ChatPanel/chat-types.ts:11-33`: `text`,
  `reasoning`, `tool_call`, `code`, `artifact`, `citations`), ending in:
  ```tsx
  default:
    return (
      <div style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 12, ...style }}>
        unknown block: {(block as { type: string }).type}
      </div>
    );
  ```
  The runtime fallback is intentional (docs: "Unknown types render a dim
  placeholder — never throws") but there is no compile-time exhaustiveness
  check, and no test pins each variant to its molecule.
- Test exemplar for bun-test React assertions without a DOM:
  `packages/ui/src/__ssr__/ssr-smoke.test.tsx` uses
  `renderToString` from `react-dom/server` and asserts on the HTML string.
  Naming convention quirk: existing ui tests use kebab-case
  (`text-block.test.ts`) — follow that (`block-renderer.test.tsx`).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Fast gate | `bun run check` | exit 0 |
| Single test file | `bun test block-renderer` | new tests pass |
| Browser suite (if plan 001 landed) | `bun run check:full` | exit 0 |
| Fallback scan | see Step C2 | zero divergent rows |

## Scope

**In scope**:
- `packages/ui/src/molecules/RadioGroup/RadioGroup.tsx`
- `packages/ui/src/molecules/RadioGroup/RadioGroup.stories.tsx` (add one story + play)
- `packages/ui/scripts/gen-barrel.mjs` (delete; delete `packages/ui/scripts/` if then empty)
- The `.tsx` files under `packages/ui/src/` containing the 13 divergent
  fallback pairs listed above (mechanical hex replacement ONLY)
- `packages/ui/src/molecules/BlockRenderer/BlockRenderer.tsx`
- `packages/ui/src/molecules/BlockRenderer/block-renderer.test.tsx` (create)

**Out of scope**:
- `packages/tokens/src/tokens.css` — canonical values do not change.
- Changing any `var(--bx-…)` **token name** in a style (only fallback hexes).
- The two already-documented token-hygiene notes in `docs/CONSUMING.md`
  (they describe `--bx-bg` and `--bx-text-dim`; after Part C the `--bx-bg` note
  becomes stale — flag it in your report for plan 004's docs pass, don't edit).
- `SegmentedControl`, `ToggleGroup` (already correct — reference only).
- Any barrel file (`index.ts`) — Part B deletes the generator, not the barrel.

## Git workflow

Repo rule: **never commit or push unless the owner explicitly asks.** Working
tree changes + report only.

## Steps

### Step A1: Clamp RadioGroup's roving index and thread `tabbable`

In `RadioGroup.tsx`:

1. Change the index derivation (line ~54) to match ToggleGroup, with the same
   style of comment:
   ```ts
   // Roving tabindex anchor: the selected option, else the first (APG radio pattern).
   const activeIndex = Math.max(
     0,
     options.findIndex((o) => o.value === selected),
   );
   ```
2. Where options render (`options.map((opt, i) => <RadioOption … />)`), pass
   `tabbable={i === activeIndex}`.
3. In `RadioOptionProps` add `tabbable: boolean;` and change the option's
   `tabIndex` from `disabled ? -1 : selected ? 0 : -1` to
   `tabIndex={disabled ? -1 : tabbable ? 0 : -1}`.
   Keep `aria-checked={selected}` and everything else as-is.

Note: `nextEnabled(activeIndex, dir)` (line ~56) now starts from `0` instead
of `-1` in the no-selection case; with `dir=+1` the first ArrowDown selects
option index 1. That matches the APG pattern (focus sits on option 0; arrow
moves selection to the next option).

**Verify**: `bun run check` → exit 0.

### Step A2: Pin the regression with a story play test

In `RadioGroup.stories.tsx`, add (adapt imports to match the file's existing
`Meta`/`StoryObj`/`storybook/test` usage — read the file first):

```tsx
/** Controlled with a value matching no option: the group must keep one tab stop. */
export const NoMatchingValue: Story = {
  args: { value: "", onChange: fn() },
  play: async ({ canvas, userEvent, args }) => {
    const radios = canvas.getAllByRole("radio");
    // Exactly one radio is tabbable even though none is selected.
    const tabbable = radios.filter((r) => r.tabIndex === 0);
    await expect(tabbable).toHaveLength(1);
    await expect(radios[0]!.tabIndex).toBe(0);
    // Arrow key from the anchor selects the next enabled option.
    radios[0]!.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(args.onChange).toHaveBeenCalled();
  },
};
```

Use the story file's existing `options` args (or define a 3-option fixture
matching its style). Story docs comment (`/** … */`) is the repo convention.

**Verify**: `bun run check` → exit 0 (the SSR story test renders the new story).
If plan 001 landed: `bun run test-storybook` → the new play passes.

### Step B1: Delete the barrel generator

```bash
git rm packages/ui/scripts/gen-barrel.mjs
```

If `packages/ui/scripts/` is now empty, remove the directory.

**Verify**: `grep -rn "gen-barrel" packages/ --include="*.ts" --include="*.tsx" --include="*.json" --include="*.mjs" | grep -v node_modules` →
matches only (if anything) inside `.claude/skills/` docs text.
`bun run check` → exit 0.

### Step C1: Sweep the divergent fallbacks

For each row of the Part C table, run a repo-wide replace limited to
`packages/ui/src`. Example for the first row (repeat per row, adjusting
token and hexes):

```bash
grep -rl "var(--bx-surface-2, #15161e)" packages/ui/src --include="*.tsx" \
  | xargs sed -i 's/var(--bx-surface-2, #15161e)/var(--bx-surface-2, #0b0d10)/g'
```

Rows 11–13 (`border-cyan` ×2, `border-magenta` ×1): apply the same mechanical
fallback alignment, and note the affected file:line in your final report with
the sentence "fallback was a bright accent hex — owner may have intended a
different var; loaded appearance unchanged either way."

**Verify** (the audit's divergence scanner — must print nothing):

```bash
awk '/--bx-[a-z0-9-]+: #/ {gsub(/[:;]/,""); print $1, $2}' packages/tokens/src/tokens.css > /tmp/canonical.txt
grep -rhoE 'var\(--bx-[a-z0-9-]+, #[0-9a-fA-F]{3,6}\)' packages/ui/src --include="*.tsx" | sort -u | while read usage; do
  tok=$(echo "$usage" | sed -E 's/var\((--bx-[a-z0-9-]+),.*/\1/')
  fb=$(echo "$usage" | sed -E 's/.*(#[0-9a-fA-F]+)\).*/\1/')
  canon=$(grep -m1 "^$tok " /tmp/canonical.txt | awk '{print $2}')
  if [ -n "$canon" ] && [ "$fb" != "$canon" ]; then echo "DIVERGENT: $usage (canonical $canon)"; fi
done
```

Expected: no `DIVERGENT` lines. Then `bun run check` → exit 0.
(Tokens with no hex in tokens.css — e.g. `--bx-text-dim`, aliased via
`var(--bx-text-7)` — produce no canonical entry and are correctly skipped.)

### Step D1: Add compile-time exhaustiveness to BlockRenderer

In `BlockRenderer.tsx`, change the `default:` branch to:

```tsx
default: {
  // Compile-time exhaustiveness: adding a Block variant without a case above
  // fails typecheck here. At runtime, unknown types still fall through to the
  // dim placeholder (consumers may feed newer data than this build knows).
  block satisfies never;
  return (
    <div style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 12, ...style }}>
      unknown block: {(block as { type: string }).type}
    </div>
  );
}
```

If biome objects to the bare `satisfies` expression statement
(`noUnusedExpressions` or similar), use `void (block satisfies never);`
instead. Do not use `// biome-ignore`.

**Verify**: `bun run check` → exit 0. Then prove the guard works: temporarily
add `| { type: "x_probe" }` to the `Block` union in `chat-types.ts`, run
`bun run typecheck` → MUST fail with a `never` error in BlockRenderer.tsx;
revert the probe edit, `bun run typecheck` → exit 0.

### Step D2: Table-driven dispatch test

Create `packages/ui/src/molecules/BlockRenderer/block-renderer.test.tsx`,
modeled on `packages/ui/src/__ssr__/ssr-smoke.test.tsx` (bun test +
`renderToString`):

- One fixture per `Block` variant; render `<BlockRenderer block={fixture} />`
  with `renderToString` and assert a distinguishing marker per branch:
  - `text` → output contains the text
  - `reasoning` → contains the reasoning text (expand-collapsed markup allowed;
    assert on a substring that survives collapse, or pass `defaultCollapsed: false`)
  - `tool_call` → contains the tool `name`
  - `code` → contains the code string
  - `artifact` → contains the artifact `title`
  - `citations` → contains a source's title/text (build a minimal
    `CitationSourceProps` fixture from `atoms/InlineCitation/InlineCitation.tsx`)
- One test for the unknown-type fallback:
  `renderToString(<BlockRenderer block={{ type: "mystery" } as unknown as Block} />)`
  contains `unknown block: mystery`.

**Verify**: `bun test block-renderer` → 7 tests pass. `bun run check` → exit 0.

## Test plan

- New: `block-renderer.test.tsx` (7 cases, listed in D2), pattern:
  `__ssr__/ssr-smoke.test.tsx`.
- New: `RadioGroup.stories.tsx` `NoMatchingValue` story with play (A2) —
  regression test for the zero-tab-stop bug.
- Existing suites must stay green: `bun run check` after every step;
  `bun run check:full` at the end if plan 001 has landed.

## Done criteria

- [ ] `bun run check` exits 0
- [ ] Divergence scanner (Step C1 verify) prints nothing
- [ ] `packages/ui/scripts/gen-barrel.mjs` does not exist
- [ ] `grep -n "satisfies never" packages/ui/src/molecules/BlockRenderer/BlockRenderer.tsx` → 1 match
- [ ] `bun test block-renderer` → 7 passing tests
- [ ] RadioGroup: `grep -n "Math.max" packages/ui/src/molecules/RadioGroup/RadioGroup.tsx` → 1 match; `NoMatchingValue` story exists
- [ ] If plan 001 landed: `bun run check:full` exits 0
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row updated; report includes the 3 flagged border-fallback sites

## STOP conditions

- RadioGroup's structure doesn't match the excerpts (e.g. `RadioOption` no
  longer exists or tabIndex logic moved).
- The Step D1 probe (`x_probe` variant) does NOT fail typecheck — the
  `satisfies never` guard isn't engaging; report instead of shipping a
  guard that doesn't guard.
- The fallback sweep would touch a file outside `packages/ui/src`.
- Any `bun run check` failure you cannot attribute to your own current step
  after one fix attempt.

## Maintenance notes

- Part C is a point-in-time sweep; new divergence can creep back. The durable
  fix (a `bx(token)` helper or a generated token→hex map) was considered and
  deferred — it touches every component file for cosmetic benefit. If
  divergence recurs, revisit; the Step C1 scanner script is the check.
- After Part C, `docs/CONSUMING.md`'s "Known token-hygiene issues" note about
  `--bx-bg`'s `#0a0b0e` fallback is stale — plan 004 owns docs corrections.
- The three bright border fallbacks flagged in the report may indicate the
  var (not the fallback) was mis-chosen; that's an owner design call.
- Reviewer: eyeball a couple of swept files to confirm only fallback hexes
  changed (the `git diff` should be pure `#hex` → `#hex` inside `var()`).
