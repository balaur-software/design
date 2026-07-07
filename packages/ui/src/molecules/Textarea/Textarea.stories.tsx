import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea.tsx";

const meta: Meta<typeof Textarea> = {
  title: "OCTANT/Molecules/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  argTypes: {
    value: { control: "text", description: "Controlled value." },
    defaultValue: { control: "text" },
    maxLength: { control: { type: "number", min: 1, max: 10000, step: 1 } },
    hint: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    onChange: { action: "changed" },
  },
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const Prefilled: Story = {
  args: {
    defaultValue: "render target: nebula field\nresolution: 1024x1024\nseed: 8823",
  },
};

export const NearLimit: Story = {
  args: {
    maxLength: 80,
    defaultValue: "this note is getting close to the character cap so the counter turns amber",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "locked — read only",
  },
};

export const Wide: Story = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Textarea hint="commit message" placeholder="summarize the change…" maxLength={120} />
    </div>
  ),
};
