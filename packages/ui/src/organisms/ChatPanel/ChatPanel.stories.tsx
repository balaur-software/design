import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ChatPanel } from "./ChatPanel";
import type { Agent, Block, ChatMessageData } from "./chat-types";

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

const meta = {
  title: "OCTANT/Organisms/ChatPanel",
  component: ChatPanel,
  args: {
    messages: messages.slice(0, 1),
    agents,
    onSend: fn(),
    onStop: fn(),
    onArtifactOpen: fn(),
    onComposerValueChange: fn(),
  },
  argTypes: {
    messages: { control: "object", description: "ChatMessageData[] (id, role, time?, agentId?, blocks)." },
    agents: { control: "object", description: "Agent lookup indexed by id." },
    artifacts: { control: "object", description: "Artifact blocks shown in the side panel." },
    streaming: { control: "boolean" },
    composerValue: { control: "text", description: "Controlled composer value." },
    defaultComposerValue: { control: "text" },
    presence: { control: "object", description: "Header presence rows." },
  },
} satisfies Meta<typeof ChatPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A single user turn plus the composer; typing and sending fires `onSend` and clears the field. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "render the field");
    await expect(args.onComposerValueChange).toHaveBeenLastCalledWith("render the field");
    await userEvent.click(canvas.getByRole("button", { name: /send/i }));
    await expect(args.onSend).toHaveBeenCalledWith("render the field");
    await expect(input).toHaveValue("");
  },
};

/** The full surface: thread, reasoning block, composer and the artifact side panel. */
export const Full: Story = {
  args: {
    messages,
    artifacts: [artifact],
  },
};

/** While the agent streams, the composer disables and shows the Stop control. */
export const Streaming: Story = {
  args: {
    streaming: true,
  },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByRole("textbox")).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: /stop generation/i }));
    await expect(args.onStop).toHaveBeenCalled();
  },
};
