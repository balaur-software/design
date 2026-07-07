import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Tooltip } from "./Tooltip.tsx";

const meta = {
  title: "OCTANT/Molecules/Tooltip",
  component: Tooltip,
  args: { children: "OCTANT", tip: "2×4 sub-pixel grid · U+1CD00" },
  argTypes: {
    children: { control: "text" },
    tip: { control: "text" },
    color: { control: "color" },
    underlineColor: { control: "color" },
  },
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Hovering the trigger scrambles the tip text into the floating bubble. */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const bubble = canvas.getByRole("tooltip", { hidden: true });
    await expect(bubble).not.toBeVisible();
    await userEvent.hover(canvas.getByText("OCTANT"));
    await waitFor(() => expect(bubble).toBeVisible(), { timeout: 2000 });
    await waitFor(() => expect(bubble).toHaveTextContent("2×4 sub-pixel grid · U+1CD00"), {
      timeout: 2000,
    });
    await userEvent.unhover(canvas.getByText("OCTANT"));
    await waitFor(() => expect(bubble).not.toBeVisible());
  },
};

/** Cyan accent variant. */
export const Cyan: Story = {
  args: {
    children: "DITHER",
    tip: "density mapped to luminance",
    color: "#2bd9d9",
    underlineColor: "var(--bx-border-cyan, #1d3540)",
  },
};

/** Magenta accent variant. */
export const Magenta: Story = {
  args: {
    children: "ANSI",
    tip: "16 hues · 8 base + 8 bright",
    color: "#d79bff",
    underlineColor: "var(--bx-border-magenta, #3a2540)",
  },
};

/** Several triggers in a row — hover each to reveal its tip. */
export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", paddingTop: 40 }}>
      <Tooltip tip="2×4 sub-pixel grid · U+1CD00">OCTANT</Tooltip>
      <Tooltip
        tip="density mapped to luminance"
        color="#2bd9d9"
        underlineColor="var(--bx-border-cyan, #1d3540)"
      >
        DITHER
      </Tooltip>
      <Tooltip
        tip="16 hues · 8 base + 8 bright"
        color="#d79bff"
        underlineColor="var(--bx-border-magenta, #3a2540)"
      >
        ANSI
      </Tooltip>
      <span style={{ color: "#3f424d", fontSize: 11 }}>hover — text resolves out of static</span>
    </div>
  ),
};
