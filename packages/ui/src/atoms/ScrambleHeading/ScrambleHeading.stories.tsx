import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrambleHeading } from "./ScrambleHeading.tsx";

const meta = {
  title: "OCTANT/Atoms/ScrambleHeading",
  component: ScrambleHeading,
  args: { text: "COMPONENT INDEX" },
  argTypes: {
    text: { control: "text" },
    as: { control: "select", options: ["h1", "h2", "h3", "h4", "h5", "h6"] },
    accent: { control: "boolean" },
    dur: { control: { type: "number", min: 100, max: 4000, step: 100 } },
    delay: { control: { type: "number", min: 0, max: 2000, step: 20 } },
  },
} satisfies Meta<typeof ScrambleHeading>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A heading that decodes itself from glyph noise on mount. */
export const Default: Story = {};

/** Accent-coloured variant. */
export const Accent: Story = {
  args: { text: "SIGNAL / SCOPE", accent: true },
};

/** Two oversized hero lines decoding with a stagger. */
export const Hero: Story = {
  args: { text: "OCTANT" },
  render: () => (
    <div style={{ display: "grid", gap: 4 }}>
      <ScrambleHeading
        as="h1"
        text="OCTANT"
        dur={1100}
        style={{ fontSize: "clamp(48px, 11vw, 150px)", lineHeight: 0.9, letterSpacing: "-0.01em" }}
      />
      <ScrambleHeading
        as="h1"
        accent
        text="INTERFACE"
        dur={1100}
        delay={160}
        style={{ fontSize: "clamp(48px, 11vw, 150px)", lineHeight: 0.9, letterSpacing: "-0.01em" }}
      />
    </div>
  ),
};

/** A stack of headings decoding in sequence. */
export const Stack: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 28 }}>
      <ScrambleHeading text="PALETTE" />
      <ScrambleHeading text="GLYPH PRIMITIVES" delay={140} />
      <ScrambleHeading text="LOADERS / METERS" delay={280} />
      <ScrambleHeading text="TYPOGRAPHY FX" accent delay={420} />
    </div>
  ),
};
