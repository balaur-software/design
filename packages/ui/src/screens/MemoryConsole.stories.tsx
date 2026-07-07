import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { DoctorReportProps } from "../organisms/DoctorStrip/DoctorStrip";
import { MemoryExplorer } from "../organisms/MemoryExplorer/MemoryExplorer";
import type { MemoryHistorySnapshot } from "../organisms/MemoryExplorer/memory-types";
import { mockEdges, mockNodes } from "../organisms/MemoryExplorer/mock-vault";

// MemoryExplorer already composes GraphFilterBar + MemoryGraph + NodeDetailPanel
// (plus the pending queue and doctor strip), so the screen is the explorer run
// at viewport height with the full mock vault behind it.

const doctor: DoctorReportProps = {
  activeCount: 1284,
  pendingCount: 2,
  acceptRate30d: 0.71,
  deadWeightCandidates: 12,
  staleCandidates: 34,
  duplicateCandidates: 3,
  dueCandidates: 5,
  queueOldestDays: 6,
  integrityOk: true,
};

const pending = mockNodes.filter((n) => n.status === "proposed");
const searchResults = mockNodes.slice(0, 6);

/** Pre-mutation snapshots for the selected node's HISTORY tab. */
const history: MemoryHistorySnapshot[] = [
  {
    seq: 3,
    title: "lake house",
    body: "Week of AUG 14–21 confirmed; Ana has the spare keys.",
    when: null,
    actor: "owner",
    action: "edit",
    at: "2026-07-05T09:00:00.000Z",
  },
  {
    seq: 2,
    title: "lake house",
    body: "Ana proposed AUG 14–21; awaiting confirmation.",
    when: null,
    actor: "agent",
    action: "update",
    at: "2026-06-30T17:24:00.000Z",
  },
  {
    seq: 1,
    title: "lake house",
    body: "",
    when: null,
    actor: "system",
    action: "create",
    at: "2026-06-12T09:00:00.000Z",
  },
];

const meta = {
  title: "OCTANT/Screens/MemoryConsole",
  component: MemoryExplorer,
  parameters: { layout: "fullscreen" },
  args: {
    nodes: mockNodes,
    edges: mockEdges,
    pendingItems: pending,
    doctorReport: doctor,
    searchResults,
    selectedHistory: history,
    style: { height: "calc(100dvh - 48px)", minHeight: 640 },
    onSelect: fn(),
    onFilterChange: fn(),
    onVerdict: fn(),
    onSearchSelect: fn(),
    onMetricClick: fn(),
  },
  argTypes: {
    nodes: { control: "object", description: "Vault nodes (MemoryNode[])." },
    edges: { control: "object", description: "Vault edges (MemoryEdge[])." },
    pendingItems: { control: "object", description: "Proposed nodes awaiting verdict." },
    doctorReport: { control: "object", description: "Doctor health snapshot." },
    searchResults: { control: "object", description: "Search results for the filter bar." },
    selectedHistory: { control: "object", description: "History snapshots for the selected node." },
    defaultSelectedId: { control: "text" },
    defaultFilter: { control: "object" },
  },
} satisfies Meta<typeof MemoryExplorer>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The full memory console: doctor strip, type rail, graph, detail panel — approving from the queue fires the verdict. */
export const Default: Story = {
  args: {
    defaultSelectedId: "n1",
  },
  play: async ({ canvas, userEvent, args }) => {
    const first = pending[0];
    if (!first) throw new Error("mock vault has no proposed nodes");
    await userEvent.click(canvas.getByRole("button", { name: `approve ${first.title}` }));
    await expect(args.onVerdict).toHaveBeenCalledWith(first.id, "approve");
  },
};

/** Triage view: the vault pre-filtered to nodes that need an owner's eye (proposed + quarantined). */
export const Triage: Story = {
  args: {
    defaultFilter: { statuses: ["proposed", "quarantined"] },
  },
};

/** A brand-new vault: no nodes yet, so the graph area shows its empty-state prompt. */
export const EmptyVault: Story = {
  args: {
    nodes: [],
    edges: [],
    pendingItems: [],
  },
};
