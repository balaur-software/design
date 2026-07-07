import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { FillButton } from "./FillButton.tsx";

const meta = {
  title: "OCTANT/Atoms/FillButton",
  component: FillButton,
  args: { children: "EXECUTE ▸", onClick: fn() },
  argTypes: {
    children: { control: "text" },
    fillColor: { control: "color", description: "Colour of the eighth-block charge fill." },
    borderColor: { control: "color" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof FillButton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Charges with an eighth-block fill on hover; clicking fires `onClick`. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /execute/i }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Cyan: Story = {
  args: { children: "COMPILE", fillColor: "#2bd9d9", borderColor: "#1d3540" },
};

/** Disabled: never charges and swallows clicks. */
export const Disabled: Story = {
  args: { children: "LOCKED", disabled: true },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole("button", { name: /locked/i });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
      <FillButton>EXECUTE ▸</FillButton>
      <FillButton fillColor="#2bd9d9" borderColor="#1d3540">
        COMPILE
      </FillButton>
      <FillButton disabled>LOCKED</FillButton>
    </div>
  ),
};
