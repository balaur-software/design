import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { MemoryNode } from "../../organisms/MemoryExplorer/memory-types";
import { NodeSearchBox } from "./NodeSearchBox";

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

const meta: Meta<typeof NodeSearchBox> = {
  title: "OCTANT/Molecules/NodeSearchBox",
  component: NodeSearchBox,
  tags: ["autodocs"],
  argTypes: {
    value: { control: "text" },
    defaultValue: { control: "text" },
    results: { control: "object", description: "Search results from the caller's recall/search." },
    onSelect: { action: "selected" },
    onValueChange: { action: "value-changed" },
    placeholder: { control: "text" },
  },
};
export default meta;

type Story = StoryObj<typeof NodeSearchBox>;

export const Default: Story = {
  render: () => <NodeSearchBox results={results} onSelect={fn()} style={{ width: 360 }} />,
};

export const WithResults: Story = {
  render: () => <NodeSearchBox defaultValue="ana" results={results} onSelect={fn()} style={{ width: 360 }} />,
};

export const Empty: Story = {
  render: () => <NodeSearchBox results={[]} style={{ width: 360 }} />,
};
