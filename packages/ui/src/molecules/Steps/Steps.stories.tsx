import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Steps } from "./Steps.tsx";

const meta = {
  title: "OCTANT/Molecules/Steps",
  component: Steps,
  args: { steps: ["DECODE", "DITHER", "RENDER", "EXPORT"], defaultStep: 2, onStepChange: fn() },
  argTypes: {
    steps: { control: "object", description: "Ordered stage labels." },
    step: { control: { type: "number", min: 0, max: 20, step: 1 }, description: "Controlled active index." },
    defaultStep: { control: { type: "number", min: 0, max: 20, step: 1 } },
  },
} satisfies Meta<typeof Steps>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Mid-pipeline: clicking a node moves the active stage and fires `onStepChange`. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const render = canvas.getByRole("button", { name: /render/i });
    await expect(render).toHaveAttribute("aria-current", "step");
    const exportStep = canvas.getByRole("button", { name: /export/i });
    await userEvent.click(exportStep);
    await expect(args.onStepChange).toHaveBeenLastCalledWith(3);
    await expect(exportStep).toHaveAttribute("aria-current", "step");
    // Enter also activates a focused node.
    const decode = canvas.getByRole("button", { name: /decode/i });
    decode.focus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onStepChange).toHaveBeenLastCalledWith(0);
    await expect(decode).toHaveAttribute("aria-current", "step");
  },
};

/** Pipeline at the first stage — nothing done yet. */
export const First: Story = { args: { defaultStep: 0 } };

/** Index past the last node: every stage reads as done. */
export const Complete: Story = {
  args: { steps: ["DECODE", "DITHER", "RENDER", "EXPORT"], defaultStep: 4 },
};

/** A shorter three-stage pipeline. */
export const ThreeStage: Story = {
  args: { steps: ["QUEUE", "BUILD", "SHIP"], defaultStep: 1 },
};
