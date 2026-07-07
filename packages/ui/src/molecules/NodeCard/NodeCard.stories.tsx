import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
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

const meta = {
  title: "OCTANT/Molecules/NodeCard",
  component: NodeCard,
  args: { node, style: { width: 320 } },
  argTypes: {
    node: { control: "object", description: "MemoryNode descriptor." },
  },
} satisfies Meta<typeof NodeCard>;
export default meta;

type Story = StoryObj<typeof meta>;

/** An active node with every field populated; clicking the card fires `onClick`. */
export const Default: Story = {
  args: { onClick: fn() },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /lake house trip/i }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** A freshly proposed node awaiting consent — no author, turn-scoped provenance. */
export const Proposed: Story = {
  args: {
    node: { ...node, status: "proposed", importance: 2, origin: "turn:abc", author: "" },
  },
};

/** A quarantined node — ask-before-surfacing, no scheduled moment. */
export const Quarantined: Story = {
  args: {
    node: { ...node, status: "quarantined", surfacing: "ask", importance: 5, when: null },
  },
};
