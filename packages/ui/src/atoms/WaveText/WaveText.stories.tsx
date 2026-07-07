import type { Meta, StoryObj } from "@storybook/react";
import { WaveText } from "./WaveText.tsx";

const meta: Meta<typeof WaveText> = {
  title: "OCTANT/Atoms/WaveText",
  component: WaveText,
  tags: ["autodocs"],
  args: { text: "OSCILLATE" },
  argTypes: {
    text: { control: "text" },
    amplitude: { control: { type: "number", min: 0, max: 40, step: 1 } },
    speed: { control: { type: "number", min: 0, max: 8, step: 0.1 } },
    phaseStep: { control: { type: "number", min: 0, max: 2, step: 0.05 } },
    color: { control: "color" },
    fontSize: { control: { type: "number", min: 10, max: 96, step: 1 } },
  },
};
export default meta;
type Story = StoryObj<typeof WaveText>;

export const Default: Story = {};

export const Phrase: Story = {
  args: { text: "SIGNAL ACQUIRED", fontSize: 22 },
};

export const HighAmplitude: Story = {
  args: { text: "RIPPLE", amplitude: 16, phaseStep: 0.7, fontSize: 34 },
};

export const AccentSlow: Story = {
  args: { text: "AMBIENT", color: "var(--bx-accent, #46c66d)", speed: 1.6 },
};

export const Stack: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <WaveText text="OSCILLATE" />
      <WaveText text="TELEMETRY" color="var(--bx-accent, #46c66d)" phaseStep={0.35} speed={2.4} />
      <WaveText text="WAVEFORM" color="#d94f9d" amplitude={12} />
    </div>
  ),
};
