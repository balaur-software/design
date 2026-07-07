import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Sidebar } from "./Sidebar.tsx";

const meta = {
  title: "OCTANT/Organisms/Sidebar",
  component: Sidebar,
  args: {
    onActiveIndexChange: fn(),
    onCollapsedChange: fn(),
  },
  argTypes: {
    items: { control: "object", description: "SidebarItem[]: { label, glyph, title, sub }." },
    brand: { control: "text" },
    operator: { control: "text" },
    activeIndex: {
      control: { type: "number", min: 0, max: 20, step: 1 },
      description: "Controlled active index.",
    },
    defaultActiveIndex: { control: { type: "number", min: 0, max: 20, step: 1 } },
    collapsed: { control: "boolean", description: "Controlled collapsed state." },
    defaultCollapsed: { control: "boolean" },
  },
} satisfies Meta<typeof Sidebar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The reference OCTANT.OS rail — pick a section, collapse with «. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    // Selecting a rail item swaps the content pane.
    const render = canvas.getByRole("button", { name: /render/i });
    await userEvent.click(render);
    await expect(render).toHaveAttribute("aria-current", "true");
    await expect(canvas.getByText("Live 2x4 cell rasteriser.")).toBeVisible();
    await expect(args.onActiveIndexChange).toHaveBeenCalledWith(1);

    // The « control collapses the rail to icons only.
    const collapse = canvas.getByRole("button", { name: /collapse sidebar/i });
    await userEvent.click(collapse);
    await expect(args.onCollapsedChange).toHaveBeenCalledWith(true);
    const expand = canvas.getByRole("button", { name: /expand sidebar/i });
    await expect(expand).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(expand);
    await expect(args.onCollapsedChange).toHaveBeenCalledWith(false);
  },
};

/** Starts collapsed to the icon-only rail. */
export const Collapsed: Story = {
  args: { defaultCollapsed: true },
};

/** Starts with the third section (Palette) active. */
export const SecondActive: Story = {
  args: { defaultActiveIndex: 2 },
};

/** Custom brand, operator, and section list. */
export const CustomSections: Story = {
  args: {
    brand: "RASTER.KIT",
    operator: "root",
    items: [
      { label: "Overview", glyph: "▛", title: "OVERVIEW", sub: "Fleet health at a glance." },
      { label: "Shaders", glyph: "▚", title: "SHADERS", sub: "Compile targets and cell kernels." },
      { label: "Queue", glyph: "▟", title: "QUEUE", sub: "Pending frame jobs, FIFO order." },
    ],
  },
};
