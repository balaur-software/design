import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { SegmentedControl } from "./SegmentedControl.tsx";

const meta = {
  title: "OCTANT/Molecules/SegmentedControl",
  component: SegmentedControl,
  args: { options: ["LOW", "MED", "HIGH"], "aria-label": "Intensity", onChange: fn() },
  argTypes: {
    options: { control: "object", description: "Segment labels, left-to-right." },
    value: { control: "text", description: "Controlled selected option." },
    defaultValue: { control: "text" },
    "aria-label": { control: "text" },
  },
} satisfies Meta<typeof SegmentedControl>;
export default meta;
type Story = StoryObj<typeof meta>;

/** First segment active; clicking another slides the accent underline to it. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const high = canvas.getByRole("radio", { name: "HIGH" });
    await expect(canvas.getByRole("radio", { name: "LOW" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(high);
    await expect(high).toHaveAttribute("aria-checked", "true");
    await expect(args.onChange).toHaveBeenCalledWith("HIGH");
  },
};

export const PreSelected: Story = {
  args: { options: ["LOW", "MED", "HIGH"], defaultValue: "HIGH" },
};

/** A five-segment time-range picker. */
export const ManyOptions: Story = {
  args: { options: ["1H", "24H", "7D", "30D", "ALL"], defaultValue: "24H", "aria-label": "Range" },
};

/** Controlled: the selected option is owned by the parent. */
export const Controlled: Story = {
  render: (args) => {
    const [val, setVal] = useState("MED");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SegmentedControl {...args} value={val} onChange={setVal} />
        <div style={{ color: "#7b8290", fontSize: 12 }}>selected: {val}</div>
      </div>
    );
  },
};
