import type { Meta, StoryObj } from "@storybook/react-vite";
import { Equalizer } from "./Equalizer.tsx";

const meta = {
  title: "OCTANT/Atoms/Equalizer",
  component: Equalizer,
  argTypes: {
    bands: { control: { type: "number", min: 2, max: 64, step: 1 } },
    motion: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
    colors: { control: "object", description: "Colours cycled across the bands." },
    height: { control: { type: "number", min: 32, max: 240, step: 4 } },
    fontSize: { control: { type: "number", min: 12, max: 96, step: 1 } },
    label: { control: "text" },
  },
} satisfies Meta<typeof Equalizer>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The default animated spectrum. */
export const Default: Story = {};

export const FewBands: Story = {
  args: { bands: 8, label: "SPECTRUM · 8 bands" },
};

export const HighResolution: Story = {
  args: { bands: 32, fontSize: 28, label: "SPECTRUM · 32 bands" },
};

export const Calm: Story = {
  args: { motion: 0.1, label: "SPECTRUM · calm" },
};

export const Monochrome: Story = {
  args: { colors: ["var(--bx-accent, #46c66d)"], label: "MONO SPECTRUM" },
};
