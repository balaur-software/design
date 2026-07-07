import type { Meta, StoryObj } from "@storybook/react";
import { Steps } from "./Steps.tsx";

const meta: Meta<typeof Steps> = {
  title: "OCTANT/Molecules/Steps",
  component: Steps,
  tags: ["autodocs"],
  args: { steps: ["DECODE", "DITHER", "RENDER", "EXPORT"], defaultStep: 2 },
  argTypes: {
    steps: { control: "object", description: "Ordered stage labels." },
    step: { control: { type: "number", min: 0, max: 20, step: 1 }, description: "Controlled active index." },
    defaultStep: { control: { type: "number", min: 0, max: 20, step: 1 } },
    onStepChange: { action: "step-changed" },
  },
};
export default meta;
type Story = StoryObj<typeof Steps>;

export const Default: Story = {};

export const First: Story = { args: { defaultStep: 0 } };

export const Complete: Story = {
  args: { steps: ["DECODE", "DITHER", "RENDER", "EXPORT"], defaultStep: 4 },
};

export const ThreeStage: Story = {
  args: { steps: ["QUEUE", "BUILD", "SHIP"], defaultStep: 1 },
};
