import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ChatComposer } from "./ChatComposer";

const meta = {
  title: "OCTANT/Molecules/ChatComposer",
  component: ChatComposer,
  args: { onSend: fn(), onValueChange: fn(), onStop: fn() },
  argTypes: {
    value: { control: "text", description: "Controlled value." },
    defaultValue: { control: "text" },
    streaming: { control: "boolean" },
    attachHint: { control: "text" },
    slashHint: { control: "boolean" },
    placeholder: { control: "text" },
  },
} satisfies Meta<typeof ChatComposer>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The resting composer — Enter sends the trimmed text and clears the textarea. */
export const Idle: Story = {
  args: { attachHint: "drop a file" },
  play: async ({ args, canvas, userEvent }) => {
    const textarea = canvas.getByRole("textbox");
    await userEvent.type(textarea, "rasterise the field{Enter}");
    await expect(args.onSend).toHaveBeenCalledWith("rasterise the field");
    await expect(textarea).toHaveValue("");
  },
};

/** While the agent streams, the textarea is disabled and Stop replaces Send. */
export const Streaming: Story = {
  args: { streaming: true },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole("textbox")).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: /stop generation/i }));
    await expect(args.onStop).toHaveBeenCalledTimes(1);
  },
};

/** Pre-filled text — the send button is enabled and fires onSend on click. */
export const WithText: Story = {
  args: { defaultValue: "rasterise the field" },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /send/i }));
    await expect(args.onSend).toHaveBeenCalledWith("rasterise the field");
  },
};
