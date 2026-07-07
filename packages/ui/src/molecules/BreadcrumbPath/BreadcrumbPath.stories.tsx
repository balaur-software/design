import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { BreadcrumbPath } from "./BreadcrumbPath";

const DEFAULT_PATH = [
  { id: "t1", title: "memory" },
  { id: "n1", title: "Lake house trip — Ana & the dogs" },
];

const meta: Meta<typeof BreadcrumbPath> = {
  title: "OCTANT/Molecules/BreadcrumbPath",
  component: BreadcrumbPath,
  tags: ["autodocs"],
  args: { path: DEFAULT_PATH, onNavigate: fn() },
  argTypes: {
    path: { control: "object", description: "Path segments: { id, title }." },
    onNavigate: { action: "navigated" },
  },
};
export default meta;

type Story = StoryObj<typeof BreadcrumbPath>;

export const Default: Story = {};

export const Deep: Story = {
  args: {
    path: [
      { id: "t1", title: "memory" },
      { id: "n1", title: "Lake house trip" },
      { id: "n2", title: "Ana — sister" },
    ],
  },
};
