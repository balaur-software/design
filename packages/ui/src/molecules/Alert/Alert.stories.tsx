import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";
import { Alert } from "./Alert.tsx";

const meta = {
  title: "OCTANT/Molecules/Alert",
  component: Alert,
  args: {
    kind: "info",
    children: "Octant glyphs detected — rendering with native U+1CD00 cells.",
    onDismiss: fn(),
  },
  argTypes: {
    kind: { control: "inline-radio", options: ["ok", "info", "warn", "err"] },
    children: { control: "text" },
    dismissible: { control: "boolean" },
  },
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The default info banner — clicking × collapses the alert and fires onDismiss. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole("alert")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /dismiss/i }));
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledTimes(1), { timeout: 2000 });
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  },
};

/** Success hue — accent-green rule and glyph. */
export const Ok: Story = {
  args: { kind: "ok", children: "Frame committed — 4096 cells flushed to the octant buffer." },
};

/** Warning hue — yellow rule and ▲ glyph. */
export const Warn: Story = {
  args: { kind: "warn", children: "Frame budget at 92% — consider lowering the dither resolution." },
};

/** Error hue — red rule and ▓ glyph. */
export const Err: Story = {
  args: { kind: "err", children: "Glyph out of range on SINK-03 — falling back to canvas raster." },
};

/** With `dismissible: false` the × control is not rendered at all. */
export const NotDismissible: Story = {
  args: { kind: "info", dismissible: false, children: "This notice stays put — no dismiss control." },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: /dismiss/i })).not.toBeInTheDocument();
  },
};

/** All four kinds stacked, as they would appear in a notice column. */
export const Stack: Story = {
  render: () => (
    <div>
      <Alert kind="info" style={{ marginBottom: 10 }}>
        Octant glyphs detected — rendering with native U+1CD00 cells.
      </Alert>
      <Alert kind="warn" style={{ marginBottom: 10 }}>
        Frame budget at 92% — consider lowering the dither resolution.
      </Alert>
      <Alert kind="err">Glyph out of range on SINK-03 — falling back to canvas raster.</Alert>
    </div>
  ),
};
