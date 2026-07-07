import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ToolPill } from "./ToolPill";

const meta = {
  title: "OCTANT/Atoms/ToolPill",
  component: ToolPill,
  args: { name: "read_file", status: "idle" },
  argTypes: {
    name: { control: "text" },
    status: { control: "select", options: ["idle", "running", "done", "error"] },
    expanded: { control: "boolean" },
  },
} satisfies Meta<typeof ToolPill>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Clicking the pill fires onClick (ToolCallBlock uses this to toggle expand). */
export const Default: Story = {
  args: { onClick: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /read_file/i }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/** Idle: a dim dot before the tool has run. */
export const Idle: Story = { args: { name: "read_file", status: "idle" } };
/** Running: the status glyph spins. */
export const Running: Story = { args: { name: "search", status: "running" } };
/** Done and expanded: the ▸ marker rotates 90°. */
export const Done: Story = { args: { name: "read_file", status: "done", expanded: true } };
/** Error: a red ✕ status glyph. */
export const ErrorState: Story = { args: { name: "exec", status: "error" } };
