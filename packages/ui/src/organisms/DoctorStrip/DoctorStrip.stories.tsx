import type { Meta, StoryObj } from "@storybook/react";
import type { DoctorReportProps } from "./DoctorStrip";
import { fn } from "@storybook/test";
import { DoctorStrip } from "./DoctorStrip";

const report: DoctorReportProps = {
  activeCount: 1284,
  pendingCount: 7,
  acceptRate30d: 0.71,
  deadWeightCandidates: 12,
  staleCandidates: 34,
  duplicateCandidates: 3,
  dueCandidates: 5,
  queueOldestDays: 9,
  integrityOk: true,
};

const meta: Meta<typeof DoctorStrip> = {
  title: "OCTANT/Organisms/DoctorStrip",
  component: DoctorStrip,
  tags: ["autodocs"],
  args: { report, onMetricClick: fn(), style: { width: 720 } },
  argTypes: {
    report: { control: "object", description: "DoctorReportProps health snapshot." },
    onMetricClick: { action: "metric-clicked" },
  },
};
export default meta;

type Story = StoryObj<typeof DoctorStrip>;

export const Default: Story = {};

export const Healthy: Story = {
  render: () => <DoctorStrip report={report} onMetricClick={fn()} style={{ width: 720 }} />,
};

export const Degraded: Story = {
  render: () => (
    <DoctorStrip
      report={{ ...report, integrityOk: false, pendingCount: 23, queueOldestDays: 41, acceptRate30d: null }}
      style={{ width: 720 }}
    />
  ),
};
