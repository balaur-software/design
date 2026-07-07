import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ArtifactChip } from "./ArtifactChip";

const meta: Meta<typeof ArtifactChip> = {
  title: "OCTANT/Atoms/ArtifactChip",
  component: ArtifactChip,
  tags: ["autodocs"],
  args: { kind: "code", title: "renderer.ts" },
  argTypes: {
    kind: { control: "select", options: ["code", "document", "image"] },
    title: { control: "text" },
    onClick: { action: "clicked" },
  },
};
export default meta;

type Story = StoryObj<typeof ArtifactChip>;

export const Default: Story = { args: { onClick: fn() } };

export const Code: Story = { args: { kind: "code", title: "renderer.ts" } };
export const Document: Story = { args: { kind: "document", title: "design-notes.md" } };
export const Image: Story = { args: { kind: "image", title: "raster-frame.png" } };
