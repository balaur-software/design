import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { MemoryNode } from "../../organisms/MemoryExplorer/memory-types";
import { NodeSearchBox } from "./NodeSearchBox";

const results: MemoryNode[] = [
  {
    id: "r1",
    type: "memory",
    title: "Lake house trip — Ana & the dogs",
    status: "active",
    surfacing: "always",
    importance: 4,
    when: null,
    created: "2026-07-04T20:14:03.123Z",
    updated: "2026-07-04T20:14:03.123Z",
    useCount: 7,
    origin: "",
    author: "",
  },
  {
    id: "r2",
    type: "person",
    title: "Ana — sister",
    status: "active",
    surfacing: "always",
    importance: 3,
    when: null,
    created: "2026-06-01T00:00:00.000Z",
    updated: "2026-06-01T00:00:00.000Z",
    useCount: 22,
    origin: "",
    author: "",
  },
  {
    id: "r3",
    type: "skill",
    title: "sourdough method",
    status: "proposed",
    surfacing: "ask",
    importance: 2,
    when: null,
    created: "2026-07-05T00:00:00.000Z",
    updated: "2026-07-05T00:00:00.000Z",
    useCount: 0,
    origin: "",
    author: "",
  },
];

const meta = {
  title: "OCTANT/Molecules/NodeSearchBox",
  component: NodeSearchBox,
  args: { style: { width: 360 } },
  argTypes: {
    value: { control: "text" },
    defaultValue: { control: "text" },
    results: { control: "object", description: "Search results from the caller's recall/search." },
    placeholder: { control: "text" },
  },
} satisfies Meta<typeof NodeSearchBox>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Typing opens the result dropdown; picking a row fires `onSelect` and closes it. */
export const Default: Story = {
  args: { results, onSelect: fn(), onValueChange: fn() },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.type(canvas.getByRole("combobox"), "ana");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("ana");
    const row = await canvas.findByRole("option", { name: /ana — sister/i });
    await userEvent.click(row);
    await expect(args.onSelect).toHaveBeenCalledWith("r2");
    await expect(canvas.queryByRole("option", { name: /ana — sister/i })).not.toBeInTheDocument();
  },
};

/** Pre-seeded query; the dropdown opens once the input is focused. */
export const WithResults: Story = {
  args: { defaultValue: "ana", results, onSelect: fn() },
};

/** No results — the dropdown never opens. */
export const Empty: Story = {
  args: { results: [] },
};
