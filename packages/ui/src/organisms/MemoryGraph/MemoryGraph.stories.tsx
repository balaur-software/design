import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentProps, useState } from "react";
import { mockEdges, mockNodes } from "../MemoryExplorer/mock-vault";
import { MemoryGraph } from "./MemoryGraph";

/** Wires the controlled selection/hover props to local state while forwarding the arg spies. */
function GraphDemo(props: ComponentProps<typeof MemoryGraph>) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <div style={{ height: 520, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <MemoryGraph
        {...props}
        {...(selected ? { selectedId: selected } : {})}
        {...(hovered ? { hoveredId: hovered } : {})}
        onSelect={(id) => {
          setSelected(id);
          props.onSelect?.(id);
        }}
        onHover={(id) => {
          setHovered(id);
          props.onHover?.(id);
        }}
      />
    </div>
  );
}

const meta = {
  title: "OCTANT/Organisms/MemoryGraph",
  component: MemoryGraph,
  args: { nodes: mockNodes, edges: mockEdges },
  argTypes: {
    nodes: { control: "object", description: "MemoryNode[] to lay out." },
    edges: { control: "object", description: "MemoryEdge[] between nodes." },
    selectedId: { control: "text", description: "Controlled selection." },
    hoveredId: { control: "text" },
    pinnedIds: { control: "object", description: "Set<string> of nodes held still." },
    width: { control: { type: "number", min: 200, max: 2000, step: 10 } },
    height: { control: { type: "number", min: 200, max: 2000, step: 10 } },
    showGrid: { control: "boolean" },
  },
} satisfies Meta<typeof MemoryGraph>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The force-directed vault graph — click a node to select, drag to pin, scroll to zoom. */
export const Default: Story = {
  render: (args) => <GraphDemo {...args} />,
};

/** The same graph with the full mock vault (~30 nodes, ~50 typed edges). */
export const Full: Story = {
  render: (args) => <GraphDemo {...args} />,
};

/** No nodes: the canvas renders just the crosshair grid. */
export const Empty: Story = {
  render: () => (
    <div style={{ height: 320, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <MemoryGraph nodes={[]} edges={[]} />
    </div>
  ),
};
