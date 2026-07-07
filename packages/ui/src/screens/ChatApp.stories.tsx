import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ChatPanel } from "../organisms/ChatPanel/ChatPanel";
import type { Agent, Block, ChatMessageData } from "../organisms/ChatPanel/chat-types";
import { Sidebar, type SidebarItem } from "../organisms/Sidebar/Sidebar";

/** App-shell navigation rail (the content pane is clipped away — only the rail shows). */
const NAV: SidebarItem[] = [
  { label: "Chat", glyph: "▛", title: "CHAT", sub: "Talk to the agent swarm." },
  { label: "Memory", glyph: "▞", title: "MEMORY", sub: "Vault graph and consent queue." },
  { label: "Ops", glyph: "▙", title: "OPS", sub: "Doctor, services, event log." },
  { label: "Artifacts", glyph: "▟", title: "ARTIFACTS", sub: "Files the agents produced." },
  { label: "Logs", glyph: "▚", title: "LOGS", sub: "Streaming event log, tail -f." },
];

const agents: Record<string, Agent> = {
  router: { id: "router", name: "ROUTER" },
  memory: { id: "memory", name: "MEMORY", accent: "#2bd9d9" },
};

const itinerary: Extract<Block, { type: "artifact" }> = {
  type: "artifact",
  id: "art-1",
  title: "itinerary.md",
  kind: "document",
  content:
    "# LAKE HOUSE — AUG 14–21\n\n- OUT · IR 1631 · 07:10 · AUG 14 · window seat, quiet car\n- BACK · IR 1638 · 18:40 · AUG 21\n- KEYS · Ana has the spare set\n",
};

/** A realistic multi-turn agent exchange: recall → cited answer → tool actions. */
const conversation: ChatMessageData[] = [
  {
    id: "u1",
    role: "user",
    time: "09:12",
    blocks: [
      { type: "text", text: "Where did we land on the lake house week? Ana proposed dates at some point." },
    ],
  },
  {
    id: "a1",
    role: "agent",
    agentId: "memory",
    time: "09:12",
    blocks: [
      {
        type: "reasoning",
        text: 'The decision lives in the vault. Recall on "lake house", then cross-check Ana\'s proposal before answering.',
        defaultCollapsed: true,
      },
      {
        type: "tool_call",
        id: "tc1",
        name: "memory.recall",
        args: { query: "lake house", limit: 5 },
        result: { hits: 3, topScore: 0.92 },
        status: "done",
      },
      {
        type: "text",
        text: "Confirmed: the week of AUG 14–21 at the lake house. Ana proposed the dates on JUN 30 and you approved them the next morning.",
      },
      {
        type: "citations",
        sources: [
          { label: "1", children: "memory://n1 · lake house — updated 2026-07-05" },
          { label: "2", children: 'telegram:fwd · Ana, JUN 30 — "14th to the 21st works"' },
        ],
      },
    ],
  },
  {
    id: "u2",
    role: "user",
    time: "09:14",
    blocks: [
      {
        type: "text",
        text: "Book the usual train out on the 14th, and remember my seat preference this time.",
      },
    ],
  },
  {
    id: "a2",
    role: "agent",
    agentId: "router",
    time: "09:15",
    blocks: [
      {
        type: "reasoning",
        text: "Two actions: search transit for AUG 14, then file the seat preference as a proposed memory (consent gate — never auto-commit).",
        defaultCollapsed: true,
      },
      {
        type: "tool_call",
        id: "tc2",
        name: "transit.search",
        args: { from: "BUC", to: "SIN", date: "2026-08-14" },
        result: { trains: 4, picked: "IR 1631 · 07:10" },
        status: "done",
      },
      {
        type: "tool_call",
        id: "tc3",
        name: "memory.propose",
        args: { type: "note", title: "seat pref — window, quiet car" },
        result: { id: "n31", status: "proposed" },
        status: "done",
      },
      {
        type: "text",
        text: "Booked IR 1631 departing 07:10 on AUG 14 — window seat, quiet car. The seat preference is filed as a proposed memory; approve it from the queue when you get a second. Itinerary is in the side panel.",
      },
      itinerary,
    ],
  },
];

/** The in-flight turn used by the Streaming story: recall still running, text mid-stream. */
const streamingTurn: ChatMessageData = {
  id: "a3",
  role: "agent",
  agentId: "memory",
  time: "09:16",
  status: "streaming",
  blocks: [
    { type: "reasoning", text: "Checking the vault for open items on the trip…" },
    {
      type: "tool_call",
      id: "tc4",
      name: "memory.recall",
      args: { query: "lake house open items" },
      status: "running",
    },
    { type: "text", text: "Two things are still open: the spare keys handoff and", streaming: true },
  ],
};

interface ChatAppProps {
  messages: ChatMessageData[];
  agents: Record<string, Agent>;
  artifacts: Block[];
  streaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onArtifactOpen: (id: string) => void;
}

/**
 * Screen-level composition (stories-only, not exported from the package):
 * the OCTANT.OS navigation rail beside the full chat surface. The Sidebar is
 * clipped to its rail width so the ChatPanel owns the content area.
 */
function ChatApp({ messages, agents, artifacts, streaming, onSend, onStop, onArtifactOpen }: ChatAppProps) {
  return (
    <div
      style={{
        display: "flex",
        height: "calc(100dvh - 48px)",
        minHeight: 560,
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-bg, #0a0b0e)",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
      }}
    >
      <Sidebar
        items={NAV}
        brand="OCTANT.OS"
        operator="a.radu"
        defaultActiveIndex={0}
        style={{ width: 213, height: "100%", flex: "none", border: 0 }}
      />
      <ChatPanel
        messages={messages}
        agents={agents}
        artifacts={artifacts}
        streaming={streaming}
        onSend={onSend}
        onStop={onStop}
        onArtifactOpen={onArtifactOpen}
        style={{
          flex: 1,
          minWidth: 0,
          height: "auto",
          border: 0,
          borderLeft: "1px solid var(--bx-border, #1c1d24)",
        }}
      />
    </div>
  );
}

const meta = {
  title: "OCTANT/Screens/ChatApp",
  component: ChatApp,
  parameters: { layout: "fullscreen" },
  args: {
    messages: conversation,
    agents,
    artifacts: [itinerary],
    streaming: false,
    onSend: fn(),
    onStop: fn(),
    onArtifactOpen: fn(),
  },
  argTypes: {
    messages: { control: "object", description: "ChatMessageData[] rendered in the thread." },
    agents: { control: "object", description: "Agent lookup indexed by id." },
    artifacts: { control: "object", description: "Artifact blocks pinned to the side panel." },
    streaming: { control: "boolean" },
  },
} satisfies Meta<typeof ChatApp>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The full app: rail, multi-turn thread (recall, tool calls, citations) and the itinerary artifact. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "approve the seat preference");
    await userEvent.click(canvas.getByRole("button", { name: /send/i }));
    await expect(args.onSend).toHaveBeenCalledWith("approve the seat preference");
    await expect(input).toHaveValue("");
  },
};

/** Mid-generation: a running recall, a streaming text block, and the composer swapped for Stop. */
export const Streaming: Story = {
  args: {
    messages: [...conversation, streamingTurn],
    streaming: true,
  },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByRole("textbox")).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: /stop generation/i }));
    await expect(args.onStop).toHaveBeenCalled();
  },
};

/** A fresh session: no messages, no artifacts — the thread shows its empty-state prompt. */
export const EmptyState: Story = {
  args: {
    messages: [],
    artifacts: [],
  },
};
