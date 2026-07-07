import type { Meta, StoryObj } from "@storybook/react";
import { GraphLegend } from "./GraphLegend";

const meta: Meta<typeof GraphLegend> = {
  title: "OCTANT/Molecules/GraphLegend",
  component: GraphLegend,
  tags: ["autodocs"],
  argTypes: {
    statuses: { control: "object", description: "Statuses to render. Defaults to the full FSM." },
    edgeTypes: { control: "object", description: "Edge types to render. Defaults to EDGE_TYPE_ORDER." },
  },
};
export default meta;

type Story = StoryObj<typeof GraphLegend>;

export const Default: Story = {
  render: () => <GraphLegend style={{ width: 520 }} />,
};

export const Full: Story = {
  render: () => <GraphLegend style={{ width: 520 }} />,
};

export const StatusOnly: Story = {
  render: () => <GraphLegend edgeTypes={[]} style={{ width: 360 }} />,
};
