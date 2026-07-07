import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Combobox } from "./Combobox.tsx";

const SYSTEMS = [
  "OCTANT 2x4",
  "QUADRANT 2x2",
  "SEXTANT 2x3",
  "BRAILLE 2x4",
  "SHADE 1x1",
  "HALF BLOCK 1x2",
  "LEGACY BLOCKS",
  "TERMINAL CELLS",
];

const meta = {
  title: "OCTANT/Organisms/Combobox",
  component: Combobox,
  args: { options: SYSTEMS, placeholder: "search glyph systems…", onChange: fn() },
  argTypes: {
    options: { control: "object", description: "Full option list, filtered case-insensitively." },
    value: { control: "text", description: "Controlled input text." },
    defaultValue: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    width: { control: { type: "number", min: 120, max: 600, step: 8 } },
    ariaLabel: { control: "text" },
  },
} satisfies Meta<typeof Combobox>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Type to filter, ↑/↓ to move the highlight, ⏎ to pick. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const input = canvas.getByRole("combobox");
    await userEvent.click(input);
    await userEvent.type(input, "braille");
    const option = await canvas.findByRole("option", { name: /braille 2x4/i });
    await expect(option).toBeVisible();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(input).toHaveValue("BRAILLE 2x4");
    await expect(args.onChange).toHaveBeenLastCalledWith("BRAILLE 2x4");
    await expect(input).toHaveAttribute("aria-expanded", "false");
  },
};

/** Starts with an option already filled in. */
export const Prefilled: Story = {
  args: { defaultValue: "OCTANT 2x4" },
};

/** A narrower combobox over a different option set. */
export const Regions: Story = {
  args: {
    options: ["US-EAST · IAD", "US-WEST · SFO", "EU-CENTRAL · FRA", "AP-SOUTH · SIN", "SA-EAST · GRU"],
    placeholder: "search regions…",
    width: 260,
  },
};

/** Disabled input — the list never opens. */
export const Disabled: Story = {
  args: { defaultValue: "BRAILLE 2x4", disabled: true },
};

/** The combobox framed by a heading and a keyboard-usage hint. */
export const WithHint: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ color: "#5b616e", fontSize: 11, letterSpacing: "0.1em" }}>COMBOBOX · searchable</div>
      <Combobox {...args} />
      <div style={{ color: "#3f424d", fontSize: 11 }}>type to filter · ↑↓ to navigate · ⏎ to pick</div>
    </div>
  ),
};
