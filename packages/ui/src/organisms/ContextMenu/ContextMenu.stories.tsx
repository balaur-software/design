import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { ToastProvider } from "../../primitives";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu.tsx";

const meta = {
  title: "OCTANT/Organisms/ContextMenu",
  component: ContextMenu,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  argTypes: {
    items: { control: "object", description: "Menu rows: { label, glyph?, toast?, danger?, divider? }." },
    children: { control: "text", description: "Content of the right-click surface." },
  },
} satisfies Meta<typeof ContextMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The reference surface — right-click it to pop the cell-inspector menu. */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const surface = canvas.getByText(/right-click anywhere/i);
    await userEvent.pointer({ keys: "[MouseRight]", target: surface });

    await canvas.findByRole("menu");
    const items = canvas.getAllByRole("menuitem");
    await expect(items).toHaveLength(4);

    // Focus lands on the first row once the menu is measured; arrows walk the rows.
    await waitFor(() => expect(items[0]).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}");
    await expect(items[1]).toHaveFocus();

    // Selecting a row closes the menu and fires its toast.
    await userEvent.click(canvas.getByRole("menuitem", { name: /copy glyph/i }));
    await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
    await canvas.findByText("Copied glyph");
  },
};

/** A custom action set, including a divider and a danger row. */
export const CustomItems: Story = {
  args: {
    items: [
      { label: "Render frame", glyph: "▛", toast: "Frame rendered" },
      { label: "Duplicate cell", glyph: "▞", toast: "Cell duplicated" },
      { label: "Export PNG", glyph: "▙", toast: "Exported PNG" },
      { divider: true },
      { label: "Flush buffer", glyph: "▓", danger: true, toast: "Buffer flushed" },
    ] satisfies ContextMenuItem[],
  },
};

/** Custom trigger content via `children`. */
export const CustomSurface: Story = {
  args: {
    children: "◪ right-click this canvas region",
    style: { padding: 64, color: "#5b616e", borderStyle: "solid" },
  },
};

/** Near a viewport edge the menu clamps back inside the visible area. */
export const ClampToEdge: Story = {
  render: (args) => (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <ContextMenu {...args} style={{ width: 320 }} />
    </div>
  ),
};
