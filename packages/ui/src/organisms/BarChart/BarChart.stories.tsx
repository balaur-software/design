import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarChart } from "./BarChart.tsx";

const meta = {
  title: "OCTANT/Organisms/BarChart",
  component: BarChart,
  argTypes: {
    data: { control: "object", description: "Rows: { label, value (0..1), color? }." },
    title: { control: "text" },
    hint: { control: "text" },
    stagger: { control: { type: "number", min: 0, max: 200, step: 5 } },
  },
} satisfies Meta<typeof BarChart>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Four accent-coloured bars with the default sweep-in stagger. */
export const Default: Story = {
  args: {
    data: [
      { label: "ROOT", value: 0.42 },
      { label: "HOME", value: 0.78 },
      { label: "VAR", value: 0.19 },
      { label: "TMP", value: 0.06 },
    ],
  },
};

/** Adds the title + hint header row above the bars. */
export const SingleAccent: Story = {
  args: {
    title: "BAR · disk usage",
    hint: "SSD",
    data: [
      { label: "ROOT", value: 0.42 },
      { label: "HOME", value: 0.78 },
      { label: "VAR", value: 0.19 },
      { label: "TMP", value: 0.06 },
    ],
  },
};

/** Per-row colours with a tightened 30ms stagger. */
export const FastSweep: Story = {
  args: {
    title: "BAR · cache hit",
    hint: "STAGGER 30",
    stagger: 30,
    data: [
      { label: "L1", value: 0.96, color: "#2bd9d9" },
      { label: "L2", value: 0.81, color: "#46c66d" },
      { label: "L3", value: 0.64, color: "#f2c94c" },
      { label: "DRAM", value: 0.28, color: "#ff6b6f" },
    ],
  },
};

/** A six-row chart exercising the full palette. */
export const Full: Story = {
  args: {
    data: [
      { label: "ALPHA", value: 0.84, color: "#46c66d" },
      { label: "BETA", value: 0.62, color: "#2bd9d9" },
      { label: "GAMMA", value: 0.71, color: "#f2c94c" },
      { label: "DELTA", value: 0.35, color: "#c061ff" },
      { label: "EPSILON", value: 0.52, color: "#ff6b6f" },
      { label: "ZETA", value: 0.93, color: "#74e692" },
    ],
  },
};
