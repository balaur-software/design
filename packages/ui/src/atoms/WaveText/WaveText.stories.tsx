import type { Meta, StoryObj } from "@storybook/react-vite";
import { WaveText } from "./WaveText.tsx";

const meta = {
  title: "OCTANT/Atoms/WaveText",
  component: WaveText,
  args: { text: "OSCILLATE" },
  argTypes: {
    text: { control: "text" },
    amplitude: { control: { type: "number", min: 0, max: 40, step: 1 } },
    speed: { control: { type: "number", min: 0, max: 8, step: 0.1 } },
    phaseStep: { control: { type: "number", min: 0, max: 2, step: 0.05 } },
    color: { control: "color" },
    fontSize: { control: { type: "number", min: 10, max: 96, step: 1 } },
  },
} satisfies Meta<typeof WaveText>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The default oscillating headline. */
export const Default: Story = {};

/** A longer phrase at a larger size. */
export const Phrase: Story = {
  args: { text: "SIGNAL ACQUIRED", fontSize: 22 },
};

/** Exaggerated wave height and phase offset. */
export const HighAmplitude: Story = {
  args: { text: "RIPPLE", amplitude: 16, phaseStep: 0.7, fontSize: 34 },
};

/** Accent-coloured wave at a slower speed. */
export const AccentSlow: Story = {
  args: { text: "AMBIENT", color: "var(--bx-accent, #46c66d)", speed: 1.6 },
};

/** Three waves stacked with different colours and phases. */
export const Stack: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <WaveText text="OSCILLATE" />
      <WaveText text="TELEMETRY" color="var(--bx-accent, #46c66d)" phaseStep={0.35} speed={2.4} />
      <WaveText text="WAVEFORM" color="#d94f9d" amplitude={12} />
    </div>
  ),
};
