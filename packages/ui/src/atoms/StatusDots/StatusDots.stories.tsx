import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusDots } from "./StatusDots.tsx";

const meta = {
  title: "OCTANT/Atoms/StatusDots",
  component: StatusDots,
  argTypes: {
    dots: { control: "object", description: "Status entries: { label, color }." },
    gap: { control: { type: "number", min: 4, max: 60, step: 1 } },
  },
} satisfies Meta<typeof StatusDots>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The default ONLINE / IDLE / BUSY / OFFLINE legend. */
export const Default: Story = {};

/** A custom pipeline-status set with cyan and magenta accents. */
export const Pipeline: Story = {
  args: {
    dots: [
      { label: "BUILDING", color: "#2bd9d9" },
      { label: "DEPLOYING", color: "#d79bff" },
      { label: "PASSED", color: "var(--bx-accent, #46c66d)" },
      { label: "FAILED", color: "#ff6b6f" },
    ],
  },
};

/** A single entry, useful inline next to a heading. */
export const Single: Story = {
  args: {
    dots: [{ label: "LIVE", color: "var(--bx-accent, #46c66d)" }],
  },
};

/** Tighter spacing between markers. */
export const Compact: Story = {
  args: { gap: 10 },
};
