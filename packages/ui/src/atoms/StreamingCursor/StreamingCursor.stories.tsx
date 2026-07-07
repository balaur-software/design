import type { Meta, StoryObj } from "@storybook/react-vite";
import { StreamingCursor } from "./StreamingCursor";

const meta = {
  title: "OCTANT/Atoms/StreamingCursor",
  component: StreamingCursor,
  argTypes: {
    active: { control: "boolean" },
    glyph: { control: "text" },
    color: { control: "color" },
  },
} satisfies Meta<typeof StreamingCursor>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The blinking cursor trailing a line of streamed text. */
export const Default: Story = {
  render: (args) => (
    <span style={{ fontFamily: "var(--bx-font-mono, ui-monospace, monospace)", fontSize: 14 }}>
      streaming text
      <StreamingCursor {...args} />
    </span>
  ),
};

/** Inactive: the block stays visible but stops blinking. */
export const Inactive: Story = { args: { active: false } };
