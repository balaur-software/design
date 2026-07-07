import type { Meta, StoryObj } from "@storybook/react-vite";
import { PALETTE } from "../../../../tokens/src/index.ts";
import { Palette, PaletteChip } from "./PaletteChip.tsx";

const meta = {
  title: "OCTANT/Atoms/PaletteChip",
  component: Palette,
} satisfies Meta<typeof Palette>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The full 16-color ANSI palette grid. */
export const FullPalette: Story = {};

/** One swatch on its own. */
export const SingleChip: Story = {
  render: () => (
    <div style={{ width: 140 }}>
      <PaletteChip color={PALETTE[2]!} />
    </div>
  ),
};
