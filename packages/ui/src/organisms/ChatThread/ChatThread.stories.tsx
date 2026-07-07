import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { Agent, ChatMessageData } from "../ChatPanel/chat-types";
import { ChatThread } from "./ChatThread";

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

const meta = {
  title: "OCTANT/Organisms/ChatThread",
  component: ChatThread,
  args: { messages: messages.slice(0, 2), agents, onArtifactOpen: fn() },
  argTypes: {
    messages: { control: "object", description: "ChatMessageData[] (id, role, time?, agentId?, blocks)." },
    agents: { control: "object", description: "Agent lookup indexed by id." },
    streaming: { control: "boolean" },
  },
} satisfies Meta<typeof ChatThread>;
export default meta;

type Story = StoryObj<typeof meta>;

/** A user turn and an agent reply with reasoning, a tool call, text and citations. */
export const Default: Story = {
  render: (args) => (
    <div style={{ height: 420, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <ChatThread {...args} />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    // The finished tool call collapses to a pill; clicking expands args + result.
    const pill = canvas.getByRole("button", { name: /render_frame/i });
    await expect(canvas.queryByText("RESULT")).not.toBeInTheDocument();
    await userEvent.click(pill);
    await expect(canvas.getByText("ARGS")).toBeVisible();
    await expect(canvas.getByText("RESULT")).toBeVisible();
  },
};

/** Three turns across two different agents. */
export const MultiTurn: Story = {
  args: { messages },
  render: (args) => (
    <div style={{ height: 420, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <ChatThread {...args} />
    </div>
  ),
};

/** The typing indicator shows while the agent is producing its first block. */
export const Streaming: Story = {
  args: { messages: messages.slice(0, 1), streaming: true },
  render: (args) => (
    <div style={{ height: 420, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <ChatThread {...args} />
    </div>
  ),
};

/** An empty thread renders the EmptyState prompt. */
export const Empty: Story = {
  args: { messages: [] },
  render: (args) => (
    <div style={{ height: 420, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <ChatThread {...args} />
    </div>
  ),
};
