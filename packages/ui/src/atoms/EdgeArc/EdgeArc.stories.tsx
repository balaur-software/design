import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { EdgeArc } from "./EdgeArc";

const EDGE_TYPES = ["links", "supersedes", "merged_into", "derived_from", "on_day", "no_match"];

const meta = {
  title: "OCTANT/Atoms/EdgeArc",
  component: EdgeArc,
  args: {
    x1: 20,
    y1: 30,
    x2: 400,
    y2: 30,
    edgeType: "links",
    highlighted: true,
    onClick: fn(),
  },
  argTypes: {
    edgeType: { control: "select", options: EDGE_TYPES },
    x1: { control: { type: "number", min: 0, max: 400, step: 1 } },
    y1: { control: { type: "number", min: 0, max: 240, step: 1 } },
    x2: { control: { type: "number", min: 0, max: 400, step: 1 } },
    y2: { control: { type: "number", min: 0, max: 240, step: 1 } },
    curve: { control: { type: "range", min: -0.5, max: 0.5, step: 0.01 } },
    strokeWidth: { control: { type: "number", min: 0.5, max: 6, step: 0.5 } },
    closed: { control: "boolean" },
    highlighted: { control: "boolean" },
  },
  render: (args) => (
    <svg width={420} height={120} style={{ background: "var(--bx-bg, #0a0b0e)" }}>
      <title>Edge arc</title>
      <EdgeArc {...args} />
    </svg>
  ),
} satisfies Meta<typeof EdgeArc>;
export default meta;

type Story = StoryObj<typeof meta>;

/** A single highlighted `links` edge; the stroke itself is the click target. */
export const Default: Story = {
  play: async ({ canvasElement, userEvent, args }) => {
    const path = canvasElement.querySelector("path");
    await expect(path).not.toBeNull();
    if (path) await userEvent.click(path);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

const TYPES = EDGE_TYPES;

/** One row per edge type, each with its own dash/colour from `EDGE_STYLE`. */
export const Types: Story = {
  render: () => (
    <svg width={420} height={240} style={{ background: "var(--bx-bg, #0a0b0e)" }}>
      <title>Edge types</title>
      {TYPES.map((t, i) => (
        <EdgeArc key={t} x1={20} y1={20 + i * 36} x2={400} y2={20 + i * 36} edgeType={t} highlighted />
      ))}
    </svg>
  ),
};

/** Base, highlighted, closed (faded) and curved edges. */
export const States: Story = {
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
