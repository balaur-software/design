# Plan 001: Wire the Storybook interaction suite into a runnable verification gate

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 74aad33..HEAD -- package.json packages/ui/package.json packages/ui/vitest.config.ts README.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (browser tests are slower and flakier than `bun test`; the fix includes a timeout bump for exactly that reason)
- **Depends on**: none
- **Category**: tests / dx
- **Planned at**: commit `74aad33`, 2026-07-08

## Why this matters

98 of the 119 `*.stories.tsx` files in `packages/ui` carry real `play`
interaction tests (focus traps, keyboard navigation, dismissal, controlled
state — e.g. `packages/ui/src/primitives/ScrimOverlay.stories.tsx:95-110`).
They run in a real headless Chromium via `@storybook/addon-vitest` + vitest
browser mode. **No command anyone runs invokes them**: the root gate
`bun run check` is `typecheck && lint && bun test`, and `bun test` only picks
up the 17 `*.test.ts(x)` files. The suite is already rotting from disuse: when
run cold during the audit it failed 3 story files on 15-second timeouts
(`NodeTypeTag > Row`, `Select > Default`, one more); run warm it passes
119 files / 464 tests in ~72s. This plan makes the suite green, stable, and
reachable through one documented command, so every later test-focused plan
(006, 007, 011) has a gate to land into.

## Current state

- `package.json` (repo root) — scripts:
  ```json
  "test": "bun test",
  "typecheck": "bun run --filter '*' typecheck",
  "lint": "biome check .",
  "check": "bun run typecheck && bun run lint && bun test",
  "storybook": "bun run --filter '@balaur/ui' storybook",
  "build-storybook": "bun run --filter '@balaur/ui' build-storybook"
  ```
  There is no root script that reaches `test-storybook`.
- `packages/ui/package.json:17` — `"test-storybook": "vitest run --project=storybook"`.
- `packages/ui/vitest.config.ts` — a single `projects` entry named `storybook`
  using `storybookTest({ configDir: … })` and
  `browser: { enabled: true, headless: true, provider: playwright({}), instances: [{ browser: "chromium" }] }`.
  There is **no `testTimeout`** configured anywhere, so vitest's 15s default
  applies — the observed flake mode (`Test timed out in 15000ms`).
- `README.md` "Scripts" section (lines ~48-57) documents `bun install`,
  `bun run storybook`, `bun test`, `bun run check` — nothing about the
  interaction suite or the Playwright browser prerequisite.
- Empirical baseline (measured 2026-07-08 on this machine, browsers already
  installed): cold run 114s with 3 timeout failures; two subsequent runs 72s,
  119/119 files pass, 464/464 tests pass.
- Repo conventions: Bun only (never npm/npx). The repo rule from
  `docs/CONSUMING.md` and the in-repo skill: **never commit or push unless the
  owner explicitly asks**.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `bun install` (repo root) | exit 0 |
| Browser install (once) | `bunx playwright install chromium` | exit 0 (fast no-op if present) |
| Fast gate | `bun run check` | exit 0; 241+ tests pass |
| Browser suite | `bun run --filter '@balaur/ui' test-storybook` | exit 0; `Test Files 119 passed` |
| Lint | `bun run lint` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `package.json` (root — scripts only)
- `packages/ui/vitest.config.ts`
- `README.md` (Scripts section only)
- `docs/RELEASE.md` (one addition to the release checklist)

**Out of scope** (do NOT touch, even though they look related):
- Any `*.stories.tsx` file — if a story fails deterministically, that is a STOP
  condition, not something to fix here.
- `.storybook/preview.tsx` — the `a11y: { test: "todo" }` setting stays as-is
  (flipping it is separate, deliberately-deferred work).
- `bunfig.toml`, `biome.json`.
- Do not fold the browser suite into `check` itself — `check` stays the fast
  (~5s) gate; the browser suite gets its own aggregate command.

## Git workflow

Repo rule (documented in `docs/CONSUMING.md` and the workspace skill): **never
commit or push unless the owner explicitly asks.** Make the changes in the
working tree, verify, and report. Do not create branches, commits, or PRs.

## Steps

### Step 1: Raise the browser-test timeout to absorb cold-start flake

In `packages/ui/vitest.config.ts`, inside the storybook project's `test`
object (the one that currently has `name: "storybook"` and the `browser`
block), add a `testTimeout`:

```ts
test: {
  name: "storybook",
  testTimeout: 30_000,
  browser: { /* … unchanged … */ },
},
```

**Verify**: `bun run --filter '@balaur/ui' test-storybook` → exit 0,
`Test Files  119 passed (119)`.

### Step 2: Run the suite a second time to confirm stability

Run the exact same command again (this catches order-dependence and residual
flake, not just cold-start).

**Verify**: `bun run --filter '@balaur/ui' test-storybook` → exit 0 again,
`464 passed`.

### Step 3: Add root aggregate scripts

In the root `package.json` scripts, add (keep existing scripts unchanged):

```json
"test-storybook": "bun run --filter '@balaur/ui' test-storybook",
"check:full": "bun run check && bun run test-storybook"
```

**Verify**: `bun run check:full` → exit 0; output ends with the vitest summary
`Test Files  119 passed (119)`.

### Step 4: Document the gate and its prerequisite

In `README.md`'s "Scripts" section, add two lines to the script list:

```bash
bun run check        # fast gate: typecheck + lint + bun test (~5s)
bun run check:full   # fast gate + Storybook interaction tests in headless Chromium
```

and immediately after the code block, one sentence: the browser suite requires
a Playwright Chromium (`bunx playwright install chromium`, one-time) and takes
1–2 minutes.

In `docs/RELEASE.md`, step 1 of "Cutting a release" currently says to make
sure `bun run check` passes; extend that step to require `bun run check:full`
and (still in step 1) a successful `bun run build-storybook` — the Storybook
production build is otherwise never exercised.

**Verify**: `grep -n "check:full" README.md docs/RELEASE.md` → at least one
match in each file.

### Step 5: Confirm build-storybook still works (release-gate claim must be true)

Run `bun run build-storybook` once.

**Verify**: exit 0; `packages/ui/storybook-static/index.html` exists. (The
output directory is gitignored — do not add it to git.)

## Test plan

No new test files — this plan makes 464 existing-but-dead tests count. The
verification IS the test plan: two consecutive green `test-storybook` runs
plus a green `check:full`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run check` exits 0 (unchanged behavior)
- [ ] `bun run check:full` exits 0 with `Test Files  119 passed`
- [ ] `bun run --filter '@balaur/ui' test-storybook` run twice in a row: both exit 0
- [ ] `grep -n "testTimeout" packages/ui/vitest.config.ts` → 1 match
- [ ] `grep -n "check:full" package.json README.md docs/RELEASE.md` → ≥1 match each
- [ ] `git status` shows changes only in the four in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any story fails **deterministically** (same story fails in both Step 1 and
  Step 2 runs). Report the story id and the failure output — fixing story
  logic is out of scope here.
- `bunx playwright install chromium` fails or the environment has no usable
  browser sandbox.
- The suite exceeds ~5 minutes per run on this machine even warm — the
  `check:full` aggregate needs a different shape (report instead of shipping a
  gate nobody will run).
- `bun run build-storybook` fails.

## Maintenance notes

- Plans 006, 007, and 011 add tests that run inside this gate; they depend on
  this plan.
- If a CI pipeline is ever added, `check:full` is the job to run (plus
  `bunx playwright install chromium` in setup). The 30s `testTimeout` was
  chosen from observed cold-start behavior; CI machines may need it or more.
- The in-repo skill `.claude/skills/design-change-and-release/SKILL.md`
  describes `test-storybook` as "an optional extra gate (unverified-run)" —
  after this plan lands that description is stale; plan 002 owns the
  agent-instruction surface and its follow-ups.
