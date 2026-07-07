import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ToolCallBlock } from "./ToolCallBlock";

const meta = {
  title: "OCTANT/Molecules/ToolCallBlock",
  component: ToolCallBlock,
} satisfies Meta<typeof ToolCallBlock>;
export default meta;
type Story = StoryObj<typeof meta>;

const base = {
  type: "tool_call" as const,
  id: "t1",
  name: "read_file",
  args: { path: "src/raster.ts" },
  startedAt: 1000,
};

/** In-flight call: stays expanded with its args visible. */
export const Running: Story = {
  args: { block: { ...base, status: "running" as const } },
};

/** Finished call: collapses to the pill; clicking it re-expands args + result. */
export const Done: Story = {
  args: {
    block: { ...base, status: "done" as const, endedAt: 1123, result: { lines: 204, ok: true } },
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.queryByText("RESULT")).not.toBeInTheDocument();
    const pill = canvas.getByRole("button", { name: /read_file/i });
    await userEvent.click(pill);
    await expect(canvas.getByText("ARGS")).toBeVisible();
    await expect(canvas.getByText("RESULT")).toBeVisible();
    await expect(canvas.getByText("123ms")).toBeVisible();
    await userEvent.click(pill);
    await expect(canvas.queryByText("RESULT")).not.toBeInTheDocument();
  },
};

/** Failed call: stays expanded and labels the payload ERROR. */
export const ErrorState: Story = {
  args: {
    block: { ...base, status: "error" as const, endedAt: 1102, result: { message: "ENOENT: no such file" } },
  },
};

/** String results render verbatim (multi-line plain text) rather than JSON-escaped. */
export const PlainTextResult: Story = {
  args: {
    block: {
      type: "tool_call" as const,
      id: "t2",
      name: "bash",
      args: { command: "ls -la" },
      status: "done" as const,
      startedAt: 1000,
      endedAt: 1044,
      result:
        "total 24\ndrwxr-xr-x  5 alex  160 Jul  7 12:34 .\n-rw-r--r--  1 alex  512 Jul  7 12:34 raster.ts",
    },
  },
};
