import type { Meta, StoryObj } from "@storybook/react";
import type { Agent, ChatMessageData } from "../ChatPanel/chat-types";
import { ChatThread } from "./ChatThread";

const meta: Meta<typeof ChatThread> = {
  title: "OCTANT/Organisms/ChatThread",
  component: ChatThread,
};
export default meta;

const agents: Record<string, Agent> = {
  router: { id: "router", name: "ROUTER" },
  coder: { id: "coder", name: "CODER" },
};

const messages: ChatMessageData[] = [
  { id: "u1", role: "user", time: "12:01", blocks: [{ type: "text", text: "Rasterise the field." }] },
  {
    id: "a1",
    role: "agent",
    agentId: "router",
    time: "12:01",
    blocks: [
      { type: "reasoning", text: "Use `octantMaskField` then dither." },
      {
        type: "tool_call",
        id: "tc",
        name: "render_frame",
        status: "done",
        args: { w: 80, h: 24 },
        result: { ok: true },
        startedAt: 0,
        endedAt: 41,
      },
      { type: "text", text: "Done — frame rendered with `bar8`. See https://octant.io." },
      {
        type: "citations",
        sources: [
          { label: 1, children: "raster.ts — paintBuf" },
          { label: 2, children: "field.ts — octantMaskField" },
        ],
      },
    ],
  },
  {
    id: "a2",
    role: "agent",
    agentId: "coder",
    time: "12:03",
    blocks: [{ type: "text", text: "I can extend it — want a dither pass too?" }],
  },
];

export const MultiTurn: StoryObj = {
  render: () => (
    <div style={{ height: 420, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <ChatThread messages={messages} agents={agents} />
    </div>
  ),
};

export const Streaming: StoryObj = {
  render: () => (
    <div style={{ height: 420, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <ChatThread messages={messages.slice(0, 1)} agents={agents} streaming />
    </div>
  ),
};

export const Empty: StoryObj = {
  render: () => (
    <div style={{ height: 420, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <ChatThread messages={[]} />
    </div>
  ),
};
