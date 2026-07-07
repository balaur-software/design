import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { DatePicker } from "./DatePicker.tsx";

const meta = {
  title: "OCTANT/Organisms/DatePicker",
  component: DatePicker,
  args: { onChange: fn() },
  argTypes: {
    value: { control: "date", description: "Controlled selected day." },
    defaultValue: { control: "date" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    width: { control: { type: "number", min: 120, max: 480, step: 8 } },
    align: { control: "radio", options: ["start", "end"] },
  },
} satisfies Meta<typeof DatePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Click the field, pick a day — it fills the input (ISO) and closes. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const field = canvas.getByRole("combobox");
    await userEvent.click(field);
    await expect(field).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(canvas.getByRole("button", { name: /^15 / }));
    await expect(args.onChange).toHaveBeenCalledWith(expect.any(Date));
    await expect(field).toHaveDisplayValue(/-15$/);
    await expect(field).toHaveAttribute("aria-expanded", "false");
  },
};

/** Uncontrolled with an initial day via `defaultValue`. */
export const Prefilled: Story = {
  args: { defaultValue: new Date(2026, 6, 6) },
};

/** Disabled: the field dims and the calendar never opens. */
export const Disabled: Story = {
  args: { defaultValue: new Date(2026, 0, 1), disabled: true },
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("combobox");
    await expect(field).toBeDisabled();
    await userEvent.click(field);
    await expect(field).toHaveAttribute("aria-expanded", "false");
  },
};

/** `align="end"` anchors the popup to the field's right edge. */
export const EndAligned: Story = {
  args: { align: "end", placeholder: "pick a day…" },
  render: (args) => (
    <div style={{ display: "flex", justifyContent: "flex-end", width: 360 }}>
      <DatePicker {...args} />
    </div>
  ),
};

/** The field composed with a label and helper hint. */
export const WithHint: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 240 }}>
      <div style={{ fontSize: 12, color: "#9aa0ad", letterSpacing: "0.04em" }}>RENDER DATE</div>
      <DatePicker {...args} />
      <div style={{ color: "#3f424d", fontSize: 11, marginTop: 10 }}>
        click the field · pick a day · it fills and closes
      </div>
    </div>
  ),
};
