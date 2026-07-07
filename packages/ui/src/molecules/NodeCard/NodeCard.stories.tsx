import type { Meta, StoryObj } from "@storybook/react";
import type { MemoryNode } from "../../organisms/MemoryExplorer/memory-types";
import { NodeCard } from "./NodeCard";

const meta: Meta<typeof NodeCard> = {
  title: "OCTANT/Molecules/NodeCard",
  component: NodeCard,
};
export default meta;

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

export const Default: StoryObj = {
  args: { node, style: { width: 320 } },
};

export const Proposed: StoryObj = {
  render: () => (
    <NodeCard
      node={{ ...node, status: "proposed", importance: 2, origin: "turn:abc", author: "" }}
      style={{ width: 320 }}
    />
  ),
};

export const Quarantined: StoryObj = {
  render: () => (
    <NodeCard
      node={{ ...node, status: "quarantined", surfacing: "ask", importance: 5, when: null }}
      style={{ width: 320 }}
    />
  ),
};
