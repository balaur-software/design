import type { Meta, StoryObj } from "@storybook/react-vite";
import { NodeTypeTag } from "./NodeTypeTag";

const TYPES = ["memory", "skill", "note", "person", "place", "event", "task", "day"];

const meta = {
  title: "OCTANT/Atoms/NodeTypeTag",
  component: NodeTypeTag,
  args: { type: "memory" },
  argTypes: {
    type: { control: "select", options: TYPES },
    accent: { control: "color", description: "Override the deterministic accent." },
    showGlyph: { control: "boolean" },
  },
} satisfies Meta<typeof NodeTypeTag>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The memory tag with its deterministic accent and glyph. */
export const Default: Story = {};

/** All built-in node types side by side. */
export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {TYPES.map((t) => (
        <NodeTypeTag key={t} type={t} />
      ))}
    </div>
  ),
};

/** Tags with the leading glyph hidden. */
export const NoGlyph: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <NodeTypeTag type="memory" showGlyph={false} />
      <NodeTypeTag type="person" showGlyph={false} />
    </div>
  ),
};

/** Manual accent override on top of the deterministic colour. */
export const Override: Story = {
  args: { type: "memory", accent: "#c061ff" },
};
