# Plan 017: Release prep — AGPL-3.0 LICENSE, provenance fix, v0.4.0 lockstep bump

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> Touch only in-scope files. On any STOP condition, stop and report.
>
> **Drift check (run first)**: `test -f LICENSE` must FAIL (no license yet),
> and root `package.json` version must be `0.3.0`. Your HEAD must contain
> plans 014/015/016's merged work (check: `test -f packages/ui/src/providers/OctantRoot/OctantRoot.tsx`).
> On mismatch, STOP.

## Status

- **Priority**: P1 (the release caps everything)
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans 014, 015, 016 merged
- **Category**: docs / release
- **Planned at**: post-016 main, 2026-07-08

## Why this matters

The owner has decided: **AGPL-3.0** (matching the `memory` sibling — the only
licensed repo in the balaur family) and a **v0.4.0** release containing the
full audit-fix + feature wave. The README's provenance link is also verifiably
wrong (`balaur-software/harness` — no such current repo) and gets corrected to
the evidence-backed source. This plan makes the tree tag-ready; the advisor
tags after merge (the owner pushes).

## Current state

- No `LICENSE*` file; no `"license"` field in any package.json.
- Canonical AGPL-3.0 text available locally, verbatim, at
  `/home/alex/projects/balaur/memory/LICENSE` (the sibling repo — READ-ONLY;
  verify its first line is `GNU AFFERO GENERAL PUBLIC LICENSE` before copying).
- `README.md:5` — currently links `balaur-software/harness`. Evidence
  gathered by the advisor: the workspace contains repos `design`, `memory`,
  `web` (remotes all `github.com/balaur-software/*`); `web/`'s own README
  titles itself "balaur-life — Bun-workspace monorepo for the Balaur personal
  life OS"; the extraction commit `c02524f` says "extract OCTANT design
  system from balaur-life". Correct link target: `balaur-software/web`.
- `README.md` License section — says "TBD — same license as the host life
  OS, to be ratified in the first non-extraction commit."
- Versions: root `package.json` + `packages/{octant-core,tokens,ui}/package.json`
  all `0.3.0` — `docs/RELEASE.md` requires lockstep bumps.
- Sub-package license mirroring: check
  `grep -n '"license"' /home/alex/projects/balaur/memory/package.json` — if
  memory declares an SPDX id, use the same string; otherwise use
  `"AGPL-3.0-only"`.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Fast gate | `bun run check` | exit 0 |
| Full gate | `bun run check:full` | exit 0 |
| Storybook build (release req) | `bun run build-storybook` | exit 0 |
| VRT (post-016) | `bun run test-vrt` | exit 0 |

## Scope

**In scope**:
- `LICENSE` (create — verbatim copy of the sibling's AGPL-3.0 text)
- `package.json` (root: `license` field + version 0.4.0)
- `packages/octant-core/package.json`, `packages/tokens/package.json`,
  `packages/ui/package.json` (version 0.4.0; add the same `license` field)
- `README.md` (License section body; line-5 provenance link)

**Out of scope**:
- Tagging, committing to main, pushing — the advisor/owner handle git ops.
- `docs/RELEASE.md`, `docs/CONSUMING.md` (already correct).
- Any source file.
- The sibling repos.

## Steps

### Step 1: LICENSE

`cp /home/alex/projects/balaur/memory/LICENSE LICENSE` (after verifying its
header). Do not edit the text.

**Verify**: `head -2 LICENSE` → `GNU AFFERO GENERAL PUBLIC LICENSE` /
`Version 3, 19 November 2007`; `diff LICENSE /home/alex/projects/balaur/memory/LICENSE` → no output.

### Step 2: package.json license fields

Add `"license": "<SPDX>"` (per the Current-state mirroring rule) to all four
package.json files, placed after `"description"`.

**Verify**: `grep -c '"license"' package.json packages/*/package.json` → 1 each.

### Step 3: README

1. Line 5: replace the `balaur-software/harness` link with
   `[\`balaur-software/web\`](https://github.com/balaur-software/web)` and
   adjust the sentence to read naturally (e.g. "Extracted from … (the
   balaur-life personal life OS monorepo) so the design system and the life
   OS can evolve independently.").
2. License section: replace the TBD body with two sentences: licensed
   AGPL-3.0 (same family license as the balaur life OS repos); see `LICENSE`.

**Verify**: `grep -n "harness" README.md` → 0 matches;
`grep -n "TBD" README.md` → 0 matches; `grep -in "AGPL" README.md` → ≥1.

### Step 4: Version bump 0.3.0 → 0.4.0 (lockstep)

All four package.json `"version"` fields → `"0.4.0"`.

**Verify**: `grep -h '"version"' package.json packages/*/package.json | sort -u`
→ exactly one line containing `0.4.0`.

### Step 5: Release gates (per docs/RELEASE.md step 1)

**Verify**: `bun run check:full` → exit 0; `bun run build-storybook` → exit 0;
`bun run test-vrt` → exit 0.

## Done criteria

- [ ] LICENSE identical to the sibling's AGPL-3.0 text
- [ ] 4× `"license"` fields, consistent SPDX string
- [ ] 4× version `0.4.0`
- [ ] README: no "harness", no "TBD", AGPL named
- [ ] `bun run check:full` + `build-storybook` + `test-vrt` all exit 0
- [ ] Only in-scope files changed

## STOP conditions

- The sibling LICENSE's header is not AGPL-3.0 (evidence changed).
- A `LICENSE` file or `license` field already exists (someone else did this).
- Any release gate fails.

## Maintenance notes

- Cutting the actual release after this merges: `git tag v0.4.0` + push main
  + tag per `docs/RELEASE.md` (owner's step; push is permission-gated).
- `web/` should bump its pin to `github:balaur-software/design#v0.4.0` and
  run its own check (workspace rule from CONSUMING.md).
