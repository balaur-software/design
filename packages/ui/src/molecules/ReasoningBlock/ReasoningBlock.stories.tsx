import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ReasoningBlock } from "./ReasoningBlock";

const TEXT =
  "The user wants a rasterised meter. I'll reach for `bar8` since it draws eighth-block cells. Checking the load range next.";

const meta = {
  title: "OCTANT/Molecules/ReasoningBlock",
  component: ReasoningBlock,
  args: { text: TEXT, defaultCollapsed: true, onCollapsedChange: fn() },
  argTypes: {
    text: { control: "text" },
    defaultCollapsed: { control: "boolean" },
    collapsed: { control: "boolean", description: "Controlled collapsed state." },
  },
} satisfies Meta<typeof ReasoningBlock>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Collapsed by default; clicking THINKING reveals the dimmed trace. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.queryByText(/rasterised meter/i)).not.toBeInTheDocument();
    const toggle = canvas.getByRole("button", { name: /thinking/i });
    await userEvent.click(toggle);
    await expect(canvas.getByText(/rasterised meter/i)).toBeVisible();
    await expect(args.onCollapsedChange).toHaveBeenCalledWith(false);
    await userEvent.click(toggle);
    await expect(canvas.queryByText(/rasterised meter/i)).not.toBeInTheDocument();
    await expect(args.onCollapsedChange).toHaveBeenLastCalledWith(true);
  },
};

export const Collapsed: Story = { args: { text: TEXT } };
/** Starts expanded via `defaultCollapsed: false`. */
export const Expanded: Story = { args: { text: TEXT, defaultCollapsed: false } };
/** Controlled collapsed state with a change spy. */
export const Controlled: Story = { args: { text: TEXT, collapsed: false, onCollapsedChange: fn() } };
