import type { Meta, StoryObj } from "@storybook/react";
import { StreamingCursor } from "./StreamingCursor";

const meta: Meta<typeof StreamingCursor> = {
  title: "OCTANT/Atoms/StreamingCursor",
  component: StreamingCursor,
  tags: ["autodocs"],
  argTypes: {
    active: { control: "boolean" },
    glyph: { control: "text" },
    color: { control: "color" },
  },
};
export default meta;

type Story = StoryObj<typeof StreamingCursor>;

export const Default: Story = {
  render: () => (
    <span style={{ fontFamily: "var(--bx-font-mono, ui-monospace, monospace)", fontSize: 14 }}>
      streaming text
      <StreamingCursor />
    </span>
  ),
};

export const Inactive: Story = { args: { active: false } };
