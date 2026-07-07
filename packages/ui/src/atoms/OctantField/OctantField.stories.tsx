import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { OctantField } from "./OctantField.tsx";

const box = (children: ReactNode) => (
  <div
    style={{
      width: "100%",
      height: 360,
      position: "relative",
      border: "1px solid #1c1d24",
      background: "#08080a",
    }}
  >
    {children}
  </div>
);

const meta = {
  title: "OCTANT/Atoms/OctantField",
  component: OctantField,
  decorators: [(Story) => box(<Story />)],
  argTypes: {
    accent: { control: "object", description: "RGB triplet, e.g. [70, 198, 109]." },
    ambient: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
  },
} satisfies Meta<typeof OctantField>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The default green ambient field. */
export const Default: Story = {};
/** Cyan accent triplet. */
export const Cyan: Story = { args: { accent: [43, 217, 217] } };
/** Amber accent triplet. */
export const Amber: Story = { args: { accent: [255, 176, 0] } };
/** Reduced ambient intensity. */
export const Calm: Story = { args: { ambient: 0.2 } };
