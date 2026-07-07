import type { Meta, StoryObj } from "@storybook/react";
import { ReasoningBlock } from "./ReasoningBlock";

const meta: Meta<typeof ReasoningBlock> = {
  title: "OCTANT/Molecules/ReasoningBlock",
  component: ReasoningBlock,
};
export default meta;

const TEXT =
  "The user wants a rasterised meter. I'll reach for `bar8` since it draws eighth-block cells. Checking the load range next.";

export const Collapsed: StoryObj = { args: { text: TEXT } };
export const Expanded: StoryObj = { args: { text: TEXT, defaultCollapsed: false } };
