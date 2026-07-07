import type { Meta, StoryObj } from "@storybook/react";
import { GraphLegend } from "./GraphLegend";

const meta: Meta<typeof GraphLegend> = {
  title: "OCTANT/Molecules/GraphLegend",
  component: GraphLegend,
};
export default meta;

export const Full: StoryObj = {
  render: () => <GraphLegend style={{ width: 520 }} />,
};

export const StatusOnly: StoryObj = {
  render: () => <GraphLegend edgeTypes={[]} style={{ width: 360 }} />,
};
