import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { type ToastKind, ToastProvider, useToast } from "./ToastProvider.tsx";

const KINDS: readonly { kind: ToastKind; label: string; message: string }[] = [
  { kind: "ok", label: "TOAST OK", message: "BUFFER COMMITTED" },
  { kind: "err", label: "TOAST ERR", message: "SINK-03 GLYPH FAULT" },
  { kind: "info", label: "TOAST INFO", message: "GLYPH CACHE WARMED" },
];

/** Demo consumer: fires one toast per kind via the `useToast` context hook. */
function ToastDemo({ duration }: { duration?: number }) {
  const toast = useToast();
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {KINDS.map(({ kind, label, message }) => (
        <button
          key={kind}
          type="button"
          onClick={() => toast({ kind, message, ...(duration !== undefined ? { duration } : {}) })}
          style={{
            fontFamily: "inherit",
            fontSize: 12,
            letterSpacing: "0.08em",
            padding: "10px 16px",
            background: "var(--bx-surface-2, #0b0d10)",
            border: "1px solid var(--bx-border, #1c1d24)",
            color: "var(--bx-text-3, #c8cdd6)",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const meta = {
  title: "OCTANT/Primitives/ToastProvider",
  component: ToastProvider,
  args: {
    children: <ToastDemo duration={1200} />,
  },
} satisfies Meta<typeof ToastProvider>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The imperative toast service: any descendant fires toasts via `useToast`; the stack
 * renders bottom-right and each toast auto-dismisses after its duration (1.2s here).
 */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.queryByRole("status")).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: /toast ok/i }));
    const toast = await canvas.findByRole("status");
    await expect(within(toast).getByText("BUFFER COMMITTED")).toBeVisible();

    // No manual dismiss affordance — toasts dismiss themselves after `duration`.
    await waitFor(() => expect(canvas.queryByRole("status")).toBeNull(), { timeout: 3000 });
  },
};

/** Several toasts stack vertically; each dismisses on its own clock. */
export const Stacked: Story = {
  args: {
    children: <ToastDemo duration={6000} />,
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /toast ok/i }));
    await userEvent.click(canvas.getByRole("button", { name: /toast err/i }));
    await userEvent.click(canvas.getByRole("button", { name: /toast info/i }));
    await waitFor(() => expect(canvas.getAllByRole("status")).toHaveLength(3));
    await expect(canvas.getByText("SINK-03 GLYPH FAULT")).toBeVisible();
  },
};
