import type { Meta, StoryObj } from "@storybook/react";
import { ArtifactPanel } from "./ArtifactPanel";

const meta: Meta<typeof ArtifactPanel> = {
  title: "OCTANT/Molecules/ArtifactPanel",
  component: ArtifactPanel,
};
export default meta;

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

export const Code: StoryObj = { args: { block: code } };
export const Document: StoryObj = { args: { block: doc } };
export const Image: StoryObj = {
  args: { block: { type: "artifact", id: "a3", title: "frame.png", kind: "image", content: "" } },
};
