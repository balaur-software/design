import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkline } from "./Sparkline.tsx";

const meta = {
  title: "OCTANT/Atoms/Sparkline",
  component: Sparkline,
  args: { label: "throughput", unit: "MB/s" },
  argTypes: {
    label: { control: "text" },
    unit: { control: "text" },
    samples: { control: { type: "number", min: 8, max: 128, step: 1 } },
    color: { control: "color" },
    spanLabel: { control: "text" },
  },
} satisfies Meta<typeof Sparkline>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The default throughput readout with the accent trace. */
export const Default: Story = {};

/** A latency trace in the warning-yellow ramp with a custom span label. */
export const Latency: Story = {
  args: { label: "latency", unit: "ms", color: "#f2c94c", spanLabel: "-30s" },
};

/** More samples packed into the same width. */
export const Dense: Story = {
  args: { label: "packets", unit: "pkt/s", color: "#46c66d", samples: 64 },
};

/** Several sparklines in a responsive dashboard grid. */
export const Grid: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 14,
        maxWidth: 900,
      }}
    >
      <Sparkline label="throughput" unit="MB/s" color="#ff6b6f" />
      <Sparkline label="latency" unit="ms" color="#4f8cff" />
      <Sparkline label="errors" unit="/min" color="#e5484d" samples={28} />
    </div>
  ),
};
