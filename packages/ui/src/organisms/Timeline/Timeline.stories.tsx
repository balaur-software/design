import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { Timeline } from "./Timeline.tsx";

const meta = {
  title: "OCTANT/Organisms/Timeline",
  component: Timeline,
} satisfies Meta<typeof Timeline>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The default event feed: seeded after mount, then streaming a new entry every ~5s while in view. */
export const Default: Story = {
  play: async ({ canvas }) => {
    // Seeding happens client-side (in an effect) so timestamps never mismatch SSR;
    // wait for the seeded entries to land in the live log.
    const log = canvas.getByRole("log");
    await waitFor(() => expect(within(log).getByText("Buffer committed")).toBeVisible());
    await expect(within(log).getByText("render pass 4.1ms")).toBeVisible();
    await expect(within(log).getByText("SINK-03 glyph fault")).toBeVisible();
  },
};

/** A custom event pool — a deploy pipeline instead of the render-core defaults. */
export const CustomEvents: Story = {
  args: {
    events: [
      { glyph: "✓", color: "#74e692", title: "Build passed", detail: "1124 tests · 41s" },
      { glyph: "▲", color: "#ffe08a", title: "Canary at 5%", detail: "error budget nominal" },
      { glyph: "█", color: "#2bd9d9", title: "Artifact pushed", detail: "sha256:9f2e…c41a" },
      { glyph: "✕", color: "#ff6b6f", title: "Rollback armed", detail: "previous release pinned" },
    ],
  },
};

/** A fast feed: one entry every 1.5s, capped at four rows before the oldest composts. */
export const FastAndShallow: Story = {
  args: {
    interval: 1500,
    max: 4,
  },
};

/** Constrained to a narrow column via `style` — long detail lines wrap inside the rail. */
export const Narrow: Story = {
  args: {
    style: { maxWidth: 340 },
  },
};
