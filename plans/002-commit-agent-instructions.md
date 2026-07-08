# Plan 002: Commit the agent instructions — track `.claude/skills/` and add a root AGENTS.md

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 74aad33..HEAD -- .claude AGENTS.md CLAUDE.md`
> Also run `git ls-files .claude | wc -l` — this plan assumes it returns `0`
> (the skills are untracked). If they are already tracked, or AGENTS.md/CLAUDE.md
> already exist, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (adds tracked files; nothing executes them)
- **Depends on**: none (but if plan 001 has landed, reflect `check:full` in the AGENTS.md gate description — see Step 3)
- **Category**: dx
- **Planned at**: commit `74aad33`, 2026-07-08

## Why this matters

This repo is heavily developed by AI agents, and its only agent-onboarding
material is invisible to them: `.claude/skills/design-change-and-release/SKILL.md`
(341 lines: the `bun run check` gate anatomy, lint policy, story-typing
hazards, the release runbook, the `bun link` ban, the never-commit rule) and
`.claude/skills/design-octant-reference/SKILL.md` (415 lines + a 198-line
component inventory in `references/components.md`) exist **only in this
working tree — `git ls-files .claude` returns nothing**. A fresh clone, CI,
another machine, or any agent session started from `origin/main` gets zero
in-repo guidance. Additionally, `docs/CONSUMING.md` (last line) references a
"workspace `AGENTS.md`" that lives in the parent directory, outside this
repo's clone boundary. This plan tracks the skills and adds a small root
`AGENTS.md` as the tool-agnostic entry point.

## Current state

- `git ls-files .claude` → empty. `git status` shows `.claude/` as untracked.
- Files that exist untracked in the working tree:
  - `.claude/skills/design-change-and-release/SKILL.md` (341 lines)
  - `.claude/skills/design-octant-reference/SKILL.md` (415 lines)
  - `.claude/skills/design-octant-reference/references/components.md` (198 lines)
- No `AGENTS.md` or `CLAUDE.md` anywhere in the repo (`find . -name AGENTS.md -not -path "./node_modules/*"` → nothing).
- `.gitignore` does NOT ignore `.claude/` (verify: `git check-ignore .claude/skills/design-change-and-release/SKILL.md` → exit 1, no output).
- Key facts the AGENTS.md must state (sourced from the skills and verified
  against the repo at `74aad33`):
  - Toolchain is **Bun only** — always `bun`/`bunx`, never `npm`/`npx`.
  - The gate: `bun run check` = per-package `tsc --noEmit` + `biome check .` +
    `bun test`. Story files are load-bearing: `packages/ui/src/__ssr__/ssr-stories.test.tsx`
    server-renders every story under `bun test`.
  - Run the gate on the untouched tree first; never adopt pre-existing failures.
  - Never `bun link` this package (dual-React `resolveDispatcher` crash) —
    `file:../design` is the dev override; see `docs/CONSUMING.md`.
  - Releases are git tags (`docs/RELEASE.md`); the published unit is the root
    package `@balaur/octant`.
  - **Never commit or push unless the owner explicitly asks.**
  - Deeper references: the two skills under `.claude/skills/`, plus
    `docs/CONSUMING.md` and `docs/RELEASE.md`.
- Repo doc style: Markdown with tables, terse imperative prose (see README.md).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Fast gate | `bun run check` | exit 0 |
| Track check | `git ls-files .claude \| wc -l` | ≥ 3 after Step 1 |
| Ignore check | `git check-ignore .claude/skills/design-change-and-release/SKILL.md` | exit 1 (not ignored) |

## Scope

**In scope**:
- `git add .claude/skills/` (staging untracked files — this is not a commit)
- `AGENTS.md` (create, repo root)
- `CLAUDE.md` (create, repo root — one-line pointer)

**Out of scope** (do NOT touch):
- The **content** of the two SKILL.md files — track them byte-for-byte as they
  are. They contain a few claims that will go stale (e.g. a gate-state
  snapshot dated 2026-07-07); editing them is the owner's job, not this plan's.
- `.claude/` subdirectories other than `skills/` (if a `.claude/settings.json`
  or similar exists, leave it untracked).
- `docs/CONSUMING.md` — its "workspace AGENTS.md" reference becomes harmless
  once an in-repo AGENTS.md exists; rewording it is plan 004's territory (docs
  corrections) if at all.

## Git workflow

Repo rule: **never commit or push unless the owner explicitly asks.** `git add`
(staging) is required by this plan so the files stop being invisible to
`git status` readers and are ready for the owner's commit — but do not run
`git commit`. Report when staged.

## Steps

### Step 1: Stage the skills directory

```bash
git add .claude/skills/
```

**Verify**: `git ls-files --cached .claude | sort` → exactly these three paths
(plus any other files that genuinely live under `.claude/skills/`):

```
.claude/skills/design-change-and-release/SKILL.md
.claude/skills/design-octant-reference/SKILL.md
.claude/skills/design-octant-reference/references/components.md
```

### Step 2: Create `AGENTS.md` at the repo root

Create `AGENTS.md` with the content below (adjust nothing else; the executor
may fix obvious typos only):

```markdown
# AGENTS.md — working in balaur-design (OCTANT)

Instructions for AI agents and new contributors. Deeper references live in
`.claude/skills/` (Claude Code loads them automatically; other tools: read them
as plain Markdown).

## Toolchain

- **Bun only.** Always `bun` / `bunx`; never `npm` / `npx` / `yarn`. Requires Bun ≥ 1.2.
- No build step: the package ships raw TypeScript. There is no `dist/`.

## The gate

- `bun run check` — fast gate (~5s): per-package `tsc --noEmit`, `biome check .`, `bun test`.
- Story files are **load-bearing**: `packages/ui/src/__ssr__/ssr-stories.test.tsx`
  server-renders every `*.stories.tsx` under `bun test`. A broken story is a red gate.
- Run the gate on the untouched tree **before** you change anything. If it is
  already red, the failures are not yours — report them, don't adopt or mask them.

## Hard rules

- **Never commit or push unless the owner explicitly asks.** Fixing is normal
  work; committing is the owner's call.
- **Never `bun link` this package** into a host — it creates two React instances
  and crashes hooks (`resolveDispatcher() is null`). Use `file:../design` for
  dev iteration. Details: `docs/CONSUMING.md`.
- Releases are git tags of the root package `@balaur/octant`; runbook:
  `docs/RELEASE.md`.

## Where things are

| Topic | Source |
|---|---|
| Change control, gate anatomy, lint policy, release discipline | `.claude/skills/design-change-and-release/SKILL.md` |
| Component/token/hook inventory, conventions, SSR discipline | `.claude/skills/design-octant-reference/SKILL.md` |
| Consumption contract (tokens.css, providers, SSR, theming) | `docs/CONSUMING.md` |
| Release runbook | `docs/RELEASE.md` |
| Improvement plans (advisor-generated) | `plans/README.md` |
```

If plan 001 has already landed (check: `grep -c "check:full" package.json`
returns ≥1), add one line to "The gate" section:
`- \`bun run check:full\` — fast gate + Storybook interaction tests in headless Chromium (needs \`bunx playwright install chromium\` once).`

**Verify**: `test -f AGENTS.md && head -1 AGENTS.md` → `# AGENTS.md — working in balaur-design (OCTANT)`

### Step 3: Create `CLAUDE.md` as a pointer

Create `CLAUDE.md` at the repo root containing exactly:

```markdown
See @AGENTS.md for repo instructions.
```

(Claude Code expands `@AGENTS.md` as an import; other readers see a pointer.)

**Verify**: `cat CLAUDE.md` → the single line above.

### Step 4: Stage the new files and confirm the gate

```bash
git add AGENTS.md CLAUDE.md
bun run check
```

**Verify**: `bun run check` → exit 0. `git status --short` → only `A ` (added)
entries for the five files, no modifications elsewhere.

## Test plan

No tests — documentation/tracking only. The gate run in Step 4 confirms
nothing else was disturbed.

## Done criteria

- [ ] `git ls-files --cached .claude | wc -l` ≥ 3
- [ ] `AGENTS.md` exists with the gate, Bun-only, never-commit, and no-bun-link rules
- [ ] `CLAUDE.md` exists and points at AGENTS.md
- [ ] `bun run check` exits 0
- [ ] Nothing outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `git ls-files .claude` is non-empty at start (someone already tracked them —
  reconcile instead of blindly adding).
- An `AGENTS.md` or `CLAUDE.md` already exists.
- `.claude/skills/` contains files with secrets or personal data (scan before
  staging: `grep -riE "api[_-]?key|token|password" .claude/skills/` should
  return only innocuous matches like design-token vocabulary; anything that
  looks like a credential is a STOP).
- `git check-ignore` reports `.claude` as ignored (would mean `.gitignore`
  drifted from the state this plan was written against).

## Maintenance notes

- The two SKILL.md files contain point-in-time claims (a "gate state as of
  2026-07-07" snapshot; a note that `test-storybook` is "optional…
  unverified"). Once tracked, they will drift like any doc — the owner should
  treat `.claude/skills/` as living docs and update them alongside behavior
  changes (especially after plan 001 lands).
- The skills reference workspace-level skills that are NOT in this repo
  (`balaur-workspace-map`, `web-app-reference`, `balaur-run-and-operate`,
  `memory-domain-reference`). That is expected — they live in the parent
  workspace. AGENTS.md deliberately lists only in-repo sources.
- Reviewer should scrutinize: that no unintended files under `.claude/` got
  staged (e.g. local settings), and that AGENTS.md claims match the repo (gate
  commands, file paths).
