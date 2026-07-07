import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { StopButton } from "./StopButton";

const meta: Meta<typeof StopButton> = {
  title: "OCTANT/Atoms/StopButton",
  component: StopButton,
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    onClick: { action: "clicked" },
  },
};
export default meta;

type Story = StoryObj<typeof StopButton>;

export const Default: Story = { args: { onClick: fn() } };
export const Disabled: Story = { args: { disabled: true } };
