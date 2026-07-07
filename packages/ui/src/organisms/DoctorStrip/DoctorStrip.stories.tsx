import type { Meta, StoryObj } from "@storybook/react";
import type { DoctorReportProps } from "./DoctorStrip";
import { DoctorStrip } from "./DoctorStrip";

const meta: Meta<typeof DoctorStrip> = {
  title: "OCTANT/Organisms/DoctorStrip",
  component: DoctorStrip,
};
export default meta;

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

export const Healthy: StoryObj = {
  render: () => <DoctorStrip report={report} onMetricClick={(k) => alert(k)} style={{ width: 720 }} />,
};

export const Degraded: StoryObj = {
  render: () => (
    <DoctorStrip
      report={{ ...report, integrityOk: false, pendingCount: 23, queueOldestDays: 41, acceptRate30d: null }}
      style={{ width: 720 }}
    />
  ),
};
