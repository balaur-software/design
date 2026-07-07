import type { Meta, StoryObj } from "@storybook/react";
import type { MemoryEdge, MemoryHistorySnapshot, MemoryNode } from "../MemoryExplorer/memory-types";
import { fn } from "@storybook/test";
import { NodeDetailPanel } from "./NodeDetailPanel";

const meta: Meta<typeof NodeDetailPanel> = {
  title: "OCTANT/Organisms/NodeDetailPanel",
  component: NodeDetailPanel,
  tags: ["autodocs"],
  argTypes: {
    node: { control: "object", description: "MemoryNode descriptor." },
    edges: { control: "object", description: "All edges touching the node (in + out)." },
    neighbours: { control: "object", description: "Lookup Map<id, MemoryNode> for neighbour titles." },
    history: { control: "object", description: "Pre-mutation history snapshots." },
    onNavigate: { action: "navigated" },
  },
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

const neighbours = new Map<string, MemoryNode>([
  ["n2", { ...node, id: "n2", title: "Ana — sister", type: "person", aliases: ["ana"] }],
  ["n3", { ...node, id: "n3", title: "the cabin", type: "place" }],
  ["n4", { ...node, id: "n4", title: "old lake house note", type: "note", status: "archived" }],
]);

const edges: MemoryEdge[] = [
  {
    id: "e1",
    source: "n1",
    target: "n2",
    type: "links",
    validFrom: null,
    validUntil: null,
    created: "2026-07-04T20:14:03.123Z",
  },
  {
    id: "e2",
    source: "n1",
    target: "n3",
    type: "links",
    validFrom: "2026-07-01",
    validUntil: null,
    created: "2026-07-04T20:14:03.123Z",
  },
  {
    id: "e3",
    source: "n4",
    target: "n1",
    type: "supersedes",
    validFrom: null,
    validUntil: null,
    created: "2026-07-05T00:00:00.000Z",
  },
  {
    id: "e4",
    source: "n2",
    target: "n1",
    type: "derived_from",
    validFrom: "2026-06-01",
    validUntil: "2026-06-30",
    created: "2026-06-01T00:00:00.000Z",
  },
];

const history: MemoryHistorySnapshot[] = [
  {
    seq: 1,
    title: "Lake house trip",
    body: "first draft",
    when: null,
    actor: "agent",
    action: "create",
    at: "2026-07-04T20:14:03.123Z",
  },
  {
    seq: 2,
    title: "Lake house trip — Ana & the dogs",
    body: "added the dogs",
    when: "2026-07-10T09:00:00.000Z",
    actor: "owner",
    action: "update",
    at: "2026-07-06T11:02:00.000Z",
  },
];

export const Default: StoryObj = {
  render: () => (
    <NodeDetailPanel
      node={node}
      edges={edges}
      neighbours={neighbours}
      history={history}
      onNavigate={fn()}
      style={{ height: 520, width: 360 }}
    />
  ),
};
