import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { DoctorReportProps } from "./DoctorStrip";
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

const meta = {
  title: "OCTANT/Organisms/DoctorStrip",
  component: DoctorStrip,
  args: { report, onMetricClick: fn(), style: { width: 720 } },
  argTypes: {
    report: { control: "object", description: "DoctorReportProps health snapshot." },
  },
} satisfies Meta<typeof DoctorStrip>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The reference strip — clicking a metric fires `onMetricClick` with its key. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /^active/i }));
    await expect(args.onMetricClick).toHaveBeenCalledWith("active");
    await userEvent.click(canvas.getByRole("button", { name: /^integrity/i }));
    await expect(args.onMetricClick).toHaveBeenLastCalledWith("integrity");
  },
};

/** An all-green snapshot: integrity OK, small queue. */
export const Healthy: Story = {};

/** Integrity failure plus a backed-up queue and no accept-rate data. */
export const Degraded: Story = {
  args: {
    report: { ...report, integrityOk: false, pendingCount: 23, queueOldestDays: 41, acceptRate30d: null },
  },
};
