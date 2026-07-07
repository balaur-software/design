import type { Meta, StoryObj } from "@storybook/react-vite";
import { Typewriter } from "./Typewriter.tsx";

const meta = {
  title: "OCTANT/Atoms/Typewriter",
  component: Typewriter,
  argTypes: {
    text: { control: "object", description: "A single string or a list of phrases cycled when loop is set." },
    speed: { control: { type: "number", min: 5, max: 200, step: 1 } },
    hold: { control: { type: "number", min: 0, max: 4000, step: 50 } },
    loop: { control: "boolean" },
    caret: { control: "boolean" },
    accent: { control: "color" },
    fontSize: { control: { type: "number", min: 10, max: 64, step: 1 } },
  },
} satisfies Meta<typeof Typewriter>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Cycles through the default phrase set behind the `>` prompt. */
export const Default: Story = {};

/** Types a single phrase once and stops. */
export const SinglePhrase: Story = {
  args: { text: "just Unicode.", loop: false },
};

/** Hides the leading prompt glyph. */
export const NoPrompt: Story = {
  args: { text: "no canvas. no images.", loop: false, prompt: null },
};

/** Faster typing with a shorter hold between phrases. */
export const Fast: Story = {
  args: {
    text: ["initialising kernel", "mounting glyph buffer", "ready."],
    speed: 28,
    hold: 700,
    fontSize: 15,
  },
};

/** No trailing caret block. */
export const NoCaret: Story = {
  args: { text: "steady output, no cursor", loop: false, caret: false },
};
