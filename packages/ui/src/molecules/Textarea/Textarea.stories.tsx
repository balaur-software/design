import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Textarea } from "./Textarea.tsx";

const meta = {
  title: "OCTANT/Molecules/Textarea",
  component: Textarea,
  args: { onChange: fn() },
  argTypes: {
    value: { control: "text", description: "Controlled value." },
    defaultValue: { control: "text" },
    maxLength: { control: { type: "number", min: 1, max: 10000, step: 1 } },
    hint: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Empty field; typing updates the value and the live character counter. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const field = canvas.getByRole("textbox");
    await userEvent.type(field, "buffer ok");
    await expect(field).toHaveValue("buffer ok");
    await expect(args.onChange).toHaveBeenLastCalledWith("buffer ok");
    await expect(canvas.getByText("9 / 240")).toBeInTheDocument();
  },
};

/** Multi-line initial value. */
export const Prefilled: Story = {
  args: {
    defaultValue: "render target: nebula field\nresolution: 1024x1024\nseed: 8823",
  },
};

/** Past 90% of `maxLength` the counter turns amber. */
export const NearLimit: Story = {
  args: {
    maxLength: 80,
    defaultValue: "this note is getting close to the character cap so the counter turns amber",
  },
};

/** Disabled: dimmed and read-only. */
export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "locked — read only",
  },
};

/** Constrained width with a custom hint and cap. */
export const Wide: Story = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Textarea hint="commit message" placeholder="summarize the change…" maxLength={120} />
    </div>
  ),
};
