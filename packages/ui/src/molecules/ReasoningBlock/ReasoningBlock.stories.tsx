import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ReasoningBlock } from "./ReasoningBlock";

const TEXT =
  "The user wants a rasterised meter. I'll reach for `bar8` since it draws eighth-block cells. Checking the load range next.";

const meta: Meta<typeof ReasoningBlock> = {
  title: "OCTANT/Molecules/ReasoningBlock",
  component: ReasoningBlock,
  tags: ["autodocs"],
  args: { text: TEXT, defaultCollapsed: true },
  argTypes: {
    text: { control: "text" },
    defaultCollapsed: { control: "boolean" },
    collapsed: { control: "boolean", description: "Controlled collapsed state." },
    onCollapsedChange: { action: "collapsed-changed" },
  },
};
export default meta;

type Story = StoryObj<typeof ReasoningBlock>;

export const Default: Story = {};

export const Collapsed: Story = { args: { text: TEXT } };
export const Expanded: Story = { args: { text: TEXT, defaultCollapsed: false } };
export const Controlled: Story = { args: { text: TEXT, collapsed: false, onCollapsedChange: fn() } };
