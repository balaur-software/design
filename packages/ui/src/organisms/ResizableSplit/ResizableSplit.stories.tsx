import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ResizableSplit } from "./ResizableSplit.tsx";

const meta = {
  title: "OCTANT/Organisms/ResizableSplit",
  component: ResizableSplit,
  args: { onSplitChange: fn() },
  argTypes: {
    split: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "Controlled left-panel width (%).",
    },
    defaultSplit: { control: { type: "range", min: 0, max: 100, step: 1 } },
    min: { control: { type: "number", min: 0, max: 100, step: 1 } },
    max: { control: { type: "number", min: 0, max: 100, step: 1 } },
    height: { control: { type: "number", min: 80, max: 1200, step: 8 } },
  },
} satisfies Meta<typeof ResizableSplit>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The reference inspector/preview row — drag the divider or nudge it with arrow keys. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const handle = canvas.getByRole("separator");
    await expect(handle).toHaveAttribute("aria-valuenow", "42");

    // Arrow keys nudge the focused divider by 2%.
    handle.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(handle).toHaveAttribute("aria-valuenow", "44");
    await expect(args.onSplitChange).toHaveBeenCalledWith(44);

    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    await expect(handle).toHaveAttribute("aria-valuenow", "40");
    await expect(args.onSplitChange).toHaveBeenCalledWith(40);
  },
};

/** Starts balanced 50/50. */
export const EvenSplit: Story = {
  args: { defaultSplit: 50 },
};

/** Loosened bounds — the divider travels between 8% and 92%. */
export const WideBounds: Story = {
  args: { defaultSplit: 60, min: 8, max: 92 },
};

/** Custom panel content on both sides of the divider. */
export const CustomPanels: Story = {
  args: {
    height: 240,
    defaultSplit: 35,
    left: (
      <>
        <div
          style={{
            color: "var(--bx-accent, #46c66d)",
            fontSize: 11,
            letterSpacing: "0.1em",
            marginBottom: 10,
          }}
        >
          TREE
        </div>
        <div style={{ color: "var(--bx-text-3, #c8cdd6)", fontSize: 12, lineHeight: 1.7 }}>
          ├─ src
          <br />
          ├─ packages
          <br />
          └─ README
        </div>
      </>
    ),
    right: (
      <>
        <div
          style={{
            color: "var(--bx-border-magenta, #3a2540)",
            fontSize: 11,
            letterSpacing: "0.1em",
            marginBottom: 10,
          }}
        >
          EDITOR
        </div>
        <div style={{ color: "var(--bx-text-3, #c8cdd6)", fontSize: 12, lineHeight: 1.7 }}>
          Drag the divider to give the editor more room. Bounds honour the min/max props.
        </div>
      </>
    ),
  },
};
