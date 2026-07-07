import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Carousel } from "./Carousel.tsx";

const meta = {
  title: "OCTANT/Organisms/Carousel",
  component: Carousel,
  parameters: { layout: "padded" },
  args: { onIndexChange: fn() },
  argTypes: {
    slides: { control: "object", description: "One node per slide." },
    index: { control: { type: "number", min: 0, max: 20, step: 1 }, description: "Controlled active slide." },
    defaultIndex: { control: { type: "number", min: 0, max: 20, step: 1 } },
    autoplay: { control: "boolean" },
    interval: { control: { type: "number", min: 500, max: 20000, step: 100 } },
    showDots: { control: "boolean" },
    showArrows: { control: "boolean" },
  },
} satisfies Meta<typeof Carousel>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The default OCTANT demo deck with autoplay, arrows and dots. */
export const Default: Story = {};

/** Autoplay off — navigation is manual via arrows, dots or swipe. */
export const Static: Story = {
  args: { autoplay: false },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /next slide/i }));
    await expect(args.onIndexChange).toHaveBeenLastCalledWith(1);
    await expect(canvas.getByRole("button", { name: /go to slide 2/i })).toHaveAttribute(
      "aria-current",
      "true",
    );

    await userEvent.click(canvas.getByRole("button", { name: /previous slide/i }));
    await expect(args.onIndexChange).toHaveBeenLastCalledWith(0);

    // Dot navigation jumps straight to a slide.
    await userEvent.click(canvas.getByRole("button", { name: /go to slide 3/i }));
    await expect(args.onIndexChange).toHaveBeenLastCalledWith(2);
  },
};

/** Just the sliding track — no dots, no arrows, no autoplay. */
export const Bare: Story = {
  args: { showDots: false, showArrows: false, autoplay: false },
};

const panel = (label: string, sub: string, color: string): React.ReactNode => (
  <div
    style={{
      height: 208,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      background: "#0a0b0e",
    }}
  >
    <span style={{ fontSize: 40, lineHeight: 1, color }}>{label}</span>
    <span style={{ color: "#5b616e", fontSize: 12, letterSpacing: "0.1em" }}>{sub}</span>
  </div>
);

/** Caller-supplied slide nodes on a faster 2.6s autoplay interval. */
export const CustomSlides: Story = {
  args: {
    interval: 2600,
    slides: [
      panel("§ 01", "GENERATIVE", "var(--bx-accent, #46c66d)"),
      panel("§ 02", "COMPOSITES", "#2bd9d9"),
      panel("§ 03", "OVERLAYS", "#c061ff"),
    ],
  },
};
