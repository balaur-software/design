import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { ToastProvider } from "../../primitives";
import { OTPInput } from "./OTPInput.tsx";

const meta = {
  title: "OCTANT/Molecules/OTPInput",
  component: OTPInput,
  args: { onChange: fn(), onComplete: fn() },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  argTypes: {
    length: { control: { type: "number", min: 2, max: 12, step: 1 } },
    value: { control: "text", description: "Controlled value (digits only)." },
    defaultValue: { control: "text" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof OTPInput>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Six empty cells. Type or paste a code; completion fires `onComplete`. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("textbox", { name: /digit 1 of 6/i }));
    await userEvent.keyboard("123456");
    await expect(args.onChange).toHaveBeenLastCalledWith("123456");
    await expect(args.onComplete).toHaveBeenCalledWith("123456");
    await expect(canvas.getByText(/code complete/i)).toBeVisible();
  },
};

/** Shorter code — cell count is driven by `length`. */
export const FourDigit: Story = { args: { length: 4 } };

/** Longer code. */
export const EightDigit: Story = { args: { length: 8 } };

/** Pre-filled + complete on mount: fires `onComplete` once. */
export const Prefilled: Story = { args: { defaultValue: "123456" } };

/** Controlled: value and onChange are owned by the parent. */
export const Controlled: Story = {
  render: (args) => {
    function Demo() {
      const [code, setCode] = useState("");
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 340 }}>
          <OTPInput value={code} onChange={setCode} onComplete={(v) => args.onComplete?.(v)} />
          <div style={{ fontSize: 12, color: "#9aa0ad" }}>value: {code || "—"}</div>
        </div>
      );
    }
    return <Demo />;
  },
};
