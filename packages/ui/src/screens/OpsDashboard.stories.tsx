import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { BarChart, type BarChartDatum } from "../organisms/BarChart/BarChart";
import {
  type DoctorMetricKey,
  type DoctorReportProps,
  DoctorStrip,
} from "../organisms/DoctorStrip/DoctorStrip";
import { Heatmap } from "../organisms/Heatmap/Heatmap";
import { LogStream } from "../organisms/LogStream/LogStream";
import type { MemoryNode } from "../organisms/MemoryExplorer/memory-types";
import { PendingQueue, type PendingVerdict } from "../organisms/PendingQueue/PendingQueue";
import { type NodeRow, Table } from "../organisms/Table/Table";

const healthyReport: DoctorReportProps = {
  activeCount: 1284,
  pendingCount: 3,
  acceptRate30d: 0.71,
  deadWeightCandidates: 12,
  staleCandidates: 34,
  duplicateCandidates: 3,
  dueCandidates: 5,
  queueOldestDays: 6,
  integrityOk: true,
};

const healthyServices: NodeRow[] = [
  { node: "AGENT-CORE", status: ["OK", "#74e692"], load: 0.62, cells: 2048 },
  { node: "MEMORY-STORE", status: ["OK", "#74e692"], load: 0.48, cells: 4096 },
  { node: "RECALL-IDX", status: ["WARN", "#ffe08a"], load: 0.81, cells: 1536 },
  { node: "TELEGRAM-GW", status: ["OK", "#74e692"], load: 0.22, cells: 512 },
  { node: "DOCTOR-CRON", status: ["OK", "#74e692"], load: 0.09, cells: 128 },
];

/** Tool p95 latency as a fraction of its budget (1.0 = at budget). */
const latency: BarChartDatum[] = [
  { label: "RECALL", value: 0.34, color: "var(--bx-accent, #46c66d)" },
  { label: "PROPOSE", value: 0.22, color: "#2bd9d9" },
  { label: "SEARCH", value: 0.51, color: "#f2c94c" },
  { label: "DECIDE", value: 0.18, color: "#c061ff" },
  { label: "DOCTOR", value: 0.72, color: "#ff6b6f" },
];

/** Proposed memories waiting on the owner — the consent queue the ops view triages. */
const pendingProposals: MemoryNode[] = [
  {
    id: "p1",
    type: "note",
    title: "seat pref — window, quiet car",
    status: "proposed",
    surfacing: "ask",
    importance: 2,
    when: null,
    created: "2026-07-06T18:12:00.000Z",
    updated: "2026-07-06T18:12:00.000Z",
    useCount: 0,
    origin: "turn:8f2c",
    author: "",
  },
  {
    id: "p2",
    type: "person",
    title: "Marc — new number",
    status: "proposed",
    surfacing: "always",
    importance: 3,
    when: null,
    created: "2026-07-05T11:40:00.000Z",
    updated: "2026-07-05T11:40:00.000Z",
    useCount: 0,
    origin: "telegram:fwd",
    author: "Ana",
    aliases: ["marc"],
  },
  {
    id: "p3",
    type: "event",
    title: "dentist — reschedule to JUL 21",
    status: "proposed",
    surfacing: "ask",
    importance: 4,
    when: "2026-07-21T08:30:00.000Z",
    created: "2026-07-01T09:05:00.000Z",
    updated: "2026-07-01T09:05:00.000Z",
    useCount: 1,
    origin: "turn:c210",
    author: "",
  },
];

const opsLogPool: string[] = [
  "recall query served 12ms",
  "doctor sweep complete 0 acts",
  "edge index compacted",
  "wal checkpoint truncated",
  "consent verdict recorded",
  "embedder batch flushed 64",
  "telegram poll ok 2 updates",
  "proposal filed → queue",
  "stale scan 34 candidates",
  "snapshot written seq 4821",
];

interface OpsDashboardProps {
  report: DoctorReportProps;
  services: NodeRow[];
  latency: BarChartDatum[];
  pending: MemoryNode[];
  onMetricClick: (key: DoctorMetricKey) => void;
  onVerdict: (id: string, verdict: PendingVerdict) => void;
  onSelectPending: (id: string) => void;
  onCommand: (command: string) => void;
}

/**
 * Screen-level composition (stories-only, not exported from the package):
 * a monitoring wall for the agent host — doctor strip up top, services table +
 * tool latency + recall heatmap on the left, consent queue + live ops log on
 * the right.
 */
function OpsDashboard({
  report,
  services,
  latency,
  pending,
  onMetricClick,
  onVerdict,
  onSelectPending,
  onCommand,
}: OpsDashboardProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: "calc(100dvh - 48px)",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "2px 2px 0",
        }}
      >
        <span style={{ color: "var(--bx-text-1, #f4f6fb)", fontSize: 14, letterSpacing: "0.04em" }}>
          <span aria-hidden="true" style={{ color: "var(--bx-accent, #46c66d)" }}>
            █{" "}
          </span>
          OCTANT.OPS
        </span>
        <span style={{ color: "#5b616e", fontSize: 11, letterSpacing: "0.08em" }}>
          UPTIME 14D 06:12 · BUILD 0.3.0
        </span>
      </div>

      <DoctorStrip report={report} onMetricClick={onMetricClick} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 380px)",
          gap: 12,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <Table rows={services} label="SERVICES · click a header to sort" defaultSortKey="load" />
          <BarChart data={latency} title="TOOLS · p95 latency vs budget" hint="P95/BUDGET" />
          <Heatmap label="HEATMAP · recall volume, 30 weeks" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <PendingQueue
            items={pending}
            onSelect={onSelectPending}
            onVerdict={onVerdict}
            style={{ border: "1px solid var(--bx-border, #1c1d24)" }}
          />
          <LogStream title="OPS LOG" messages={opsLogPool} onCommand={onCommand} />
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "OCTANT/Screens/OpsDashboard",
  component: OpsDashboard,
  parameters: { layout: "fullscreen" },
  args: {
    report: healthyReport,
    services: healthyServices,
    latency,
    pending: pendingProposals,
    onMetricClick: fn(),
    onVerdict: fn(),
    onSelectPending: fn(),
    onCommand: fn(),
  },
  argTypes: {
    report: { control: "object", description: "Doctor health snapshot (DoctorStrip)." },
    services: { control: "object", description: "Cluster rows for the services table." },
    latency: { control: "object", description: "Tool latency fractions for the bar chart." },
    pending: { control: "object", description: "Proposed memories in the consent queue." },
  },
} satisfies Meta<typeof OpsDashboard>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Nominal operations: healthy doctor strip, a short consent queue, and the live ops log. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    // The log's command line echoes and forwards submitted commands.
    const command = canvas.getByRole("textbox", { name: /command/i });
    await userEvent.type(command, "doctor --sweep{Enter}");
    await expect(args.onCommand).toHaveBeenCalledWith("doctor --sweep");
    await expect(command).toHaveValue("");
    // Approving from the consent queue routes the verdict to the host.
    await userEvent.click(canvas.getByRole("button", { name: /approve seat pref/i }));
    await expect(args.onVerdict).toHaveBeenCalledWith("p1", "approve");
    // The doctor strip drills into a metric on click.
    await userEvent.click(canvas.getByRole("button", { name: /pending/i }));
    await expect(args.onMetricClick).toHaveBeenCalledWith("pending");
  },
};

/** An unhealthy host: integrity FAIL, a backed-up consent queue and services in the red. */
export const Degraded: Story = {
  args: {
    report: {
      activeCount: 1284,
      pendingCount: 19,
      acceptRate30d: 0.38,
      deadWeightCandidates: 41,
      staleCandidates: 122,
      duplicateCandidates: 9,
      dueCandidates: 17,
      queueOldestDays: 23,
      integrityOk: false,
    },
    services: [
      { node: "AGENT-CORE", status: ["OK", "#74e692"], load: 0.58, cells: 2048 },
      { node: "MEMORY-STORE", status: ["ERR", "#ff6b6f"], load: 0.97, cells: 4096 },
      { node: "RECALL-IDX", status: ["ERR", "#ff6b6f"], load: 0.93, cells: 1536 },
      { node: "TELEGRAM-GW", status: ["WARN", "#ffe08a"], load: 0.44, cells: 512 },
      { node: "DOCTOR-CRON", status: ["WARN", "#ffe08a"], load: 0.31, cells: 128 },
    ],
    latency: [
      { label: "RECALL", value: 0.92, color: "#ff6b6f" },
      { label: "PROPOSE", value: 0.66, color: "#f2c94c" },
      { label: "SEARCH", value: 0.88, color: "#ff6b6f" },
      { label: "DECIDE", value: 0.35, color: "#2bd9d9" },
      { label: "DOCTOR", value: 0.99, color: "#ff6b6f" },
    ],
  },
};

/** A quiet night: nothing awaits a verdict, so the queue shows its empty state. */
export const QueueClear: Story = {
  args: {
    pending: [],
  },
};
