import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { mockEdges, mockNodes } from "../MemoryExplorer/mock-vault";
import { MemoryGraph } from "./MemoryGraph";

const meta: Meta<typeof MemoryGraph> = {
  title: "OCTANT/Organisms/MemoryGraph",
  component: MemoryGraph,
};
export default meta;

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
