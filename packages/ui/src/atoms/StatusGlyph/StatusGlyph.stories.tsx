import type { Meta, StoryObj } from "@storybook/react";
import type { MemoryStatus } from "../../organisms/MemoryExplorer/memory-types";
import { StatusGlyph } from "./StatusGlyph";

const STATUSES: MemoryStatus[] = [
  "active",
  "proposed",
  "archived",
  "rejected",
  "quarantined",
  "forgotten",
  "merged",
];

const meta: Meta<typeof StatusGlyph> = {
  title: "OCTANT/Atoms/StatusGlyph",
  component: StatusGlyph,
  tags: ["autodocs"],
  args: { status: "active", showLabel: true },
  argTypes: {
    status: { control: "select", options: STATUSES },
    size: { control: { type: "number", min: 8, max: 48, step: 1 } },
    showLabel: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof StatusGlyph>;

export const Default: Story = {};

export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {STATUSES.map((s) => (
        <StatusGlyph key={s} status={s} showLabel />
      ))}
    </div>
  ),
};

export const Bare: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 14, fontSize: 18 }}>
      {STATUSES.map((s) => (
        <StatusGlyph key={s} status={s} size={18} />
      ))}
    </div>
  ),
};
