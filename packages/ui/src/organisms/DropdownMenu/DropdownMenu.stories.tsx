import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ToastProvider } from "../../primitives";
import { DropdownMenu, type DropdownMenuItem } from "./DropdownMenu.tsx";

const ACTIONS: DropdownMenuItem[] = [
  { label: "Render frame", glyph: "▛", shortcut: "R", toast: "Frame rendered" },
  { label: "Duplicate cell", glyph: "▞", shortcut: "⌘D", toast: "Cell duplicated" },
  { label: "Export PNG", glyph: "▙", toast: "Exported PNG" },
  { divider: true },
  { label: "Flush buffer", glyph: "▓", shortcut: "⌫", danger: true, toast: "Buffer flushed" },
];

const meta = {
  title: "OCTANT/Organisms/DropdownMenu",
  component: DropdownMenu,
  args: { items: ACTIONS },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  argTypes: {
    label: { control: "text" },
    items: {
      control: "object",
      description: "Rows: { label, glyph?, shortcut?, toast?, danger?, divider? }.",
    },
    width: { control: { type: "number", min: 120, max: 480, step: 8 } },
    align: { control: "radio", options: ["start", "end"] },
  },
} satisfies Meta<typeof DropdownMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The reference action menu — click an item, it fires a toast and closes. */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: /actions/i });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(canvas.getByRole("menuitem", { name: /export png/i }));
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await canvas.findByText("Exported PNG");

    // Escape dismisses without selecting.
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Escape}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

/** Custom trigger label and panel width. */
export const CustomLabel: Story = {
  args: { label: "COMMANDS", width: 240 },
};

/** Rows without shortcut keycaps collapse to glyph + label. */
export const NoShortcuts: Story = {
  args: {
    label: "ENCODERS",
    items: [
      { label: "OCTANT · 2×4", glyph: "▛" },
      { label: "QUADRANT · 2×2", glyph: "▚" },
      { label: "BRAILLE · 2×4", glyph: "⠿" },
      { label: "SHADE · 1×1", glyph: "▓" },
    ],
  },
};

/** `align="end"` anchors the panel to the trigger's right edge. */
export const EndAligned: Story = {
  render: (args) => (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <DropdownMenu {...args} align="end" />
    </div>
  ),
};
