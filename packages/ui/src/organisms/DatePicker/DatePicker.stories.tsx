import type { Meta, StoryObj } from "@storybook/react";
import { DatePicker } from "./DatePicker.tsx";

const meta: Meta<typeof DatePicker> = {
  title: "OCTANT/Organisms/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
  argTypes: {
    value: { control: "date", description: "Controlled selected day." },
    defaultValue: { control: "date" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    width: { control: { type: "number", min: 120, max: 480, step: 8 } },
    align: { control: "radio", options: ["start", "end"] },
    onChange: { action: "changed" },
  },
};
export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {};

export const Prefilled: Story = {
  args: { defaultValue: new Date(2026, 6, 6) },
};

export const Disabled: Story = {
  args: { defaultValue: new Date(2026, 0, 1), disabled: true },
};

export const EndAligned: Story = {
  render: () => (
    <div style={{ display: "flex", justifyContent: "flex-end", width: 360 }}>
      <DatePicker align="end" placeholder="pick a day…" />
    </div>
  ),
};

export const WithHint: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 240 }}>
      <div style={{ fontSize: 12, color: "#9aa0ad", letterSpacing: "0.04em" }}>RENDER DATE</div>
      <DatePicker />
      <div style={{ color: "#3f424d", fontSize: 11, marginTop: 10 }}>
        click the field · pick a day · it fills and closes
      </div>
    </div>
  ),
};
