import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { MemoryEdge } from "../../organisms/MemoryExplorer/memory-types";
import { EdgeRow } from "./EdgeRow";

const base: MemoryEdge = {
  id: "e1",
  source: "a",
  target: "b",
  type: "links",
  validFrom: null,
  validUntil: null,
  created: "2026-07-04T20:14:03.123Z",
};

const meta = {
  title: "OCTANT/Molecules/EdgeRow",
  component: EdgeRow,
  args: {
    edge: { ...base, type: "links", validFrom: "2026-07-01" },
    fromTitle: "lake house",
    toTitle: "Ana",
    onClick: fn(),
  },
  argTypes: {
    edge: {
      control: "object",
      description: "MemoryEdge: { id, source, target, type, validFrom?, validUntil?, created }.",
    },
    fromTitle: { control: "text" },
    toTitle: { control: "text" },
    outgoing: { control: "boolean" },
  },
} satisfies Meta<typeof EdgeRow>;
export default meta;

type Story = StoryObj<typeof meta>;

/** An open outgoing "links" edge — clicking the row hands the far node's id (target) to onClick. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /lake house → Ana/i }));
    await expect(args.onClick).toHaveBeenCalledWith("b");
  },
};

const edges: MemoryEdge[] = [
  { ...base, id: "1", type: "links", validFrom: "2026-07-01", validUntil: null },
  { ...base, id: "2", type: "supersedes" },
  { ...base, id: "3", type: "merged_into" },
  { ...base, id: "4", type: "derived_from", validFrom: "2026-06-01", validUntil: "2026-06-30" },
  { ...base, id: "5", type: "on_day" },
  { ...base, id: "6", type: "no_match" },
];

/** Every edge type's stroke style, including a closed (faded) validity window. */
export const Types: Story = {
  render: () => (
    <div style={{ width: 460, border: "1px solid var(--bx-border, #1c1d24)" }}>
      {edges.map((e) => (
        <EdgeRow key={e.id} edge={e} fromTitle="lake house" toTitle="Ana" />
      ))}
    </div>
  ),
};

/** An incoming edge — the titles flip to `to → from`. */
export const Incoming: Story = {
  render: () => (
    <div style={{ width: 460, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <EdgeRow edge={edges[1]!} fromTitle="old note" toTitle="lake house" outgoing={false} />
    </div>
  ),
};
