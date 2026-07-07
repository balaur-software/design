import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
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

const meta: Meta<typeof EdgeRow> = {
  title: "OCTANT/Molecules/EdgeRow",
  component: EdgeRow,
  tags: ["autodocs"],
  args: {
    edge: { ...base, type: "links", validFrom: "2026-07-01" },
    fromTitle: "lake house",
    toTitle: "Ana",
  },
  argTypes: {
    edge: {
      control: "object",
      description: "MemoryEdge: { id, source, target, type, validFrom?, validUntil?, created }.",
    },
    fromTitle: { control: "text" },
    toTitle: { control: "text" },
    outgoing: { control: "boolean" },
    onClick: { action: "clicked" },
  },
};
export default meta;

type Story = StoryObj<typeof EdgeRow>;

export const Default: Story = { args: { onClick: fn() } };

const edges: MemoryEdge[] = [
  { ...base, id: "1", type: "links", validFrom: "2026-07-01", validUntil: null },
  { ...base, id: "2", type: "supersedes" },
  { ...base, id: "3", type: "merged_into" },
  { ...base, id: "4", type: "derived_from", validFrom: "2026-06-01", validUntil: "2026-06-30" },
  { ...base, id: "5", type: "on_day" },
  { ...base, id: "6", type: "no_match" },
];

export const Types: Story = {
  render: () => (
    <div style={{ width: 460, border: "1px solid var(--bx-border, #1c1d24)" }}>
      {edges.map((e) => (
        <EdgeRow key={e.id} edge={e} fromTitle="lake house" toTitle="Ana" />
      ))}
    </div>
  ),
};

export const Incoming: Story = {
  render: () => (
    <div style={{ width: 460, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <EdgeRow edge={edges[1]!} fromTitle="old note" toTitle="lake house" outgoing={false} />
    </div>
  ),
};
