import type { Meta, StoryObj } from "@storybook/react-vite";
import { Marquee } from "./Marquee.tsx";

const meta = {
  title: "OCTANT/Atoms/Marquee",
  component: Marquee,
  argTypes: {
    items: { control: "object", description: "Inline items separated by the separator." },
    separator: { control: "text" },
    speed: { control: { type: "number", min: 0, max: 200, step: 1 } },
    ambient: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
    pauseOnHover: { control: "boolean" },
  },
} satisfies Meta<typeof Marquee>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The default scrolling ticker with built-in items. */
export const Default: Story = {};

/** Slower scroll at reduced ambient intensity. */
export const Slow: Story = {
  args: { speed: 26, ambient: 0.4 },
};

/** Fast, full-intensity ticker with status-line items. */
export const HighEnergy: Story = {
  args: {
    speed: 92,
    ambient: 1,
    items: ["SYSTEM ONLINE", "LATENCY 4MS", "NODES 128 / 128", "THROUGHPUT 9.6 GB/S", "0 ERRORS"],
  },
};

/** Arbitrary children instead of the items prop. */
export const CustomContent: Story = {
  render: () => (
    <Marquee separator="◆">
      <span style={{ color: "var(--bx-text-1, #f4f6fb)" }}>BALAUR</span>
      <span aria-hidden="true" style={{ color: "var(--bx-accent, #46c66d)", margin: "0 14px" }}>
        ◆
      </span>
      <span>MEMORY · OCTANT · LLM</span>
      <span aria-hidden="true" style={{ color: "var(--bx-accent, #46c66d)", margin: "0 14px" }}>
        ◆
      </span>
    </Marquee>
  ),
};

/** Two marquees stacked with different content and speed. */
export const Stack: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Marquee />
      <Marquee speed={40} separator="•" items={["ENCODE", "QUANTIZE", "DITHER", "RASTER", "EMIT"]} />
    </div>
  ),
};
