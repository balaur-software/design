import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ToastProvider } from "../../primitives";
import { Menubar, type MenubarMenu } from "./Menubar.tsx";

const MENUS: MenubarMenu[] = [
  {
    label: "FILE",
    items: [
      { label: "New buffer", shortcut: "⌘N", toast: "New buffer" },
      { label: "Open…", shortcut: "⌘O", toast: "Opened" },
      { label: "Save", shortcut: "⌘S", toast: "Saved" },
      { divider: true },
      { label: "Export PNG", shortcut: "⌘E", toast: "Exported PNG" },
    ],
  },
  {
    label: "EDIT",
    items: [
      { label: "Undo", shortcut: "⌘Z", toast: "Undo" },
      { label: "Redo", shortcut: "⇧⌘Z", toast: "Redo" },
      { divider: true },
      { label: "Copy", shortcut: "⌘C", toast: "Copied cells" },
      { label: "Paste", shortcut: "⌘V", toast: "Pasted cells" },
    ],
  },
  {
    label: "VIEW",
    items: [
      { label: "Zoom in", shortcut: "⌘+", toast: "Zoomed in" },
      { label: "Zoom out", shortcut: "⌘−", toast: "Zoomed out" },
      { divider: true },
      { label: "Toggle grid", shortcut: "⌘G", toast: "Grid toggled" },
    ],
  },
  {
    label: "HELP",
    items: [
      { label: "Documentation", toast: "Docs opened" },
      { label: "Keyboard shortcuts", toast: "Shortcuts" },
    ],
  },
];

const meta = {
  title: "OCTANT/Organisms/Menubar",
  component: Menubar,
  args: { menus: MENUS },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  argTypes: {
    menus: { control: "object", description: "MenubarMenu[]: { label, items[] }." },
  },
} satisfies Meta<typeof Menubar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The reference app-shell menu bar — click a group, hover across to switch, pick an item to fire a toast. */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const file = canvas.getByRole("button", { name: "FILE" });
    await userEvent.click(file);
    await expect(file).toHaveAttribute("aria-expanded", "true");

    // Picking an item closes the bar and fires its toast.
    await userEvent.click(canvas.getByRole("menuitem", { name: /save/i }));
    await expect(file).toHaveAttribute("aria-expanded", "false");
    await canvas.findByText("Saved");

    // While a menu is open, hovering a sibling trigger switches to it; Escape dismisses.
    const edit = canvas.getByRole("button", { name: "EDIT" });
    const view = canvas.getByRole("button", { name: "VIEW" });
    await userEvent.click(edit);
    await userEvent.hover(view);
    await expect(view).toHaveAttribute("aria-expanded", "true");
    await expect(edit).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("{Escape}");
    await expect(view).toHaveAttribute("aria-expanded", "false");
  },
};

/** A trimmed bar with just two groups. */
export const Compact: Story = {
  args: {
    menus: [
      {
        label: "FILE",
        items: [
          { label: "New buffer", shortcut: "⌘N" },
          { label: "Save", shortcut: "⌘S" },
        ],
      },
      {
        label: "EDIT",
        items: [
          { label: "Undo", shortcut: "⌘Z" },
          { label: "Redo", shortcut: "⇧⌘Z" },
        ],
      },
    ],
  },
};

/** No shortcut hints — the items collapse to plain labels. */
export const NoShortcuts: Story = {
  args: {
    menus: [
      {
        label: "ENCODE",
        items: [
          { label: "OCTANT · 2×4" },
          { label: "QUADRANT · 2×2" },
          { label: "BRAILLE · 2×4" },
          { divider: true },
          { label: "SHADE · 1×1" },
        ],
      },
      {
        label: "PALETTE",
        items: [{ label: "16 ANSI hues" }, { label: "256 xterm" }, { label: "Truecolor" }],
      },
    ],
  },
};

const runBuild = fn();
const runTest = fn();
const runDeploy = fn();

/** Custom `onSelect` handlers instead of the default toast. */
export const CustomHandlers: Story = {
  args: {
    menus: [
      {
        label: "RUN",
        items: [
          { label: "Build", shortcut: "⌘B", onSelect: runBuild },
          { label: "Test", shortcut: "⌘T", onSelect: runTest },
          { divider: true },
          { label: "Deploy", onSelect: runDeploy },
        ],
      },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "RUN" });
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole("menuitem", { name: /build/i }));
    await expect(runBuild).toHaveBeenCalled();
    await expect(runDeploy).not.toHaveBeenCalled();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
