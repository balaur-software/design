import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";
import { DeployButton } from "./DeployButton.tsx";

const meta = {
  title: "OCTANT/Molecules/DeployButton",
  component: DeployButton,
  args: { onDeploy: fn() },
  argTypes: {
    label: { control: "text" },
    accent: { control: "color" },
    accentBright: { control: "color" },
    borderColor: { control: "color" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof DeployButton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Clicking launches the comet sweep, resolves to "✓ DEPLOYED", and fires onDeploy. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button");
    await userEvent.click(button);
    await waitFor(() => expect(args.onDeploy).toHaveBeenCalledTimes(1), { timeout: 4000 });
    await expect(button).toHaveTextContent("✓ DEPLOYED");
  },
};

/** Custom idle label. */
export const CustomLabel: Story = {
  args: { label: "SHIP ▸" },
};

/** Cyan accent, bright flash, and border overrides. */
export const Cyan: Story = {
  args: {
    label: "PUBLISH ▸",
    accent: "#2bd9d9",
    accentBright: "#7ff0f0",
    borderColor: "#1d3540",
  },
};

/** Disabled — dimmed border/label; clicks never start the sweep. */
export const Disabled: Story = {
  args: { label: "LOCKED", disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "LOCKED" });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onDeploy).not.toHaveBeenCalled();
  },
};

/** Default, cyan, and disabled variants side by side. */
export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
      <DeployButton />
      <DeployButton label="SHIP ▸" accent="#2bd9d9" accentBright="#7ff0f0" borderColor="#1d3540" />
      <DeployButton label="LOCKED" disabled />
    </div>
  ),
};
