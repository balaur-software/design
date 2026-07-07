import type { Meta, StoryObj } from "@storybook/react";
import { ToolCallBlock } from "./ToolCallBlock";

const meta: Meta<typeof ToolCallBlock> = {
  title: "OCTANT/Molecules/ToolCallBlock",
  component: ToolCallBlock,
};
export default meta;

const base = {
  type: "tool_call" as const,
  id: "t1",
  name: "read_file",
  args: { path: "src/raster.ts" },
  startedAt: 1000,
};

export const Running: StoryObj = {
  args: { block: { ...base, status: "running" as const } },
};

export const Done: StoryObj = {
  args: {
    block: { ...base, status: "done" as const, endedAt: 1123, result: { lines: 204, ok: true } },
  },
};

export const ErrorState: StoryObj = {
  args: {
    block: { ...base, status: "error" as const, endedAt: 1102, result: { message: "ENOENT: no such file" } },
  },
};

/** String results render verbatim (multi-line plain text) rather than JSON-escaped. */
export const PlainTextResult: StoryObj = {
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
