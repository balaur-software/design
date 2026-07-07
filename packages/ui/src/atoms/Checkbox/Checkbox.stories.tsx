import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Checkbox } from "./Checkbox.tsx";

const meta = {
  title: "OCTANT/Atoms/Checkbox",
  component: Checkbox,
  args: { label: "ORDERED DITHER", defaultChecked: false, onChange: fn() },
  argTypes: {
    label: { control: "text" },
    defaultChecked: { control: "boolean" },
    checked: { control: "boolean", description: "Controlled checked state." },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Uncontrolled: click and Space both toggle the checked state. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const box = canvas.getByRole("checkbox", { name: /ordered dither/i });
    await expect(box).toHaveAttribute("aria-checked", "false");

    await userEvent.click(box);
    await expect(box).toHaveAttribute("aria-checked", "true");
    await expect(args.onChange).toHaveBeenLastCalledWith(true);

    await userEvent.keyboard(" ");
    await expect(box).toHaveAttribute("aria-checked", "false");
    await expect(args.onChange).toHaveBeenLastCalledWith(false);
  },
};

export const Checked: Story = { args: { defaultChecked: true, label: "ORDERED DITHER" } };
export const Unchecked: Story = { args: { defaultChecked: false, label: "WRAP EDGES" } };
export const Disabled: Story = { args: { disabled: true, defaultChecked: true, label: "LOCKED" } };

/** Controlled: clicks fire onChange into the Actions log. */
export const Controlled: Story = {
  args: { checked: true, label: "CONTROLLED", onChange: fn() },
  play: async ({ canvas, userEvent, args }) => {
    const box = canvas.getByRole("checkbox", { name: /controlled/i });
    await userEvent.click(box);
    await expect(args.onChange).toHaveBeenLastCalledWith(false);
    // Controlled: state stays as passed until the parent updates `checked`.
    await expect(box).toHaveAttribute("aria-checked", "true");
  },
};

export const Stack: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 320 }}>
      <Checkbox defaultChecked label="ORDERED DITHER" />
      <Checkbox label="WRAP EDGES" />
      <Checkbox label="SERPENTINE SCAN" />
      <Checkbox disabled defaultChecked label="LOCKED" />
    </div>
  ),
};
