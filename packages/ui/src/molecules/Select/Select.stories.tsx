import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Select } from "./Select.tsx";

const ENCODERS = [
  { value: "octant", label: "OCTANT · 2×4" },
  { value: "quadrant", label: "QUADRANT · 2×2" },
  { value: "braille", label: "BRAILLE · 2×4" },
  { value: "shade", label: "SHADE · 1×1" },
];

const meta = {
  title: "OCTANT/Molecules/Select",
  component: Select,
  args: { options: ENCODERS, onChange: fn() },
  argTypes: {
    options: { control: "object", description: "Options: { value, label }." },
    value: { control: "text", description: "Controlled selected value." },
    defaultValue: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    width: { control: { type: "number", min: 120, max: 480, step: 8 } },
    ariaLabel: { control: "text" },
  },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Click to unroll the option list; choosing an option updates the trigger and closes. */
export const Default: Story = {
  args: { defaultValue: "octant" },
  play: async ({ canvas, userEvent, args }) => {
    const trigger = canvas.getByRole("combobox", { name: /octant · 2×4/i });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(canvas.getByRole("option", { name: /braille/i }));
    await expect(args.onChange).toHaveBeenCalledWith("braille");
    await expect(trigger).toHaveTextContent("BRAILLE · 2×4");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

/**
 * Keyboard contract: ↓ opens and advances the active option (`aria-activedescendant`),
 * Enter selects the active option and closes, Escape closes without firing `onChange` again.
 */
export const KeyboardNavigation: Story = {
  args: { defaultValue: "octant", onChange: fn() },
  play: async ({ canvas, userEvent, args }) => {
    const trigger = canvas.getByRole("combobox", { name: /octant · 2×4/i });
    trigger.focus();

    await userEvent.keyboard("{ArrowDown}");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const firstActive = trigger.getAttribute("aria-activedescendant");
    await expect(firstActive).toMatch(/-opt-\d+$/);

    await userEvent.keyboard("{ArrowDown}");
    const secondActive = trigger.getAttribute("aria-activedescendant");
    await expect(secondActive).toMatch(/-opt-\d+$/);
    await expect(secondActive).not.toBe(firstActive);

    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenCalledWith("quadrant");

    await userEvent.keyboard("{ArrowDown}");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Escape}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(args.onChange).toHaveBeenCalledTimes(1);
  },
};

/** Nothing selected — the trigger shows the placeholder text. */
export const Placeholder: Story = {
  args: { placeholder: "CHOOSE ENCODER" },
};

/** Disabled trigger — the menu never opens. */
export const Disabled: Story = {
  args: { defaultValue: "octant", disabled: true },
};

/** A wider select with region options. */
export const Regions: Story = {
  args: {
    options: [
      { value: "us-east", label: "US-EAST · IAD" },
      { value: "us-west", label: "US-WEST · SFO" },
      { value: "eu-central", label: "EU-CENTRAL · FRA" },
      { value: "ap-south", label: "AP-SOUTH · SIN" },
      { value: "sa-east", label: "SA-EAST · GRU" },
    ],
    defaultValue: "eu-central",
    width: 260,
  },
};

export const Stack: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ color: "#5b616e", fontSize: 12 }}>SELECT</div>
      <Select options={ENCODERS} defaultValue="octant" />
      <div style={{ color: "#3f424d", fontSize: 11 }}>
        click to unroll · selection drives the glyph encoder
      </div>
    </div>
  ),
};
