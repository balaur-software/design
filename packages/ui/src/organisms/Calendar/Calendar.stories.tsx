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

/** Boundary: February in a leap year has a 29th. */
export const LeapFebruary: Story = {
  args: { defaultMonth: new Date(2024, 1, 1) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/^february 2024$/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: /^29 february 2024$/i })).toBeVisible();
  },
};

/** Boundary: February in a non-leap year stops at the 28th — no 29th cell. */
export const NonLeapFebruary: Story = {
  args: { defaultMonth: new Date(2025, 1, 1) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/^february 2025$/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: /^28 february 2025$/i })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: /^29 february 2025$/i })).toBeNull();
  },
};

/** Boundary: December → January year rollover, and back down through November. */
export const YearRollover: Story = {
  args: { defaultMonth: new Date(2025, 11, 1) },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText(/^december 2025$/i)).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Next month" }));
    await expect(canvas.getByText(/^january 2026$/i)).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Previous month" }));
    await userEvent.click(canvas.getByRole("button", { name: "Previous month" }));
    await expect(canvas.getByText(/^november 2025$/i)).toBeVisible();
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
