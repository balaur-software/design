import type { Meta, StoryObj } from "@storybook/react";
import { CellAvatar, CellAvatarRow } from "./CellAvatar.tsx";

const meta: Meta<typeof CellAvatar> = {
  title: "OCTANT/Atoms/CellAvatar",
  component: CellAvatar,
  tags: ["autodocs"],
  args: { kind: "agent" },
  argTypes: {
    kind: { control: "select", options: ["agent", "user", "tool", "system"] },
    label: { control: "text" },
    color: { control: "color" },
    size: { control: { type: "number", min: 8, max: 48, step: 1 } },
  },
};
export default meta;

type Story = StoryObj<typeof CellAvatar>;

export const Default: Story = {};

export const Tool: Story = { args: { kind: "tool" } };

export const System: Story = { args: { kind: "system" } };

export const AllArchetypes: StoryObj = {
  render: () => <CellAvatarRow />,
};

export const CustomLabel: Story = {
  args: { kind: "user", label: "OPERATOR", size: 22 },
};
