import type { Meta, StoryObj } from "@storybook/react";
import type { DoctorReportProps } from "../DoctorStrip/DoctorStrip";
import { fn } from "@storybook/test";
import { MemoryExplorer } from "./MemoryExplorer";
import { mockEdges, mockNodes } from "./mock-vault";

const meta: Meta<typeof MemoryExplorer> = {
  title: "OCTANT/Organisms/MemoryExplorer",
  component: MemoryExplorer,
  tags: ["autodocs"],
  argTypes: {
    nodes: { control: "object", description: "Vault nodes (MemoryNode[)." },
    edges: { control: "object", description: "Vault edges (MemoryEdge[)." },
    pendingItems: { control: "object", description: "Proposed nodes awaiting verdict." },
    doctorReport: { control: "object", description: "Doctor health snapshot." },
    searchResults: { control: "object", description: "Search results for the filter bar." },
    selectedId: { control: "text", description: "Controlled selection." },
    defaultSelectedId: { control: "text" },
    filter: { control: "object", description: "Controlled NodeFilter." },
    defaultFilter: { control: "object" },
    onSelect: { action: "selected" },
    onFilterChange: { action: "filter-changed" },
    onVerdict: { action: "verdict" },
    onSearchSelect: { action: "search-selected" },
    onMetricClick: { action: "metric-clicked" },
  },
};
export default meta;

const doctor: DoctorReportProps = {
  activeCount: 1284,
  pendingCount: 4,
  acceptRate30d: 0.71,
  deadWeightCandidates: 12,
  staleCandidates: 34,
  duplicateCandidates: 3,
  dueCandidates: 5,
  queueOldestDays: 9,
  integrityOk: true,
};

const pending = mockNodes.filter((n) => n.status === "proposed").slice(0, 4);
const searchResults = mockNodes.slice(0, 6);

export const Default: StoryObj = {
  render: () => (
    <MemoryExplorer
      nodes={mockNodes}
      edges={mockEdges}
      pendingItems={pending}
      doctorReport={doctor}
      searchResults={searchResults}
      onVerdict={fn()}
      onSearchSelect={fn()}
      onMetricClick={fn()}
    />
  ),
};

export const Full: StoryObj = {
  render: () => (
    <MemoryExplorer
      nodes={mockNodes}
      edges={mockEdges}
      pendingItems={pending}
      doctorReport={doctor}
      searchResults={searchResults}
      onVerdict={fn()}
      onSearchSelect={fn()}
      onMetricClick={fn()}
    />
  ),
};

export const NoDoctor: StoryObj = {
  render: () => <MemoryExplorer nodes={mockNodes} edges={mockEdges} pendingItems={pending} />,
};
