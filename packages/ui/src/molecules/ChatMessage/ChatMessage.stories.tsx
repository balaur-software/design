import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { Agent, ChatMessageData } from "../../organisms/ChatPanel/chat-types";
import { ChatMessage } from "./ChatMessage";

const meta: Meta<typeof ChatMessage> = {
  title: "OCTANT/Molecules/ChatMessage",
  component: ChatMessage,
  tags: ["autodocs"],
  argTypes: {
    message: {
      control: "object",
      description: "ChatMessageData: { id, role, time?, agentId?, blocks, status? }.",
    },
    agent: { control: "object", description: "Agent descriptor for agent messages." },
    onArtifactOpen: { action: "artifact-opened" },
  },
};
export default meta;

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

export const Default: StoryObj = { args: { message: userMsg, onArtifactOpen: fn() } };

export const User: StoryObj = { args: { message: userMsg } };
export const AgentStreaming: StoryObj = { args: { message: agentMsg, agent } };
export const Tool: StoryObj = { args: { message: toolMsg } };
export const System: StoryObj = {
  args: { message: { id: "s", role: "system", blocks: [{ type: "text", text: "context window reset" }] } },
};
export const ErrorState: StoryObj = {
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
