import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton.tsx";

const meta: Meta<typeof Skeleton> = {
  title: "OCTANT/Atoms/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    avatar: { control: "boolean" },
    avatarSize: { control: { type: "number", min: 16, max: 128, step: 2 } },
    lines: { control: "object", description: "Widths of the avatar-row placeholders." },
    footerLines: { control: "object", description: "Widths of the stacked footer rows." },
    lineHeight: { control: { type: "number", min: 6, max: 40, step: 1 } },
    gap: { control: { type: "number", min: 0, max: 40, step: 1 } },
    color: { control: "color" },
  },
};
export default meta;
type Story = StoryObj<typeof Skeleton>;

/** The reference card: an avatar block, three header rows, two footer rows. */
export const Default: Story = {};

/** No avatar — a plain block of text placeholder rows. */
export const TextBlock: Story = {
  args: {
    label: "SKELETON · article",
    avatar: false,
    lines: ["100%", "96%", "88%", "72%", "40%"],
    footerLines: [],
  },
};

/** A media object with a larger avatar and a couple of caption rows. */
export const MediaObject: Story = {
  args: {
    label: "SKELETON · media",
    avatarSize: 72,
    lines: ["64%", "42%"],
    footerLines: [],
  },
};

/** A stack of full-width rows for list / feed placeholders. */
export const List: Story = {
  args: {
    label: "SKELETON · feed",
    avatar: false,
    lines: [],
    footerLines: ["100%", "100%", "100%", "100%", "100%"],
    lineHeight: 14,
    gap: 12,
  },
};
