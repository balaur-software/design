import type { Meta, StoryObj } from "@storybook/react";
import { ArtifactChip } from "./ArtifactChip";

const meta: Meta<typeof ArtifactChip> = {
  title: "OCTANT/Atoms/ArtifactChip",
  component: ArtifactChip,
};
export default meta;

export const Code: StoryObj = { args: { kind: "code", title: "renderer.ts" } };
export const Document: StoryObj = { args: { kind: "document", title: "design-notes.md" } };
export const Image: StoryObj = { args: { kind: "image", title: "raster-frame.png" } };
