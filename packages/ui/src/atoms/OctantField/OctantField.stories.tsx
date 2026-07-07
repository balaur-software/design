import type { Meta, StoryObj } from "@storybook/react";
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

const meta: Meta<typeof OctantField> = {
  title: "OCTANT/Atoms/OctantField",
  component: OctantField,
  tags: ["autodocs"],
  decorators: [(Story) => box(<Story />)],
  argTypes: {
    accent: { control: "object", description: "RGB triplet, e.g. [70, 198, 109]." },
    ambient: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
  },
};
export default meta;
type Story = StoryObj<typeof OctantField>;

export const Default: Story = {};
export const Cyan: Story = { args: { accent: [43, 217, 217] } };
export const Amber: Story = { args: { accent: [255, 176, 0] } };
export const Calm: Story = { args: { ambient: 0.2 } };
