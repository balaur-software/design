import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ChatComposer } from "./ChatComposer";

const meta: Meta<typeof ChatComposer> = {
  title: "OCTANT/Molecules/ChatComposer",
  component: ChatComposer,
};
export default meta;

export const Idle: StoryObj = {
  render: () => {
    const [v, setV] = useState("");
    return <ChatComposer value={v} onValueChange={setV} onSend={(t) => alert(t)} attachHint="drop a file" />;
  },
};

export const Streaming: StoryObj = {
  render: () => <ChatComposer streaming onSend={() => {}} onStop={() => alert("stop")} />,
};

export const WithText: StoryObj = {
  render: () => {
    const [v, setV] = useState("rasterise the field");
    return <ChatComposer value={v} onValueChange={setV} onSend={(t) => alert(t)} />;
  },
};
