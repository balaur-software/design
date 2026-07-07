import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor, within } from "storybook/test";
import { ToastProvider } from "../../primitives";
import { type CommandGroup, CommandPalette } from "./CommandPalette.tsx";

const meta = {
  title: "OCTANT/Organisms/CommandPalette",
  component: CommandPalette,
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
  args: { onOpenChange: fn(), onNavigate: fn(), onSelect: fn() },
  argTypes: {
    commands: { control: "object", description: "CommandGroup[]: { group, items[] }." },
    open: { control: "boolean", description: "Controlled open state." },
    defaultOpen: { control: "boolean" },
    showTrigger: { control: "boolean" },
    placeholder: { control: "text" },
    triggerLabel: { control: "text" },
  },
} satisfies Meta<typeof CommandPalette>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The default palette: click the trigger or hit ⌘K, filter, arrow + Enter. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /search commands/i }));
    // The palette portals to document.body, outside the story canvas.
    const body = within(document.body);
    const input = await body.findByRole("combobox");
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);

    await userEvent.type(input, "console");
    await expect(body.getByRole("option", { name: /go to console/i })).toBeVisible();
    await userEvent.keyboard("{Enter}");

    await expect(args.onNavigate).toHaveBeenCalledWith("console");
    await expect(args.onSelect).toHaveBeenCalled();
    await waitFor(() => expect(body.queryByRole("combobox")).not.toBeInTheDocument());
  },
};

/** Opens mounted so the panel, filter list and highlight are visible at rest. */
export const OpenByDefault: Story = {
  args: { defaultOpen: true, showTrigger: false },
  play: async ({ userEvent, args }) => {
    const body = within(document.body);
    // The panel fades in on the next animation frame, so wait for full visibility.
    await waitFor(async () => expect(await body.findByRole("combobox")).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(args.onOpenChange).toHaveBeenLastCalledWith(false));
    await waitFor(() => expect(body.queryByRole("combobox")).not.toBeInTheDocument());
  },
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
  },
};

/** No inline trigger — driven purely by the global ⌘K / Ctrl-K shortcut. */
export const KeyboardOnly: Story = {
  args: { showTrigger: false },
};
