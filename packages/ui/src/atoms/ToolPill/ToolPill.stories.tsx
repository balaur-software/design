import type { Meta, StoryObj } from "@storybook/react";
import { ToolPill } from "./ToolPill";

const meta: Meta<typeof ToolPill> = {
  title: "OCTANT/Atoms/ToolPill",
  component: ToolPill,
};
export default meta;

export const Idle: StoryObj = { args: { name: "read_file", status: "idle" } };
export const Running: StoryObj = { args: { name: "search", status: "running" } };
export const Done: StoryObj = { args: { name: "read_file", status: "done", expanded: true } };
export const ErrorState: StoryObj = { args: { name: "exec", status: "error" } };
