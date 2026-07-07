import type { Meta, StoryObj } from "@storybook/react";
import type { DoctorReportProps } from "../DoctorStrip/DoctorStrip";
import { MemoryExplorer } from "./MemoryExplorer";
import { mockEdges, mockNodes } from "./mock-vault";

const meta: Meta<typeof MemoryExplorer> = {
  title: "OCTANT/Organisms/MemoryExplorer",
  component: MemoryExplorer,
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

export const Full: StoryObj = {
  render: () => (
    <MemoryExplorer
      nodes={mockNodes}
      edges={mockEdges}
      pendingItems={pending}
      doctorReport={doctor}
      searchResults={searchResults}
      onVerdict={(id, v) => alert(`verdict ${v} on ${id}`)}
      onSearchSelect={(id) => alert(`search ${id}`)}
      onMetricClick={(k) => alert(`metric ${k}`)}
    />
  ),
};

export const NoDoctor: StoryObj = {
  render: () => <MemoryExplorer nodes={mockNodes} edges={mockEdges} pendingItems={pending} />,
};
