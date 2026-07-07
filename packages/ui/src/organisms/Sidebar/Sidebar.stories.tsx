import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "./Sidebar.tsx";

const meta: Meta<typeof Sidebar> = {
  title: "OCTANT/Organisms/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  argTypes: {
    items: { control: "object", description: "SidebarItem[]: { label, glyph, title, sub }." },
    brand: { control: "text" },
    operator: { control: "text" },
    activeIndex: { control: { type: "number", min: 0, max: 20, step: 1 }, description: "Controlled active index." },
    defaultActiveIndex: { control: { type: "number", min: 0, max: 20, step: 1 } },
    collapsed: { control: "boolean", description: "Controlled collapsed state." },
    defaultCollapsed: { control: "boolean" },
    onActiveIndexChange: { action: "active-changed" },
    onCollapsedChange: { action: "collapsed-changed" },
  },
};
export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {};

export const Collapsed: Story = {
  args: { defaultCollapsed: true },
};

export const SecondActive: Story = {
  args: { defaultActiveIndex: 2 },
};

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
