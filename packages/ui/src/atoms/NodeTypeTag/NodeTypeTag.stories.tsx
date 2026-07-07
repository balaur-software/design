import type { Meta, StoryObj } from "@storybook/react";
import { NodeTypeTag } from "./NodeTypeTag";

const meta: Meta<typeof NodeTypeTag> = {
  title: "OCTANT/Atoms/NodeTypeTag",
  component: NodeTypeTag,
};
export default meta;

const TYPES = ["memory", "skill", "note", "person", "place", "event", "task", "day"];

export const Row: StoryObj = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {TYPES.map((t) => (
        <NodeTypeTag key={t} type={t} />
      ))}
    </div>
  ),
};

export const NoGlyph: StoryObj = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <NodeTypeTag type="memory" showGlyph={false} />
      <NodeTypeTag type="person" showGlyph={false} />
    </div>
  ),
};

export const Override: StoryObj = {
  args: { type: "memory", accent: "#c061ff" },
};
