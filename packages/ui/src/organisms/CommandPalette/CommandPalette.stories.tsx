import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ToastProvider } from "../../primitives";
import { type CommandGroup, CommandPalette } from "./CommandPalette.tsx";

const meta: Meta<typeof CommandPalette> = {
  title: "OCTANT/Organisms/CommandPalette",
  component: CommandPalette,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ToastProvider>
        <div style={{ maxWidth: 420 }}>
          <div
            style={{
              color: "var(--bx-text-3, #5b616e)",
              fontSize: 11,
              letterSpacing: "0.1em",
              marginBottom: 18,
            }}
          >
            COMMAND PALETTE
          </div>
          <Story />
          <div style={{ color: "var(--bx-text-dim, #3f424d)", fontSize: 11, marginTop: 18 }}>
            press ⌘K / Ctrl-K anywhere on this page
          </div>
        </div>
      </ToastProvider>
    ),
  ],
  argTypes: {
    commands: { control: "object", description: "CommandGroup[]: { group, items[] }." },
    open: { control: "boolean", description: "Controlled open state." },
    defaultOpen: { control: "boolean" },
    showTrigger: { control: "boolean" },
    placeholder: { control: "text" },
    triggerLabel: { control: "text" },
    onOpenChange: { action: "open-changed" },
    onNavigate: { action: "navigated" },
    onSelect: { action: "selected" },
  },
};
export default meta;
type Story = StoryObj<typeof CommandPalette>;

/** The default palette: click the trigger or hit ⌘K, filter, arrow + Enter. */
export const Default: Story = {};

/** Opens mounted so the panel, filter list and highlight are visible at rest. */
export const OpenByDefault: Story = {
  args: { defaultOpen: true, showTrigger: false },
};

const DEPLOY_COMMANDS: CommandGroup[] = [
  {
    group: "PIPELINE",
    items: [
      { glyph: "▸", label: "Trigger build", shortcut: "B" },
      { glyph: "◆", label: "Run test suite", shortcut: "T" },
      { glyph: "▙", label: "Deploy to staging", to: "staging" },
      { glyph: "▟", label: "Promote to production", to: "prod" },
    ],
  },
  {
    group: "DANGER",
    items: [
      { glyph: "▓", label: "Roll back release", danger: true, shortcut: "⌘R" },
      { glyph: "▚", label: "Purge cache", danger: true, shortcut: "⌫" },
    ],
  },
];

/** A custom command set — navigation targets log via `onNavigate`, actions toast. */
export const CustomCommands: Story = {
  args: {
    commands: DEPLOY_COMMANDS,
    triggerLabel: "Search deploy actions…",
    onNavigate: fn(),
  },
};

/** No inline trigger — driven purely by the global ⌘K / Ctrl-K shortcut. */
export const KeyboardOnly: Story = {
  args: { showTrigger: false },
};
