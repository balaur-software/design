import type { Meta, StoryObj } from "@storybook/react-vite";
import { TypingIndicator } from "./TypingIndicator";

const meta = {
  title: "OCTANT/Molecules/TypingIndicator",
  component: TypingIndicator,
  argTypes: {
    label: { control: "text" },
  },
} satisfies Meta<typeof TypingIndicator>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Default "thinking" row: spinner, label, animated dots. */
export const Default: Story = {};

/** Custom label beside the spinner. */
export const CustomLabel: Story = { args: { label: "running tool" } };
