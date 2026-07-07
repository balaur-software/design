import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useState } from "react";
import { ChatComposer } from "./ChatComposer";

const meta: Meta<typeof ChatComposer> = {
  title: "OCTANT/Molecules/ChatComposer",
  component: ChatComposer,
  tags: ["autodocs"],
  argTypes: {
    value: { control: "text", description: "Controlled value." },
    defaultValue: { control: "text" },
    streaming: { control: "boolean" },
    attachHint: { control: "text" },
    slashHint: { control: "boolean" },
    placeholder: { control: "text" },
    onValueChange: { action: "value-changed" },
    onSend: { action: "sent" },
    onStop: { action: "stopped" },
  },
};
export default meta;

export const Idle: StoryObj = {
  render: () => {
    const [v, setV] = useState("");
    return <ChatComposer value={v} onValueChange={setV} onSend={fn()} attachHint="drop a file" />;
  },
};

export const Streaming: StoryObj = {
  render: () => <ChatComposer streaming onSend={fn()} onStop={fn()} />,
};

export const WithText: StoryObj = {
  render: () => {
    const [v, setV] = useState("rasterise the field");
    return <ChatComposer value={v} onValueChange={setV} onSend={fn()} />;
  },
};
