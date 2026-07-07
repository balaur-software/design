import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { EmptyState } from "./EmptyState.tsx";

const meta = {
  title: "OCTANT/Molecules/EmptyState",
  component: EmptyState,
  args: {
    title: "NO CELLS LIT",
    description: "The octant buffer is empty. Seed it with random cells or start drawing to begin.",
    cta: "SEED RANDOM ▸",
    onCtaClick: fn(),
  },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    art: { control: "text", description: "ASCII art above the title." },
    cta: { control: "text" },
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The §17 empty card — clicking the CTA fires onCtaClick. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /seed random/i }));
    await expect(args.onCtaClick).toHaveBeenCalledTimes(1);
  },
};

/** No CTA — just art, title, and copy. */
export const NoCta: Story = {
  args: {
    title: "NOTHING TO SHOW",
    description: "There are no records in this view yet.",
    cta: undefined,
  },
};

/** Custom ASCII art above the title. */
export const CustomArt: Story = {
  args: {
    title: "SIGNAL LOST",
    description: "The relay dropped its carrier. Retry the handshake to reconnect.",
    art: "░▒▓█▓▒░\n ✗   ✗ \n░▒▓█▓▒░",
    cta: "RETRY ↻",
  },
};

/** A fully custom action node in place of the built-in CTA. */
export const CustomAction: Story = {
  args: {
    title: "QUEUE DRAINED",
    description: "All jobs have finished. Enqueue a new batch to continue.",
    cta: undefined,
    action: (
      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <span style={{ color: "#5b616e", fontSize: 12 }}>0 pending &middot; 0 running</span>
      </div>
    ),
  },
};
