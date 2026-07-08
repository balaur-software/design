import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { AttachmentChip } from "./AttachmentChip";

const meta = {
  title: "OCTANT/Atoms/AttachmentChip",
  component: AttachmentChip,
  args: { id: "a1", name: "raster.ts", kind: "code", onRemove: fn() },
  argTypes: {
    kind: { control: "select", options: ["code", "document", "image"] },
    status: { control: "select", options: [undefined, "pending", "ready", "error"] },
    name: { control: "text" },
    size: { control: "number" },
  },
} satisfies Meta<typeof AttachmentChip>;
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The × control is its own click target and fires `onRemove` with the id;
 * pending/error status variants render a coloured dot, ready stays neutral.
 */
export const Default: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <AttachmentChip {...args} />
      <AttachmentChip id="a2" name="uploading.png" kind="image" size={245760} status="pending" />
      <AttachmentChip id="a3" name="failed.md" kind="document" size={1024} status="error" />
      <AttachmentChip id="a4" name="ready.ts" kind="code" status="ready" />
    </div>
  ),
  play: async ({ args, canvas, userEvent }) => {
    // The separate remove control fires onRemove with the attachment id.
    await userEvent.click(canvas.getByRole("button", { name: /remove raster\.ts/i }));
    await expect(args.onRemove).toHaveBeenCalledWith("a1");

    // Status variants render: pending and error show a dot, ready shows none.
    await expect(canvas.getByRole("img", { name: "pending" })).toBeInTheDocument();
    await expect(canvas.getByRole("img", { name: "error" })).toBeInTheDocument();
    await expect(canvas.getByText("240 KB")).toBeInTheDocument();
    await expect(canvas.getByText("ready.ts")).toBeInTheDocument();
    await expect(canvas.queryAllByRole("img")).toHaveLength(2);
  },
};

export const Pending: Story = {
  args: { name: "uploading.png", kind: "image", size: 245760, status: "pending" },
};
export const ErrorState: Story = {
  args: { name: "failed.md", kind: "document", size: 1024, status: "error" },
};
export const WithBodyClick: Story = { args: { onClick: fn(), size: 2048 } };
