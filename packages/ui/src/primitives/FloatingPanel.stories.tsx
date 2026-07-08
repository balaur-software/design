import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { FloatingPanel, type FloatingPanelProps } from "./FloatingPanel.tsx";

const itemStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  fontFamily: "inherit",
  fontSize: 12,
  padding: "9px 14px",
  background: "none",
  border: 0,
  color: "var(--bx-text-3, #c8cdd6)",
  cursor: "pointer",
} as const;

/** Interactive harness: the trigger button toggles the panel and reports through `onOpenChange`. */
function PanelDemo({
  label = "OPTIONS",
  open: _open,
  onOpenChange,
  trigger: _trigger,
  ...props
}: FloatingPanelProps & { label?: string }) {
  const [open, setOpen] = useState(false);
  const set = (next: boolean) => {
    setOpen(next);
    onOpenChange(next);
  };
  return (
    <FloatingPanel
      {...props}
      open={open}
      onOpenChange={set}
      trigger={
        <button
          type="button"
          aria-haspopup={props.role === "dialog" ? "dialog" : "menu"}
          aria-expanded={open}
          onClick={() => set(!open)}
          style={{
            fontFamily: "inherit",
            fontSize: 13,
            letterSpacing: "0.1em",
            padding: "11px 18px",
            background: "var(--bx-surface-2, #0b0d10)",
            border: "1px solid var(--bx-border, #1c1d24)",
            color: "var(--bx-text-1, #f4f6fb)",
            cursor: "pointer",
          }}
        >
          {label} {open ? "▴" : "▾"}
        </button>
      }
    />
  );
}

const meta = {
  title: "OCTANT/Primitives/FloatingPanel",
  component: FloatingPanel,
  args: {
    open: false,
    onOpenChange: fn(),
    trigger: null,
    ariaLabel: "Buffer actions",
    panelStyle: {
      background: "var(--bx-surface-3, #0c0d11)",
      border: "1px solid var(--bx-border, #1c1d24)",
      padding: "6px 0",
    },
    children: (
      <>
        <button type="button" role="menuitem" style={itemStyle}>
          COMMIT BUFFER
        </button>
        <button type="button" role="menuitem" style={itemStyle}>
          DIFF AGAINST BASELINE
        </button>
        <button type="button" role="menuitem" style={itemStyle}>
          FLUSH CELLS
        </button>
      </>
    ),
  },
} satisfies Meta<typeof FloatingPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The anchored popup base (Select, DropdownMenu, Popover…): panel reveals below its
 * trigger, Escape / outside-click dismisses via `onOpenChange(false)`.
 */
export const Default: Story = {
  args: { width: 240 },
  render: (args) => <PanelDemo {...args} />,
  play: async ({ canvas, userEvent, args }) => {
    // Closed panels are visibility:hidden + inert, so no menu in the a11y tree yet.
    await expect(canvas.queryByRole("menu")).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: /options/i }));
    const menu = await canvas.findByRole("menu");
    // The panel fades opacity 0 -> 1 over 120ms; wait for the entrance to land.
    await waitFor(() => expect(menu).toBeVisible());
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    await expect(canvas.getByRole("menuitem", { name: /commit buffer/i })).toBeVisible();
    await expect(canvas.getAllByRole("menuitem")).toHaveLength(3);

    await userEvent.keyboard("{Escape}");
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    // visibility flips to hidden after the 120ms exit fade.
    await waitFor(() => expect(canvas.queryByRole("menu")).toBeNull());
  },
};

/** `align="end"` anchors the panel's right edge to the trigger's right edge. */
export const AlignEnd: Story = {
  args: { align: "end", width: 260 },
  render: (args) => (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <PanelDemo label="ALIGN END" {...args} />
    </div>
  ),
};

/** `role="dialog"` — the Popover posture, with free-form (non-menu) content. */
export const DialogRole: Story = {
  args: {
    role: "dialog",
    width: 300,
    ariaLabel: "Render stats",
    panelStyle: {
      background: "var(--bx-surface-3, #0c0d11)",
      border: "1px solid var(--bx-border, #1c1d24)",
      padding: 16,
    },
    children: (
      <div style={{ fontSize: 12, color: "var(--bx-text-5, #7b8290)", lineHeight: 1.7 }}>
        <div style={{ color: "var(--bx-text-1, #f4f6fb)", letterSpacing: "0.08em", marginBottom: 8 }}>
          RENDER STATS
        </div>
        frame budget 92% · dither 2×4 · 256 cell states
      </div>
    ),
  },
  render: (args) => <PanelDemo label="STATS" {...args} />,
};
