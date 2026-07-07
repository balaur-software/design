import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { Tag } from "./Tag.tsx";

const meta = {
  title: "OCTANT/Atoms/Tag",
  component: Tag,
  args: { label: "NODE-01", onRemove: fn() },
  argTypes: {
    label: { control: "text" },
    tone: { control: "select", options: ["default", "active", "degraded", "offline"] },
    removable: { control: "boolean" },
  },
} satisfies Meta<typeof Tag>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Removable chip: `×` dissolves the label into dot-noise, collapses, then fires onRemove. */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /remove node-01/i }));
    // Dissolve (~360ms) + collapse (~300ms) run before onRemove fires and the tag unmounts.
    await waitFor(() => expect(args.onRemove).toHaveBeenCalledTimes(1), { timeout: 3000 });
    await expect(canvas.queryByRole("button", { name: /remove node-01/i })).not.toBeInTheDocument();
  },
};

/** No `×` button — a plain read-only chip. */
export const NotRemovable: Story = {
  args: { label: "READ-ONLY", removable: false },
};

/** Non-removable status chips: each tone prepends its own octant status glyph. */
export const Tones: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
      <Tag tone="active" label="ACTIVE" removable={false} />
      <Tag tone="degraded" label="DEGRADED" removable={false} />
      <Tag tone="offline" label="OFFLINE" removable={false} />
      <Tag label="DEFAULT" removable={false} />
    </div>
  ),
};

/** A dismissable tag row — `×` dissolves each chip into dot-noise, then collapses it. */
export const Row: Story = {
  render: () => {
    const [tags, setTags] = useState(["NODE-01", "RELAY-7", "BUFFER-X", "SINK-3"]);
    return (
      <div style={{ maxWidth: 360 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {tags.map((label) => (
            <Tag key={label} label={label} onRemove={() => setTags((t) => t.filter((x) => x !== label))} />
          ))}
        </div>
        <div style={{ color: "#3f424d", fontSize: 11, marginTop: 16 }}>
          × dissolves the tag into dot-noise
        </div>
        {tags.length < 4 && (
          <button
            type="button"
            onClick={() => setTags(["NODE-01", "RELAY-7", "BUFFER-X", "SINK-3"])}
            style={{
              marginTop: 12,
              fontFamily: "inherit",
              fontSize: 11,
              background: "transparent",
              border: "1px solid #2a2c34",
              color: "#9aa0ad",
              cursor: "pointer",
              padding: "5px 10px",
            }}
          >
            RESET
          </button>
        )}
      </div>
    );
  },
};
