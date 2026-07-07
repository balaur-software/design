import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ToastProvider, useToast } from "../../primitives";
import { Toast } from "./Toast.tsx";

const meta = {
  title: "OCTANT/Molecules/Toast",
  component: Toast,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof Toast>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Trigger panel; each button spawns a toast in the provider's stack. */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /ok/i }));
    const toast = await canvas.findByRole("status");
    await expect(toast).toHaveTextContent("Buffer committed");
    await userEvent.click(canvas.getByRole("button", { name: /error/i }));
    const toasts = await canvas.findAllByRole("status");
    await expect(toasts).toHaveLength(2);
    await expect(toasts[1]).toHaveTextContent("Glyph out of range");
  },
};

/** Two demo panels side by side share the single provider stack. */
export const SharedStack: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      <Toast />
      <Toast />
    </div>
  ),
};

/** Firing a toast programmatically from a custom trigger. */
export const CustomTrigger: Story = {
  render: () => {
    function Panel() {
      const toast = useToast();
      return (
        <button
          type="button"
          onClick={() => toast({ kind: "info", message: "Rendered 256 cells", duration: 5000 })}
          style={{
            fontFamily: "inherit",
            fontSize: 13,
            letterSpacing: "0.06em",
            padding: "10px 14px",
            background: "transparent",
            border: "1px solid var(--bx-border-cyan, #1d3540)",
            color: "#6ff2f2",
            cursor: "pointer",
          }}
        >
          ▛ FLUSH BUFFER
        </button>
      );
    }
    return <Panel />;
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /flush buffer/i }));
    const toast = await canvas.findByRole("status");
    await expect(toast).toHaveTextContent("Rendered 256 cells");
  },
};
