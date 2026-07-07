import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Accordion } from "./Accordion.tsx";

const items = [
  {
    title: "WHAT IS AN OCTANT CELL?",
    content:
      "A single character divided into a 2×4 grid of eight sub-pixels. Each can be lit independently, giving 256 states per glyph — the finest mosaic in the Unicode block, new in 16.0.",
    defaultOpen: true,
  },
  {
    title: "HOW IS DENSITY THE ONLY CHANNEL?",
    content:
      "A grayscale value maps to how many sub-pixels are lit. Ordered dithering distributes that coverage across the cell, so a flat text grid behaves like a 1-bit framebuffer — no colour, no antialiasing.",
  },
  {
    title: "WHAT IF THE FONT LACKS THE GLYPHS?",
    content:
      "The renderer detects support per glyph. Where the cells exist they print as real text; where they don't, the panel draws the same 2×4 sub-pixels directly to a canvas — identical output, never a broken box.",
  },
];

const meta = {
  title: "OCTANT/Organisms/Accordion",
  component: Accordion,
  args: { items, style: { maxWidth: 560 }, onOpenChange: fn() },
  argTypes: {
    items: { control: "object", description: "Rows: { title, content, defaultOpen? }." },
    single: { control: "boolean" },
    openIndices: { control: "object", description: "Controlled set of open indices." },
  },
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Multi-open accordion; the first item starts expanded via `defaultOpen`. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const first = canvas.getByRole("button", { name: /what is an octant cell/i });
    const second = canvas.getByRole("button", { name: /how is density/i });
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(second).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(second);
    await expect(second).toHaveAttribute("aria-expanded", "true");
    // Multi-open: the first item stays expanded.
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(args.onOpenChange).toHaveBeenLastCalledWith([0, 1]);
  },
};

/** Every row starts collapsed. */
export const AllClosed: Story = {
  args: { items: items.map((it) => ({ ...it, defaultOpen: false })) },
};

/** Radio-style behaviour: opening one row closes the others. */
export const SingleOpen: Story = {
  args: { single: true, items: items.map((it) => ({ ...it, defaultOpen: false })) },
  play: async ({ canvas, userEvent }) => {
    const first = canvas.getByRole("button", { name: /what is an octant cell/i });
    const second = canvas.getByRole("button", { name: /how is density/i });
    await userEvent.click(first);
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(second);
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(first).toHaveAttribute("aria-expanded", "false");
  },
};

/** A short two-row status readout. */
export const Compact: Story = {
  args: {
    items: [
      { title: "STATUS", content: "All eight sub-pixels reporting nominal.", defaultOpen: true },
      { title: "BUFFER", content: "256 states cached; 0 dropped frames." },
    ],
  },
};
