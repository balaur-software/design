import type { Meta, StoryObj } from "@storybook/react";
import type { Agent } from "../../organisms/ChatPanel/chat-types";
import { AgentGlyph } from "./AgentGlyph";

const meta: Meta<typeof AgentGlyph> = {
  title: "OCTANT/Atoms/AgentGlyph",
  component: AgentGlyph,
  tags: ["autodocs"],
  args: { agent: { id: "router", name: "ROUTER" } },
  argTypes: {
    agent: { control: "object", description: "Agent descriptor: { id, name, accent? }." },
    size: { control: { type: "number", min: 8, max: 48, step: 1 } },
    showLabel: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof AgentGlyph>;

export const Default: Story = {};

const agents: Agent[] = [
  { id: "router", name: "ROUTER" },
  { id: "coder", name: "CODER" },
  { id: "critic", name: "CRITIC" },
  { id: "researcher", name: "RESEARCH" },
];

export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
      {agents.map((a) => (
        <AgentGlyph key={a.id} agent={a} />
      ))}
    </div>
  ),
};

export const WithOverride: Story = {
  args: { agent: { id: "x", name: "CUSTOM", accent: "#c061ff" } },
};
