import type { Meta, StoryObj } from "@storybook/react";
import { StopButton } from "./StopButton";

const meta: Meta<typeof StopButton> = {
  title: "OCTANT/Atoms/StopButton",
  component: StopButton,
};
export default meta;

export const Default: StoryObj = {};
export const Disabled: StoryObj = { args: { disabled: true } };
