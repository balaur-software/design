---
name: design-change-and-release
description: Use when changing code in design/ (OCTANT), running or failing `bun run check` there, hitting TS2322/TS2741 or exactOptionalPropertyTypes errors in *.stories.tsx, asking about biome.json rules or lint debt, cutting a release of @balaur/octant, editing web's `github:balaur-software/design#vX.Y.Z` pin, using `file:../design`, tempted to `bun link`, debugging the resolveDispatcher()/dual-React SSR crash, or consulting RELEASE.md, CONSUMING.md, version tags, or the design license.
---

# design-change-and-release — change control and release discipline for OCTANT

The `design/` repo (github.com/balaur-software/design) holds OCTANT, the design
system published as the single package `@balaur/octant` via **git tag pins**
(never npm registry). This skill covers the quality gate, lint policy, story
typing hazards, the release runbook, the consumption contract, and downstream
duties.

**When NOT to use this skill:**

| You want | Use instead |
|---|---|
| Component/token/hook inventory, component conventions, SSR discipline, Storybook usage | `design-octant-reference` |
| Cross-repo architecture, workspace-wide doc-drift ledger, change choreography across repos | `balaur-workspace-map` |
| Running dev servers, ports, systemd, Herdr panes | `balaur-run-and-operate` |
| The web app's side of the dependency (bump runbook internals) | `web-app-reference` |

Hard rule (workspace-wide): **never commit or push unless the owner explicitly
asks.** Fixing things is normal dev work; committing them is not yours to decide.

---

## 1. The gate: `bun run check`

`bun run check` (run from `design/` root) is the universal quality gate. There
is no CI (no `.github/` in the repo) and no git hooks — the gate is only as
real as you running it. Anatomy (from root `package.json` scripts):

```
check = typecheck && lint && test
  typecheck : bun run --filter '*' typecheck     # fans out: tsc --noEmit in each of
              #   packages/octant-core, packages/tokens, packages/ui
  lint      : biome check .                       # format + lint + import-organize, whole repo
  test      : bun test                            # all workspace tests at once
```

**Gate state as of 2026-07-07 (HEAD `74aad33`): GREEN.**
All three typechecks exit 0; biome reports 0 errors / 0 warnings / 1 info (a
deprecation notice about biome.json's `recommended` field — harmless); `bun
test` runs 241 tests across 17 files, 0 fail. The test suite includes
`packages/ui/src/__ssr__/ssr-stories.test.tsx`, which server-renders every
story of all 119 `*.stories.tsx` files under `bun test` — so story files are
load-bearing for the gate, not decoration.

Not part of the gate: `bun run --filter '@balaur/ui' test-storybook`
(`vitest run --project=storybook`) runs the interaction/play-function tests in
a real Chromium via `@storybook/addon-vitest` + playwright. It exists at HEAD
(script in `packages/ui/package.json`) but `bun run check` does not invoke it,
and it needs a browser installed. Treat it as an optional extra gate
(unverified-run in this skill's authoring pass).

**Baseline first, always.** Before you change anything, run `bun run check` on
the untouched tree and record the result. If it is red before you start, the
failures are not yours — see the incident below for exactly this trap. Never
adopt pre-existing failures as your own, and never "fix" them silently inside
an unrelated change.

### Repo position as of 2026-07-07

- HEAD = `74aad33` "feat: Storybook 10 + Storybook Test, SSR gates, and full
  library audit fixes" (2026-07-07 22:44 +0300), **2 commits past tag v0.3.0**.
- `web/` pins `github:balaur-software/design#v0.3.0` (commit `9f26088`) —
  everything after the tag is unreleased; web does not see it until the next
  release.
- Local `main` tracks `origin/main` and showed in-sync at authoring time; run
  `git fetch && git status` to confirm before reasoning about push state.
- Storybook is **v10.4.6** (`@storybook/react-vite` framework) since `74aad33`
  — any doc or memory saying "Storybook 8" is pre-migration.
- `bunfig.toml` pins `linker = "hoisted"`: bun's default isolated linker
  duplicates vitest through circular peer deps and breaks the vitest runner.
  Do not remove it.

---

## 2. The red-gate incident (2026-07-07) — the cautionary tale

For most of 2026-07-07, HEAD was `7073f40` (message: `storybook`) and **`bun
run check` failed there**. That commit landed 27 minutes after the v0.3.0 tag
(tag commit `9f26088` at 15:06, `7073f40` at 15:33), so **the tag web pins was
always clean** — the breakage lived only on unreleased main. The owner ruled it
a known accident to fix forward, and it *was* fixed forward the same evening by
`74aad33`. It stays in this skill because it is the perfect specimen of both
traps this repo sets.

Reproduced from a scratch clone at `7073f40` (exact tsc output):

```
src/organisms/AgentPlan/AgentPlan.stories.tsx(33,11): error TS2322:
  Type '{ status: "done"; detail: undefined; id: string; label: string; }[]'
  is not assignable to type 'PlanStep[]'.
src/organisms/ChatThread/ChatThread.stories.tsx(65,8): error TS2741:
  Property 'messages' is missing in type '{}' but required in type 'ChatThreadProps'.
```

Plus biome at that commit: **12 errors** (format drift and
`assist/source/organizeImports`, all in `*.stories.tsx` files) and **19
warnings** (carried lint debt — `suppressions/unused`, `useOptionalChain`,
`useTemplate`, …).

How each broke, and how `74aad33` fixed it:

1. **`detail: undefined` under `exactOptionalPropertyTypes`** (TS2322).
   `PlanStep.detail` is declared optional (`detail?: string`). With
   `exactOptionalPropertyTypes: true` (on in every tsconfig here), explicitly
   writing `detail: undefined` is NOT the same as omitting the property — it
   fails assignment. The story built args with
   `steps.map((s) => ({ ...s, status: "done" as const, detail: undefined }))`.
   Fix: destructure the property away instead —
   `steps.map(({ detail: _detail, ...s }) => ({ ...s, status: "done" as const }))`.
2. **Untyped `StoryObj` render args** (TS2741). The story declared
   `export const Default: StoryObj = { args: {...}, render: (args) => <ChatThread {...args} /> }`.
   Bare `StoryObj` gives `args` no useful type, so spreading it into a
   component with a required `messages` prop fails. Fix (the pattern now used
   repo-wide): `const meta = { component: ChatThread, ... } satisfies Meta<typeof ChatThread>`
   then `type Story = StoryObj<typeof meta>` — args become typed and checked.
3. **Biome never ran on the new story code.** The repair for that class is
   mechanical: `bunx biome check --write <files>` (or `bun run fmt` for
   format-only), then re-run `bun run check`.

**Lessons, stated as rules:**

- Story files are typechecked, biome-checked, AND SSR-executed by the gate.
  "It's just a story" is never an excuse.
- Typing stories activates `exactOptionalPropertyTypes` on `args`: never write
  `prop: undefined` where the component declares `prop?:` — omit or
  destructure it out.
- Run `bun run check` before considering any commit candidate done. `7073f40`
  is what skipping that looks like.
- Commit messages here follow conventional commits (`feat:`, `fix:`,
  `chore(release):` — see `git log`). The message `storybook` is the
  **counterexample**, not the pattern. Do not imitate it.

---

## 3. Lint policy — what biome.json deliberately turns off

Definitions: **biome** = the formatter+linter (`biome check .`); a
**biome-ignore comment** = a per-line suppression
(`// biome-ignore lint/<group>/<rule>: <reason>`).

Current `biome.json` at HEAD `74aad33` (verify by reading the file — it is
short):

| Rule | State | Why |
|---|---|---|
| `style/noNonNullAssertion` | off | pervasive in animation/canvas code |
| `suspicious/noArrayIndexKey` | off | false positives in story fixtures |
| `correctness/useExhaustiveDependencies` | off | false positives in animation hooks |
| `a11y/useSemanticElements` | off | components are role-annotated divs by design |
| `a11y/useValidAriaRole` | error, `{ ignoreNonDom: true }` | re-enabled with an option, not off |

History you must know so stale docs don't mislead you: before `74aad33`,
**seven** a11y rules were globally off and ~19 lint warnings rode along
without failing the gate. The `74aad33` audit re-enabled six a11y rules
(replacing global off-switches with justified per-site suppressions — 13
`biome-ignore` comments exist in `packages/` at HEAD, each with a reason),
purged the stale suppressions, and drove warnings to zero.

**README.md's "Lint debt" section is STALE as of 2026-07-07**: it still claims
"a11y/* (7 rules)" are demoted and that a handful of warnings remain. Trust
`biome.json` and the live `biome check .` output (0 errors, 0 warnings, 1
info) over that section. The README's larger point still stands as policy:

- The four rules that remain off are **deliberate**, not oversights. Turning
  one back on is its own intentional change (with the fixes it forces), never
  a side effect of unrelated work.
- Do not "clean up" a `biome-ignore` comment you didn't cause; each surviving
  one carries a written justification.

---

## 4. Cutting a release

Canonical doc: `docs/RELEASE.md` (verified accurate at HEAD). The published
unit is the ROOT package `@balaur/octant`; the tag IS the release — no npm, no
build, no dist. Runbook:

1. `main` clean, `bun run check` green (see §1).
2. Bump `"version"` in **FOUR** package.json files, in lockstep:
   root `package.json` (the published version) **and**
   `packages/octant-core/package.json`, `packages/tokens/package.json`,
   `packages/ui/package.json`. Both prior releases did exactly this — commits
   `26b605d` (v0.2.0) and `9f26088` (v0.3.0) each touch precisely those 4
   files, 4 insertions / 4 deletions. Verify:
   `git show 9f26088 --stat`.
3. Commit as `chore(release): vX.Y.Z` — **only on the owner's explicit ask.**
4. Tag the release commit with a **lightweight** tag matching the root
   version, `v`-prefixed (`git tag vX.Y.Z`). All three existing tags are
   lightweight (`git cat-file -t v0.3.0` → `commit`).
5. Push `main` and the tag (`git push origin main && git push origin vX.Y.Z`)
   — again, only on the owner's ask.
6. Do the downstream duty (§6) in `web/`.

**Tags never move.** RELEASE.md: a tag whose root `package.json#version`
doesn't match is fixed "by tagging the matching commit, never by moving the
tag."

### The tag trap: v0.1.0 is not consumable

At tag `v0.1.0` the root package was still named **`balaur-design`** (and
`private: true`) — the `@balaur/octant` rename came later. Pinning
`github:balaur-software/design#v0.1.0` as `@balaur/octant` cannot work.
**Earliest usable tag: `v0.2.0`.** As of 2026-07-07, `docs/CONSUMING.md` still
shows `#v0.1.0` in two example pins (lines 182 and 242) — those examples are
wrong; substitute the current tag (web is on `#v0.3.0`).

### Known unreleased fixes at HEAD (as of 2026-07-07)

`74aad33` also fixed the root `files` packaging list, which previously shipped
zero source in an npm-pack tarball. Git tag pins were unaffected (web on
v0.3.0 passes its check — verified), but do not add an npm-registry publish
path against any tag ≤ v0.3.0.

---

## 5. The consumption contract (canonical)

Sources of truth: `docs/RELEASE.md` + `docs/CONSUMING.md` (both current at
HEAD `74aad33`; CONSUMING.md's tail "Versioning / linking" section was
rewritten in `74aad33` and now agrees — older descriptions of it as stale no
longer apply. Its only remaining defect is the `#v0.1.0` examples, §4).

| Mode | How | Notes |
|---|---|---|
| Committed state (always) | `"@balaur/octant": "github:balaur-software/design#vX.Y.Z"` in the host's package.json | frozen snapshot in bun's cache |
| Active design iteration | `"@balaur/octant": "file:../design"` then re-run `bun install` **in the host after EACH design edit** | `file:` installs a COPY, not a symlink — edits are invisible until the next `bun install` (~fast) |
| `bun link @balaur/octant` | **FORBIDDEN** | see below |

**Why `bun link` is forbidden — the dual-React crash.** Linking makes the
host's `node_modules/@balaur/octant` a symlink into `design/`, so the library's
`import "react"` resolves to *design's* React while the host's
`react-dom/server` uses *its own* React: two physical React instances, two
`ReactSharedInternals`, and every hook call inside the host's renderer throws
`resolveDispatcher() is null` **at runtime**. Typecheck and lint are blind to
it. This is not hypothetical: web lived through it, and commit `b1ee150` in
`web/` ("consume published @balaur/octant + pi-remote-web-ui SSR app",
2026-07-07) is the fix — switching from bun-linked sources to the published
tag pin, whose `react`/`react-dom` **peerDependencies** let bun hoist a single
React into the host graph. `file:../design` preserves that same peer-dep
dedupe; `bun link` does not. Even `bun link react` tricks do not repair it
(documented in CONSUMING.md "Why published, not bun link").

**Never commit a host with the `file:../design` override active.** Switch back
to the `github:...#vX.Y.Z` pin (and `bun install`) before any commit of the
host repo.

Consumer requirements (host tsconfig needs `moduleResolution: "bundler"`,
`allowImportingTsExtensions`, `noEmit`, `jsx: "react-jsx"` — the package ships
raw `.ts` with `.ts`-extension imports) live in CONSUMING.md §"Consumer
TypeScript requirements".

---

## 6. Downstream duty after a release or API change

From the workspace `AGENTS.md` (root of `/home/alex/projects/balaur`, the
dev_env repo — rules verified at lines 64-72):

1. After cutting a release: update `web/package.json` to the new
   `github:balaur-software/design#vX.Y.Z`, run `bun install` in `web/`, then
   `bun run check` in `web/`. The pin bump is a web-repo commit (owner ask
   applies).
2. Any design change should be **verified in Storybook**
   (`bun run storybook` in `design/`, port 6006 — machine-specific port note
   in `balaur-run-and-operate`) **and spot-checked in `web/`**.
3. Any API-surface change in `design/` requires confirming `web` still
   compiles (`bun run check` in `web/`) even before a release exists — use the
   `file:../design` override for that rehearsal, then revert it.

---

## 7. New-component checklist (digest)

Full checklist and conventions belong to `design-octant-reference`. The
change-control essence: a new component ships with its `*.stories.tsx` (the
gate SSR-renders every story), passes `bun run check` including biome with at
most justified per-line suppressions, and follows the
`satisfies Meta<typeof X>` / `StoryObj<typeof meta>` story-typing pattern (§2).

---

## 8. License — OPEN owner decision

README.md ends with "License: TBD — same license as the host life OS, to be
ratified in the first non-extraction commit." No LICENSE file exists in the
repo. As of 2026-07-07 this is **unratified**; it gates any external
promotion or publication of OCTANT. Do not add a license yourself; flag it to
the owner. (Claim discipline for external-facing work: see
`balaur-external-positioning`.)

---

## 9. Doc-drift ledger (design-local, as of 2026-07-07)

The workspace-wide ledger lives in `balaur-workspace-map`; these are the
design-repo entries:

| Doc | Claim | Reality | Trust instead |
|---|---|---|---|
| `README.md` §Lint debt | 7 a11y rules off; ~19 warnings carried | 1 a11y rule off + 1 configured; 0 warnings (since `74aad33`) | `biome.json` + live `biome check .` output |
| `docs/CONSUMING.md` lines 182, 242 | example pin `#v0.1.0` | v0.1.0 root pkg was `balaur-design`, private — not consumable | earliest usable tag v0.2.0; pin the current tag |
| Any pre-2026-07-07-evening notes | "design HEAD is red" / "Storybook 8" | fixed forward + migrated to Storybook 10.4 in `74aad33` | `bun run check` yourself; `git log -1` |
| `packages/ui/scripts/gen-barrel.mjs` | (script exists) | STALE — running it clobbers hand-maintained barrels | never run it; edit barrels by hand (see `design-octant-reference`) |

---

## Related skills

- `design-octant-reference` — component/token/hook inventory, conventions, SSR discipline, Storybook ops.
- `balaur-workspace-map` — three-repo architecture, consumption doctrine in workspace context, full drift ledger.
- `web-app-reference` — web's side of the pin and its dependency-bump runbook.
- `balaur-run-and-operate` — ports (6006 Storybook, 6001 web dev — machine-specific), Herdr panes for long-running servers.
- `balaur-debugging-playbook` — symptom-first triage if you don't yet know the failure is design-side.

---

## Provenance and maintenance

Authored 2026-07-07 against HEAD `74aad33`. Volatile facts and how to re-check
each (run from `/home/alex/projects/balaur/design` — machine-specific path):

| Fact (as of 2026-07-07) | Re-verify with |
|---|---|
| HEAD `74aad33`, 2 commits past v0.3.0 | `git log --oneline -3 && git describe --tags` |
| `bun run check` GREEN (241 tests / 17 files; biome 0 err / 0 warn / 1 info) | `bun run check` |
| Tags: v0.1.0, v0.2.0, v0.3.0 — all lightweight | `git tag -l \| xargs -I{} sh -c 'echo -n "{}: "; git cat-file -t {}'` |
| v0.1.0 root pkg named `balaur-design` (tag trap) | `git show v0.1.0:package.json \| head -4` |
| Release commits bump exactly 4 package.jsons | `git show 9f26088 --stat` |
| biome.json off-rules table (§3) | `cat biome.json` |
| 13 `biome-ignore` comments in packages/ | `grep -rn 'biome-ignore' packages --include='*.ts' --include='*.tsx' \| wc -l` |
| README lint-debt + license sections unchanged/stale | `sed -n '59,79p' README.md` |
| CONSUMING.md still shows `#v0.1.0` examples | `grep -n 'v0.1.0' docs/CONSUMING.md` |
| web pins design `#v0.3.0` and its check passes | `grep octant ../web/package.json && (cd ../web && bun run check)` |
| Storybook 10.4.6, a11y addon registered | `grep -n 'storybook\|a11y' packages/ui/package.json packages/ui/.storybook/main.ts` |
| No LICENSE file / license TBD | `ls LICENSE* 2>/dev/null; tail -4 README.md` |
| No CI, no hooks | `ls -d .github .git/hooks/*.sample 2>/dev/null` |
