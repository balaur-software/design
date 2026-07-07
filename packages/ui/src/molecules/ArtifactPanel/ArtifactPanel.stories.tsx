import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
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

const meta = {
  title: "OCTANT/Molecules/ArtifactPanel",
  component: ArtifactPanel,
  args: { block: code, onOpen: fn() },
  argTypes: {
    block: {
      control: "object",
      description: "ArtifactBlockData: { type, id, title, kind, language?, content }.",
    },
    previewMaxHeight: { control: { type: "number", min: 80, max: 800, step: 8 } },
  },
} satisfies Meta<typeof ArtifactPanel>;
export default meta;

type Story = StoryObj<typeof meta>;

/** A code artifact card — clicking "open ↗" hands the artifact id to onOpen. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /open/i }));
    await expect(args.onOpen).toHaveBeenCalledWith("a1");
  },
};

/** Code artifact — renders the body inside a CodeBlock. */
export const Code: Story = { args: { block: code } };
/** Document artifact — renders the body as wrapped preformatted text. */
export const Document: Story = { args: { block: doc } };
/** Image artifact — renders a glyph placeholder instead of the content. */
export const Image: Story = {
  args: { block: { type: "artifact", id: "a3", title: "frame.png", kind: "image", content: "" } },
};
