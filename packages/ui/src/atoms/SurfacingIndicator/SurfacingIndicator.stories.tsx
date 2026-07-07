import type { Meta, StoryObj } from "@storybook/react-vite";
import { SurfacingIndicator } from "./SurfacingIndicator";

const SURFACING = ["always", "ask", "never"] as const;

const meta = {
  title: "OCTANT/Atoms/SurfacingIndicator",
  component: SurfacingIndicator,
  args: { surfacing: "always", showLabel: true },
  argTypes: {
    surfacing: { control: "select", options: [...SURFACING] },
    showLabel: { control: "boolean" },
  },
} satisfies Meta<typeof SurfacingIndicator>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The "always" surfacing mode with its label. */
export const Default: Story = {};

/** All three surfacing modes stacked. */
export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SurfacingIndicator surfacing="always" showLabel />
      <SurfacingIndicator surfacing="ask" showLabel />
      <SurfacingIndicator surfacing="never" showLabel />
    </div>
  ),
};
