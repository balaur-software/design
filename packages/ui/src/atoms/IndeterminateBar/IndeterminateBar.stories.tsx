import type { Meta, StoryObj } from "@storybook/react-vite";
import { IndeterminateBar } from "./IndeterminateBar.tsx";

const meta = {
  title: "OCTANT/Atoms/IndeterminateBar",
  component: IndeterminateBar,
  args: { label: "STREAM · indeterminate" },
  argTypes: {
    cells: { control: { type: "number", min: 4, max: 96, step: 1 } },
    color: { control: "color" },
    size: { control: { type: "number", min: 8, max: 48, step: 1 } },
    speed: { control: { type: "number", min: 0.1, max: 6, step: 0.1 } },
    label: { control: "text" },
  },
} satisfies Meta<typeof IndeterminateBar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Default cell sweep with the standard label. */
export const Default: Story = {};

/** Accent-coloured sweep using the theme accent token. */
export const Accent: Story = {
  args: { label: "SYNC · indeterminate", color: "var(--bx-accent, #46c66d)" },
};

/** A wider 48-cell bar in amber. */
export const Wide: Story = {
  args: { label: "TRANSFER · 48 cells", cells: 48, color: "#f2c94c" },
};

/** Faster sweep speed with larger cells. */
export const Fast: Story = {
  args: { label: "SCAN · fast sweep", speed: 3, color: "#c061ff", size: 18 },
};

/** Several bars stacked with differing colours and speeds. */
export const Stack: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 320 }}>
      <IndeterminateBar label="LINK · indeterminate" />
      <IndeterminateBar label="HASH · indeterminate" color="#f2c94c" speed={0.6} />
      <IndeterminateBar label="STREAM · indeterminate" color="var(--bx-accent, #46c66d)" speed={2} />
    </div>
  ),
};
