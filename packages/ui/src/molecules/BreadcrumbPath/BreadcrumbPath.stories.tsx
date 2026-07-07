import type { Meta, StoryObj } from "@storybook/react";
import { BreadcrumbPath } from "./BreadcrumbPath";

const meta: Meta<typeof BreadcrumbPath> = {
  title: "OCTANT/Molecules/BreadcrumbPath",
  component: BreadcrumbPath,
};
export default meta;

export const Default: StoryObj = {
  render: () => (
    <BreadcrumbPath
      path={[
        { id: "t1", title: "memory" },
        { id: "n1", title: "Lake house trip — Ana & the dogs" },
      ]}
      onNavigate={(id) => alert(`nav ${id}`)}
    />
  ),
};

export const Deep: StoryObj = {
  render: () => (
    <BreadcrumbPath
      path={[
        { id: "t1", title: "memory" },
        { id: "n1", title: "Lake house trip" },
        { id: "n2", title: "Ana — sister" },
      ]}
    />
  ),
};
