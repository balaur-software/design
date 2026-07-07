import type { Meta, StoryObj } from "@storybook/react";
import { ImportanceMeter } from "./ImportanceMeter";

const meta: Meta<typeof ImportanceMeter> = {
  title: "OCTANT/Atoms/ImportanceMeter",
  component: ImportanceMeter,
  tags: ["autodocs"],
  args: { importance: 4 },
  argTypes: {
    importance: {
      control: { type: "number", min: 0, max: 5, step: 1 },
      description: "0 = n/a; 1..5 otherwise.",
    },
    max: { control: { type: "number", min: 1, max: 10, step: 1 } },
    color: { control: "color" },
    trackColor: { control: "color" },
    showValue: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof ImportanceMeter>;

export const Default: Story = {};

export const Scale: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <ImportanceMeter key={n} importance={n} />
      ))}
    </div>
  ),
};

export const NoValue: Story = {
  args: { importance: 4, showValue: false },
};
