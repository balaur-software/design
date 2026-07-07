import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { MemoryNode } from "../MemoryExplorer/memory-types";
import { PendingQueue } from "./PendingQueue";

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

const meta = {
  title: "OCTANT/Organisms/PendingQueue",
  component: PendingQueue,
  args: {
    items,
    onSelect: fn(),
    onVerdict: fn(),
  },
  argTypes: {
    items: { control: "object", description: "Proposed MemoryNode[] awaiting verdict." },
    selectedId: { control: "text" },
    header: { control: "object", description: "Optional header node above the list." },
  },
} satisfies Meta<typeof PendingQueue>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Three proposed nodes, each with the four owner verdicts. */
export const Default: Story = {
  args: { style: { width: 380 } },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByText(/pending · 3/i)).toBeVisible();

    // Selecting a row reports its id (the row name starts with its status badge;
    // the verdict buttons are named "approve/reject <title>" and must not match).
    await userEvent.click(canvas.getByRole("button", { name: /^proposed ribollita recipe/i }));
    await expect(args.onSelect).toHaveBeenCalledWith("p3");

    // Each verdict button reports (id, verdict).
    await userEvent.click(canvas.getByRole("button", { name: "approve sourdough method" }));
    await expect(args.onVerdict).toHaveBeenCalledWith("p1", "approve");
    await userEvent.click(canvas.getByRole("button", { name: "reject Marc — neighbour" }));
    await expect(args.onVerdict).toHaveBeenCalledWith("p2", "reject");
  },
};

/** Nothing awaits a verdict — the queue collapses to an empty state. */
export const Empty: Story = {
  args: { items: [], style: { width: 380 } },
};
