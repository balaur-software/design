import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";
import { Tabs } from "./Tabs.tsx";

const meta = {
  title: "OCTANT/Organisms/Tabs",
  component: Tabs,
  args: {
    "aria-label": "System sections",
    onChange: fn(),
    tabs: [
      {
        label: "OVERVIEW",
        panel:
          "A grid of 2×4 octant cells, U+1CD00 onward. Eight sub-pixels per glyph, 256 reachable states, density as the only channel. The whole system descends from this one primitive.",
      },
      {
        label: "SIGNAL",
        panel:
          "Cursor X drives frequency, cursor Y drives amplitude. Each dot column is one sample; the trace is rasterised straight into block cells with no antialiasing.",
      },
      {
        label: "RENDER",
        panel:
          "One luminance buffer, ordered-dithered onto 2×4 cells. Where the font ships the glyphs they render as real text; where it does not, the panel draws the same sub-pixels directly.",
      },
      {
        label: "SYSTEM",
        panel:
          "Sixteen ANSI hues, eight base plus bright. No gradients, no opacity tricks — every surface in the system is a flat fill of lit cells in one of these colours.",
      },
    ],
  },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The reference four-tab strip — click or arrow between tabs to decode each panel. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    // Clicking a tab selects it and swaps (scramble-decodes) the panel.
    const signal = canvas.getByRole("tab", { name: "SIGNAL" });
    await userEvent.click(signal);
    await expect(signal).toHaveAttribute("aria-selected", "true");
    await expect(args.onChange).toHaveBeenCalledWith(1);
    await waitFor(() => expect(canvas.getByRole("tabpanel")).toHaveTextContent(/cursor x drives frequency/i));

    // Arrow keys move selection with roving focus.
    await userEvent.keyboard("{ArrowRight}");
    const render = canvas.getByRole("tab", { name: "RENDER" });
    await expect(render).toHaveAttribute("aria-selected", "true");
    await expect(render).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(signal).toHaveAttribute("aria-selected", "true");
  },
};

/** Starts with the second tab (SIGNAL) selected via `defaultIndex`. */
export const StartOnSignal: Story = {
  args: { defaultIndex: 1 },
};

/** A minimal two-tab strip. */
export const TwoTabs: Story = {
  args: {
    "aria-label": "Transport modes",
    tabs: [
      {
        label: "STREAM",
        panel:
          "Frames arrive as they render; the reader never blocks. Backpressure is a single lit cell that fills as the buffer drains.",
      },
      {
        label: "BATCH",
        panel:
          "The whole payload resolves before the first byte ships. One decode, one paint, no reflow — the terminal aesthetic at rest.",
      },
    ],
  },
};

/** Controlled mode — `index` pins the selection; clicks only fire `onChange`. */
export const Controlled: Story = {
  args: { index: 2 },
  render: (args) => (
    <div style={{ maxWidth: 680 }}>
      <Tabs {...args} />
      <p style={{ marginTop: 12, color: "#5b616e", fontSize: 12 }}>
        index is pinned to RENDER (controlled); clicks fire onChange only.
      </p>
    </div>
  ),
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "OVERVIEW" }));
    await expect(args.onChange).toHaveBeenCalledWith(0);
    // Selection stays pinned to the controlled index.
    await expect(canvas.getByRole("tab", { name: "RENDER" })).toHaveAttribute("aria-selected", "true");
  },
};
