import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
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

const meta = {
  title: "OCTANT/Atoms/NodeGlyph",
  component: NodeGlyph,
  args: { node: baseNode, x: 60, y: 60, selected: true, showLabel: true, onClick: fn() },
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
    <svg width={400} height={160} style={{ background: "var(--bx-bg, #08080a)" }}>
      <title>Node glyph</title>
      <NodeGlyph {...args} />
    </svg>
  ),
} satisfies Meta<typeof NodeGlyph>;
export default meta;

type Story = StoryObj<typeof meta>;

/** A selected, labelled marker — clicking it reports the node id. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByText("lake house"));
    await expect(args.onClick).toHaveBeenCalledWith("n");
  },
};

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

/** Every status colour plus the selected / hovered / pinned / dimmed variants. */
export const States: Story = {
  render: () => (
    <svg width={520} height={180} style={{ background: "var(--bx-bg, #08080a)" }}>
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
