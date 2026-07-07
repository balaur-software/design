import type { Meta, StoryObj } from "@storybook/react";
import type { Agent } from "../../organisms/ChatPanel/chat-types";
import { AgentGlyph } from "./AgentGlyph";

const meta: Meta<typeof AgentGlyph> = {
  title: "OCTANT/Atoms/AgentGlyph",
  component: AgentGlyph,
};
export default meta;

const agents: Agent[] = [
  { id: "router", name: "ROUTER" },
  { id: "coder", name: "CODER" },
  { id: "critic", name: "CRITIC" },
  { id: "researcher", name: "RESEARCH" },
];

export const Row: StoryObj = {
  render: () => (
    <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
      {agents.map((a) => (
        <AgentGlyph key={a.id} agent={a} />
      ))}
    </div>
  ),
};

export const WithOverride: StoryObj = {
  args: { agent: { id: "x", name: "CUSTOM", accent: "#c061ff" } },
};
