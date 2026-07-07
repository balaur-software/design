import type { Meta, StoryObj } from "@storybook/react";
import { NodeTypeTag } from "./NodeTypeTag";

const TYPES = ["memory", "skill", "note", "person", "place", "event", "task", "day"];

const meta: Meta<typeof NodeTypeTag> = {
  title: "OCTANT/Atoms/NodeTypeTag",
  component: NodeTypeTag,
  tags: ["autodocs"],
  args: { type: "memory" },
  argTypes: {
    type: { control: "select", options: TYPES },
    accent: { control: "color", description: "Override the deterministic accent." },
    showGlyph: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof NodeTypeTag>;

export const Default: Story = {};

export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {TYPES.map((t) => (
        <NodeTypeTag key={t} type={t} />
      ))}
    </div>
  ),
};

export const NoGlyph: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <NodeTypeTag type="memory" showGlyph={false} />
      <NodeTypeTag type="person" showGlyph={false} />
    </div>
  ),
};

export const Override: Story = {
  args: { type: "memory", accent: "#c061ff" },
};
