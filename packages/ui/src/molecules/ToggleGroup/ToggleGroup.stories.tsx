import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ToggleGroup, type ToggleGroupItem } from "./ToggleGroup.tsx";

const SQUARE = { width: 38, padding: 0, textAlign: "center" as const };

const ALIGN_ITEMS: ToggleGroupItem[] = [
  { value: "left", label: "▐█▌", title: "Align left" },
  { value: "center", label: "███", title: "Align center" },
  { value: "right", label: "▌█▐", title: "Align right" },
];

const FORMAT_ITEMS: ToggleGroupItem[] = [
  { value: "b", label: "B", title: "Bold", style: { ...SQUARE, fontSize: 14, fontWeight: "bold" } },
  {
    value: "i",
    label: "I",
    title: "Italic",
    style: { ...SQUARE, fontSize: 14, fontStyle: "italic" },
  },
  {
    value: "u",
    label: "U",
    title: "Underline",
    style: { ...SQUARE, fontSize: 14, textDecoration: "underline" },
  },
];

const meta = {
  title: "OCTANT/Molecules/ToggleGroup",
  component: ToggleGroup,
  args: { items: ALIGN_ITEMS, defaultValue: ["left"], onChange: fn() },
  argTypes: {
    items: { control: "object", description: "Items: { value, label, title?, style? }." },
    multi: { control: "boolean" },
    value: { control: "object", description: "Controlled selection (string[])." },
    defaultValue: { control: "object" },
  },
} satisfies Meta<typeof ToggleGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Single-select alignment picker (default mode): one item stays lit. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const left = canvas.getByTitle("Align left");
    const center = canvas.getByTitle("Align center");
    await expect(left).toHaveAttribute("aria-checked", "true");
    await userEvent.click(center);
    await expect(args.onChange).toHaveBeenLastCalledWith(["center"]);
    await expect(center).toHaveAttribute("aria-checked", "true");
    await expect(left).toHaveAttribute("aria-checked", "false");
  },
};

/** Multi-select text formatting (mirrors `data-multi`): items toggle independently. */
export const Multi: Story = {
  args: {
    multi: true,
    defaultValue: ["b"],
    items: FORMAT_ITEMS,
  },
  play: async ({ canvas, userEvent, args }) => {
    const bold = canvas.getByTitle("Bold");
    const italic = canvas.getByTitle("Italic");
    await userEvent.click(italic);
    await expect(args.onChange).toHaveBeenLastCalledWith(["b", "i"]);
    await expect(bold).toHaveAttribute("aria-pressed", "true");
    await expect(italic).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(bold);
    await expect(args.onChange).toHaveBeenLastCalledWith(["i"]);
    await expect(bold).toHaveAttribute("aria-pressed", "false");
  },
};

/** Wider labelled options. */
export const Labelled: Story = {
  args: {
    defaultValue: ["grid"],
    items: [
      { value: "grid", label: "GRID" },
      { value: "list", label: "LIST" },
      { value: "flow", label: "FLOW" },
    ],
  },
};

/** Multi and single mode side by side. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "center" }}>
      <div>
        <div style={{ color: "#3f424d", fontSize: 11, marginBottom: 9 }}>FORMAT &middot; multi</div>
        <ToggleGroup multi defaultValue={["b"]} items={FORMAT_ITEMS} />
      </div>
      <div>
        <div style={{ color: "#3f424d", fontSize: 11, marginBottom: 9 }}>ALIGN &middot; single</div>
        <ToggleGroup defaultValue={["left"]} items={ALIGN_ITEMS} />
      </div>
    </div>
  ),
};
