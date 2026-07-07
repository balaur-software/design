import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Switch } from "./Switch.tsx";

const meta = {
  title: "OCTANT/Atoms/Switch",
  component: Switch,
  args: { label: "TELEMETRY", defaultChecked: false, onChange: fn() },
  argTypes: {
    label: { control: "text" },
    defaultChecked: { control: "boolean" },
    checked: { control: "boolean", description: "Controlled checked state." },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Uncontrolled: clicking toggles the knob and fires onChange. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "TELEMETRY" });
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await expect(args.onChange).toHaveBeenCalledWith(true);
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await expect(args.onChange).toHaveBeenLastCalledWith(false);
  },
};

export const On: Story = { args: { defaultChecked: true, label: "TELEMETRY" } };
export const Off: Story = { args: { defaultChecked: false, label: "VERBOSE LOG" } };

/** Disabled switches ignore clicks and never fire onChange. */
export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true, label: "LOCKED" },
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "LOCKED" });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** Controlled: clicks fire onChange into the Actions log. */
export const Controlled: Story = {
  args: { checked: true, label: "CONTROLLED", onChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "CONTROLLED" });
    await userEvent.click(toggle);
    await expect(args.onChange).toHaveBeenCalledWith(false);
    // Controlled without a state update: the switch stays checked.
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  },
};

/** Space and Enter both toggle the focused switch. */
export const KeyboardToggle: Story = {
  args: { label: "KEYBOARD" },
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "KEYBOARD" });
    toggle.focus();
    await userEvent.keyboard(" ");
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{Enter}");
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

export const Stack: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 320 }}>
      <Switch defaultChecked label="TELEMETRY" />
      <Switch label="VERBOSE LOG" />
      <Switch disabled defaultChecked label="LOCKED" />
    </div>
  ),
};
