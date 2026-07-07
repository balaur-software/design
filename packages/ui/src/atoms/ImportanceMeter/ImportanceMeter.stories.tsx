import type { Meta, StoryObj } from "@storybook/react";
import { ImportanceMeter } from "./ImportanceMeter";

const meta: Meta<typeof ImportanceMeter> = {
  title: "OCTANT/Atoms/ImportanceMeter",
  component: ImportanceMeter,
};
export default meta;

export const Scale: StoryObj = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <ImportanceMeter key={n} importance={n} />
      ))}
    </div>
  ),
};

export const NoValue: StoryObj = {
  args: { importance: 4, showValue: false },
};
