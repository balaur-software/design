import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ValidatedField } from "./ValidatedField.tsx";

const meta = {
  title: "OCTANT/Molecules/ValidatedField",
  component: ValidatedField,
  args: { onChange: fn() },
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    value: { control: "text", description: "Controlled value." },
    defaultValue: { control: "text" },
    maxLength: { control: { type: "number", min: 1, max: 1000, step: 1 } },
    hint: { control: "text" },
    validMessage: { control: "text" },
    invalidMessage: { control: "text" },
  },
} satisfies Meta<typeof ValidatedField>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Empty field; typing revalidates live against the NAME-NUMBER pattern. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const input = canvas.getByRole("textbox");
    const status = canvas.getByRole("status");
    await expect(status).toHaveTextContent("Format: NAME-NUMBER (e.g. NODE-01)");
    await userEvent.type(input, "node 1");
    await expect(status).toHaveTextContent("Must match NAME-NUMBER, e.g. RELAY-7");
    await userEvent.clear(input);
    await userEvent.type(input, "NODE-01");
    await expect(status).toHaveTextContent("Valid node identifier");
    await expect(args.onChange).toHaveBeenLastCalledWith("NODE-01");
  },
};

/** Prefilled with a value that passes the default pattern. */
export const PrefilledValid: Story = {
  args: { defaultValue: "RELAY-7" },
};

/** Prefilled with a value that fails the default pattern. */
export const PrefilledInvalid: Story = {
  args: { defaultValue: "relay 7" },
};

/** Custom pattern, cap and messages for an email address. */
export const EmailField: Story = {
  args: {
    label: "OPERATOR EMAIL",
    placeholder: "ops@balaur.dev",
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 48,
    hint: "We only page this address on incidents.",
    validMessage: "Deliverable address",
    invalidMessage: "Enter a valid email, e.g. ops@balaur.dev",
  },
};

/** Valid, invalid and empty fields stacked. */
export const Stack: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 360 }}>
      <ValidatedField defaultValue="NODE-01" />
      <ValidatedField defaultValue="bad id" />
      <ValidatedField />
    </div>
  ),
};
