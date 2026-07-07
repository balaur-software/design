import type { Meta, StoryObj } from "@storybook/react";
import type { MemoryNode, NodeFilter } from "../../organisms/MemoryExplorer/memory-types";
import { GraphFilterBar } from "./GraphFilterBar";

const meta: Meta<typeof GraphFilterBar> = {
  title: "OCTANT/Molecules/GraphFilterBar",
  component: GraphFilterBar,
};
export default meta;

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

export const Default: StoryObj = {
  render: () => {
    const filter: NodeFilter = {
      types: ["memory", "person"],
      statuses: ["active", "proposed"],
      minImportance: 2,
    };
    return (
      <GraphFilterBar
        filter={filter}
        onFilterChange={() => {}}
        types={["memory", "person", "skill", "note", "event"]}
        searchResults={results}
        onSearchSelect={(id) => alert(`select ${id}`)}
        style={{ width: 460 }}
      />
    );
  },
};
