import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { LogStream } from "./LogStream.tsx";

const meta: Meta<typeof LogStream> = {
  title: "OCTANT/Organisms/LogStream",
  component: LogStream,
  tags: ["autodocs"],
  argTypes: {
    messages: { control: "object", description: "Pool of messages randomly appended to the stream." },
    title: { control: "text" },
    interval: { control: { type: "number", min: 100, max: 10000, step: 100 } },
    maxLines: { control: { type: "number", min: 3, max: 200, step: 1 } },
    initialCount: { control: { type: "number", min: 0, max: 50, step: 1 } },
    placeholder: { control: "text" },
    onCommand: { action: "command" },
  },
};
export default meta;
type Story = StoryObj<typeof LogStream>;

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <LogStream />
    </div>
  ),
};

export const FastStream: Story = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <LogStream title="TELEMETRY" interval={600} maxLines={11} />
    </div>
  ),
};

export const CustomFeed: Story = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <LogStream
        title="DEPLOY"
        interval={900}
        initialCount={4}
        placeholder="type a command"
        messages={[
          "pulling image sha256:9f2a",
          "container scheduled",
          "health probe green",
          "rollout 3/3 ready",
          "gateway route swapped",
          "cache invalidated",
        ]}
      />
    </div>
  ),
};

export const WithCommandHandler: Story = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <LogStream title="CONSOLE" onCommand={fn()} />
    </div>
  ),
};
