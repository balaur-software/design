import type { Meta, StoryObj } from "@storybook/react";
import { SurfacingIndicator } from "./SurfacingIndicator";

const meta: Meta<typeof SurfacingIndicator> = {
  title: "OCTANT/Atoms/SurfacingIndicator",
  component: SurfacingIndicator,
};
export default meta;

export const Row: StoryObj = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SurfacingIndicator surfacing="always" showLabel />
      <SurfacingIndicator surfacing="ask" showLabel />
      <SurfacingIndicator surfacing="never" showLabel />
    </div>
  ),
};
