import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";
import { ScrambleButton } from "./ScrambleButton.tsx";

const meta = {
  title: "OCTANT/Molecules/ScrambleButton",
  component: ScrambleButton,
  args: { text: "DECRYPT", onClick: fn() },
  argTypes: {
    text: { control: "text" },
    color: { control: "color" },
    borderColor: { control: "color" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof ScrambleButton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Hovering scrambles the label into place; the button stays a plain clickable button. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole("button");
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
    // after the 560ms scramble resolves the label reads its true text again
    await waitFor(() => expect(button).toHaveTextContent("DECRYPT"), { timeout: 1500 });
  },
};

export const Cyan: Story = {
  args: { text: "DECODE", color: "#2bd9d9", borderColor: "#1d3540" },
};

export const Accent: Story = {
  args: {
    text: "AUTHORIZE",
    color: "var(--bx-accent, #46c66d)",
    borderColor: "var(--bx-border-accent, #2a3320)",
  },
};

/** Disabled: never scrambles and swallows clicks. */
export const Disabled: Story = {
  args: { text: "LOCKED", disabled: true },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole("button", { name: /locked/i });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
      <ScrambleButton text="DECRYPT" />
      <ScrambleButton text="DECODE" color="#2bd9d9" borderColor="#1d3540" />
      <ScrambleButton
        text="AUTHORIZE"
        color="var(--bx-accent, #46c66d)"
        borderColor="var(--bx-border-accent, #2a3320)"
      />
      <ScrambleButton text="LOCKED" disabled />
    </div>
  ),
};
