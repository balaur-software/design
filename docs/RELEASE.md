# RELEASE.md — publishing `@balaur/octant`

The OCTANT design system is published as a **single package**, `@balaur/octant`,
via **Git tag-pinned GitHub dependencies** — not to the npm registry. One repo,
one package, one tag per release.

The repo is a Bun workspace internally (`packages/{ui,octant-core,tokens}` — for
Storybook, per-package `typecheck`, and tests), but the **published unit is the
root package** `@balaur/octant`. Its `exports` map points at the three
sub-packages' `src/index.ts` entry points:

| Subpath | Resolves to |
|---|---|
| `@balaur/octant` | `packages/ui/src/index.ts` (all React components/hooks/primitives/providers) |
| `@balaur/octant/core` | `packages/octant-core/src/index.ts` (pure encoder) |
| `@balaur/octant/tokens` | `packages/tokens/src/index.ts` (typed tokens) |
| `@balaur/octant/tokens/tokens.css` | `packages/tokens/src/tokens.css` (CSS custom properties + `@font-face`) |
| `@balaur/octant/tokens/fonts/*` | `packages/tokens/fonts/*` (self-hosted DepartureMono) |

`react` / `react-dom` are `peerDependencies`. Intra-repo cross-package imports
inside `@balaur/ui` use **relative paths** (not `@balaur/tokens` etc.), so the
single package is self-contained — no `workspace:*` leaks into the host's
install graph.

## Cutting a release

1. **Make sure `main` is clean and `bun run check:full` passes, and that
   `bun run build-storybook` succeeds.**
   ```bash
   bun run check:full       # typecheck + biome + tests + Storybook interaction suite
   bun run build-storybook  # confirms the Storybook production build still works
   ```
2. **Bump `version` in the root `package.json`** (this is the published version).
   Keep `packages/*/package.json` versions in lockstep for internal consistency.
3. **Commit.** Conventional-commits style:
   ```bash
   git commit -am "chore(release): v0.1.1"
   ```
4. **Tag the commit** with the version, prefixed `v`:
   ```bash
   git tag v0.1.1
   git push origin main
   git push origin v0.1.1
   ```
5. **Verify** the host consumes the tag cleanly (see below).

The tag is the release. There is no separate publish step, no registry login,
no `dist`. A tag whose root `package.json#version` doesn't match is a bug — fix
it by tagging the matching commit, never by moving the tag.

## Consuming from a host

`web/` (and any Bun-native host) pins the tag directly:

```jsonc
{
  "dependencies": {
    "@balaur/octant": "github:balaur-software/design#v0.1.1"
  }
}
```

```bash
bun install
```

Because `react` is a peer dep, Bun hoists a single `react` into the host's
`node_modules` and `@balaur/octant`'s `import "react"` resolves to that one
copy. One instance, hooks work. This is why consumption is via a published dep
and **not** `bun link` (see [CONSUMING.md](CONSUMING.md#cross-repo-consumption)
for the dual-React failure mode that `bun link` causes).

Verify end-to-end by rendering a component server-side — see the `/octant` route
in `web/` ([apps/web/src/octant/OctantDemo.tsx](../../web/apps/web/src/octant/OctantDemo.tsx)).

## Dev iteration against a local checkout

During active design work, point the host at the local design directory instead
of the tag so you can re-install after each edit without cutting a release:

```jsonc
// host package.json — dev only, do not commit
"@balaur/octant": "file:../design"
```

```bash
# after editing something in design/:
cd web && bun install     # recopies @balaur/octant into the host graph
```

`file:../design` installs a **copy** (not a symlink), so edits do not appear
until `bun install` re-runs — but it preserves the single-React peer-dep
dedupe. Switch back to the `github:...#vX` pin before committing.

Do **not** substitute `bun link @balaur/octant` for dev iteration — it
reintroduces the dual-React hook crash.

## Cross-package dependencies inside this repo

`@balaur/ui` references `@balaur/octant-core` and `@balaur/tokens` via
**relative paths** (`…/octant-core/src/index.ts`, `…/tokens/src/index.ts`), not
package names. This is what lets the root package be self-contained when
published. The sub-packages still declare `name` in their own `package.json`
for per-package tooling (typecheck, storybook), and `@balaur/ui` keeps
`workspace:*` dev deps on them so storybook's `@balaur/tokens/tokens.css`
import resolves inside the workspace — but those workspace refs are never
visible to a host because the host consumes the root `@balaur/octant`, not the
sub-packages.
