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
