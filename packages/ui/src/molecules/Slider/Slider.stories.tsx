import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Slider } from "./Slider.tsx";

const meta = {
  title: "OCTANT/Molecules/Slider",
  component: Slider,
  args: { onChange: fn() },
  argTypes: {
    min: { control: { type: "number", min: -1000, max: 1000, step: 1 } },
    max: { control: { type: "number", min: -1000, max: 100000, step: 1 } },
    step: { control: { type: "number", min: 0, max: 1000, step: 1 } },
    value: {
      control: { type: "number", min: -1000, max: 100000, step: 1 },
      description: "Controlled value.",
    },
    defaultValue: { control: { type: "number", min: -1000, max: 100000, step: 1 } },
    label: { control: "text" },
    accentColor: { control: "color" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Slider>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Uncontrolled slider; arrow keys nudge the value and fire `onChange`. */
export const Default: Story = {
  args: { defaultValue: 62 },
  play: async ({ canvas, userEvent, args }) => {
    const slider = canvas.getByRole("slider");
    await expect(slider).toHaveAttribute("aria-valuenow", "62");
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(slider).toHaveAttribute("aria-valuenow", "63");
    await expect(args.onChange).toHaveBeenLastCalledWith(63);
    await userEvent.keyboard("{Home}");
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
  },
};

/** Snaps to the nearest multiple of `step`. */
export const Stepped: Story = {
  args: {
    label: "GAIN · step 10",
    min: 0,
    max: 100,
    step: 10,
    defaultValue: 40,
  },
};

/** Custom bounds with a formatted readout and cyan accent. */
export const CustomRange: Story = {
  args: {
    label: "FREQ · 20 → 20k Hz",
    min: 20,
    max: 20000,
    defaultValue: 4400,
    formatValue: (v) => `${Math.round(v)} Hz`,
    accentColor: "#2bd9d9",
  },
};

/** Disabled: dimmed, unfocusable, ignores input. */
export const Disabled: Story = {
  args: { label: "LOCKED", defaultValue: 30, disabled: true },
};
