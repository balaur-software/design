import type { Meta, StoryObj } from "@storybook/react";
import { EdgeArc } from "./EdgeArc";

const meta: Meta<typeof EdgeArc> = {
  title: "OCTANT/Atoms/EdgeArc",
  component: EdgeArc,
};
export default meta;

const TYPES = ["links", "supersedes", "merged_into", "derived_from", "on_day", "no_match"];

export const Types: StoryObj = {
  render: () => (
    <svg width={420} height={240} style={{ background: "var(--bx-bg, #0a0b0e)" }}>
      <title>Edge types</title>
      {TYPES.map((t, i) => (
        <EdgeArc key={t} x1={20} y1={20 + i * 36} x2={400} y2={20 + i * 36} edgeType={t} highlighted />
      ))}
    </svg>
  ),
};

export const States: StoryObj = {
  render: () => (
    <svg width={420} height={180} style={{ background: "var(--bx-bg, #0a0b0e)" }}>
      <title>Edge arc states</title>
      <EdgeArc x1={20} y1={30} x2={400} y2={30} edgeType="links" />
      <EdgeArc x1={20} y1={70} x2={400} y2={70} edgeType="links" highlighted />
      <EdgeArc x1={20} y1={110} x2={400} y2={110} edgeType="supersedes" closed />
      <EdgeArc x1={20} y1={150} x2={400} y2={150} edgeType="no_match" curve={0.18} highlighted />
    </svg>
  ),
};
