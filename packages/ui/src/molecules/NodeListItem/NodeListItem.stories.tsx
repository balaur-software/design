import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { MemoryNode } from "../../organisms/MemoryExplorer/memory-types";
import { NodeListItem } from "./NodeListItem";

const baseNode: MemoryNode = {
  id: "1",
  type: "memory",
  title: "Lake house trip",
  status: "active",
  surfacing: "always",
  importance: 3,
  when: null,
  created: "2026-07-04T20:14:03.123Z",
  updated: "2026-07-04T20:14:03.123Z",
  useCount: 0,
  origin: "",
  author: "",
};

const meta = {
  title: "OCTANT/Molecules/NodeListItem",
  component: NodeListItem,
  args: { node: baseNode, selected: true },
  argTypes: {
    node: { control: "object", description: "MemoryNode descriptor." },
    selected: { control: "boolean" },
    hovered: { control: "boolean" },
    meta: { control: "text", description: "Right-aligned meta text." },
  },
} satisfies Meta<typeof NodeListItem>;
export default meta;

type Story = StoryObj<typeof meta>;

/** A selected row; hovering fires `onHover`, clicking fires `onSelect` with the node id. */
export const Default: Story = {
  args: { onSelect: fn(), onHover: fn() },
  play: async ({ canvas, userEvent, args }) => {
    const row = canvas.getByRole("button", { name: /lake house trip/i });
    await userEvent.click(row);
    await expect(args.onHover).toHaveBeenCalledWith("1");
    await expect(args.onSelect).toHaveBeenCalledWith("1");
  },
};

const mk = (over: Partial<MemoryNode>): MemoryNode => ({ ...baseNode, ...over });

const items: MemoryNode[] = [
  mk({ id: "1", title: "Lake house trip", type: "memory", status: "active" }),
  mk({ id: "2", title: "Ana — sister", type: "person", status: "active" }),
  mk({ id: "3", title: "sourdough method", type: "skill", status: "proposed" }),
  mk({ id: "4", title: "old note", type: "note", status: "archived" }),
];

/** A bordered stack of rows across node types and statuses, second row selected. */
export const List: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid var(--bx-border, #1c1d24)",
        width: 360,
      }}
    >
      {items.map((n, i) => (
        <NodeListItem key={n.id} node={n} selected={i === 1} {...(i === 0 ? { meta: "12:04" } : {})} />
      ))}
    </div>
  ),
};
