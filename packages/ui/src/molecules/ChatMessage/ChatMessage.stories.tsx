import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { Agent, ChatMessageData } from "../../organisms/ChatPanel/chat-types";
import { ChatMessage } from "./ChatMessage";

const agent: Agent = { id: "router", name: "ROUTER" };

const userMsg: ChatMessageData = {
  id: "u1",
  role: "user",
  time: "12:01",
  blocks: [{ type: "text", text: "Rasterise the field and show me the result." }],
};

const agentMsg: ChatMessageData = {
  id: "a1",
  role: "agent",
  agentId: "router",
  time: "12:01",
  blocks: [
    { type: "reasoning", text: "Reach for `octantMaskField`, then dither." },
    { type: "text", text: "On it — calling `render_frame`.", streaming: true },
  ],
};

const toolMsg: ChatMessageData = {
  id: "t1",
  role: "tool",
  time: "12:02",
  blocks: [
    {
      type: "tool_call",
      id: "tc1",
      name: "render_frame",
      status: "done",
      args: { w: 80, h: 24 },
      result: { ok: true },
      startedAt: 0,
      endedAt: 42,
    },
  ],
};

const meta = {
  title: "OCTANT/Molecules/ChatMessage",
  component: ChatMessage,
  args: { message: userMsg, onArtifactOpen: fn() },
  argTypes: {
    message: {
      control: "object",
      description: "ChatMessageData: { id, role, time?, agentId?, blocks, status? }.",
    },
    agent: { control: "object", description: "Agent descriptor for agent messages." },
  },
} satisfies Meta<typeof ChatMessage>;
export default meta;

type Story = StoryObj<typeof meta>;

/** A user message — right-aligned neutral bubble with a cell avatar. */
export const Default: Story = {};

/** The plain user bubble. */
export const User: Story = { args: { message: userMsg } };
/** An agent message mid-stream: reasoning block plus a streaming text block. */
export const AgentStreaming: Story = { args: { message: agentMsg, agent } };
/** A tool message — the done tool call collapses to its pill; clicking expands args and result. */
export const Tool: Story = {
  args: { message: toolMsg },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /render_frame/i }));
    await expect(canvas.getByText("ARGS")).toBeVisible();
    await expect(canvas.getByText("RESULT")).toBeVisible();
    await expect(canvas.getByText("42ms")).toBeVisible();
  },
};
/** A system message — centered, dimmed, avatar-less. */
export const System: Story = {
  args: { message: { id: "s", role: "system", blocks: [{ type: "text", text: "context window reset" }] } },
};
/** An errored agent message — red hairline and ERR badge. */
export const ErrorState: Story = {
  args: {
    message: {
      id: "e",
      role: "agent",
      agentId: "router",
      status: "error",
      blocks: [{ type: "text", text: "buffer overflow — aborted." }],
    },
    agent,
  },
};
