import type { Meta, StoryObj } from "@storybook/react";
import { TypingIndicator } from "./TypingIndicator";

const meta: Meta<typeof TypingIndicator> = {
  title: "OCTANT/Molecules/TypingIndicator",
  component: TypingIndicator,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
  },
};
export default meta;

type Story = StoryObj<typeof TypingIndicator>;

export const Default: Story = {};
export const CustomLabel: Story = { args: { label: "running tool" } };
