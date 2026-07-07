import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { ProgressBar } from "./ProgressBar.tsx";

const meta = {
  title: "OCTANT/Atoms/ProgressBar",
  component: ProgressBar,
  args: { value: 0.66, label: "LINK" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 1, step: 0.01 }, description: "Progress fraction 0..1." },
    label: { control: "text" },
    color: { control: "color" },
    showPercent: { control: "boolean" },
    ease: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
  },
} satisfies Meta<typeof ProgressBar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Two-thirds full with the default accent. */
export const Default: Story = {};

/** Amber bar at 40%. */
export const Hash: Story = {
  args: { value: 0.4, label: "HASH", color: "#f2c94c" },
};

/** Empty and full bars — the range endpoints. */
export const Endpoints: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 13, width: 320 }}>
      <ProgressBar value={0} label="IDLE" />
      <ProgressBar value={1} label="DONE" />
    </div>
  ),
};

/** Several bars stacked with different colours. */
export const Stack: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 13, width: 320 }}>
      <ProgressBar value={0.82} label="LINK" />
      <ProgressBar value={0.4} label="HASH" color="#f2c94c" />
      <ProgressBar value={0.61} label="STREAM" color="#2bd9d9" />
    </div>
  ),
};

function LoopingBars() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      setT((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const f1 = Math.min(1, (t * 0.16) % 1.25);
  const f2 = Math.min(1, (t * 0.1 + 0.3) % 1.4);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13, width: 320 }}>
      <ProgressBar value={f1} label="LINK" />
      <ProgressBar value={f2} label="HASH" color="#f2c94c" />
    </div>
  );
}

/** Continuously looping values to show the eased fill animation. */
export const Animated: Story = {
  render: () => <LoopingBars />,
};
