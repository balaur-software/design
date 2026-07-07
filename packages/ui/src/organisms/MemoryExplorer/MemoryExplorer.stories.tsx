import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { DoctorReportProps } from "../DoctorStrip/DoctorStrip";
import { MemoryExplorer } from "./MemoryExplorer";
import { mockEdges, mockNodes } from "./mock-vault";

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

const meta = {
  title: "OCTANT/Organisms/MemoryExplorer",
  component: MemoryExplorer,
  args: {
    nodes: mockNodes,
    edges: mockEdges,
    pendingItems: pending,
    doctorReport: doctor,
    searchResults,
    onSelect: fn(),
    onFilterChange: fn(),
    onVerdict: fn(),
    onSearchSelect: fn(),
    onMetricClick: fn(),
  },
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
  },
} satisfies Meta<typeof MemoryExplorer>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The full navigation shell — toggling a type in the left rail narrows the filter. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    // The type appears both as a left-rail row (with its count) and a filter-bar chip.
    const [typeRow] = canvas.getAllByRole("button", { name: /^person\b/i });
    await userEvent.click(typeRow as HTMLElement);
    await expect(args.onFilterChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ types: ["person"] }),
    );
    // Toggling the same type off empties the filter again.
    await userEvent.click(typeRow as HTMLElement);
    await expect(args.onFilterChange).toHaveBeenLastCalledWith(expect.objectContaining({ types: [] }));
  },
};

/** Every rail populated: doctor strip, pending queue, search results. */
export const Full: Story = {};

/** Without a doctor report or search wiring the header collapses to brand + breadcrumb. */
export const NoDoctor: Story = {
  render: () => <MemoryExplorer nodes={mockNodes} edges={mockEdges} pendingItems={pending} />,
};
