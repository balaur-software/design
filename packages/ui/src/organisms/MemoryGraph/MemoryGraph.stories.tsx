import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { mockEdges, mockNodes } from "../MemoryExplorer/mock-vault";
import { MemoryGraph } from "./MemoryGraph";

const meta: Meta<typeof MemoryGraph> = {
  title: "OCTANT/Organisms/MemoryGraph",
  component: MemoryGraph,
  tags: ["autodocs"],
  argTypes: {
    nodes: { control: "object", description: "MemoryNode[] to lay out." },
    edges: { control: "object", description: "MemoryEdge[] between nodes." },
    selectedId: { control: "text", description: "Controlled selection." },
    hoveredId: { control: "text" },
    pinnedIds: { control: "object", description: "Set<string> of nodes held still." },
    width: { control: { type: "number", min: 200, max: 2000, step: 10 } },
    height: { control: { type: "number", min: 200, max: 2000, step: 10 } },
    showGrid: { control: "boolean" },
    onSelect: { action: "selected" },
    onHover: { action: "hovered" },
    onPinChange: { action: "pin-changed" },
  },
};
export default meta;

export const Default: StoryObj = {
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);
    const [hovered, setHovered] = useState<string | null>(null);
    return (
      <div style={{ height: 520, border: "1px solid var(--bx-border, #1c1d24)" }}>
        <MemoryGraph
          nodes={mockNodes}
          edges={mockEdges}
          {...(selected ? { selectedId: selected } : {})}
          {...(hovered ? { hoveredId: hovered } : {})}
          onSelect={setSelected}
          onHover={setHovered}
        />
      </div>
    );
  },
};

export const Full: StoryObj = {
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);
    const [hovered, setHovered] = useState<string | null>(null);
    return (
      <div style={{ height: 520, border: "1px solid var(--bx-border, #1c1d24)" }}>
        <MemoryGraph
          nodes={mockNodes}
          edges={mockEdges}
          {...(selected ? { selectedId: selected } : {})}
          {...(hovered ? { hoveredId: hovered } : {})}
          onSelect={setSelected}
          onHover={setHovered}
        />
      </div>
    );
  },
};

export const Empty: StoryObj = {
  render: () => (
    <div style={{ height: 320, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <MemoryGraph nodes={[]} edges={[]} />
    </div>
  ),
};
