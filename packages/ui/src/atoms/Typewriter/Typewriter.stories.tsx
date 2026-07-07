import type { Meta, StoryObj } from "@storybook/react";
import { Typewriter } from "./Typewriter.tsx";

const meta: Meta<typeof Typewriter> = {
  title: "OCTANT/Atoms/Typewriter",
  component: Typewriter,
  tags: ["autodocs"],
  argTypes: {
    text: { control: "object", description: "A single string or a list of phrases cycled when loop is set." },
    speed: { control: { type: "number", min: 5, max: 200, step: 1 } },
    hold: { control: { type: "number", min: 0, max: 4000, step: 50 } },
    loop: { control: "boolean" },
    caret: { control: "boolean" },
    accent: { control: "color" },
    fontSize: { control: { type: "number", min: 10, max: 64, step: 1 } },
  },
};
export default meta;
type Story = StoryObj<typeof Typewriter>;

export const Default: Story = {};

export const SinglePhrase: Story = {
  args: { text: "just Unicode.", loop: false },
};

export const NoPrompt: Story = {
  args: { text: "no canvas. no images.", loop: false, prompt: null },
};

export const Fast: Story = {
  args: {
    text: ["initialising kernel", "mounting glyph buffer", "ready."],
    speed: 28,
    hold: 700,
    fontSize: 15,
  },
};

export const NoCaret: Story = {
  args: { text: "steady output, no cursor", loop: false, caret: false },
};
