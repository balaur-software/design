import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ChatPanel } from "./ChatPanel";
import type { Agent, Block, ChatMessageData } from "./chat-types";

const meta: Meta<typeof ChatPanel> = {
  title: "OCTANT/Organisms/ChatPanel",
  component: ChatPanel,
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
        onSend={(t) => alert(`send: ${t}`)}
        onStop={() => alert("stop")}
        onArtifactOpen={(id) => alert(`open: ${id}`)}
      />
    );
  },
};

export const Streaming: StoryObj = {
  render: () => (
    <ChatPanel
      messages={messages.slice(0, 1)}
      agents={agents}
      streaming
      onSend={() => {}}
      onStop={() => alert("stop")}
    />
  ),
};
