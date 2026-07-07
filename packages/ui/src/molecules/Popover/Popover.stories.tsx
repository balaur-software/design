import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor, within } from "storybook/test";
import { ToastProvider } from "../../primitives";
import { Popover } from "./Popover.tsx";

const meta = {
  title: "OCTANT/Molecules/Popover",
  component: Popover,
  args: { onChange: fn() },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  argTypes: {
    label: { control: "text" },
    title: { control: "text" },
    description: { control: "text" },
    options: { control: "object", description: "Single-select toggle options." },
    value: { control: "text", description: "Controlled selected option." },
    defaultValue: { control: "text" },
    applyLabel: { control: "text" },
    toastMessage: { control: "text" },
    width: { control: { type: "number", min: 160, max: 480, step: 8 } },
    align: { control: "radio", options: ["start", "end"] },
  },
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The reference popover — CONFIGURE opens a density toggle; APPLY closes it and fires a toast. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const trigger = canvas.getByRole("button", { name: /configure/i });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = canvas.getByRole("dialog", { name: /render density/i });
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(within(dialog).getByRole("button", { name: "HIGH" }));
    await expect(args.onChange).toHaveBeenCalledWith("HIGH");
    await expect(within(dialog).getByRole("button", { name: "HIGH" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(within(dialog).getByRole("button", { name: /apply/i }));
    await waitFor(() => expect(dialog).not.toBeVisible());
  },
};

/** Every surface overridden — a glyph-set picker with a COMMIT action. */
export const CustomControls: Story = {
  args: {
    label: "ENCODER",
    title: "GLYPH SET",
    description: "Which sub-cell encoder rasterises each frame.",
    options: ["OCTANT", "QUAD", "BRAILLE"],
    defaultValue: "OCTANT",
    applyLabel: "COMMIT",
    toastMessage: "Encoder committed",
    width: 264,
  },
};

/** `align: "end"` anchors the panel to the trigger's right edge. */
export const EndAligned: Story = {
  render: (args) => (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <Popover {...args} align="end" />
    </div>
  ),
};

/** Two independent popovers side by side. */
export const TwoUp: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 40 }}>
      <Popover label="DENSITY" />
      <Popover
        label="THEME"
        title="SURFACE TINT"
        description="Base tint applied to floating surfaces."
        options={["COOL", "NEUTRAL", "WARM"]}
        defaultValue="NEUTRAL"
        toastMessage="Tint applied"
      />
    </div>
  ),
};
