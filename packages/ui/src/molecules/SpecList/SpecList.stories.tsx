import type { Meta, StoryObj } from "@storybook/react-vite";
import { SpecList } from "./SpecList.tsx";

const meta = {
  title: "OCTANT/Molecules/SpecList",
  component: SpecList,
  argTypes: {
    items: { control: "object", description: "Key/value rows: { key, value, accent? }." },
    label: { control: "text" },
    columns: { control: { type: "number", min: 1, max: 6, step: 1 } },
  },
} satisfies Meta<typeof SpecList>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The reference glyph-block spec sheet, two columns. */
export const Default: Story = {};

/** A single column of rows — useful in a narrow sidebar. */
export const SingleColumn: Story = {
  args: { columns: 1 },
};

/** Custom rows with a relabelled caption and several accented values. */
export const Custom: Story = {
  args: {
    label: "NODE · runtime",
    items: [
      { key: "HOST", value: "octant-01", accent: true },
      { key: "REGION", value: "eu-central" },
      { key: "UPTIME", value: "412d 06h" },
      { key: "STATUS", value: "HEALTHY", accent: true },
      { key: "CPU", value: "38%" },
      { key: "MEM", value: "6.2 / 16 GB" },
    ],
  },
};

/** Three columns for a wide dense layout. */
export const ThreeColumns: Story = {
  args: { columns: 3 },
};
