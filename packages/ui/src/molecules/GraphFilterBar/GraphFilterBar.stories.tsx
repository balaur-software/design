import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { MemoryNode } from "../../organisms/MemoryExplorer/memory-types";
import { GraphFilterBar } from "./GraphFilterBar";

const results: MemoryNode[] = [
  {
    id: "r1",
    type: "memory",
    title: "Lake house trip",
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
];

const meta = {
  title: "OCTANT/Molecules/GraphFilterBar",
  component: GraphFilterBar,
  args: {
    filter: {
      types: ["memory", "person"],
      statuses: ["active", "proposed"],
      minImportance: 2,
    },
    onFilterChange: fn(),
    types: ["memory", "person", "skill", "note", "event"],
    searchResults: results,
    onSearchSelect: fn(),
    style: { width: 460 },
  },
  argTypes: {
    filter: { control: "object", description: "NodeFilter: { types, statuses, minImportance }." },
    types: { control: "object", description: "Node types available in the vault." },
    searchResults: { control: "object", description: "Search results from the caller's recall/search." },
  },
} satisfies Meta<typeof GraphFilterBar>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The full scope bar — toggling a type composes a new NodeFilter, and picking a search result fires onSearchSelect. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const skill = canvas.getByRole("button", { name: "skill" });
    await expect(skill).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(skill);
    await expect(args.onFilterChange).toHaveBeenCalledWith({
      types: ["memory", "person", "skill"],
      statuses: ["active", "proposed"],
      minImportance: 2,
    });

    await userEvent.click(canvas.getByRole("combobox"));
    await userEvent.click(canvas.getByRole("option", { name: /lake house trip/i }));
    await expect(args.onSearchSelect).toHaveBeenCalledWith("r1");
  },
};
