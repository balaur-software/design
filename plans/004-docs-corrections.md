# Plan 004: Correct the actively-wrong docs — README lint section, CONSUMING pins, license decision

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 74aad33..HEAD -- README.md docs/CONSUMING.md biome.json`
> On drift, compare the excerpts below against live files; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (Step 4 has a soft interaction with plan 003 — see below)
- **Category**: docs
- **Planned at**: commit `74aad33`, 2026-07-08

## Why this matters

Three living docs make claims that are verifiably false today, and stale docs
are worse than missing ones: the README describes lint debt that stopped
existing at commit `74aad33` (it tells readers 7 a11y rules are off and
warnings remain; reality: 1 a11y rule off, 0 warnings); `docs/CONSUMING.md`
twice tells consumers to pin `#v0.1.0` — a tag at which the package was named
`balaur-design` and marked `private: true`, so the documented install cannot
resolve; and the README's license line ("TBD — to be ratified in the first
non-extraction commit") has been overtaken by 8+ commits while the package is
consumed cross-repo with no license at all, i.e. legally all-rights-reserved.

## Current state

- `README.md:59-74` — the "Lint debt" section claims:
  - "`a11y/*` (7 rules)" are demoted. Reality (`biome.json:10-13`): exactly one
    a11y rule is off (`useSemanticElements`) and one is configured
    (`useValidAriaRole` with `ignoreNonDom`).
  - "A handful of `complexity/useOptionalChain`, `style/useTemplate`,
    `performance/noAccumulatingSpread`, and `suppressions/unused` warnings
    remain in `packages/ui/`". Reality: `bun run lint` reports **0 errors,
    0 warnings** (one `info` about the deprecated `recommended` config field,
    which plan 005 removes).
  - Rules genuinely off in `biome.json`: `style/noNonNullAssertion`,
    `suspicious/noArrayIndexKey`, `correctness/useExhaustiveDependencies`,
    `a11y/useSemanticElements`.
- `docs/CONSUMING.md:182` and `docs/CONSUMING.md:242` — both read
  `"@balaur/octant": "github:balaur-software/design#v0.1.0"`. Verified:
  `git show v0.1.0:package.json` has `"name": "balaur-design"` and
  `"private": true`; the earliest tag with the `@balaur/octant` name is
  `v0.2.0`; the current release is `v0.3.0`.
- `README.md:76-79` — License section: "TBD — same license as the host life
  OS, to be ratified in the first non-extraction commit." No `LICENSE*` file
  exists in the repo.
- `README.md:5` — says the system was "Extracted from
  [`balaur-software/harness`](https://github.com/balaur-software/harness)",
  while the extraction commit message (`git log --oneline | tail -1` →
  `c02524f feat: extract OCTANT design system from balaur-life`) says
  `balaur-life`. Which repo name/URL is real cannot be verified from inside
  this clone.
- Doc style: terse imperative Markdown, tables where enumerable (see the rest
  of README.md). Match it.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Fast gate | `bun run check` | exit 0 |
| Lint reality check | `bun run lint` | exit 0; 0 errors/warnings |
| Pin check | `grep -n "v0.1.0" docs/CONSUMING.md` | no matches after Step 2 |

## Scope

**In scope**:
- `README.md` (Lint debt section; License section; optionally line 5 — Step 4)
- `docs/CONSUMING.md` (the two version pins; the `--bx-bg` token-hygiene note
  ONLY IF plan 003 already landed — check `plans/README.md`)
- `LICENSE` (create ONLY if the owner has answered — Step 3)

**Out of scope**:
- `biome.json` (plan 005 owns the config migration).
- `docs/RELEASE.md` (its `#v0.1.1` examples are placeholders in a runbook
  context and read correctly).
- `docs/superpowers/**` — historical intent records; drift there is expected
  and not corrected.
- Picking a license yourself. Never.

## Git workflow

Repo rule: **never commit or push unless the owner explicitly asks.** Working
tree changes + report only.

## Steps

### Step 1: Rewrite the README "Lint debt" section

Replace the entire section body (`README.md:59-74`, heading stays) with
content equivalent to:

```markdown
## Lint policy (deliberate demotions)

`bun run check` currently passes with zero lint errors and zero warnings.
Four rules are deliberately disabled in `biome.json` rather than enforced:

- `style/noNonNullAssertion` — `!` is used judiciously under
  `noUncheckedIndexedAccess`, where the compiler already forces index checks.
- `suspicious/noArrayIndexKey`, `correctness/useExhaustiveDependencies` —
  common false positives in Storybook stories and animation hooks.
- `a11y/useSemanticElements` — OCTANT's terminal aesthetic renders
  role-annotated `div`/`pre` structures by design; `a11y/useValidAriaRole`
  stays on (configured with `ignoreNonDom`).

Re-enabling any of these is a separate, intentional change, not a side effect
of other work.
```

**Verify**: `grep -n "7 rules" README.md` → no matches;
`grep -n "warnings remain" README.md` → no matches; `bun run check` → exit 0.

### Step 2: Fix the CONSUMING.md pins

At `docs/CONSUMING.md:182` (the "committed state" example) and `:242` (the
"Versioning / linking" example), replace `#v0.1.0` with `#v0.3.0`. If the
repo's current release tag is newer than v0.3.0 by the time you execute
(check: `git tag --sort=-v:refname | head -1`), use that tag instead —
the example must name a tag that actually resolves as `@balaur/octant`.

**Verify**: `grep -n "v0.1.0" docs/CONSUMING.md` → no matches.

### Step 3: Surface the license decision (owner input required)

This is an owner decision the plan can only surface, not make:

1. Check whether the owner has already recorded a license choice anywhere new
   (`ls LICENSE* 2>/dev/null`; `grep -in "license" package.json`).
2. If a decision exists: add the matching `LICENSE` file at repo root, set
   `"license": "<SPDX id>"` in the root `package.json`, and replace the README
   License section body with the license name.
3. If no decision exists: leave README and package.json untouched, and record
   in your final report + `plans/README.md` status: `BLOCKED (license: owner
   decision needed — repo is currently all-rights-reserved while consumed
   cross-repo)`. Do NOT invent a license.

**Verify** (case 2 only): `test -f LICENSE` and
`grep -n '"license"' package.json` → 1 match. (Case 3: no file changes.)

### Step 4: Provenance line — flag, don't guess

Do not change `README.md:5` yourself (the true source-repo URL is not
verifiable from this clone). Add to your final report: "README.md:5 links
`balaur-software/harness` as the extraction source; the extraction commit
`c02524f` says `balaur-life`. Owner: confirm which is correct and fix the
link." If — and only if — plan 003 has landed (check its row in
`plans/README.md`), also update `docs/CONSUMING.md`'s "Known token-hygiene
issues" bullet about `--bx-bg`'s `#0a0b0e` fallback: that divergence was fixed
by the sweep, so delete that bullet (keep the `--bx-text-dim` alias bullet —
still true).

**Verify**: if the bullet was removed: `grep -n "0a0b0e" docs/CONSUMING.md` →
no matches. `bun run check` → exit 0.

## Test plan

Docs-only; no tests. The gate run confirms no accidental source damage.
Every grep in the steps is the regression check for the specific staleness.

## Done criteria

- [ ] `bun run check` exits 0
- [ ] `grep -n "7 rules\|warnings remain" README.md` → no matches
- [ ] `grep -n "v0.1.0" docs/CONSUMING.md` → no matches
- [ ] License: either `LICENSE` exists + `package.json` has a `license` field, or the plan row says BLOCKED with the owner question
- [ ] Report lists the README:5 provenance question
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `biome.json` no longer matches the rule list quoted above (the Lint policy
  rewrite would then document the wrong rules — re-derive from the live file
  or stop).
- `bun run lint` is NOT clean at start (the "zero warnings" claim would be
  false the moment you write it).
- Any instruction here would require modifying `docs/RELEASE.md` or
  `biome.json`.

## Maintenance notes

- The README lint section will drift again the next time `biome.json` changes;
  whoever edits `biome.json` should touch this section in the same change
  (worth a line in AGENTS.md — plan 002's file — if both plans land).
- The CONSUMING.md pin examples hardcode a tag; each release bump makes them
  one release stale (cosmetically). Consider `#vX.Y.Z` placeholders if that
  bothers the owner — deliberate choice here was a real, working tag.
