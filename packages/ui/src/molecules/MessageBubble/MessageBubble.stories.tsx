import type { Meta, StoryObj } from "@storybook/react-vite";
import { MessageBubble } from "./MessageBubble.tsx";

const meta = {
  title: "OCTANT/Molecules/MessageBubble",
  component: MessageBubble,
  argTypes: {
    role: { control: "radio", options: ["user", "agent"] },
    name: { control: "text" },
    time: { control: "text" },
    avatar: { control: "text" },
    children: { control: "text" },
  },
} satisfies Meta<typeof MessageBubble>;
export default meta;

type Story = StoryObj<typeof meta>;

/** A user message — neutral tint, right-aligned. */
export const Default: Story = {
  args: {
    role: "user",
    time: "09:41:07",
    children: "Render the throughput series as an octant chart.",
  },
};

/** An agent message — accent tint, left-aligned. */
export const Agent: Story = {
  args: {
    role: "agent",
    time: "09:41:09",
    children: "On it — pulling the series and rasterising to the lattice now.",
  },
};

/** A short alternating exchange, as it appears in the chat panel. */
export const Conversation: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
      <MessageBubble role="user" time="09:41:07">
        Render the throughput series as an octant chart.
      </MessageBubble>
      <MessageBubble role="agent" time="09:41:09">
        On it — pulling the series and rasterising to the lattice now.
      </MessageBubble>
      <MessageBubble role="user" time="09:41:15">
        Perfect. Overlay the p99 latency as a second band.
      </MessageBubble>
    </div>
  ),
};

/** A custom name + octant-mosaic avatar (e.g. a tool speaker). */
export const CustomAvatar: Story = {
  args: {
    role: "agent",
    name: "TOOL",
    time: "09:41:11",
    avatar: "▚▖\n▗▝",
    children: "Query executed — 4,096 rows rasterised to the lattice.",
  },
};
