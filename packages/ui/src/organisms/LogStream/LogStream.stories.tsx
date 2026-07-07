import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { LogStream } from "./LogStream.tsx";

const meta = {
  title: "OCTANT/Organisms/LogStream",
  component: LogStream,
  args: { onCommand: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    messages: { control: "object", description: "Pool of messages randomly appended to the stream." },
    title: { control: "text" },
    interval: { control: { type: "number", min: 100, max: 10000, step: 100 } },
    maxLines: { control: { type: "number", min: 3, max: 200, step: 1 } },
    initialCount: { control: { type: "number", min: 0, max: 50, step: 1 } },
    placeholder: { control: "text" },
  },
} satisfies Meta<typeof LogStream>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The reference event log — submitting a command echoes a CMD row and fires `onCommand`. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "flush{Enter}");
    await expect(args.onCommand).toHaveBeenCalledWith("flush");
    await expect(input).toHaveValue("");
  },
};

/** A faster cadence with a taller backlog. */
export const FastStream: Story = {
  args: { title: "TELEMETRY", interval: 600, maxLines: 11 },
};

/** A custom message pool and prompt placeholder. */
export const CustomFeed: Story = {
  args: {
    title: "DEPLOY",
    interval: 900,
    initialCount: 4,
    placeholder: "type a command",
    messages: [
      "pulling image sha256:9f2a",
      "container scheduled",
      "health probe green",
      "rollout 3/3 ready",
      "gateway route swapped",
      "cache invalidated",
    ],
  },
};

/** The RUN button submits the prompt just like Enter. */
export const WithCommandHandler: Story = {
  args: { title: "CONSOLE" },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.type(canvas.getByRole("textbox"), "deploy web");
    await userEvent.click(canvas.getByRole("button", { name: /run/i }));
    await expect(args.onCommand).toHaveBeenCalledWith("deploy web");
  },
};
