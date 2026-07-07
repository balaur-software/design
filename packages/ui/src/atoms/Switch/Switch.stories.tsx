import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Switch } from "./Switch.tsx";

const meta: Meta<typeof Switch> = {
  title: "OCTANT/Atoms/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: { label: "TELEMETRY", defaultChecked: false },
  argTypes: {
    label: { control: "text" },
    defaultChecked: { control: "boolean" },
    checked: { control: "boolean", description: "Controlled checked state." },
    disabled: { control: "boolean" },
    onChange: { action: "changed" },
  },
};
export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {};

export const On: Story = { args: { defaultChecked: true, label: "TELEMETRY" } };
export const Off: Story = { args: { defaultChecked: false, label: "VERBOSE LOG" } };
export const Disabled: Story = { args: { disabled: true, defaultChecked: true, label: "LOCKED" } };

/** Controlled: clicks fire onChange into the Actions log. */
export const Controlled: Story = {
  args: { checked: true, label: "CONTROLLED", onChange: fn() },
};

export const Stack: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 320 }}>
      <Switch defaultChecked label="TELEMETRY" />
      <Switch label="VERBOSE LOG" />
      <Switch disabled defaultChecked label="LOCKED" />
    </div>
  ),
};
