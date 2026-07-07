import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { List, type ListItem } from "./List.tsx";

const FILES: ListItem[] = [
  { glyph: "▛", label: "octant-field.bin", meta: "2.4k" },
  { glyph: "▞", label: "palette.def", meta: "512b" },
  { glyph: "▙", label: "dither.bayer", meta: "1.1k" },
  { glyph: "▟", label: "glyph.cache", meta: "8.7k" },
  { glyph: "▚", label: "render.cfg", meta: "340b" },
];

const meta = {
  title: "OCTANT/Organisms/List",
  component: List,
  args: { items: FILES, onSelect: fn() },
  argTypes: {
    items: { control: "object", description: "Rows: { glyph?, label, meta? }." },
    selected: {
      control: { type: "number", min: 0, max: 50, step: 1 },
      description: "Controlled selected index.",
    },
    defaultSelected: { control: { type: "number", min: 0, max: 50, step: 1 } },
  },
} satisfies Meta<typeof List>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The reference file list — clicking a row moves the selection and fires `onSelect`. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const row = canvas.getByRole("option", { name: /dither\.bayer/i });
    await expect(row).toHaveAttribute("aria-selected", "false");
    await userEvent.click(row);
    await expect(args.onSelect).toHaveBeenCalledWith(2);
    await expect(row).toHaveAttribute("aria-selected", "true");
  },
};

/** Uncontrolled initial selection via `defaultSelected`. */
export const ThirdSelected: Story = {
  args: { items: FILES, defaultSelected: 2 },
};

/** Rows without `meta` collapse to glyph + label. */
export const NoMeta: Story = {
  args: {
    items: [{ label: "SYSTEM" }, { label: "GLYPHS" }, { label: "RENDER" }, { label: "PALETTE" }],
  },
};

/** Two fully controlled lists pinned to different indices. */
export const Controlled: Story = {
  render: (args) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <List {...args} selected={0} />
      <List {...args} selected={3} />
    </div>
  ),
};
