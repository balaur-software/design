import type { Meta, StoryObj } from "@storybook/react";
import type { PlanStep } from "../ChatPanel/chat-types";
import { AgentPlan } from "./AgentPlan";

const meta: Meta<typeof AgentPlan> = {
  title: "OCTANT/Organisms/AgentPlan",
  component: AgentPlan,
};
export default meta;

const steps: PlanStep[] = [
  { id: "1", label: "Read the buffer", status: "done" },
  { id: "2", label: "Rasterise the field", status: "done" },
  { id: "3", label: "Dither the output", status: "done" },
  { id: "4", label: "Encode to glyphs", status: "running", detail: "painting 256 cells…" },
  { id: "5", label: "Render to panel", status: "pending" },
  { id: "6", label: "Flush stream", status: "pending" },
];

export const MidExecution: StoryObj = { args: { steps } };
export const AllDone: StoryObj = {
  args: { steps: steps.map((s) => ({ ...s, status: "done" as const, detail: undefined })) },
};
export const WithError: StoryObj = {
  args: {
    steps: [
      ...steps.slice(0, 3),
      { id: "4", label: "Encode to glyphs", status: "error", detail: "overflow" },
      ...steps.slice(4),
    ],
  },
};
