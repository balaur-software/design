import type { Meta, StoryObj } from "@storybook/react-vite";
import { ModelBadge } from "./ModelBadge.tsx";

const meta = {
  title: "OCTANT/Atoms/ModelBadge",
  component: ModelBadge,
  argTypes: {
    model: { control: "text" },
    glyph: { control: "text" },
    meta: { control: "object", description: "Secondary neutral meta tags." },
  },
} satisfies Meta<typeof ModelBadge>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Built-in default model name and meta tags. */
export const Default: Story = {};

/** Custom model name with sampling-parameter meta tags. */
export const CustomModel: Story = {
  args: {
    model: "OCTANT-4-TURBO",
    meta: ["CTX 256K", "TEMP 0.2", "TOP-P 0.9"],
  },
};

/** Model name only, with no meta tags. */
export const ModelOnly: Story = {
  args: {
    model: "OCTANT-MINI",
    meta: [],
  },
};

/** Alternate leading glyph. */
export const CustomGlyph: Story = {
  args: {
    model: "OCTANT-VISION",
    glyph: "▛",
    meta: ["CTX 128K", "IMG 4"],
  },
};
