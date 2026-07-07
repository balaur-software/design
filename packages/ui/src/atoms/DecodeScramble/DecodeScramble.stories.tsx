import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { DecodeScramble } from "./DecodeScramble.tsx";

const meta = {
  title: "OCTANT/Atoms/DecodeScramble",
  component: DecodeScramble,
  args: { text: "DESERIALIZE" },
  argTypes: {
    text: { control: "text" },
    trigger: { control: "radio", options: ["click", "hover"] },
    dur: { control: { type: "number", min: 100, max: 4000, step: 100 } },
    color: { control: "color" },
    fontSize: { control: { type: "number", min: 10, max: 80, step: 1 } },
  },
} satisfies Meta<typeof DecodeScramble>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Click to replay: the scramble sweep resolves back into the exact text. */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const el = canvas.getByRole("button", { name: "DESERIALIZE" });
    await userEvent.click(el);
    // The replayed sweep must settle on the exact target text.
    await waitFor(() => expect(el).toHaveTextContent(/^DESERIALIZE$/), { timeout: 3000 });
  },
};

export const Hover: Story = {
  args: { text: "REPLICATE", trigger: "hover" },
};

export const CyanFast: Story = {
  args: { text: "HANDSHAKE", color: "var(--bx-ansi-6, #2bd9d9)", dur: 500 },
};

export const Stack: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ color: "#3f424d", fontSize: 11 }}>
        click to replay &middot; scramble &rarr; resolve, left to right
      </div>
      <DecodeScramble text="DESERIALIZE" />
      <DecodeScramble text="RECONSTRUCT" color="var(--bx-accent, #46c66d)" />
      <DecodeScramble text="TERMINATE" color="var(--bx-ansi-3, #f2c94c)" fontSize={24} />
    </div>
  ),
};
