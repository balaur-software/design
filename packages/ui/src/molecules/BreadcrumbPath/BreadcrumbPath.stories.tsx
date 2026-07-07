import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { BreadcrumbPath } from "./BreadcrumbPath";

const DEFAULT_PATH = [
  { id: "t1", title: "memory" },
  { id: "n1", title: "Lake house trip — Ana & the dogs" },
];

const meta = {
  title: "OCTANT/Molecules/BreadcrumbPath",
  component: BreadcrumbPath,
  args: { path: DEFAULT_PATH, onNavigate: fn() },
  argTypes: {
    path: { control: "object", description: "Path segments: { id, title }." },
  },
} satisfies Meta<typeof BreadcrumbPath>;
export default meta;

type Story = StoryObj<typeof meta>;

/** MEMORY ▸ type ▸ node title — clicking a non-final segment routes its id through onNavigate. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText("Lake house trip — Ana & the dogs")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await userEvent.click(canvas.getByRole("link", { name: "memory" }));
    await expect(args.onNavigate).toHaveBeenCalledWith("t1");
  },
};

/** A three-segment path — every ancestor stays clickable. */
export const Deep: Story = {
  args: {
    path: [
      { id: "t1", title: "memory" },
      { id: "n1", title: "Lake house trip" },
      { id: "n2", title: "Ana — sister" },
    ],
  },
};
