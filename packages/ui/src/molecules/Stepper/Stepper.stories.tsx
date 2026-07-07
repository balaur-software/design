import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { Stepper } from "./Stepper.tsx";

const meta = {
  title: "OCTANT/Molecules/Stepper",
  component: Stepper,
  args: { onChange: fn() },
  argTypes: {
    value: { control: { type: "number", min: 0, max: 999, step: 1 }, description: "Controlled value." },
    defaultValue: { control: { type: "number", min: 0, max: 999, step: 1 } },
    min: { control: { type: "number", min: -999, max: 999, step: 1 } },
    max: { control: { type: "number", min: 0, max: 9999, step: 1 } },
    step: { control: { type: "number", min: 1, max: 100, step: 1 } },
    label: { control: "text" },
    fillColor: { control: "color" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Stepper>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Default stepper; +/- buttons step the value and fire `onChange`. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Increase" }));
    await expect(args.onChange).toHaveBeenLastCalledWith(7);
    await expect(canvas.getByText("07")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Decrease" }));
    await expect(args.onChange).toHaveBeenLastCalledWith(6);
    await expect(canvas.getByText("06")).toBeInTheDocument();
  },
};

/** Two steps below the cap — the + button disables at `max`. */
export const NearFull: Story = {
  args: { label: "STEPPER · gain", defaultValue: 14, max: 16 },
};

/** Custom range with a cyan fill. */
export const Cyan: Story = {
  args: {
    label: "STEPPER · channels",
    defaultValue: 3,
    min: 0,
    max: 8,
    fillColor: "#2bd9d9",
  },
};

/** Disabled: both buttons inert and the bar drains. */
export const Disabled: Story = {
  args: { label: "STEPPER · locked", defaultValue: 9, disabled: true },
  play: async ({ canvas, userEvent, args }) => {
    const inc = canvas.getByRole("button", { name: "Increase" });
    await expect(inc).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Decrease" })).toBeDisabled();
    await userEvent.click(inc);
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** Controlled usage: the parent owns the value via `value` + `onChange`. */
export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState(6);
    return (
      <div style={{ display: "grid", gap: 14, width: 320 }}>
        <Stepper value={v} onChange={setV} label="STEPPER · controlled" />
        <div style={{ color: "#9aa0ad", fontSize: 12 }}>value = {v}</div>
      </div>
    );
  },
};
