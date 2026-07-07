import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { Pager } from "./Pager.tsx";

const meta = {
  title: "OCTANT/Molecules/Pager",
  component: Pager,
  args: { count: 24, defaultPage: 3, onPageChange: fn() },
  argTypes: {
    count: { control: { type: "number", min: 1, max: 200, step: 1 } },
    page: { control: { type: "number", min: 1, max: 200, step: 1 }, description: "Controlled active page." },
    defaultPage: { control: { type: "number", min: 1, max: 200, step: 1 } },
    siblingCount: { control: { type: "number", min: 0, max: 5, step: 1 } },
    boundaryCount: { control: { type: "number", min: 0, max: 5, step: 1 } },
  },
} satisfies Meta<typeof Pager>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Matches the reference layout: `1 2 3 4 5 … 24` with page 3 active. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Page 5" }));
    await expect(args.onPageChange).toHaveBeenCalledWith(5);
    await expect(canvas.getByRole("button", { name: "Page 5" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(args.onPageChange).toHaveBeenLastCalledWith(6);
    await expect(canvas.getByRole("button", { name: "Page 6" })).toHaveAttribute("aria-current", "page");
  },
};

/** First page active — the previous chevron is disabled. */
export const FirstPage: Story = { args: { count: 24, defaultPage: 1 } };

/** Deep in the range: ellipsis gaps open on both sides. */
export const Middle: Story = { args: { count: 24, defaultPage: 12 } };

/** Few enough pages that everything fits without an ellipsis. */
export const Few: Story = { args: { count: 5, defaultPage: 2 } };

/** `siblingCount: 2` keeps two neighbours on each side of the active page. */
export const WideSiblings: Story = { args: { count: 40, defaultPage: 20, siblingCount: 2 } };

/** Controlled: the active page is owned by the parent. */
export const Controlled: Story = {
  render: () => {
    const [page, setPage] = useState(3);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Pager count={24} page={page} onPageChange={setPage} />
        <span style={{ color: "#9aa0ad", fontSize: 13 }}>PAGE {page} / 24</span>
      </div>
    );
  },
};
