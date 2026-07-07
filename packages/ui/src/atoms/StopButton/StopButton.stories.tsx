import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { StopButton } from "./StopButton";

const meta = {
  title: "OCTANT/Atoms/StopButton",
  component: StopButton,
  args: { onClick: fn() },
  argTypes: {
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof StopButton>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The square cancel-generation button; clicking it fires onClick. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: /stop generation/i });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/** Disabled state dims the glyph and blocks clicks. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: /stop generation/i });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
