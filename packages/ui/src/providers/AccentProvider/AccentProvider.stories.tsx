import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { ACCENTS, type AccentName } from "../../../../tokens/src/index.ts";
import { AccentProvider } from "./AccentProvider.tsx";

/** Reads the inherited custom properties back so the re-skin is visible (and assertable). */
function AccentSwatch({ label }: { label?: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: 10,
        padding: 18,
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-3, #0c0d11)",
        fontSize: 12,
        minWidth: 220,
      }}
    >
      {label ? (
        <span style={{ color: "var(--bx-text-6, #5b616e)", letterSpacing: "0.1em" }}>{label}</span>
      ) : null}
      <span style={{ color: "var(--bx-accent)" }}>█ --bx-accent</span>
      <span style={{ color: "var(--bx-accent-bright)" }}>█ --bx-accent-bright</span>
      <span
        style={{
          alignSelf: "flex-start",
          padding: "5px 10px",
          border: "1px solid var(--bx-accent)",
          color: "var(--bx-accent-bright)",
          letterSpacing: "0.08em",
        }}
      >
        ACCENTED CHILD
      </span>
    </div>
  );
}

const meta = {
  title: "OCTANT/Providers/AccentProvider",
  component: AccentProvider,
  args: {
    accent: "green",
    children: <AccentSwatch />,
  },
} satisfies Meta<typeof AccentProvider>;
export default meta;
type Story = StoryObj<typeof meta>;

const hexToRgb = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 0xff}, ${(n >> 8) & 0xff}, ${n & 0xff})`;
};

/** The default green accent — children pick up `--bx-accent` / `--bx-accent-bright` by inheritance. */
export const Green: Story = {
  play: async ({ canvas }) => {
    const chip = canvas.getByText(/--bx-accent$/);
    await waitFor(() => expect(getComputedStyle(chip).color).toBe(hexToRgb(ACCENTS.green.hex)));
  },
};

/** The amber accent, with its hardcoded bright pair. */
export const Amber: Story = {
  args: { accent: "amber" },
};

/** The cyan accent, with its hardcoded bright pair. */
export const Cyan: Story = {
  args: { accent: "cyan" },
};

/** All three named accents side by side, each provider re-skinning only its own subtree. */
export const AllNamedAccents: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      {(Object.keys(ACCENTS) as AccentName[]).map((name) => (
        <AccentProvider {...args} key={name} accent={name}>
          <AccentSwatch label={name.toUpperCase()} />
        </AccentProvider>
      ))}
    </div>
  ),
};

/**
 * Any hex passes through: an unrecognized value becomes both `--bx-accent` and
 * `--bx-accent-bright` (no bright derivation).
 */
export const CustomHex: Story = {
  args: { accent: "#c061ff" },
  play: async ({ canvas }) => {
    const accent = canvas.getByText(/--bx-accent$/);
    const bright = canvas.getByText(/--bx-accent-bright$/);
    await waitFor(() => expect(getComputedStyle(accent).color).toBe(hexToRgb("#c061ff")));
    await expect(getComputedStyle(bright).color).toBe(hexToRgb("#c061ff"));
  },
};
