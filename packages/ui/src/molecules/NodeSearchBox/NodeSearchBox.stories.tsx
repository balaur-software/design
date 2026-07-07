import type { Meta, StoryObj } from "@storybook/react";
import type { MemoryNode } from "../../organisms/MemoryExplorer/memory-types";
import { NodeSearchBox } from "./NodeSearchBox";

const meta: Meta<typeof NodeSearchBox> = {
  title: "OCTANT/Molecules/NodeSearchBox",
  component: NodeSearchBox,
};
export default meta;

const results: MemoryNode[] = [
  {
    id: "r1",
    type: "memory",
    title: "Lake house trip — Ana & the dogs",
    status: "active",
    surfacing: "always",
    importance: 4,
    when: null,
    created: "2026-07-04T20:14:03.123Z",
    updated: "2026-07-04T20:14:03.123Z",
    useCount: 7,
    origin: "",
    author: "",
  },
  {
    id: "r2",
    type: "person",
    title: "Ana — sister",
    status: "active",
    surfacing: "always",
    importance: 3,
    when: null,
    created: "2026-06-01T00:00:00.000Z",
    updated: "2026-06-01T00:00:00.000Z",
    useCount: 22,
    origin: "",
    author: "",
  },
  {
    id: "r3",
    type: "skill",
    title: "sourdough method",
    status: "proposed",
    surfacing: "ask",
    importance: 2,
    when: null,
    created: "2026-07-05T00:00:00.000Z",
    updated: "2026-07-05T00:00:00.000Z",
    useCount: 0,
    origin: "",
    author: "",
  },
];

export const WithResults: StoryObj = {
  render: () => (
    <NodeSearchBox
      defaultValue="ana"
      results={results}
      onSelect={(id) => alert(`select ${id}`)}
      style={{ width: 360 }}
    />
  ),
};

export const Empty: StoryObj = {
  render: () => <NodeSearchBox results={[]} style={{ width: 360 }} />,
};
