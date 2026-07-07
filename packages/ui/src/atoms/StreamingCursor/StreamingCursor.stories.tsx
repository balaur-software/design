import type { Meta, StoryObj } from "@storybook/react";
import { StreamingCursor } from "./StreamingCursor";

const meta: Meta<typeof StreamingCursor> = {
  title: "OCTANT/Atoms/StreamingCursor",
  component: StreamingCursor,
};
export default meta;

export const Default: StoryObj = {
  render: () => (
    <span style={{ fontFamily: "var(--bx-font-mono, ui-monospace, monospace)", fontSize: 14 }}>
      streaming text
      <StreamingCursor />
    </span>
  ),
};

export const Inactive: StoryObj = { args: { active: false } };
