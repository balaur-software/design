import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { NavMenu, type NavMenuItem } from "./NavMenu.tsx";

const ITEMS: NavMenuItem[] = [
  {
    label: "PRODUCT",
    cards: [
      { glyph: "▛", title: "Renderer", desc: "2×4 cell raster", href: "#image" },
      { glyph: "▞", title: "Palette", desc: "16 ANSI hues", href: "#palette" },
      { glyph: "▙", title: "Dither", desc: "ordered Bayer", href: "#image" },
      { glyph: "▟", title: "Glyph Map", desc: "256 states", href: "#glyphs" },
    ],
  },
  {
    label: "RESOURCES",
    links: [
      { label: "Documentation" },
      { label: "Changelog" },
      { label: "Examples" },
      { label: "API reference" },
    ],
  },
  { label: "PRICING", href: "#pricing" },
];

const meta = {
  title: "OCTANT/Organisms/NavMenu",
  component: NavMenu,
  args: { items: ITEMS },
  argTypes: {
    items: { control: "object", description: "NavMenuItem[]: { label, cards?[], links?[], href? }." },
  },
} satisfies Meta<typeof NavMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The reference bar — hover PRODUCT for the mega grid, RESOURCES for a link list; PRICING is a bare link. */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    // Hovering a trigger opens its panel (clicking then toggles it).
    const product = canvas.getByRole("button", { name: /product/i });
    await userEvent.hover(product);
    await expect(product).toHaveAttribute("aria-expanded", "true");
    const renderer = canvas.getByRole("link", { name: /renderer/i });
    await waitFor(() => expect(renderer).toBeVisible());

    // Only one panel opens at a time.
    const resources = canvas.getByRole("button", { name: /resources/i });
    await userEvent.hover(resources);
    await expect(resources).toHaveAttribute("aria-expanded", "true");
    await expect(product).toHaveAttribute("aria-expanded", "false");

    // Escape dismisses the open panel.
    await userEvent.keyboard("{Escape}");
    await expect(resources).toHaveAttribute("aria-expanded", "false");
  },
};

/** A single mega panel with a three-column card grid. */
export const WideMega: Story = {
  args: {
    items: [
      {
        label: "PLATFORM",
        columns: 3,
        width: 560,
        cards: [
          { glyph: "▛", title: "Renderer", desc: "2×4 cell raster" },
          { glyph: "▜", title: "Encoder", desc: "octant packer" },
          { glyph: "▙", title: "Dither", desc: "ordered Bayer" },
          { glyph: "▟", title: "Palette", desc: "16 ANSI hues" },
          { glyph: "▚", title: "Glyph Map", desc: "256 states" },
          { glyph: "▞", title: "Export", desc: "PNG · ANSI · SVG" },
        ],
      },
      { label: "DOCS", href: "#docs" },
    ],
  },
};

/** Only compact link-list panels — no mega grid. */
export const LinkLists: Story = {
  args: {
    items: [
      {
        label: "COMPANY",
        links: [{ label: "About" }, { label: "Careers" }, { label: "Blog" }, { label: "Contact" }],
      },
      {
        label: "DEVELOPERS",
        links: [{ label: "API reference" }, { label: "SDKs" }, { label: "Status" }],
      },
      { label: "PRICING", href: "#pricing" },
    ],
  },
};

/** Every entry is a bare link — the bar degrades to a plain nav strip. */
export const LinksOnly: Story = {
  args: {
    items: [
      { label: "HOME", href: "#home" },
      { label: "DOCS", href: "#docs" },
      { label: "PRICING", href: "#pricing" },
      { label: "BLOG", href: "#blog" },
    ],
  },
};
