import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextBlock } from "./TextBlock";

const meta = {
  title: "OCTANT/Molecules/TextBlock",
  component: TextBlock,
  argTypes: {
    text: { control: "text" },
    streaming: { control: "boolean" },
  },
} satisfies Meta<typeof TextBlock>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Plain single-line text with no inline formatting. */
export const Plain: Story = { args: { text: "Reading the buffer and rasterising the field." } };

/** Inline `code`, **bold**, and a bare URL rendered as a link. */
export const Formatted: Story = {
  args: {
    text: "Used `bar8(load)` to draw the meter.\nSee **the docs** at https://octant.io for more.",
  },
};

/** In-progress stream text with a blinking trailing cursor. */
export const Streaming: Story = {
  args: { text: "Rendering frame 4 of 8…", streaming: true },
};
