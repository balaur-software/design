import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { MemoryNode } from "../../organisms/MemoryExplorer/memory-types";
import { NodeCard } from "./NodeCard";

const node: MemoryNode = {
  id: "n1",
  type: "memory",
  title: "Lake house trip — Ana & the dogs",
  status: "active",
  surfacing: "always",
  importance: 4,
  when: "2026-07-15T09:00:00.000Z",
  created: "2026-07-04T20:14:03.123Z",
  updated: "2026-07-06T11:02:00.000Z",
  useCount: 7,
  origin: "telegram:fwd:123",
  author: "Ana",
  aliases: ["lake house", "cabin"],
};

const meta: Meta<typeof NodeCard> = {
  title: "OCTANT/Molecules/NodeCard",
  component: NodeCard,
  tags: ["autodocs"],
  args: { node, style: { width: 320 } },
  argTypes: {
    node: { control: "object", description: "MemoryNode descriptor." },
    onClick: { action: "clicked" },
  },
};
export default meta;

type Story = StoryObj<typeof NodeCard>;

export const Default: Story = { args: { onClick: fn() } };

export const Proposed: Story = {
  render: () => (
    <NodeCard
      node={{ ...node, status: "proposed", importance: 2, origin: "turn:abc", author: "" }}
      style={{ width: 320 }}
    />
  ),
};

export const Quarantined: Story = {
  render: () => (
    <NodeCard
      node={{ ...node, status: "quarantined", surfacing: "ask", importance: 5, when: null }}
      style={{ width: 320 }}
    />
  ),
};
