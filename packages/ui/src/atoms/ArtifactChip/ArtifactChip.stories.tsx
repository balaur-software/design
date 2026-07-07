import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ArtifactChip } from "./ArtifactChip";

const meta = {
  title: "OCTANT/Atoms/ArtifactChip",
  component: ArtifactChip,
  args: { kind: "code", title: "renderer.ts", onClick: fn() },
  argTypes: {
    kind: { control: "select", options: ["code", "document", "image"] },
    title: { control: "text" },
  },
} satisfies Meta<typeof ArtifactChip>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The whole chip is one click target; clicking fires `onClick`. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /renderer\.ts/i }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Code: Story = { args: { kind: "code", title: "renderer.ts" } };
export const Document: Story = { args: { kind: "document", title: "design-notes.md" } };
export const Image: Story = { args: { kind: "image", title: "raster-frame.png" } };
