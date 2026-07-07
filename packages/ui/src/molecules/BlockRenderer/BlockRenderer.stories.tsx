import type { Meta, StoryObj } from "@storybook/react";
import type { Block } from "../../organisms/ChatPanel/chat-types";
import { BlockRenderer } from "./BlockRenderer";

const meta: Meta<typeof BlockRenderer> = {
  title: "OCTANT/Molecules/BlockRenderer",
  component: BlockRenderer,
};
export default meta;

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

export const Gallery: StoryObj = {
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
