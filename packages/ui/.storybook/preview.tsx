import { ACCENTS, type AccentName } from "@balaur/tokens";
import type { Preview } from "@storybook/react-vite";
import "@balaur/tokens/tokens.css";
import { AccentProvider } from "../src/providers/AccentProvider/AccentProvider.tsx";

const accentOptions = Object.keys(ACCENTS) as AccentName[];

const preview: Preview = {
  tags: ["autodocs"],
  globalTypes: {
    accent: {
      name: "Accent",
      description: "OCTANT accent hue (sets --bx-accent on every story)",
      toolbar: {
        icon: "paintbrush",
        items: [
          ...accentOptions.map((name) => ({ value: name, title: name })),
          { value: "#c061ff", title: "custom: violet" },
        ],
      },
    },
  },
  initialGlobals: {
    accent: "green",
    backgrounds: {
      value: "octant-dark",
      grid: false,
    },
  },
  parameters: {
    layout: "padded",
    backgrounds: {
      options: {
        "octant-dark": { name: "octant-dark", value: "#08080a" },
        panel: { name: "panel", value: "#0f1015" },
        ink: { name: "ink", value: "#ffffff" },
      },
    },
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "667px" } },
        tablet: { name: "Tablet", styles: { width: "768px", height: "1024px" } },
        desktop: { name: "Desktop", styles: { width: "1280px", height: "800px" } },
        wide: { name: "Wide", styles: { width: "1920px", height: "1080px" } },
      },
    },
    a11y: {
      // "todo" surfaces axe violations in the Vitest run without failing CI;
      // flip to "error" once the backlog is clean.
      test: "todo",
    },
  },
  decorators: [
    (Story, context) => (
      <AccentProvider accent={(context.globals as { accent?: string }).accent ?? "green"}>
        <div
          style={{
            color: "#c8cdd6",
            fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
            minHeight: "100vh",
            padding: 24,
          }}
        >
          <Story />
        </div>
      </AccentProvider>
    ),
  ],
} satisfies Preview;

export default preview;
