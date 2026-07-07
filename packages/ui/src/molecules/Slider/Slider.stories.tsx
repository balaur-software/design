import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./Slider.tsx";

const meta: Meta<typeof Slider> = {
  title: "OCTANT/Molecules/Slider",
  component: Slider,
  tags: ["autodocs"],
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
    onChange: { action: "changed" },
  },
};
export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: { defaultValue: 62 },
};

export const Stepped: Story = {
  args: {
    label: "GAIN · step 10",
    min: 0,
    max: 100,
    step: 10,
    defaultValue: 40,
  },
};

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

export const Disabled: Story = {
  args: { label: "LOCKED", defaultValue: 30, disabled: true },
};
