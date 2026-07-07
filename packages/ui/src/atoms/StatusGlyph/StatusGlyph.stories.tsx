import type { Meta, StoryObj } from "@storybook/react-vite";
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

const meta = {
  title: "OCTANT/Atoms/StatusGlyph",
  component: StatusGlyph,
  args: { status: "active", showLabel: true },
  argTypes: {
    status: { control: "select", options: STATUSES },
    size: { control: { type: "number", min: 8, max: 48, step: 1 } },
    showLabel: { control: "boolean" },
  },
} satisfies Meta<typeof StatusGlyph>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The active-status glyph with its label. */
export const Default: Story = {};

/** Every memory status stacked with labels. */
export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {STATUSES.map((s) => (
        <StatusGlyph key={s} status={s} showLabel />
      ))}
    </div>
  ),
};

/** Glyphs only, no labels — for dense inline use. */
export const Bare: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 14, fontSize: 18 }}>
      {STATUSES.map((s) => (
        <StatusGlyph key={s} status={s} size={18} />
      ))}
    </div>
  ),
};
