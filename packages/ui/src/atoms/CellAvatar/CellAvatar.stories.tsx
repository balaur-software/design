import type { Meta, StoryObj } from "@storybook/react-vite";
import { CellAvatar, CellAvatarRow } from "./CellAvatar.tsx";

const meta = {
  title: "OCTANT/Atoms/CellAvatar",
  component: CellAvatar,
  args: { kind: "agent" },
  argTypes: {
    kind: { control: "select", options: ["agent", "user", "tool", "system"] },
    label: { control: "text" },
    color: { control: "color" },
    size: { control: { type: "number", min: 8, max: 48, step: 1 } },
  },
} satisfies Meta<typeof CellAvatar>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The agent archetype with its default glyph and label. */
export const Default: Story = {};

export const Tool: Story = { args: { kind: "tool" } };

export const System: Story = { args: { kind: "system" } };

/** All four archetypes rendered via `CellAvatarRow`. */
export const AllArchetypes: Story = {
  render: () => <CellAvatarRow />,
};

export const CustomLabel: Story = {
  args: { kind: "user", label: "OPERATOR", size: 22 },
};
