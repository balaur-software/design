import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { ScrimOverlay, type ScrimOverlayProps } from "./ScrimOverlay.tsx";

/** Interactive harness: an OPEN trigger + a self-contained ScrimOverlay (it portals and renders null while closed). */
function ScrimDemo({
  trigger = "OPEN OVERLAY",
  open: _open,
  onClose,
  ...props
}: ScrimOverlayProps & { trigger?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontFamily: "inherit",
          fontSize: 13,
          letterSpacing: "0.1em",
          padding: "12px 20px",
          background: "var(--bx-surface-2, #15161e)",
          border: "1px solid var(--bx-border-accent, #2a3320)",
          color: "var(--bx-accent, #46c66d)",
          cursor: "pointer",
        }}
      >
        {trigger} {"▸"}
      </button>
      <ScrimOverlay
        {...props}
        open={open}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
      />
    </div>
  );
}

const panelChrome = {
  background: "var(--bx-surface-3, #0c0d11)",
  border: "1px solid var(--bx-border, #1c1d24)",
  padding: 24,
  color: "var(--bx-text-3, #c8cdd6)",
  fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
  fontSize: 13,
} as const;

const meta = {
  title: "OCTANT/Primitives/ScrimOverlay",
  component: ScrimOverlay,
  args: {
    open: false,
    onClose: fn(),
    ariaLabel: "Buffer inspector",
    panelStyle: { ...panelChrome, width: 420, maxWidth: "90vw" },
    children: (
      <div>
        <div style={{ color: "var(--bx-text-1, #f4f6fb)", letterSpacing: "0.08em", marginBottom: 12 }}>
          BUFFER INSPECTOR
        </div>
        <p style={{ margin: 0, color: "var(--bx-text-5, #7b8290)", lineHeight: 1.6 }}>
          The shared shell behind Modal, Sheet and CommandPalette: portalled scrim, Escape / outside-click
          dismissal, body-scroll lock and a focus trap. Press Escape or click the scrim to close.
        </p>
        <button
          type="button"
          style={{
            marginTop: 18,
            fontFamily: "inherit",
            fontSize: 12,
            padding: "9px 16px",
            background: "var(--bx-surface-2, #15161e)",
            border: "1px solid var(--bx-border, #1c1d24)",
            color: "var(--bx-text-3, #c8cdd6)",
            cursor: "pointer",
          }}
        >
          FOCUSABLE CHILD
        </button>
      </div>
    ),
  },
} satisfies Meta<typeof ScrimOverlay>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Centered dialog behind a trigger — opens portalled to body, Escape dismisses and fires `onClose`. */
export const Default: Story = {
  render: (args) => <ScrimDemo {...args} />,
  play: async ({ canvas, userEvent, args }) => {
    // The overlay portals into document.body, so query at screen level.
    const body = within(document.body);
    await expect(body.queryByRole("dialog")).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: /open overlay/i }));
    const dialog = await body.findByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName("Buffer inspector");
    // Focus trap moves focus to the first focusable inside the panel.
    await waitFor(() => expect(body.getByRole("button", { name: /focusable child/i })).toHaveFocus());

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/** `align="end"` stretches the panel against the right edge — the Sheet posture. */
export const EndSheet: Story = {
  args: {
    align: "end",
    ariaLabel: "Render settings",
    panelStyle: { ...panelChrome, width: 320, borderTop: 0, borderBottom: 0, borderRight: 0 },
  },
  render: (args) => <ScrimDemo trigger="OPEN SHEET" {...args} />,
};

/** `trapFocus={false}` — dismissal and scroll lock still apply, but Tab may leave the panel. */
export const NoFocusTrap: Story = {
  args: {
    trapFocus: false,
  },
  render: (args) => <ScrimDemo trigger="OPEN UNTRAPPED" {...args} />,
};
