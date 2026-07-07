import type { Meta, StoryObj } from "@storybook/react";
import type { PlanStep } from "../ChatPanel/chat-types";
import { fn } from "@storybook/test";
import { AgentPlan } from "./AgentPlan";

const steps: PlanStep[] = [
  { id: "1", label: "Read the buffer", status: "done" },
  { id: "2", label: "Rasterise the field", status: "done" },
  { id: "3", label: "Dither the output", status: "done" },
  { id: "4", label: "Encode to glyphs", status: "running", detail: "painting 256 cells…" },
  { id: "5", label: "Render to panel", status: "pending" },
  { id: "6", label: "Flush stream", status: "pending" },
];

const meta: Meta<typeof AgentPlan> = {
  title: "OCTANT/Organisms/AgentPlan",
  component: AgentPlan,
  tags: ["autodocs"],
  args: { steps, onStepClick: fn() },
  argTypes: {
    steps: { control: "object", description: "PlanStep[]: { id, label, status, detail? }." },
    onStepClick: { action: "step-clicked" },
  },
};
export default meta;

type Story = StoryObj<typeof AgentPlan>;

export const Default: Story = {};

export const MidExecution: Story = { args: { steps } };
export const AllDone: Story = {
  args: { steps: steps.map((s) => ({ ...s, status: "done" as const, detail: undefined })) },
};
export const WithError: Story = {
  args: {
    steps: [
      ...steps.slice(0, 3),
      { id: "4", label: "Encode to glyphs", status: "error", detail: "overflow" },
      ...steps.slice(4),
    ],
  },
};
