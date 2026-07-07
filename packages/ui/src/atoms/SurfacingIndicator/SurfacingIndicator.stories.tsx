import type { Meta, StoryObj } from "@storybook/react";
import { SurfacingIndicator } from "./SurfacingIndicator";

const SURFACING = ["always", "ask", "never"] as const;

const meta: Meta<typeof SurfacingIndicator> = {
  title: "OCTANT/Atoms/SurfacingIndicator",
  component: SurfacingIndicator,
  tags: ["autodocs"],
  args: { surfacing: "always", showLabel: true },
  argTypes: {
    surfacing: { control: "select", options: [...SURFACING] },
    showLabel: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof SurfacingIndicator>;

export const Default: Story = {};

export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SurfacingIndicator surfacing="always" showLabel />
      <SurfacingIndicator surfacing="ask" showLabel />
      <SurfacingIndicator surfacing="never" showLabel />
    </div>
  ),
};
