import { describe, expect, it } from "bun:test";
import { composeStories } from "@storybook/react-vite";
import { renderToReadableStream } from "react-dom/server";

/**
 * SSR gate for the whole library: every story of every component must render
 * to a stream on the server (no DOM, effects never run). A component that
 * touches window/document/matchMedia during render — or a story whose render
 * function does — fails here, long before it breaks a consumer's server.
 *
 * Empty output is allowed: portalled overlays (Modal, Sheet, …) legitimately
 * render null on the server. Content assertions live in ssr-smoke.test.tsx.
 * New components are covered automatically the moment they get a story.
 */
const srcDir = new URL("..", import.meta.url).pathname;
const storyFiles = [...new Bun.Glob("**/*.stories.tsx").scanSync({ cwd: srcDir, absolute: true })].sort();

describe("SSR: every story renders server-side", () => {
  expect(storyFiles.length).toBeGreaterThan(0);

  for (const file of storyFiles) {
    const rel = file.slice(srcDir.length);
    it(rel, async () => {
      const composed = composeStories(await import(file));
      const names = Object.keys(composed);
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) {
        const Story = composed[name as keyof typeof composed] as React.ComponentType;
        try {
          const stream = await renderToReadableStream(<Story />);
          await Bun.readableStreamToText(stream);
        } catch (cause) {
          throw new Error(`story "${name}" in ${rel} failed to SSR-render: ${cause}`, { cause });
        }
      }
    });
  }
});
