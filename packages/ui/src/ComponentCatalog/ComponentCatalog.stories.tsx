import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { CATALOG_GROUPS, ComponentCatalog } from "./ComponentCatalog.tsx";

const meta = {
  title: "OCTANT/ComponentCatalog",
  component: ComponentCatalog,
  args: {
    onFilterChange: fn(),
    onJump: fn(),
  },
} satisfies Meta<typeof ComponentCatalog>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The full index, uncontrolled. Type in the filter to narrow the live count. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const filter = canvas.getByRole("textbox", { name: /filter components/i });
    await userEvent.type(filter, "chart");
    await expect(args.onFilterChange).toHaveBeenLastCalledWith("chart");
    // "Bar Chart" + "Line Chart" survive the filter; the live count reflects it.
    await expect(canvas.getByText(/2 \/ \d+ match/i)).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: /chart/i })).toHaveLength(2);

    await userEvent.click(canvas.getByRole("button", { name: /bar chart/i }));
    await expect(args.onJump).toHaveBeenCalledWith("charts");
  },
};

/** Pre-filtered on mount via `defaultFilter` (uncontrolled). */
export const Prefiltered: Story = {
  args: { defaultFilter: "chart" },
};

/** A small custom catalogue passed via `groups`. */
export const CustomGroups: Story = {
  args: {
    groups: [
      {
        cat: "PRIMITIVES",
        items: [
          { name: "Button", to: "button" },
          { name: "Switch", to: "switch" },
          { name: "Slider", to: "slider" },
        ],
      },
      {
        cat: "OVERLAYS",
        items: [
          { name: "Dialog", to: "dialog" },
          { name: "Toast", to: "toast" },
        ],
      },
    ],
  },
};

/** Controlled filter driven by external state, with a jump log. */
export const Controlled: Story = {
  render: () => {
    const [q, setQ] = useState("data");
    const [last, setLast] = useState<string>("—");
    return (
      <div>
        <div
          style={{
            marginBottom: 16,
            fontSize: 12,
            color: "#7b8290",
            fontFamily: "var(--bx-font-mono, monospace)",
          }}
        >
          filter=<span style={{ color: "#f4f6fb" }}>{q || "∅"}</span> · lastJump=
          <span style={{ color: "var(--bx-accent, #46c66d)" }}>{last}</span>
        </div>
        <ComponentCatalog filter={q} onFilterChange={setQ} onJump={setLast} groups={CATALOG_GROUPS} />
      </div>
    );
  },
};
