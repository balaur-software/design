import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { fn } from "@storybook/test";
import { ChatPanel } from "./ChatPanel";
import type { Agent, Block, ChatMessageData } from "./chat-types";

const meta: Meta<typeof ChatPanel> = {
  title: "OCTANT/Organisms/ChatPanel",
  component: ChatPanel,
  tags: ["autodocs"],
  argTypes: {
    messages: { control: "object", description: "ChatMessageData[] (id, role, time?, agentId?, blocks)." },
    agents: { control: "object", description: "Agent lookup indexed by id." },
    artifacts: { control: "object", description: "Artifact blocks shown in the side panel." },
    streaming: { control: "boolean" },
    composerValue: { control: "text", description: "Controlled composer value." },
    defaultComposerValue: { control: "text" },
    presence: { control: "object", description: "Header presence rows." },
    onSend: { action: "sent" },
    onStop: { action: "stopped" },
    onArtifactOpen: { action: "artifact-opened" },
    onComposerValueChange: { action: "composer-changed" },
  },
};
export default meta;

const agents: Record<string, Agent> = {
  router: { id: "router", name: "ROUTER" },
};

const artifact: Extract<Block, { type: "artifact" }> = {
  type: "artifact",
  id: "a1",
  title: "raster.ts",
  kind: "code",
  language: "ts",
  content: "export const V = (x: number) => (x + 1) & 7;\n",
};

const messages: ChatMessageData[] = [
  {
    id: "u1",
    role: "user",
    time: "12:01",
    blocks: [{ type: "text", text: "Rasterise the field and give me the file." }],
  },
  {
    id: "a1",
    role: "agent",
    agentId: "router",
    time: "12:01",
    blocks: [
      { type: "reasoning", text: "Build the raster module, then hand it back as an artifact." },
      { type: "text", text: "Here's the raster module — open it from the side panel." },
      artifact,
    ],
  },
];

export const Default: StoryObj = {
  render: () => {
    const [v, setV] = useState("");
    return (
      <ChatPanel
        messages={messages.slice(0, 1)}
        agents={agents}
        composerValue={v}
        onComposerValueChange={setV}
        onSend={fn()}
        onStop={fn()}
      />
    );
  },
};

export const Full: StoryObj = {
  render: () => {
    const [v, setV] = useState("");
    return (
      <ChatPanel
        messages={messages}
        agents={agents}
        artifacts={[artifact]}
        composerValue={v}
        onComposerValueChange={setV}
        onSend={fn()}
        onStop={fn()}
        onArtifactOpen={fn()}
      />
    );
  },
};

export const Streaming: StoryObj = {
  render: () => (
    <ChatPanel messages={messages.slice(0, 1)} agents={agents} streaming onSend={fn()} onStop={fn()} />
  ),
};
