# balaur-design

> **The OCTANT design system** — pure encoder, design tokens, and atomic React
> components. Bun-native, zero runtime deps in the core. Extracted from
> [`balaur-software/harness`](https://github.com/balaur-software/harness)
> so the design system and the life OS can evolve independently.

A Bun-workspace monorepo with three packages:

| Package | What |
|---|---|
| `packages/octant-core` (`@balaur/octant-core`) | Pure, framework-agnostic encoder for OCTANT — the pixel→mask→Unicode-octant-glyph core (`octChar`) + canvas rasterization fallback. Zero deps, zero DOM. |
| `packages/tokens` (`@balaur/tokens`) | OCTANT design tokens (ANSI 16-color palette, ramps, type scale, motion, accent system) as typed TS + `tokens.css`; self-hosted DepartureMono. |
| `packages/ui` (`@balaur/ui`) | The OCTANT design system as atomic React components + Storybook. Depends on `@balaur/octant-core` and `@balaur/tokens`. |

## Using it (Bun — by design)

The package ships raw TypeScript — Bun consumes it natively; there is no
build step and no Node entry, deliberately. It is published as a **single
package**, `@balaur/octant`, from the repo root: the tarball carries a fixed
`files` list (each package's `src/`, no stories or tests) and exposes the
three layers via subpath `exports` (`.` = UI, `./tokens`, `./core`).

```bash
# in balaur-design/
bun install                            # resolve the workspace
bun run check                          # typecheck + lint + test
bun run storybook                      # component workshop on :6006
```

```jsonc
// host package.json — committed state pins a release tag
"dependencies": {
  "@balaur/octant": "github:balaur-software/design#vX.Y.Z"
}

// host package.json — active design iteration against a local checkout
"@balaur/octant": "file:../design"    // re-run `bun install` after edits
```

Do **not** `bun link` the packages (individually or as `@balaur/octant`) —
linking resolves `react` inside this repo's own module graph and produces two
React instances in the host, crashing hooks with `resolveDispatcher() is null`.
`file:../design` is the safe dev override. See
[docs/CONSUMING.md](docs/CONSUMING.md) for the full consumption guide and
[docs/RELEASE.md](docs/RELEASE.md) for the tag-and-release runbook.

## Scripts

```bash
bun install          # resolve the workspace
bun run storybook    # component workshop (packages/ui) on :6006
bun test             # run all workspace tests
bun run check        # typecheck + lint + test
```

Requires Bun ≥ 1.2.

## Lint debt (known, deferred from extraction)

The Phase 2/3 UI code was landed in its previous home without `biome check`
being run on it; the extraction auto-fixed 58 formatting issues but
deliberately **demotes** several noisy rule categories in `biome.json` rather
than rewrite behavior in the extraction commit:

- `suspicious/noArrayIndexKey`, `correctness/useExhaustiveDependencies` —
  common false positives in storybook stories and animation hooks.
- `a11y/*` (7 rules) — the components were authored visually-first; a real
  a11y pass is its own future phase, not a side effect of moving files.

A handful of `complexity/useOptionalChain`, `style/useTemplate`,
`performance/noAccumulatingSpread`, and `suppressions/unused` warnings
remain in `packages/ui/`; `bun run check` passes (warnings don't fail
the build). Tightening any of these is a separate, intentional change.

## License

TBD — same license as the host life OS, to be ratified in the first
non-extraction commit.
