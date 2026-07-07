import type { Meta, StoryObj } from "@storybook/react";
import { Heatmap } from "./Heatmap.tsx";

const meta: Meta<typeof Heatmap> = {
  title: "OCTANT/Organisms/Heatmap",
  component: Heatmap,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    rows: { control: { type: "number", min: 1, max: 31, step: 1 } },
    cols: { control: { type: "number", min: 4, max: 52, step: 1 } },
    label: { control: "text" },
    dayLabels: { control: "object", description: "Row labels indexed by row." },
    color: { control: "color" },
  },
};
export default meta;
type Story = StoryObj<typeof Heatmap>;

export const Default: Story = {};

export const Cyan: Story = {
  args: { color: "#2bd9d9", label: "HEATMAP · latency" },
};

export const Amber: Story = {
  args: { color: "#f2c94c", label: "HEATMAP · load" },
};

export const Compact: Story = {
  args: { rows: 5, cols: 16, label: "HEATMAP · commits" },
};
