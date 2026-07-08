import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          testTimeout: 30_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
      // VRT (plans/011 spike, plan 016 rollout): a separate project so
      // `bun run test-storybook` (`vitest run --project=storybook`) is
      // unaffected, and so `bun run check`/`check:full` are unaffected too
      // (plan 016 keeps `test-vrt` out of both gates until proven stable).
      // Not part of the storybookTest auto-discovery — a hand-written test
      // file enumerates every `*.stories.tsx` via `import.meta.glob`, mounts
      // each primary export, and asserts `toMatchScreenshot`. See
      // plans/011-findings.md and plans/016-vrt-rollout.md for the writeup.
      // Run with:
      //   cd packages/ui && bunx vitest run --project=vrt
      //
      // File extension is `.vrt.tsx`, NOT `.test.tsx`: this file imports
      // `vitest/browser`, which throws when imported outside Vitest's
      // browser mode — and the repo's `bun test` (run by `bun run check`)
      // auto-discovers every `*.test.tsx` file across the whole monorepo,
      // so it would otherwise try (and fail) to import this one directly.
      {
        extends: true,
        plugins: [react()],
        test: {
          name: "vrt",
          include: ["src/__vrt__/**/*.vrt.tsx"],
          testTimeout: 30_000,
          setupFiles: [path.join(dirname, ".storybook/vitest.setup.ts")],
          browser: {
            enabled: true,
            headless: true,
            // Determinism lever (plan's hunch, confirmed): force
            // prefers-reduced-motion at the Playwright BrowserContext level so
            // every rAF-driven component (useRafLoop/useBar8Fill via
            // useReducedMotion) renders its static resting frame instead of a
            // mid-animation one.
            provider: playwright({ contextOptions: { reducedMotion: "reduce" } }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
