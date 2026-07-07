import type { Meta, StoryObj } from "@storybook/react-vite";
import { Ticker } from "./Ticker.tsx";

const meta = {
  title: "OCTANT/Atoms/Ticker",
  component: Ticker,
  args: { to: 256, label: "CELL STATES" },
  argTypes: {
    to: { control: { type: "number", min: 0, max: 100000, step: 1 } },
    label: { control: "text" },
    barColor: { control: "color" },
    duration: { control: { type: "number", min: 200, max: 6000, step: 100 } },
  },
} satisfies Meta<typeof Ticker>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Counts up to 256 with the default accent bar. */
export const Default: Story = {};

/** A small count with a cyan bar. */
export const AnsiHues: Story = {
  args: { to: 16, label: "ANSI HUES", barColor: "#2bd9d9" },
};

/** A five-digit count with a violet bar. */
export const LargeCount: Story = {
  args: { to: 14400, label: "DOTS / FRAME", barColor: "#c061ff" },
};

/** Four tickers side by side as a stat strip. */
export const Dashboard: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
      <Ticker to={256} label="CELL STATES" />
      <Ticker to={16} label="ANSI HUES" barColor="#2bd9d9" />
      <Ticker to={3072} label="GLYPHS MAPPED" barColor="#f2c94c" />
      <Ticker to={14400} label="DOTS / FRAME" barColor="#c061ff" />
    </div>
  ),
};
