import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ScanButton } from "./ScanButton.tsx";

const meta = {
  title: "OCTANT/Atoms/ScanButton",
  component: ScanButton,
  args: { children: "SCAN", onClick: fn() },
  argTypes: {
    children: { control: "text" },
    scanColor: { control: "color" },
    borderColor: { control: "color" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof ScanButton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The default yellow scanline button — hover to see the sweep; clicking fires onClick. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: /scan/i });
    await userEvent.hover(button);
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/** Cyan scanline and border. */
export const Cyan: Story = {
  args: { children: "PROBE", scanColor: "#2bd9d9", borderColor: "#1d3540" },
};

/** Magenta scanline and border. */
export const Magenta: Story = {
  args: { children: "TRACE", scanColor: "#d79bff", borderColor: "#3a2540" },
};

/** Disabled state — dimmed, inert, and unclickable. */
export const Disabled: Story = {
  args: { children: "OFFLINE", disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: /offline/i });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/** All colour variants plus the disabled state in one row. */
export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
      <ScanButton>SCAN</ScanButton>
      <ScanButton scanColor="#2bd9d9" borderColor="#1d3540">
        PROBE
      </ScanButton>
      <ScanButton scanColor="#d79bff" borderColor="#3a2540">
        TRACE
      </ScanButton>
      <ScanButton disabled>OFFLINE</ScanButton>
    </div>
  ),
};
