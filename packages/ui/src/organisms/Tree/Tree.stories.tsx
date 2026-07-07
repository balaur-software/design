import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Tree, type TreeNode } from "./Tree.tsx";

const SYSTEM: TreeNode[] = [
  {
    label: "SYSTEM",
    children: [
      { label: "palette.def", glyph: "▞" },
      {
        label: "glyphs",
        children: [
          { label: "octant.map", glyph: "▛" },
          { label: "legacy.map", glyph: "▙" },
        ],
      },
      {
        label: "render",
        children: [
          { label: "dither.cfg", glyph: "▚" },
          { label: "light.cfg", glyph: "▟" },
        ],
      },
      { label: "boot.seq", glyph: "▞" },
    ],
  },
];

const meta = {
  title: "OCTANT/Organisms/Tree",
  component: Tree,
  args: { nodes: SYSTEM, "aria-label": "System files" },
  argTypes: {
    nodes: { control: "object", description: "TreeNode[]: { label, glyph?, children?, defaultCollapsed? }." },
  },
} satisfies Meta<typeof Tree>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The reference SYSTEM tree — click a folder (or use arrow keys) to toggle its subtree. */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    // Clicking an open folder collapses its subtree.
    const glyphs = canvas.getByRole("treeitem", { name: "glyphs" });
    await expect(glyphs).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText("octant.map")).toBeVisible();
    await userEvent.click(glyphs);
    await expect(glyphs).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(canvas.queryByText("octant.map")).toBeNull());

    // ArrowRight on the focused closed folder expands it again.
    await userEvent.keyboard("{ArrowRight}");
    await expect(glyphs).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(canvas.getByText("octant.map")).toBeVisible());
  },
};

/** The `glyphs` and `render` folders start collapsed via `defaultCollapsed`. */
export const CollapsedFolders: Story = {
  args: {
    nodes: [
      {
        label: "SYSTEM",
        children: [
          { label: "palette.def", glyph: "▞" },
          {
            label: "glyphs",
            defaultCollapsed: true,
            children: [
              { label: "octant.map", glyph: "▛" },
              { label: "legacy.map", glyph: "▙" },
            ],
          },
          {
            label: "render",
            defaultCollapsed: true,
            children: [
              { label: "dither.cfg", glyph: "▚" },
              { label: "light.cfg", glyph: "▟" },
            ],
          },
        ],
      },
    ],
  },
};

/** Four levels of nesting — depth drives the indent. */
export const DeepNesting: Story = {
  args: {
    nodes: [
      {
        label: "root",
        children: [
          {
            label: "src",
            children: [
              {
                label: "core",
                children: [
                  { label: "octant.ts", glyph: "▛" },
                  { label: "encode.ts", glyph: "▙" },
                ],
              },
              { label: "index.ts", glyph: "▚" },
            ],
          },
          { label: "readme.md", glyph: "▟" },
        ],
      },
    ],
  },
};

/** The tree framed inside a bordered panel, as it would sit in an app rail. */
export const InPanel: Story = {
  render: (args) => (
    <div
      style={{
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-3, #0c0d11)",
        padding: 18,
        maxWidth: 320,
      }}
    >
      <div style={{ color: "#5b616e", fontSize: 11, letterSpacing: "0.1em", marginBottom: 14 }}>
        TREE · click folders
      </div>
      <Tree {...args} />
    </div>
  ),
};
