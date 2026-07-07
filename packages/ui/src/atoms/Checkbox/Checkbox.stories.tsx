import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Checkbox } from "./Checkbox.tsx";

const meta: Meta<typeof Checkbox> = {
  title: "OCTANT/Atoms/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: { label: "ORDERED DITHER", defaultChecked: false },
  argTypes: {
    label: { control: "text" },
    defaultChecked: { control: "boolean" },
    checked: { control: "boolean", description: "Controlled checked state." },
    disabled: { control: "boolean" },
    onChange: { action: "changed" },
  },
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true, label: "ORDERED DITHER" } };
export const Unchecked: Story = { args: { defaultChecked: false, label: "WRAP EDGES" } };
export const Disabled: Story = { args: { disabled: true, defaultChecked: true, label: "LOCKED" } };

/** Controlled: clicks fire onChange into the Actions log. */
export const Controlled: Story = {
  args: { checked: true, label: "CONTROLLED", onChange: fn() },
};

export const Stack: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 320 }}>
      <Checkbox defaultChecked label="ORDERED DITHER" />
      <Checkbox label="WRAP EDGES" />
      <Checkbox label="SERPENTINE SCAN" />
      <Checkbox disabled defaultChecked label="LOCKED" />
    </div>
  ),
};
