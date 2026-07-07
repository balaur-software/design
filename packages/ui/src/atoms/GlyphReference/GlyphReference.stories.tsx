import type { Meta, StoryObj } from "@storybook/react-vite";
import { GlyphReference } from "./GlyphReference.tsx";

const meta = {
  title: "OCTANT/Atoms/GlyphReference",
  component: GlyphReference,
} satisfies Meta<typeof GlyphReference>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The full glyph reference table. */
export const Default: Story = {};
