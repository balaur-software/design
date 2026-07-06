# RELEASE.md — publishing `balaur-design`

The OCTANT design system is published as **Git tag-pinned GitHub
dependencies**, not to the npm registry. The repo is a Bun-workspace
monorepo with three packages (`@balaur/octant-core`, `@balaur/tokens`,
`@balaur/ui`); each release tags the whole repo at a shared version.

> **Multi-package caveat.** Bun's `github:user/repo#tag` spec installs
> the package named in the repo's *root* `package.json` — which here is
> `balaur-design` (private, not publishable). To consume the individual
> subpackages from a fresh checkout, the supported path today is
> `bun link` against a local clone (see below). A future release may
> add a single meta-package `@balaur/design` that re-exports the three
> subpackages, so hosts can pin via one `github:balaur-software/design#vX`
> line. Until then, `bun link` is the canonical consumption path.

## Cutting a release

1. **Make sure `main` is clean and `bun run check` passes.**
   ```bash
   bun run check   # typecheck + biome + tests, all workspaces
   ```
2. **Bump `version` in every package's `package.json`** in lockstep —
   `packages/{octant-core,tokens,ui}/package.json` and the root
   `package.json`. The shared version is the contract; a release where
   the three packages disagree is a bug.
3. **Commit.** Conventional-commits style:
   ```bash
   git commit -am "chore(release): v0.1.1"
   ```
4. **Tag the commit** with the shared version, prefixed `v`:
   ```bash
   git tag v0.1.1
   git push origin main
   git push origin v0.1.1
   ```
5. **Verify** from a clean clone:
   ```bash
   git clone https://github.com/balaur-software/design.git
   cd design && bun install && bun run check
   ```

The tag is the release. There is no separate publish step, no registry
login, no `dist`. A tag that doesn't match the `package.json#version`
across all three packages is a bug — fix it by tagging the matching
commit, never by moving the tag.

## Linking for parallel dev (the canonical consumption path)

When developing `balaur-design` and a host (e.g. `balaur-life`) at the
same time, link each package so edits land instantly without re-pinning
the tag:

```bash
# in balaur-design/, one shot per package:
cd packages/octant-core && bun link && cd ../..
cd packages/tokens && bun link && cd ../..
cd packages/ui && bun link && cd ../..

# in the host (e.g. balaur-life/):
bun link @balaur/octant-core
bun link @balaur/tokens
bun link @balaur/ui
```

The host's `package.json` should declare each package via `link:<name>`
so `bun install` resolves them through the global link registry:

```json
{
  "dependencies": {
    "@balaur/octant-core": "link:@balaur/octant-core",
    "@balaur/tokens": "link:@balaur/tokens",
    "@balaur/ui": "link:@balaur/ui"
  }
}
```

### Fresh checkout recovery

`link:` specs only resolve if the global link registry has the packages
(they're a local dev convenience, not a publishable artifact). On a
fresh machine, the recovery flow is:

```bash
# clone and register the design packages once:
git clone https://github.com/balaur-software/design.git ~/Projects/balaur-design
cd ~/Projects/balaur-design && bun install
cd packages/octant-core && bun link && cd ../..
cd packages/tokens && bun link && cd ../..
cd packages/ui && bun link && cd ../..

# then in the host:
bun install   # link: deps now resolve
```

To drop the link and resolve from a real published source (once a
meta-package exists), use `link:` → `github:` and `bun install`. Bun
1.3.x has no `bun unlink`; delete the symlink manually if needed:

```bash
rm node_modules/@balaur/ui && bun install
```

## Cross-package dependencies inside this repo

`@balaur/ui` depends on `@balaur/octant-core` and `@balaur/tokens` via
`workspace:*`. Those resolutions stay internal to this repo — when a
host links `@balaur/ui`, Bun resolves `@balaur/ui`'s imports of
`@balaur/tokens` by walking up from the linked location (the design
repo's `packages/ui/`) into the design repo's own `node_modules`, where
the workspace symlink to `packages/tokens/` lives. So linking
`@balaur/ui` alone is sufficient if you don't import `@balaur/tokens`
directly; linking all three is the safe, explicit default.

Never commit the host with `workspace:*` references to these packages
unless this repo is also a workspace member of the host — `workspace:*`
only resolves inside this repo. The host's `package.json` uses `link:`
specs, not `workspace:*`.
