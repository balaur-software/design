import type { Meta, StoryObj } from "@storybook/react-vite";
import { Keycap, Keycaps, type Shortcut } from "./Keycaps.tsx";

const meta = {
  title: "OCTANT/Atoms/Keycaps",
  component: Keycaps,
  argTypes: {
    shortcuts: { control: "object", description: "Array of { keys: string[], label, combo? }." },
  },
} satisfies Meta<typeof Keycaps>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The built-in default shortcut list. */
export const Default: Story = {};

const EDITOR_SHORTCUTS: Shortcut[] = [
  { keys: ["⌘", "Z"], label: "undo stroke" },
  { keys: ["⌘", "⇧", "Z"], label: "redo stroke" },
  { keys: ["⌘", "S"], label: "export buffer" },
  { keys: ["SPACE"], label: "toggle cell" },
  { keys: ["W", "A", "S", "D"], label: "pan viewport", combo: false },
];

/** A custom editor shortcut table, including a non-combo WASD row. */
export const EditorShortcuts: Story = {
  args: { shortcuts: EDITOR_SHORTCUTS },
};

/** A single chord row. */
export const SingleChord: Story = {
  args: {
    shortcuts: [{ keys: ["⌘", "K"], label: "open command palette" }],
  },
};

/** Bare Keycap atoms outside a shortcut table. */
export const LoneCaps: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <Keycap>⌘</Keycap>
      <Keycap>⏎</Keycap>
      <Keycap>ESC</Keycap>
      <Keycap>⌫</Keycap>
    </div>
  ),
};
