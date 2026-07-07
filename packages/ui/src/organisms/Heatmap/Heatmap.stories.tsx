import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heatmap } from "./Heatmap.tsx";

const meta = {
  title: "OCTANT/Organisms/Heatmap",
  component: Heatmap,
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
} satisfies Meta<typeof Heatmap>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The reference activity heatmap in the default accent green. */
export const Default: Story = {};

/** Cyan intensity ramp. */
export const Cyan: Story = {
  args: { color: "#2bd9d9", label: "HEATMAP · latency" },
};

/** Amber intensity ramp. */
export const Amber: Story = {
  args: { color: "#f2c94c", label: "HEATMAP · load" },
};

/** A smaller 5×16 grid. */
export const Compact: Story = {
  args: { rows: 5, cols: 16, label: "HEATMAP · commits" },
};
