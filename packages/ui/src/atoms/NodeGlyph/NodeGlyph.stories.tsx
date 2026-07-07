import type { Meta, StoryObj } from "@storybook/react";
import type { MemoryNode } from "../../organisms/MemoryExplorer/memory-types";
import { NodeGlyph } from "./NodeGlyph";

const baseNode: MemoryNode = {
  id: "n",
  type: "memory",
  title: "lake house",
  status: "active",
  surfacing: "always",
  importance: 3,
  when: null,
  created: "2026-07-07T10:00:00.000Z",
  updated: "2026-07-07T10:00:00.000Z",
  useCount: 2,
  origin: "turn:abc",
  author: "",
};

const meta: Meta<typeof NodeGlyph> = {
  title: "OCTANT/Atoms/NodeGlyph",
  component: NodeGlyph,
  tags: ["autodocs"],
  args: { node: baseNode, x: 60, y: 60, selected: true, showLabel: true },
  argTypes: {
    node: { control: "object", description: "MemoryNode descriptor." },
    x: { control: { type: "number", min: 0, max: 600, step: 1 } },
    y: { control: { type: "number", min: 0, max: 400, step: 1 } },
    selected: { control: "boolean" },
    hovered: { control: "boolean" },
    dimmed: { control: "boolean" },
    pinned: { control: "boolean" },
    showLabel: { control: "boolean" },
    zoom: { control: { type: "number", min: 0.5, max: 4, step: 0.1 } },
  },
  render: (args) => (
    <svg width={400} height={160} style={{ background: "var(--bx-bg, #0a0b0e)" }}>
      <title>Node glyph</title>
      <NodeGlyph {...args} />
    </svg>
  ),
};
export default meta;

type Story = StoryObj<typeof NodeGlyph>;

export const Default: Story = {};

const node = (over: Partial<MemoryNode> = {}): MemoryNode => ({ ...baseNode, ...over });

const STATUSES = [
  "active",
  "proposed",
  "archived",
  "rejected",
  "quarantined",
  "forgotten",
  "merged",
] as const;

export const States: Story = {
  render: () => (
    <svg width={520} height={180} style={{ background: "var(--bx-bg, #0a0b0e)" }}>
      <title>Node glyph states</title>
      {STATUSES.map((s, i) => (
        <NodeGlyph key={s} node={node({ status: s, importance: i % 6 })} x={40 + i * 65} y={60} />
      ))}
      <NodeGlyph node={node({ importance: 5 })} x={40} y={130} selected showLabel />
      <NodeGlyph node={node({ type: "person" })} x={170} y={130} hovered showLabel />
      <NodeGlyph node={node({ type: "skill" })} x={300} y={130} pinned showLabel />
      <NodeGlyph node={node({ type: "note" })} x={430} y={130} dimmed showLabel />
    </svg>
  ),
};
