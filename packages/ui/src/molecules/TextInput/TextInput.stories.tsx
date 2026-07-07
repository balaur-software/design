import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { TextInput } from "./TextInput.tsx";

const meta = {
  title: "OCTANT/Molecules/TextInput",
  component: TextInput,
  args: { onChange: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    value: { control: "text", description: "Controlled value." },
    defaultValue: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof TextInput>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Empty field; typing echoes into the glyph mirror and fires `onChange`. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "NOVA-7");
    await expect(input).toHaveValue("NOVA-7");
    await expect(args.onChange).toHaveBeenLastCalledWith("NOVA-7");
  },
};

/** Starts with a value already set. */
export const Prefilled: Story = {
  args: { defaultValue: "NOVA-7", placeholder: "enter callsign" },
};

/** Placeholder text shown while empty. */
export const CustomPlaceholder: Story = {
  args: { placeholder: "search sector" },
};

/** Disabled: dimmed and ignores input. */
export const Disabled: Story = {
  args: { defaultValue: "LOCKED", disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox")).toBeDisabled();
  },
};

/** Controlled usage: the parent owns the value via `value` + `onChange`. */
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <TextInput value={value} onChange={setValue} placeholder="type here" />
        <div style={{ fontSize: 11, color: "#5b616e" }}>value: {value || "—"}</div>
      </div>
    );
  },
};
