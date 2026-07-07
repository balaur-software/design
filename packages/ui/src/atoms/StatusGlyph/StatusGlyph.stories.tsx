import type { Meta, StoryObj } from "@storybook/react";
import type { MemoryStatus } from "../../organisms/MemoryExplorer/memory-types";
import { StatusGlyph } from "./StatusGlyph";

const meta: Meta<typeof StatusGlyph> = {
  title: "OCTANT/Atoms/StatusGlyph",
  component: StatusGlyph,
};
export default meta;

const STATUSES: MemoryStatus[] = [
  "active",
  "proposed",
  "archived",
  "rejected",
  "quarantined",
  "forgotten",
  "merged",
];

export const Row: StoryObj = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {STATUSES.map((s) => (
        <StatusGlyph key={s} status={s} showLabel />
      ))}
    </div>
  ),
};

export const Bare: StoryObj = {
  render: () => (
    <div style={{ display: "flex", gap: 14, fontSize: 18 }}>
      {STATUSES.map((s) => (
        <StatusGlyph key={s} status={s} size={18} />
      ))}
    </div>
  ),
};
