import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { Block } from "../../organisms/ChatPanel/chat-types";
import { BlockRenderer } from "./BlockRenderer";

const textBlock: Block = { type: "text", text: "Hello **world**, see `bar8`." };

const meta = {
  title: "OCTANT/Molecules/BlockRenderer",
  component: BlockRenderer,
  args: { block: textBlock, onArtifactOpen: fn() },
  argTypes: {
    block: { control: "object", description: "A ChatPanel Block (text|reasoning|tool_call|code|artifact)." },
  },
} satisfies Meta<typeof BlockRenderer>;
export default meta;

type Story = StoryObj<typeof meta>;

/** A text block — the most common dispatch target. */
export const Default: Story = {};

/** A done tool call dispatches to ToolCallBlock — clicking the pill expands the args/result payloads. */
export const ToolCall: Story = {
  args: {
    block: { type: "tool_call", id: "t", name: "search", status: "done", args: { q: "x" }, result: { n: 3 } },
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.queryByText("ARGS")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /search/i }));
    await expect(canvas.getByText("ARGS")).toBeVisible();
    await expect(canvas.getByText("RESULT")).toBeVisible();
  },
};

/** An artifact block dispatches to ArtifactPanel — opening it routes the id through onArtifactOpen. */
export const Artifact: Story = {
  args: {
    block: {
      type: "artifact",
      id: "a",
      title: "out.ts",
      kind: "code",
      language: "ts",
      content: "export const V = 1;\n",
    },
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /open/i }));
    await expect(args.onArtifactOpen).toHaveBeenCalledWith("a");
  },
};

const blocks: { name: string; block: Block }[] = [
  { name: "text", block: { type: "text", text: "Hello **world**, see `bar8`." } },
  { name: "reasoning", block: { type: "reasoning", text: "Planning the raster pass." } },
  {
    name: "tool_call",
    block: { type: "tool_call", id: "t", name: "search", status: "done", args: { q: "x" }, result: { n: 3 } },
  },
  { name: "code", block: { type: "code", language: "ts", code: "const V = 1;" } },
  {
    name: "artifact",
    block: {
      type: "artifact",
      id: "a",
      title: "out.ts",
      kind: "code",
      language: "ts",
      content: "export const V = 1;\n",
    },
  },
];

/** Every block type rendered once, labeled by its dispatch key. */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 520 }}>
      {blocks.map(({ name, block }) => (
        <div key={name}>
          <div style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 10, marginBottom: 6 }}>{name}</div>
          <BlockRenderer block={block} />
        </div>
      ))}
    </div>
  ),
};
