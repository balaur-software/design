import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import type { PlanStep } from "../ChatPanel/chat-types";
import { AgentPlan } from "./AgentPlan";

const steps: PlanStep[] = [
  { id: "1", label: "Read the buffer", status: "done" },
  { id: "2", label: "Rasterise the field", status: "done" },
  { id: "3", label: "Dither the output", status: "done" },
  { id: "4", label: "Encode to glyphs", status: "running", detail: "painting 256 cells…" },
  { id: "5", label: "Render to panel", status: "pending" },
  { id: "6", label: "Flush stream", status: "pending" },
];

const meta = {
  title: "OCTANT/Organisms/AgentPlan",
  component: AgentPlan,
  args: { steps, onStepClick: fn() },
  argTypes: {
    steps: { control: "object", description: "PlanStep[]: { id, label, status, detail? }." },
  },
} satisfies Meta<typeof AgentPlan>;
export default meta;

type Story = StoryObj<typeof meta>;

/** A plan mid-flight: the running step carries the accent rail; clicking a step reports its id. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByText(/plan · 3\/6/i)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /encode to glyphs/i }));
    await expect(args.onStepClick).toHaveBeenCalledWith("4");
    await userEvent.click(canvas.getByRole("button", { name: /read the buffer/i }));
    await expect(args.onStepClick).toHaveBeenLastCalledWith("1");
  },
};

/** Same mid-execution snapshot with explicit step args. */
export const MidExecution: Story = { args: { steps } };

/** Every step completed — the counter reads 6/6. */
export const AllDone: Story = {
  args: { steps: steps.map(({ detail: _detail, ...s }) => ({ ...s, status: "done" as const })) },
};

/** A failed step rendered in the error treatment with its detail line. */
export const WithError: Story = {
  args: {
    steps: [
      ...steps.slice(0, 3),
      { id: "4", label: "Encode to glyphs", status: "error", detail: "overflow" },
      ...steps.slice(4),
    ],
  },
};
