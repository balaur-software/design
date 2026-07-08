import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ACCENTS } from "../../../../tokens/src/index.ts";
import { Tag } from "../../atoms/Tag/Tag.tsx";
import { useToast } from "../../primitives/ToastProvider.tsx";
import { OctantRoot } from "./OctantRoot.tsx";

/**
 * Probe child: an accent-consuming atom (`Tag`, tone="active") plus a button
 * that fires an "ok" toast via `useToast()`. The Tag is an ordinary descendant
 * of `{children}`; the toast glyph is rendered OUTSIDE `{children}` by
 * `ToastProvider` itself — so the accent reaching the glyph proves
 * `OctantRoot`'s nesting order (AccentProvider outer) threads the accent to
 * ToastProvider's own sibling div, not just to the app subtree.
 */
function Probe() {
  const toast = useToast();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      <Tag label="ACCENT PROBE" tone="active" removable={false} />
      <button
        type="button"
        onClick={() => toast({ kind: "ok", message: "PROBE OK" })}
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
        FIRE TOAST
      </button>
    </div>
  );
}

const hexToRgb = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 0xff}, ${(n >> 8) & 0xff}, ${n & 0xff})`;
};

const meta = {
  title: "OCTANT/Providers/OctantRoot",
  component: OctantRoot,
  args: {
    accent: "green",
    children: <Probe />,
  },
} satisfies Meta<typeof OctantRoot>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The probe renders without throwing (ToastProvider is wired — no `useToast()`
 * crash), and firing a toast shows it.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("ACCENT PROBE")).toBeVisible();
    await expect(canvas.queryByRole("status")).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: /fire toast/i }));
    const toastEl = await canvas.findByRole("status");
    await expect(within(toastEl).getByText("PROBE OK")).toBeVisible();
  },
};

/**
 * A non-default accent (cyan) changes `--bx-accent` for BOTH the ordinary
 * descendant (the Tag's label, colored `--bx-accent-bright`) and the toast's
 * "ok" glyph (colored `--bx-accent`) — proof that `OctantRoot`'s nesting
 * (AccentProvider outer, ToastProvider inner) threads the accent all the way
 * to ToastProvider's own sibling div. The reverse order (previously documented
 * in CONSUMING.md) leaves the toast stack outside AccentProvider's DOM node,
 * stuck at `:root`'s default green.
 */
export const CyanAccentReachesToast: Story = {
  args: { accent: "cyan" },
  play: async ({ canvas }) => {
    const tagLabel = canvas.getByText("ACCENT PROBE");
    await waitFor(() => expect(getComputedStyle(tagLabel).color).toBe(hexToRgb(ACCENTS.cyan.bright)));

    await userEvent.click(canvas.getByRole("button", { name: /fire toast/i }));
    const toastEl = await canvas.findByRole("status");
    const glyph = within(toastEl).getByText("✓");
    await waitFor(() => expect(getComputedStyle(glyph).color).toBe(hexToRgb(ACCENTS.cyan.hex)));
  },
};
