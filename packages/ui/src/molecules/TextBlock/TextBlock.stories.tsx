import type { Meta, StoryObj } from "@storybook/react";
import { TextBlock } from "./TextBlock";

const meta: Meta<typeof TextBlock> = {
  title: "OCTANT/Molecules/TextBlock",
  component: TextBlock,
};
export default meta;

export const Plain: StoryObj = { args: { text: "Reading the buffer and rasterising the field." } };

export const Formatted: StoryObj = {
  args: {
    text: "Used `bar8(load)` to draw the meter.\nSee **the docs** at https://octant.io for more.",
  },
};

export const Streaming: StoryObj = {
  args: { text: "Rendering frame 4 of 8…", streaming: true },
};
