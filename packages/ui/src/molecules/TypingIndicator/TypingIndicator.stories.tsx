import type { Meta, StoryObj } from "@storybook/react";
import { TypingIndicator } from "./TypingIndicator";

const meta: Meta<typeof TypingIndicator> = {
  title: "OCTANT/Molecules/TypingIndicator",
  component: TypingIndicator,
};
export default meta;

export const Default: StoryObj = {};
export const CustomLabel: StoryObj = { args: { label: "running tool" } };
