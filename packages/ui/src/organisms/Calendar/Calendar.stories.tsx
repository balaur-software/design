import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { Calendar } from "./Calendar.tsx";

const meta = {
  title: "OCTANT/Organisms/Calendar",
  component: Calendar,
  args: { onSelect: fn() },
  argTypes: {
    value: { control: "date", description: "Controlled selected day." },
    defaultValue: { control: "date" },
    defaultMonth: { control: "date" },
  },
} satisfies Meta<typeof Calendar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The current month; clicking a day selects it and fires `onSelect`. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const day = canvas.getByRole("button", { name: /^15 / });
    await expect(day).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(day);
    await expect(day).toHaveAttribute("aria-pressed", "true");
    await expect(args.onSelect).toHaveBeenCalledTimes(1);
    await expect(args.onSelect).toHaveBeenCalledWith(expect.any(Date));
  },
};

/** Opens with the 15th of the current month pre-selected. */
export const WithSelection: Story = {
  args: { defaultValue: new Date(new Date().getFullYear(), new Date().getMonth(), 15) },
};

/** The calendar composed inside a bordered card surface. */
export const InCard: Story = {
  render: (args) => (
    <div
      style={{
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-3, #0c0d11)",
        padding: 22,
      }}
    >
      <div style={{ color: "#5b616e", fontSize: 11, letterSpacing: "0.1em", marginBottom: 16 }}>CALENDAR</div>
      <Calendar {...args} />
    </div>
  ),
};

/** Fully controlled selection — the caption mirrors the chosen day. */
export const Controlled: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 286 }}>
        <Calendar value={date} onSelect={setDate} />
        <div style={{ fontSize: 12, color: "var(--bx-text-4, #9aa0ad)" }}>
          {date ? `SELECTED: ${date.toDateString()}` : "no date selected"}
        </div>
      </div>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText("no date selected")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /^10 / }));
    await expect(canvas.getByText(/^SELECTED:/)).toBeVisible();
  },
};
