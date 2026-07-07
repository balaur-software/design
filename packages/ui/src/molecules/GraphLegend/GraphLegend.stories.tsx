import type { Meta, StoryObj } from "@storybook/react-vite";
import { GraphLegend } from "./GraphLegend";

const meta = {
  title: "OCTANT/Molecules/GraphLegend",
  component: GraphLegend,
  args: { style: { width: 520 } },
  argTypes: {
    statuses: { control: "object", description: "Statuses to render. Defaults to the full FSM." },
    edgeTypes: { control: "object", description: "Edge types to render. Defaults to EDGE_TYPE_ORDER." },
  },
} satisfies Meta<typeof GraphLegend>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The default legend — full status FSM plus every edge type. */
export const Default: Story = {};

/** Both sections at full width. */
export const Full: Story = {};

/** Statuses only — an empty edgeTypes list hides the edge section. */
export const StatusOnly: Story = {
  args: { edgeTypes: [], style: { width: 360 } },
};
