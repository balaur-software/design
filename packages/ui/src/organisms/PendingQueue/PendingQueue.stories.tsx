import type { Meta, StoryObj } from "@storybook/react";
import type { MemoryNode } from "../MemoryExplorer/memory-types";
import { PendingQueue } from "./PendingQueue";

const meta: Meta<typeof PendingQueue> = {
  title: "OCTANT/Organisms/PendingQueue",
  component: PendingQueue,
};
export default meta;

const mk = (over: Partial<MemoryNode>): MemoryNode => ({
  id: over.id ?? "x",
  type: "memory",
  title: "untitled",
  status: "proposed",
  surfacing: "always",
  importance: 3,
  when: null,
  created: "2026-07-04T20:14:03.123Z",
  updated: "2026-07-04T20:14:03.123Z",
  useCount: 0,
  origin: "turn:abc",
  author: "agent",
  ...over,
});

const items: MemoryNode[] = [
  mk({ id: "p1", title: "sourdough method", type: "skill", importance: 2 }),
  mk({ id: "p2", title: "Marc — neighbour", type: "person", importance: 3 }),
  mk({ id: "p3", title: "ribollita recipe", type: "note", importance: 1 }),
];

export const Default: StoryObj = {
  render: () => (
    <PendingQueue
      items={items}
      onSelect={(id) => alert(`select ${id}`)}
      onVerdict={(id, v) => alert(`verdict ${v} on ${id}`)}
      style={{ width: 380 }}
    />
  ),
};

export const Empty: StoryObj = {
  render: () => <PendingQueue items={[]} style={{ width: 380 }} />,
};
