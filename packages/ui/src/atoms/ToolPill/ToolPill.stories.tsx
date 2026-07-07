import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ToolPill } from "./ToolPill";

const meta: Meta<typeof ToolPill> = {
  title: "OCTANT/Atoms/ToolPill",
  component: ToolPill,
  tags: ["autodocs"],
  args: { name: "read_file", status: "idle" },
  argTypes: {
    name: { control: "text" },
    status: { control: "select", options: ["idle", "running", "done", "error"] },
    expanded: { control: "boolean" },
    onClick: { action: "clicked" },
  },
};
export default meta;

type Story = StoryObj<typeof ToolPill>;

export const Default: Story = { args: { onClick: fn() } };

export const Idle: Story = { args: { name: "read_file", status: "idle" } };
export const Running: Story = { args: { name: "search", status: "running" } };
export const Done: Story = { args: { name: "read_file", status: "done", expanded: true } };
export const ErrorState: Story = { args: { name: "exec", status: "error" } };
