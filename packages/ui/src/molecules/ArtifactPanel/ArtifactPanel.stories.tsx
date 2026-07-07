import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ArtifactPanel } from "./ArtifactPanel";

const code = {
  type: "artifact" as const,
  id: "a1",
  title: "raster.ts",
  kind: "code" as const,
  language: "ts",
  content: "export const V = (x: number) => (x + 1) & 7;\n",
};

const doc = {
  type: "artifact" as const,
  id: "a2",
  title: "notes.md",
  kind: "document" as const,
  content: "# Plan\n- rasterise field\n- dither output\n",
};

const meta: Meta<typeof ArtifactPanel> = {
  title: "OCTANT/Molecules/ArtifactPanel",
  component: ArtifactPanel,
  tags: ["autodocs"],
  args: { block: code, onOpen: fn() },
  argTypes: {
    block: {
      control: "object",
      description: "ArtifactBlockData: { type, id, title, kind, language?, content }.",
    },
    previewMaxHeight: { control: { type: "number", min: 80, max: 800, step: 8 } },
    onOpen: { action: "opened" },
  },
};
export default meta;

type Story = StoryObj<typeof ArtifactPanel>;

export const Default: Story = {};

export const Code: Story = { args: { block: code } };
export const Document: Story = { args: { block: doc } };
export const Image: Story = {
  args: { block: { type: "artifact", id: "a3", title: "frame.png", kind: "image", content: "" } },
};
