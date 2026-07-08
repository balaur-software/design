import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
// The CSS-decision prototype: a `.tsx`-level side-effect import of tokens.css via
// the same workspace-relative path a published `OctantRoot` would have to use
// (see docs/RELEASE.md's relative-import rule). This is evidence, not the
// recommendation — see docs/superpowers/specs/2026-07-08-octant-root-design.md
// "CSS decision". Storybook already loads this globally via .storybook/preview.tsx,
// so this import is redundant here; that redundancy is itself part of the
// double-import-safety evidence (harmless to import CSS twice).
import "../../../tokens/src/tokens.css";
import { ACCENTS, type AccentName } from "../../../tokens/src/index.ts";
import { Tag } from "../atoms/Tag/Tag.tsx";
import { ToastProvider, useToast } from "../primitives/ToastProvider.tsx";
import { AccentProvider } from "./AccentProvider/AccentProvider.tsx";

/**
 * PROTOTYPE for plan 013 / docs/superpowers/specs/2026-07-08-octant-root-design.md.
 * NOT a shipped component: defined only in this story file, not exported from
 * any barrel. Exercises the proposed `<OctantRoot>` shape to gather SSR +
 * Storybook/Vite evidence for the design spec's CSS decision and nesting-order
 * finding. The real follow-up build (if approved) lives in
 * `packages/ui/src/providers/OctantRoot/`.
 */

export interface OctantRootPrototypeProps {
  /** Accent name or hex; forwarded to AccentProvider. Default "green". */
  accent?: AccentName | string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Proposed shape: `AccentProvider` OUTER, `ToastProvider` INNER — the opposite
 * of docs/CONSUMING.md's current documented order. `ToastProvider` renders its
 * toast stack as its OWN sibling `<div>` next to `{children}` (not inside a
 * wrapper around them), so the toast stack only lands inside `AccentProvider`'s
 * DOM node — and inherits `--bx-accent` — when `AccentProvider` is the outer
 * component. See `CyanAccentReachesToast` below for the passing proof and
 * `WrongNestingRepro` for what breaks under the currently-documented order.
 */
function OctantRootPrototype({ accent = "green", children, className, style }: OctantRootPrototypeProps) {
  return (
    <AccentProvider
      accent={accent}
      {...(className !== undefined ? { className } : {})}
      {...(style !== undefined ? { style } : {})}
    >
      <ToastProvider>{children}</ToastProvider>
    </AccentProvider>
  );
}

/**
 * Repro of docs/CONSUMING.md's CURRENT documented order
 * (`<ToastProvider><AccentProvider>…</AccentProvider></ToastProvider>`), kept
 * only to demonstrate the bug it produces: the toast stack is a DOM sibling of
 * `AccentProvider`'s div (not a descendant), so toasts never pick up a
 * non-default accent. The doc's own example never surfaces this because it
 * always passes `accent="green"`, which matches `:root`'s default.
 */
function OctantRootWrongOrderRepro({
  accent = "green",
  children,
  className,
  style,
}: OctantRootPrototypeProps) {
  return (
    <ToastProvider>
      <AccentProvider
        accent={accent}
        {...(className !== undefined ? { className } : {})}
        {...(style !== undefined ? { style } : {})}
      >
        {children}
      </AccentProvider>
    </ToastProvider>
  );
}

/**
 * Probe child: an accent-consuming atom (`Tag`, tone="active") plus a button
 * that fires an "ok" toast via `useToast()`. The Tag is an ordinary descendant
 * of `{children}` and forwards the accent under BOTH nesting orders; the toast
 * glyph (rendered outside `{children}` by `ToastProvider` itself) only forwards
 * the accent under the correct order — that asymmetry is what the stories below
 * assert.
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
  title: "OCTANT/Providers/OctantRootPrototype",
  component: OctantRootPrototype,
  args: {
    accent: "green",
    children: <Probe />,
  },
} satisfies Meta<typeof OctantRootPrototype>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Plays 1+2: the probe renders without throwing (ToastProvider is wired — no
 * `useToast()` crash), and firing a toast shows it.
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
 * Play 3: a non-default accent (cyan) changes `--bx-accent` for BOTH the
 * ordinary descendant (the Tag's label, colored `--bx-accent-bright`) and the
 * toast's "ok" glyph (colored `--bx-accent`) — proof the chosen nesting
 * (AccentProvider outer) threads the accent all the way to ToastProvider's own
 * sibling div, not just to `{children}`.
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

/**
 * Negative evidence for the nesting-order decision: under docs/CONSUMING.md's
 * CURRENT documented order (`ToastProvider` outer), the toast stack sits
 * outside `AccentProvider`'s DOM node, so its "ok" glyph stays at `:root`'s
 * default green (`--bx-accent: #46c66d`) even though `accent="cyan"` was
 * requested. This is the concrete bug the chosen nesting order (see
 * `OctantRootPrototype` above) fixes.
 */
export const WrongNestingRepro: Story = {
  render: (args) => (
    <OctantRootWrongOrderRepro accent={args.accent ?? "green"}>
      <Probe />
    </OctantRootWrongOrderRepro>
  ),
  args: { accent: "cyan" },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /fire toast/i }));
    const toastEl = await canvas.findByRole("status");
    const glyph = within(toastEl).getByText("✓");
    // Stays green (:root default) instead of turning cyan — the documented
    // recipe's nesting order does not reskin toasts.
    await waitFor(() => expect(getComputedStyle(glyph).color).toBe(hexToRgb(ACCENTS.green.hex)));
  },
};
