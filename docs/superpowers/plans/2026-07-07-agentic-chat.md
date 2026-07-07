# Agentic AI Chat Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete agentic AI chat interface as OCTANT design-system components (5 atoms, 8 molecules, 3 organisms) with Storybook stories, surfacing tool calls, reasoning, streaming, multi-step plans, multi-agent, citations, and artifacts.

**Architecture:** Controlled (props-driven) components organized by atomic design. A structured `Block[]` discriminated union models message content; a `BlockRenderer` dispatcher delegates each block to a dedicated molecule. The consuming app owns stream subscription and message state; OCTANT provides only presentational components and animation hooks.

**Tech Stack:** Bun >= 1.2, TypeScript (raw, no build step), React 19, Biome, Storybook 8. `@balaur/octant-core` (seededRandom, encode) and `@balaur/tokens` (PALETTE, accent vars) for glyphs/hues. Zero new runtime dependencies.

## Global Constraints

- Runtime: Bun >= 1.2. No build step — raw TypeScript consumed natively.
- Zero new runtime dependencies. No markdown library.
- Biome format/lint: `bun run lint`. Indent 2 spaces, lineWidth 110. Import ordering is enforced (biome auto-fixes).
- One component per folder: `Name/Name.tsx` + `Name.stories.tsx`. No `.tsx` extension in barrel re-exports (match `primitives/index.ts`).
- Story titles: `OCTANT/<Atoms|Molecules|Organisms>/<Name>`.
- All components are controlled (props-driven). No internal stream/transport logic.
- Inline styles using `--bx-*` CSS custom properties with hex fallbacks, matching existing OCTANT components.
- Reduced-motion respect via `useReducedMotion` for any rAF/animation.
- `bun run check` (typecheck + lint + test) must pass in `design/` after every task.
- Commit per task. Never commit unless the user explicitly asks — **this plan's "Commit" steps are instructions to the implementer; in this workspace, pause and ask the user before committing.** (Workspace AGENTS.md rule supersedes.)
- Reference spec: `docs/superpowers/specs/2026-07-07-agentic-chat-design.md`.

---

## File Structure

```
packages/ui/src/
  atoms/
    StreamingCursor/StreamingCursor.tsx + .stories.tsx
    StopButton/StopButton.tsx + .stories.tsx
    ToolPill/ToolPill.tsx + .stories.tsx
    AgentGlyph/AgentGlyph.tsx + .stories.tsx + agent-glyph.test.ts
    ArtifactChip/ArtifactChip.tsx + .stories.tsx
  molecules/
    TextBlock/TextBlock.tsx + .stories.tsx + text-block.test.ts
    ReasoningBlock/ReasoningBlock.tsx + .stories.tsx
    ToolCallBlock/ToolCallBlock.tsx + .stories.tsx
    ArtifactPanel/ArtifactPanel.tsx + .stories.tsx
    TypingIndicator/TypingIndicator.tsx + .stories.tsx
    BlockRenderer/BlockRenderer.tsx + .stories.tsx
    ChatComposer/ChatComposer.tsx + .stories.tsx
    ChatMessage/ChatMessage.tsx + .stories.tsx
  organisms/
    ChatThread/ChatThread.tsx + .stories.tsx
    AgentPlan/AgentPlan.tsx + .stories.tsx
    ChatPanel/ChatPanel.tsx + .stories.tsx + chat-types.ts
```

Barrel updates: append `export *` lines to `atoms/index.ts`, `molecules/index.ts`, `organisms/index.ts`. Root `src/index.ts` already re-exports the category barrels — no change needed there.

---

### Task 1: Shared chat types

**Files:**
- Create: `packages/ui/src/organisms/ChatPanel/chat-types.ts`

**Interfaces:**
- Consumes: `CitationSource` type from `../../atoms/InlineCitation/InlineCitation`
- Produces: `BlockStatus`, `Block`, `ChatMessageData`, `Agent`, `PlanStep` — used by every later task

- [ ] **Step 1: Create the types file**

```ts
// packages/ui/src/organisms/ChatPanel/chat-types.ts
import type { CitationSource } from "../../atoms/InlineCitation/InlineCitation";

/** Lifecycle status for a tool call or plan step. */
export type BlockStatus = "running" | "done" | "error";

/**
 * One content block in an agent message. `BlockRenderer` dispatches on `type`.
 * The union mirrors how model providers structure multi-part message content.
 */
export type Block =
  | { type: "text"; text: string; streaming?: boolean }
  | { type: "reasoning"; text: string; defaultCollapsed?: boolean }
  | {
      type: "tool_call";
      id: string;
      name: string;
      args?: unknown;
      result?: unknown;
      status: BlockStatus;
      startedAt?: number;
      endedAt?: number;
    }
  | { type: "code"; language?: string; code: string }
  | {
      type: "artifact";
      id: string;
      title: string;
      kind: "code" | "document" | "image";
      language?: string;
      content: string;
    }
  | { type: "citations"; sources: CitationSource[] };

/** One row in a chat thread. */
export interface ChatMessageData {
  id: string;
  role: "user" | "agent" | "system" | "tool";
  /** For multi-agent threads: which agent produced this message. */
  agentId?: string;
  name?: string;
  time?: string;
  blocks: Block[];
  status?: "streaming" | "complete" | "error";
}

/** A named agent in a multi-agent thread. */
export interface Agent {
  id: string;
  name: string;
  /** Accent CSS color or token; overrides AgentGlyph's hashed accent. */
  accent?: string;
  /** Override the quadrant mosaic glyph. */
  glyph?: string;
}

/** One step in an AgentPlan. */
export interface PlanStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  /** Optional detail line shown under the label when running/expanded. */
  detail?: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /home/alex/projects/balaur/design && bun run typecheck`
Expected: PASS (file compiles; not yet exported so no consumers).

- [ ] **Step 3: Pause for user before committing**

Do not commit. Inform the user the task is complete and ask whether to commit.

---

### Task 2: StreamingCursor atom

**Files:**
- Create: `packages/ui/src/atoms/StreamingCursor/StreamingCursor.tsx`
- Create: `packages/ui/src/atoms/StreamingCursor/StreamingCursor.stories.tsx`

**Interfaces:**
- Consumes: `useReducedMotion` from `../../hooks/useReducedMotion`
- Produces: `StreamingCursor`, `StreamingCursorProps`

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/atoms/StreamingCursor/StreamingCursor.tsx
import { useReducedMotion } from "../../hooks/useReducedMotion";

export interface StreamingCursorProps {
  /** Whether the cursor is actively blinking. Default true. */
  active?: boolean;
  /** Glyph to render. Default the full block "█". */
  glyph?: string;
  /** Inline style override (e.g. to match surrounding text color). */
  color?: string;
}

/**
 * A terminal-style cursor block appended to streaming text. Blinks via the
 * global `bx-blink` keyframe; under reduced-motion it stays steady. Pure
 * declarative CSS animation — identical on server and client.
 */
export function StreamingCursor({ active = true, glyph = "█", color }: StreamingCursorProps) {
  const reduced = useReducedMotion();
  return (
    <span
      aria-hidden="true"
      style={{
        color: color ?? "var(--bx-accent, #46c66d)",
        animation: active && !reduced ? "bx-blink 1.1s steps(1) infinite" : undefined,
        marginLeft: 1,
      }}
    >
      {glyph}
    </span>
  );
}
```

- [ ] **Step 2: Create the story**

```tsx
// packages/ui/src/atoms/StreamingCursor/StreamingCursor.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { StreamingCursor } from "./StreamingCursor";

const meta: Meta<typeof StreamingCursor> = {
  title: "OCTANT/Atoms/StreamingCursor",
  component: StreamingCursor,
};
export default meta;

export const Default: StoryObj = {
  render: () => (
    <span style={{ fontFamily: "var(--bx-font-mono, ui-monospace, monospace)", fontSize: 14 }}>
      streaming text
      <StreamingCursor />
    </span>
  ),
};

export const Inactive: StoryObj = { args: { active: false } };
```

- [ ] **Step 3: Add to the atoms barrel**

Append to `packages/ui/src/atoms/index.ts`:

```ts
export * from "./StreamingCursor/StreamingCursor";
```

- [ ] **Step 4: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 5: Pause for user before committing**

---

### Task 3: StopButton atom

**Files:**
- Create: `packages/ui/src/atoms/StopButton/StopButton.tsx`
- Create: `packages/ui/src/atoms/StopButton/StopButton.stories.tsx`

**Interfaces:**
- Consumes: React `ButtonHTMLAttributes`
- Produces: `StopButton`, `StopButtonProps`

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/atoms/StopButton/StopButton.tsx
import { type ButtonHTMLAttributes, type CSSProperties } from "react";

export interface StopButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  /** Inline style override. */
  style?: CSSProperties;
}

/**
 * A square "stop" button — the cancel-generation counterpart to FillButton.
 * Renders a filled square glyph in the red `--bx-ansi-9` family. Pure static
 * markup; disabled state dims to the dim-text ramp.
 */
export function StopButton({ style, disabled, ...rest }: StopButtonProps) {
  return (
    <button
      type="button"
      aria-label="Stop generation"
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 38,
        height: 38,
        flex: "none",
        fontFamily: "inherit",
        fontSize: 14,
        background: "var(--bx-surface-2, #15161e)",
        border: "1px solid var(--bx-border-red, #3a2020)",
        color: disabled ? "var(--bx-text-6, #5b616e)" : "#ff6b6f",
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
      {...rest}
    >
      ■
    </button>
  );
}
```

- [ ] **Step 2: Create the story**

```tsx
// packages/ui/src/atoms/StopButton/StopButton.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { StopButton } from "./StopButton";

const meta: Meta<typeof StopButton> = {
  title: "OCTANT/Atoms/StopButton",
  component: StopButton,
};
export default meta;

export const Default: StoryObj = {};
export const Disabled: StoryObj = { args: { disabled: true } };
```

- [ ] **Step 3: Add to the atoms barrel**

Append to `packages/ui/src/atoms/index.ts`:

```ts
export * from "./StopButton/StopButton";
```

- [ ] **Step 4: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 5: Pause for user before committing**

---

### Task 4: ToolPill atom

**Files:**
- Create: `packages/ui/src/atoms/ToolPill/ToolPill.tsx`
- Create: `packages/ui/src/atoms/ToolPill/ToolPill.stories.tsx`

**Interfaces:**
- Consumes: `BlockStatus` from `../../organisms/ChatPanel/chat-types`
- Produces: `ToolPill`, `ToolPillProps`

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/atoms/ToolPill/ToolPill.tsx
import type { CSSProperties } from "react";
import type { BlockStatus } from "../../organisms/ChatPanel/chat-types";

export type ToolPillStatus = BlockStatus | "idle";

const STATUS: Record<ToolPillStatus, { glyph: string; color: string; spin?: boolean }> = {
  idle: { glyph: "·", color: "var(--bx-text-6, #5b616e)" },
  running: { glyph: "◐", color: "var(--bx-accent, #46c66d)", spin: true },
  done: { glyph: "✓", color: "var(--bx-accent, #46c66d)" },
  error: { glyph: "✕", color: "#ff6b6f" },
};

export interface ToolPillProps {
  /** Tool name, shown after the ▸ marker. */
  name: string;
  status?: ToolPillStatus;
  /** Optional click handler (ToolCallBlock toggles expand on click). */
  onClick?: () => void;
  /** Whether the pill is currently expanded (rotates the ▸). */
  expanded?: boolean;
  style?: CSSProperties;
}

/**
 * A `▸ tool_name` chip with a trailing status glyph. The running glyph spins
 * via a CSS rotate animation; the marker rotates 90° when `expanded`. Pure
 * markup + declarative CSS.
 */
export function ToolPill({ name, status = "idle", onClick, expanded = false, style }: ToolPillProps) {
  const s = STATUS[status];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: 12,
        padding: "4px 9px",
        background: "transparent",
        border: "1px solid var(--bx-border, #1c1d24)",
        color: "var(--bx-text-3, #c8cdd6)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          color: "var(--bx-accent, #46c66d)",
          display: "inline-block",
          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform .15s",
        }}
      >
        ▸
      </span>
      <span>{name}</span>
      <span
        aria-hidden="true"
        style={{
          color: s.color,
          animation: s.spin ? "bx-spin 0.9s linear infinite" : undefined,
        }}
      >
        {s.glyph}
      </span>
    </button>
  );
}
```

Note: `bx-spin` is a new keyframe. Add it to `packages/tokens/src/tokens.css` alongside `bx-blink`:

```css
@keyframes bx-spin {
  to { transform: rotate(360deg); }
}
```

(If `bx-blink` is defined in that file, mirror its placement. If a spin keyframe already exists, reuse its name instead of adding `bx-spin`.)

- [ ] **Step 2: Add the keyframe**

Open `packages/tokens/src/tokens.css`, find the `@keyframes bx-blink` block, and add the `bx-spin` keyframe immediately after it (see code above). If a `bx-spin`/spin keyframe already exists, skip this step and reuse the existing name in `ToolPill.tsx`.

- [ ] **Step 3: Create the story**

```tsx
// packages/ui/src/atoms/ToolPill/ToolPill.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ToolPill } from "./ToolPill";

const meta: Meta<typeof ToolPill> = {
  title: "OCTANT/Atoms/ToolPill",
  component: ToolPill,
};
export default meta;

export const Idle: StoryObj = { args: { name: "read_file", status: "idle" } };
export const Running: StoryObj = { args: { name: "search", status: "running" } };
export const Done: StoryObj = { args: { name: "read_file", status: "done", expanded: true } };
export const Error: StoryObj = { args: { name: "exec", status: "error" } };
```

- [ ] **Step 4: Add to the atoms barrel**

Append to `packages/ui/src/atoms/index.ts`:

```ts
export * from "./ToolPill/ToolPill";
```

- [ ] **Step 5: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 6: Pause for user before committing**

---

### Task 5: AgentGlyph atom (TDD — hash determinism)

**Files:**
- Create: `packages/ui/src/atoms/AgentGlyph/AgentGlyph.tsx`
- Create: `packages/ui/src/atoms/AgentGlyph/agent-glyph.test.ts`
- Create: `packages/ui/src/atoms/AgentGlyph/AgentGlyph.stories.tsx`

**Interfaces:**
- Consumes: `seededRandom` from `@balaur/octant-core`, `PALETTE`/`byIdx` from `@balaur/tokens`, `Agent` type
- Produces: `AgentGlyph`, `AgentGlyphProps`, `agentMosaic(agent: Agent): string`, `agentAccent(agent: Agent): string`

- [ ] **Step 1: Write the failing test**

```ts
// packages/ui/src/atoms/AgentGlyph/agent-glyph.test.ts
import { describe, expect, it } from "bun:test";
import { agentAccent, agentMosaic } from "./AgentGlyph";
import type { Agent } from "../../organisms/ChatPanel/chat-types";

const agent = (id: string): Agent => ({ id, name: id });

describe("agentMosaic", () => {
  it("is deterministic for the same id", () => {
    const a = agentMosaic(agent("relay-07"));
    const b = agentMosaic(agent("relay-07"));
    expect(a).toBe(b);
  });

  it("differs for different ids", () => {
    expect(agentMosaic(agent("alpha"))).not.toBe(agentMosaic(agent("beta")));
  });

  it("is a 2-line string of 2 quadrant glyphs each", () => {
    const m = agentMosaic(agent("x"));
    const lines = m.split("\n");
    expect(lines.length).toBe(2);
    expect(lines[0].length).toBe(2);
    expect(lines[1].length).toBe(2);
  });
});

describe("agentAccent", () => {
  it("returns the agent accent override when set", () => {
    expect(agentAccent({ id: "x", name: "x", accent: "#ff0000" })).toBe("#ff0000");
  });

  it("returns a PALETTE hex when no override", () => {
    const c = agentAccent(agent("y"));
    expect(c.startsWith("#")).toBe(true);
    expect(c.length).toBe(7);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /home/alex/projects/balaur/design && bun test packages/ui/src/atoms/AgentGlyph`
Expected: FAIL — `agentMosaic`/`agentAccent` not defined.

- [ ] **Step 3: Write the implementation**

```tsx
// packages/ui/src/atoms/AgentGlyph/AgentGlyph.tsx
import { seededRandom } from "@balaur/octant-core";
import { byIdx, PALETTE } from "@balaur/tokens";
import type { CSSProperties } from "react";
import type { Agent } from "../../organisms/ChatPanel/chat-types";

/** The four quadrant glyphs used to build a 2×2 agent mosaic. */
const QUADRANTS = ["▛", "▜", "▙", "▟", "▚", "▞", "▖", "▗", "▝", "▘", "█", "░"];

/** Deterministically pick a 2×2 mosaic (two lines of two glyphs) from agent.id. */
export function agentMosaic(agent: Agent): string {
  const rnd = seededRandom(agent.id);
  const a = QUADRANTS[Math.floor(rnd() * QUADRANTS.length)]!;
  const b = QUADRANTS[Math.floor(rnd() * QUADRANTS.length)]!;
  const c = QUADRANTS[Math.floor(rnd() * QUADRANTS.length)]!;
  const d = QUADRANTS[Math.floor(rnd() * QUADRANTS.length)]!;
  return `${a}${b}\n${c}${d}`;
}

/** Deterministically pick an ANSI palette hue for the agent, or the override. */
export function agentAccent(agent: Agent): string {
  if (agent.accent) return agent.accent;
  const rnd = seededRandom(agent.id);
  const idx = Math.floor(rnd() * PALETTE.length) % PALETTE.length;
  return byIdx(idx)?.hex ?? "var(--bx-accent, #46c66d)";
}

export interface AgentGlyphProps {
  agent: Agent;
  /** Glyph font-size in px. Default 15. */
  size?: number;
  /** Show the agent name beneath the mosaic. Default true. */
  showLabel?: boolean;
}

/**
 * A 2×2 octant-mosaic sigil for a named agent, hashed from `agent.id` so each
 * agent in a multi-agent thread gets a stable, distinct glyph + ANSI hue.
 * Opts into the accent recolour system only when no override is set. Pure
 * static markup — deterministic across server and client.
 */
export function AgentGlyph({ agent, size = 15, showLabel = true }: AgentGlyphProps) {
  const mosaic = agent.glyph ?? agentMosaic(agent);
  const accent = agentAccent(agent);
  const preStyle: CSSProperties = {
    margin: "0 0 8px",
    fontSize: size,
    lineHeight: 0.9,
    color: accent,
    whiteSpace: "pre",
    letterSpacing: 0,
    fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
  };
  return (
    <div style={{ textAlign: "center" }}>
      <pre aria-hidden="true" style={preStyle}>
        {mosaic}
      </pre>
      {showLabel && <span style={{ color: "#7b8290", fontSize: 11 }}>{agent.name}</span>}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/alex/projects/balaur/design && bun test packages/ui/src/atoms/AgentGlyph`
Expected: PASS (4 tests).

- [ ] **Step 5: Create the story**

```tsx
// packages/ui/src/atoms/AgentGlyph/AgentGlyph.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { AgentGlyph } from "./AgentGlyph";
import type { Agent } from "../../organisms/ChatPanel/chat-types";

const meta: Meta<typeof AgentGlyph> = {
  title: "OCTANT/Atoms/AgentGlyph",
  component: AgentGlyph,
};
export default meta;

const agents: Agent[] = [
  { id: "router", name: "ROUTER" },
  { id: "coder", name: "CODER" },
  { id: "critic", name: "CRITIC" },
  { id: "researcher", name: "RESEARCH" },
];

export const Row: StoryObj = {
  render: () => (
    <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
      {agents.map((a) => (
        <AgentGlyph key={a.id} agent={a} />
      ))}
    </div>
  ),
};

export const WithOverride: StoryObj = {
  args: { agent: { id: "x", name: "CUSTOM", accent: "#c061ff" } },
};
```

- [ ] **Step 6: Add to the atoms barrel**

Append to `packages/ui/src/atoms/index.ts`:

```ts
export * from "./AgentGlyph/AgentGlyph";
```

- [ ] **Step 7: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 8: Pause for user before committing**

---

### Task 6: ArtifactChip atom

**Files:**
- Create: `packages/ui/src/atoms/ArtifactChip/ArtifactChip.tsx`
- Create: `packages/ui/src/atoms/ArtifactChip/ArtifactChip.stories.tsx`

**Interfaces:**
- Produces: `ArtifactChip`, `ArtifactChipProps`, `ArtifactKind`

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/atoms/ArtifactChip/ArtifactChip.tsx
import type { CSSProperties } from "react";

export type ArtifactKind = "code" | "document" | "image";

const ICON: Record<ArtifactKind, string> = {
  code: "{ }",
  document: "¶",
  image: "▦",
};

export interface ArtifactChipProps {
  kind: ArtifactKind;
  title: string;
  onClick?: () => void;
  style?: CSSProperties;
}

/**
 * A small clickable chip representing an artifact: a type glyph + title. The
 * whole chip is the click target. Pure static markup.
 */
export function ArtifactChip({ kind, title, onClick, style }: ArtifactChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: 12,
        padding: "5px 10px",
        background: "var(--bx-surface-2, #15161e)",
        border: "1px solid var(--bx-border, #1c1d24)",
        color: "var(--bx-text-3, #c8cdd6)",
        cursor: onClick ? "pointer" : "default",
        maxWidth: 240,
        ...style,
      }}
    >
      <span aria-hidden="true" style={{ color: "var(--bx-accent, #46c66d)" }}>
        {ICON[kind]}
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {title}
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Create the story**

```tsx
// packages/ui/src/atoms/ArtifactChip/ArtifactChip.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ArtifactChip } from "./ArtifactChip";

const meta: Meta<typeof ArtifactChip> = {
  title: "OCTANT/Atoms/ArtifactChip",
  component: ArtifactChip,
};
export default meta;

export const Code: StoryObj = { args: { kind: "code", title: "renderer.ts" } };
export const Document: StoryObj = { args: { kind: "document", title: "design-notes.md" } };
export const Image: StoryObj = { args: { kind: "image", title: "raster-frame.png" } };
```

- [ ] **Step 3: Add to the atoms barrel**

Append to `packages/ui/src/atoms/index.ts`:

```ts
export * from "./ArtifactChip/ArtifactChip";
```

- [ ] **Step 4: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 5: Pause for user before committing**

---

### Task 7: TextBlock molecule (TDD — inline tokenizer)

**Files:**
- Create: `packages/ui/src/molecules/TextBlock/TextBlock.tsx`
- Create: `packages/ui/src/molecules/TextBlock/text-block.test.ts`
- Create: `packages/ui/src/molecules/TextBlock/TextBlock.stories.tsx`

**Interfaces:**
- Consumes: `StreamingCursor` from `../../atoms/StreamingCursor/StreamingCursor`
- Produces: `TextBlock`, `TextBlockProps`, `tokenizeInline(text: string): InlineToken[]`, `InlineToken`

- [ ] **Step 1: Write the failing test**

```ts
// packages/ui/src/molecules/TextBlock/text-block.test.ts
import { describe, expect, it } from "bun:test";
import { tokenizeInline } from "./TextBlock";

describe("tokenizeInline", () => {
  it("returns a single plain token for plain text", () => {
    expect(tokenizeInline("hello world")).toEqual([{ kind: "text", text: "hello world" }]);
  });

  it("extracts backtick code spans", () => {
    expect(tokenizeInline("use `bar8` here")).toEqual([
      { kind: "text", text: "use " },
      { kind: "code", text: "bar8" },
      { kind: "text", text: " here" },
    ]);
  });

  it("extracts **bold** spans", () => {
    expect(tokenizeInline("a **bold** word")).toEqual([
      { kind: "text", text: "a " },
      { kind: "bold", text: "bold" },
      { kind: "text", text: " word" },
    ]);
  });

  it("extracts bare http(s) URLs as links", () => {
    const toks = tokenizeInline("see https://x.io/y for details");
    expect(toks).toEqual([
      { kind: "text", text: "see " },
      { kind: "link", text: "https://x.io/y", href: "https://x.io/y" },
      { kind: "text", text: " for details" },
    ]);
  });

  it("handles mixed code and bold", () => {
    expect(tokenizeInline("`a` and **b**")).toEqual([
      { kind: "code", text: "a" },
      { kind: "text", text: " and " },
      { kind: "bold", text: "b" },
    ]);
  });

  it("ignores unmatched markers", () => {
    expect(tokenizeInline("a ` b")).toEqual([{ kind: "text", text: "a ` b" }]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /home/alex/projects/balaur/design && bun test packages/ui/src/molecules/TextBlock`
Expected: FAIL — `tokenizeInline` not defined.

- [ ] **Step 3: Write the implementation**

```tsx
// packages/ui/src/molecules/TextBlock/TextBlock.tsx
import { type CSSProperties, type ReactNode } from "react";
import { StreamingCursor } from "../../atoms/StreamingCursor/StreamingCursor";

export type InlineToken =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "link"; text: string; href: string };

/**
 * Minimal inline tokenizer for text blocks: backtick `code`, **bold**, and
 * bare http(s) URLs as links. No markdown dependency. Unmatched markers stay
 * literal. Returns tokens in source order.
 */
export function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;
  const pushText = (t: string) => {
    if (t === "") return;
    const last = tokens[tokens.length - 1];
    if (last?.kind === "text") last.text += t;
    else tokens.push({ kind: "text", text: t });
  };

  while (i < text.length) {
    // URL (greedy, non-whitespace run starting with http:// or https://)
    if (text.startsWith("http://", i) || text.startsWith("https://", i)) {
      let j = i;
      while (j < text.length && !/\s/.test(text[j]!)) j++;
      const href = text.slice(i, j);
      tokens.push({ kind: "link", text: href, href });
      i = j;
      continue;
    }
    // Backtick code
    if (text[i] === "`") {
      const close = text.indexOf("`", i + 1);
      if (close !== -1) {
        pushText(text.slice(0, i)); // flush prior text accumulated via slice approach
        // NOTE: we rebuild from scratch below, so this branch is unused in the
        // final tokenizer; kept intentionality-free by deferring to the regex pass.
      }
    }
    i++;
  }
  // The character-by-character pass above only handles URLs reliably; redo
  // the whole thing with a single regex split so ordering is correct.
  return tokenizeRegex(text);
}

/** Regex-driven tokenizer — the actual implementation used by tokenizeInline. */
function tokenizeRegex(text: string): InlineToken[] {
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(https?:\/\/[^\s]+)/g;
  const tokens: InlineToken[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ kind: "text", text: text.slice(last, m.index) });
    const seg = m[0];
    if (seg.startsWith("`")) {
      tokens.push({ kind: "code", text: seg.slice(1, -1) });
    } else if (seg.startsWith("**")) {
      tokens.push({ kind: "bold", text: seg.slice(2, -2) });
    } else {
      tokens.push({ kind: "link", text: seg, href: seg });
    }
    last = m.index + seg.length;
  }
  if (last < text.length) tokens.push({ kind: "text", text: text.slice(last) });
  return tokens;
}
```

**IMPORTANT — clean up the implementation:** The `tokenizeInline` function above contains a deliberately broken first pass. Replace the entire file's `tokenizeInline` with the clean version below before running tests (the broken pass was a placeholder to illustrate the regex pass is the real one). Final `tokenizeInline`:

```ts
export function tokenizeInline(text: string): InlineToken[] {
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(https?:\/\/[^\s]+)/g;
  const tokens: InlineToken[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ kind: "text", text: text.slice(last, m.index) });
    const seg = m[0];
    if (seg.startsWith("`")) tokens.push({ kind: "code", text: seg.slice(1, -1) });
    else if (seg.startsWith("**")) tokens.push({ kind: "bold", text: seg.slice(2, -2) });
    else tokens.push({ kind: "link", text: seg, href: seg });
    last = m.index + seg.length;
  }
  if (last < text.length) tokens.push({ kind: "text", text: text.slice(last) });
  return tokens;
}
```

Delete the `tokenizeRegex` helper and the broken first pass entirely; the final file exports only `tokenizeInline`, `InlineToken`, `TextBlock`, `TextBlockProps`.

- [ ] **Step 4: Add the component**

Append to `packages/ui/src/molecules/TextBlock/TextBlock.tsx` (after the clean `tokenizeInline`):

```tsx
function renderInline(text: string): ReactNode[] {
  return tokenizeInline(text).map((t, i) => {
    switch (t.kind) {
      case "code":
        return (
          <code
            key={i}
            style={{
              fontFamily: "var(--bx-font-mono, ui-monospace, monospace)",
              background: "var(--bx-surface-2, #15161e)",
              border: "1px solid var(--bx-border, #1c1d24)",
              padding: "0 4px",
              fontSize: "0.92em",
              color: "var(--bx-accent, #46c66d)",
            }}
          >
            {t.text}
          </code>
        );
      case "bold":
        return (
          <strong key={i} style={{ color: "var(--bx-text-1, #f4f6fb)" }}>
            {t.text}
          </strong>
        );
      case "link":
        return (
          <a key={i} href={t.href} style={{ color: "var(--bx-accent, #46c66d)" }}>
            {t.text}
          </a>
        );
      default:
        return <span key={i}>{t.text}</span>;
    }
  });
}

export interface TextBlockProps {
  text: string;
  /** Append a blinking StreamingCursor (for in-progress stream text). */
  streaming?: boolean;
  style?: CSSProperties;
}

/**
 * Renders a text block with minimal inline formatting — `code`, **bold**, and
 * bare URLs as links — across `text.split("\n")` lines. When `streaming`, a
 * `StreamingCursor` sits at the end of the last line. No markdown dependency.
 */
export function TextBlock({ text, streaming = false, style }: TextBlockProps) {
  const lines = text.split("\n");
  const body: CSSProperties = {
    color: "var(--bx-text-2, #dfe3ea)",
    fontSize: 13,
    lineHeight: 1.55,
    fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    ...style,
  };
  return (
    <div style={body}>
      {lines.map((line, i) => (
        <div key={i}>
          {renderInline(line)}
          {streaming && i === lines.length - 1 && <StreamingCursor />}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd /home/alex/projects/balaur/design && bun test packages/ui/src/molecules/TextBlock`
Expected: PASS (6 tests).

- [ ] **Step 6: Create the story**

```tsx
// packages/ui/src/molecules/TextBlock/TextBlock.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { TextBlock } from "./TextBlock";

const meta: Meta<typeof TextBlock> = {
  title: "OCTANT/Molecules/TextBlock",
  component: TextBlock,
};
export default meta;

export const Plain: StoryObj = { args: { text: "Reading the buffer and rasterising the field." } };

export const Formatted: StoryObj = {
  args: {
    text: "Used `bar8(load)` to draw the meter.\nSee **the docs** at https://octant.io for more.",
  },
};

export const Streaming: StoryObj = {
  args: { text: "Rendering frame 4 of 8…", streaming: true },
};
```

- [ ] **Step 7: Add to the molecules barrel**

Append to `packages/ui/src/molecules/index.ts`:

```ts
export * from "./TextBlock/TextBlock";
```

- [ ] **Step 8: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 9: Pause for user before committing**

---

### Task 8: ReasoningBlock molecule

**Files:**
- Create: `packages/ui/src/molecules/ReasoningBlock/ReasoningBlock.tsx`
- Create: `packages/ui/src/molecules/ReasoningBlock/ReasoningBlock.stories.tsx`

**Interfaces:**
- Consumes: `TextBlock` from `../TextBlock/TextBlock`, `useControllableState` from `../../hooks/useControllableState`
- Produces: `ReasoningBlock`, `ReasoningBlockProps`

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/molecules/ReasoningBlock/ReasoningBlock.tsx
import { type CSSProperties, useState } from "react";
import { TextBlock } from "../TextBlock/TextBlock";

export interface ReasoningBlockProps {
  text: string;
  /** Initial collapsed state. Default true. */
  defaultCollapsed?: boolean;
  /** Controlled collapsed state. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  style?: CSSProperties;
}

/**
 * A collapsible "THINKING" trace. A `▸`/`▾` chevron toggles a dimmed body
 * rendered via `TextBlock`. Collapsed by default so the reasoning stays out of
 * the way unless the reader wants it. Pure local state via `useState`.
 */
export function ReasoningBlock({
  text,
  defaultCollapsed = true,
  collapsed,
  onCollapsedChange,
  style,
}: ReasoningBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed ?? defaultCollapsed);
  const set = (v: boolean) => {
    setIsCollapsed(v);
    onCollapsedChange?.(v);
  };
  return (
    <div
      style={{
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-1, #0a0b0e)",
        padding: "8px 12px",
        ...style,
      }}
    >
      <button
        type="button"
        onClick={() => set(!isCollapsed)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "inherit",
          fontSize: 11,
          background: "transparent",
          border: 0,
          color: "var(--bx-text-6, #5b616e)",
          cursor: "pointer",
          letterSpacing: "0.08em",
        }}
      >
        <span aria-hidden="true" style={{ display: "inline-block" }}>
          {isCollapsed ? "▸" : "▾"}
        </span>
        THINKING
      </button>
      {!isCollapsed && (
        <div style={{ marginTop: 8 }}>
          <TextBlock text={text} style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 12 }} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the story**

```tsx
// packages/ui/src/molecules/ReasoningBlock/ReasoningBlock.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ReasoningBlock } from "./ReasoningBlock";

const meta: Meta<typeof ReasoningBlock> = {
  title: "OCTANT/Molecules/ReasoningBlock",
  component: ReasoningBlock,
};
export default meta;

const TEXT =
  "The user wants a rasterised meter. I'll reach for `bar8` since it draws eighth-block cells. Checking the load range next.";

export const Collapsed: StoryObj = { args: { text: TEXT } };
export const Expanded: StoryObj = { args: { text: TEXT, defaultCollapsed: false } };
```

- [ ] **Step 3: Add to the molecules barrel**

Append to `packages/ui/src/molecules/index.ts`:

```ts
export * from "./ReasoningBlock/ReasoningBlock";
```

- [ ] **Step 4: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 5: Pause for user before committing**

---

### Task 9: ToolCallBlock molecule

**Files:**
- Create: `packages/ui/src/molecules/ToolCallBlock/ToolCallBlock.tsx`
- Create: `packages/ui/src/molecules/ToolCallBlock/ToolCallBlock.stories.tsx`

**Interfaces:**
- Consumes: `ToolPill` from `../../atoms/ToolPill/ToolPill`, `CodeBlock` from `../CodeBlock/CodeBlock`, `Block` (tool_call) type
- Produces: `ToolCallBlock`, `ToolCallBlockProps`

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/molecules/ToolCallBlock/ToolCallBlock.tsx
import { type CSSProperties, useState } from "react";
import { ToolPill } from "../../atoms/ToolPill/ToolPill";
import { CodeBlock } from "../CodeBlock/CodeBlock";

interface ToolCallBlockData {
  type: "tool_call";
  id: string;
  name: string;
  args?: unknown;
  result?: unknown;
  status: "running" | "done" | "error";
  startedAt?: number;
  endedAt?: number;
}

export interface ToolCallBlockProps {
  block: ToolCallBlockData;
  style?: CSSProperties;
}

function fmtJson(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2) ?? String(v);
  } catch {
    return String(v);
  }
}

function fmtDuration(block: ToolCallBlockData): string | null {
  if (block.startedAt == null || block.endedAt == null) return null;
  return `${block.endedAt - block.startedAt}ms`;
}

/**
 * A collapsible tool-call block: a `ToolPill` header (click to toggle) plus the
 * args and result as `CodeBlock` JSON, and a trailing duration line. Collapses
 * to the pill once `status === "done"`; stays expanded while `running` or on
 * `error`. Local state via `useState`.
 */
export function ToolCallBlock({ block, style }: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(block.status !== "done");
  const dur = fmtDuration(block);
  const errColor = block.status === "error" ? "#ff6b6f" : "var(--bx-text-6, #5b616e)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}>
      <ToolPill name={block.name} status={block.status} expanded={expanded} onClick={() => setExpanded((e) => !e)} />
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 4 }}>
          {block.args !== undefined && (
            <div>
              <div style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 10, letterSpacing: "0.08em", marginBottom: 4 }}>
                ARGS
              </div>
              <CodeBlock code={fmtJson(block.args)} language="json" />
            </div>
          )}
          {block.result !== undefined && (
            <div>
              <div style={{ color: errColor, fontSize: 10, letterSpacing: "0.08em", marginBottom: 4 }}>
                {block.status === "error" ? "ERROR" : "RESULT"}
              </div>
              <CodeBlock code={fmtJson(block.result)} language="json" />
            </div>
          )}
          {dur && <div style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 11 }}>{dur}</div>}
        </div>
      )}
    </div>
  );
}
```

Note: verify `CodeBlock`'s prop names by reading `packages/ui/src/molecules/CodeBlock/CodeBlock.tsx` before implementing. If the props are `code`/`language`, use them as above; otherwise adjust to the real signature (`children`/`lang` etc.).

- [ ] **Step 2: Verify CodeBlock's API**

Read `packages/ui/src/molecules/CodeBlock/CodeBlock.tsx` and confirm the prop names. Adjust the `CodeBlock` calls in Step 1 to match (e.g. `<CodeBlock language="json">{fmtJson(block.args)}</CodeBlock>` if it takes children).

- [ ] **Step 3: Create the story**

```tsx
// packages/ui/src/molecules/ToolCallBlock/ToolCallBlock.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ToolCallBlock } from "./ToolCallBlock";

const meta: Meta<typeof ToolCallBlock> = {
  title: "OCTANT/Molecules/ToolCallBlock",
  component: ToolCallBlock,
};
export default meta;

const base = {
  type: "tool_call" as const,
  id: "t1",
  name: "read_file",
  args: { path: "src/raster.ts" },
  startedAt: 1000,
};

export const Running: StoryObj = {
  args: { block: { ...base, status: "running" as const } },
};

export const Done: StoryObj = {
  args: {
    block: { ...base, status: "done" as const, endedAt: 1123, result: { lines: 204, ok: true } },
  },
};

export const Error: StoryObj = {
  args: {
    block: { ...base, status: "error" as const, endedAt: 1102, result: { message: "ENOENT: no such file" } },
  },
};
```

- [ ] **Step 4: Add to the molecules barrel**

Append to `packages/ui/src/molecules/index.ts`:

```ts
export * from "./ToolCallBlock/ToolCallBlock";
```

- [ ] **Step 5: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 6: Pause for user before committing**

---

### Task 10: ArtifactPanel molecule

**Files:**
- Create: `packages/ui/src/molecules/ArtifactPanel/ArtifactPanel.tsx`
- Create: `packages/ui/src/molecules/ArtifactPanel/ArtifactPanel.stories.tsx`

**Interfaces:**
- Consumes: `ArtifactChip` from `../../atoms/ArtifactChip/ArtifactChip`, `CodeBlock` from `../CodeBlock/CodeBlock`, `Block` (artifact) type
- Produces: `ArtifactPanel`, `ArtifactPanelProps`

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/molecules/ArtifactPanel/ArtifactPanel.tsx
import { type CSSProperties } from "react";
import { ArtifactChip } from "../../atoms/ArtifactChip/ArtifactChip";
import { CodeBlock } from "../CodeBlock/CodeBlock";

interface ArtifactBlockData {
  type: "artifact";
  id: string;
  title: string;
  kind: "code" | "document" | "image";
  language?: string;
  content: string;
}

export interface ArtifactPanelProps {
  block: ArtifactBlockData;
  onOpen?: (id: string) => void;
  /** Max height for the preview body before it clips. Default 240. */
  previewMaxHeight?: number;
  style?: CSSProperties;
}

/**
 * An artifact card: an `ArtifactChip` header (clickable → `onOpen`) plus a
 * preview body — `CodeBlock` for code artifacts, preformatted text for
 * documents, and a glyph placeholder for images. Pure static markup.
 */
export function ArtifactPanel({ block, onOpen, previewMaxHeight = 240, style }: ArtifactPanelProps) {
  return (
    <div
      style={{
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-2, #15161e)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px",
          borderBottom: "1px solid var(--bx-border, #1c1d24)",
        }}
      >
        <ArtifactChip kind={block.kind} title={block.title} onClick={onOpen ? () => onOpen(block.id) : undefined} />
        {onOpen && (
          <button
            type="button"
            onClick={() => onOpen(block.id)}
            style={{
              fontFamily: "inherit",
              fontSize: 12,
              background: "transparent",
              border: 0,
              color: "var(--bx-accent, #46c66d)",
              cursor: "pointer",
            }}
          >
            open ↗
          </button>
        )}
      </div>
      <div style={{ maxHeight: previewMaxHeight, overflow: "auto", padding: 8 }}>
        {block.kind === "code" ? (
          <CodeBlock code={block.content} language={block.language} />
        ) : block.kind === "document" ? (
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              color: "var(--bx-text-3, #c8cdd6)",
              fontSize: 13,
              fontFamily: "var(--bx-font-mono, ui-monospace, monospace)",
            }}
          >
            {block.content}
          </pre>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 120,
              color: "var(--bx-text-6, #5b616e)",
              fontFamily: "var(--bx-font-mono, ui-monospace, monospace)",
            }}
          >
            ▦ image artifact
          </div>
        )}
      </div>
    </div>
  );
}
```

(Adjust `CodeBlock` props to match the real API per Task 9 Step 2.)

- [ ] **Step 2: Create the story**

```tsx
// packages/ui/src/molecules/ArtifactPanel/ArtifactPanel.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ArtifactPanel } from "./ArtifactPanel";

const meta: Meta<typeof ArtifactPanel> = {
  title: "OCTANT/Molecules/ArtifactPanel",
  component: ArtifactPanel,
};
export default meta;

const code = {
  type: "artifact" as const,
  id: "a1",
  title: "raster.ts",
  kind: "code" as const,
  language: "ts",
  content: "export const V = (x: number) => (x + 1) & 7;\n",
};

const doc = {
  type: "artifact" as const,
  id: "a2",
  title: "notes.md",
  kind: "document" as const,
  content: "# Plan\n- rasterise field\n- dither output\n",
};

export const Code: StoryObj = { args: { block: code } };
export const Document: StoryObj = { args: { block: doc } };
export const Image: StoryObj = {
  args: { block: { type: "artifact", id: "a3", title: "frame.png", kind: "image", content: "" } },
};
```

- [ ] **Step 3: Add to the molecules barrel**

Append to `packages/ui/src/molecules/index.ts`:

```ts
export * from "./ArtifactPanel/ArtifactPanel";
```

- [ ] **Step 4: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 5: Pause for user before committing**

---

### Task 11: TypingIndicator molecule

**Files:**
- Create: `packages/ui/src/molecules/TypingIndicator/TypingIndicator.tsx`
- Create: `packages/ui/src/molecules/TypingIndicator/TypingIndicator.stories.tsx`

**Interfaces:**
- Consumes: `BrailleSpinner` from `../../atoms/BrailleSpinner/BrailleSpinner`
- Produces: `TypingIndicator`, `TypingIndicatorProps`

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/molecules/TypingIndicator/TypingIndicator.tsx
import { type CSSProperties } from "react";
import { BrailleSpinner } from "../../atoms/BrailleSpinner/BrailleSpinner";

export interface TypingIndicatorProps {
  /** Label beside the spinner. Default "thinking". */
  label?: string;
  style?: CSSProperties;
}

/**
 * A compact agent-thinking row: a `BrailleSpinner` + a label + animated
 * trailing dots. Shown at the bottom of `ChatThread` while the agent is
 * producing its first block. Pure declarative CSS animation.
 */
export function TypingIndicator({ label = "thinking", style }: TypingIndicatorProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        fontSize: 12,
        color: "var(--bx-text-6, #5b616e)",
        ...style,
      }}
    >
      <BrailleSpinner variant="pulse" />
      <span>{label}</span>
      <span style={{ letterSpacing: "0.2em", animation: "bx-blink 1.1s steps(1) infinite" }}>…</span>
    </div>
  );
}
```

(Verify `BrailleSpinner`'s props by reading `packages/ui/src/atoms/BrailleSpinner/BrailleSpinner.tsx`; if `variant` is not a prop or `"pulse"` is not valid, use the default `<BrailleSpinner />`.)

- [ ] **Step 2: Create the story**

```tsx
// packages/ui/src/molecules/TypingIndicator/TypingIndicator.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { TypingIndicator } from "./TypingIndicator";

const meta: Meta<typeof TypingIndicator> = {
  title: "OCTANT/Molecules/TypingIndicator",
  component: TypingIndicator,
};
export default meta;

export const Default: StoryObj = {};
export const CustomLabel: StoryObj = { args: { label: "running tool" } };
```

- [ ] **Step 3: Add to the molecules barrel**

Append to `packages/ui/src/molecules/index.ts`:

```ts
export * from "./TypingIndicator/TypingIndicator";
```

- [ ] **Step 4: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 5: Pause for user before committing**

---

### Task 12: BlockRenderer molecule

**Files:**
- Create: `packages/ui/src/molecules/BlockRenderer/BlockRenderer.tsx`
- Create: `packages/ui/src/molecules/BlockRenderer/BlockRenderer.stories.tsx`

**Interfaces:**
- Consumes: `TextBlock`, `ToolCallBlock`, `ReasoningBlock`, `ArtifactPanel`, `CodeBlock`, `CitationList`/`CitationSource`, `Block` type
- Produces: `BlockRenderer`, `BlockRendererProps`

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/molecules/BlockRenderer/BlockRenderer.tsx
import { type CSSProperties } from "react";
import { CitationList, CitationSource } from "../../atoms/InlineCitation/InlineCitation";
import { CodeBlock } from "../CodeBlock/CodeBlock";
import { ReasoningBlock } from "../ReasoningBlock/ReasoningBlock";
import { TextBlock } from "../TextBlock/TextBlock";
import { ToolCallBlock } from "../ToolCallBlock/ToolCallBlock";
import { ArtifactPanel } from "../ArtifactPanel/ArtifactPanel";
import type { Block } from "../../organisms/ChatPanel/chat-types";

export interface BlockRendererProps {
  block: Block;
  onArtifactOpen?: (id: string) => void;
  style?: CSSProperties;
}

/**
 * The single dispatch point for a `Block`. Delegates each block type to its
 * dedicated molecule. Unknown types render a dim placeholder — never throws.
 */
export function BlockRenderer({ block, onArtifactOpen, style }: BlockRendererProps) {
  switch (block.type) {
    case "text":
      return <TextBlock text={block.text} streaming={block.streaming} style={style} />;
    case "reasoning":
      return <ReasoningBlock text={block.text} defaultCollapsed={block.defaultCollapsed} style={style} />;
    case "tool_call":
      return <ToolCallBlock block={block} style={style} />;
    case "code":
      return <CodeBlock code={block.code} language={block.language} />;
    case "artifact":
      return <ArtifactPanel block={block} onOpen={onArtifactOpen} style={style} />;
    case "citations":
      return (
        <CitationList>
          {block.sources.map((s, i) => (
            <CitationSource key={i} label={s.label} accent={s.accent}>
              {s.children}
            </CitationSource>
          ))}
        </CitationList>
      );
    default:
      return (
        <div style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 12, ...style }}>
          unknown block: {(block as { type: string }).type}
        </div>
      );
  }
}
```

(Adjust `CodeBlock`, `CitationSource` prop names to match their real APIs per earlier tasks. `CitationSource`'s props are `label`, `accent`, `children` — confirmed in `atoms/InlineCitation/InlineCitation.tsx`.)

- [ ] **Step 2: Create the story**

```tsx
// packages/ui/src/molecules/BlockRenderer/BlockRenderer.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { BlockRenderer } from "./BlockRenderer";
import type { Block } from "../../organisms/ChatPanel/chat-types";

const meta: Meta<typeof BlockRenderer> = {
  title: "OCTANT/Molecules/BlockRenderer",
  component: BlockRenderer,
};
export default meta;

const blocks: { name: string; block: Block }[] = [
  { name: "text", block: { type: "text", text: "Hello **world**, see `bar8`." } },
  { name: "reasoning", block: { type: "reasoning", text: "Planning the raster pass." } },
  {
    name: "tool_call",
    block: { type: "tool_call", id: "t", name: "search", status: "done", args: { q: "x" }, result: { n: 3 } },
  },
  { name: "code", block: { type: "code", language: "ts", code: "const V = 1;" } },
  {
    name: "artifact",
    block: { type: "artifact", id: "a", title: "out.ts", kind: "code", language: "ts", content: "export const V = 1;\n" },
  },
];

export const Gallery: StoryObj = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 520 }}>
      {blocks.map(({ name, block }) => (
        <div key={name}>
          <div style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 10, marginBottom: 6 }}>{name}</div>
          <BlockRenderer block={block} />
        </div>
      ))}
    </div>
  ),
};
```

- [ ] **Step 3: Add to the molecules barrel**

Append to `packages/ui/src/molecules/index.ts`:

```ts
export * from "./BlockRenderer/BlockRenderer";
```

- [ ] **Step 4: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 5: Pause for user before committing**

---

### Task 13: ChatComposer molecule

**Files:**
- Create: `packages/ui/src/molecules/ChatComposer/ChatComposer.tsx`
- Create: `packages/ui/src/molecules/ChatComposer/ChatComposer.stories.tsx`

**Interfaces:**
- Consumes: `Textarea` from `../Textarea/Textarea`, `FillButton` from `../../atoms/FillButton/FillButton`, `StopButton` from `../../atoms/StopButton/StopButton`, `useControllableState` from `../../hooks/useControllableState`
- Produces: `ChatComposer`, `ChatComposerProps`

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/molecules/ChatComposer/ChatComposer.tsx
import { type CSSProperties, type KeyboardEvent } from "react";
import { FillButton } from "../../atoms/FillButton/FillButton";
import { StopButton } from "../../atoms/StopButton/StopButton";
import { useControllableState } from "../../hooks/useControllableState";
import { Textarea } from "../Textarea/Textarea";

export interface ChatComposerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** True while the agent is generating — shows Stop instead of Send. */
  streaming?: boolean;
  /** Fired on Enter (no shift) with the trimmed text. Clear is the caller's job. */
  onSend: (text: string) => void;
  /** Fired when Stop is pressed. */
  onStop?: () => void;
  /** Show the attach hint row. */
  attachHint?: string;
  /** Show the slash-command hint. */
  slashHint?: boolean;
  placeholder?: string;
  style?: CSSProperties;
}

/**
 * The chat input: a `Textarea` + a Send/Stop toggle (by `streaming`) + optional
 * attach and slash-command hints. Enter sends, Shift+Enter inserts a newline.
 * The textarea is disabled while `streaming` (except the Stop button).
 */
export function ChatComposer({
  value,
  defaultValue = "",
  onValueChange,
  streaming = false,
  onSend,
  onStop,
  attachHint,
  slashHint = true,
  placeholder = "type a message…  (enter to send, shift+enter for newline)",
  style,
}: ChatComposerProps) {
  const [text, setText] = useControllableState(value, defaultValue, onValueChange);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const trimmed = text.trim();
      if (trimmed && !streaming) {
        onSend(trimmed);
        setText("");
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 12,
        borderTop: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-1, #0a0b0e)",
        ...style,
      }}
    >
      <Textarea
        value={text}
        onChange={(e) => setText((e.target as HTMLTextAreaElement).value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={streaming}
        style={{ minHeight: 64, fontFamily: "var(--bx-font-mono, ui-monospace, monospace)", fontSize: 13 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--bx-text-6, #5b616e)", fontSize: 11 }}>
          {slashHint && (
            <span style={{ border: "1px solid var(--bx-border, #1c1d24)", padding: "1px 5px" }}>/</span>
          )}
          {attachHint && <span>📎 {attachHint}</span>}
        </div>
        {streaming ? (
          <StopButton onClick={onStop} />
        ) : (
          <FillButton onClick={() => text.trim() && onSend(text.trim())} disabled={!text.trim()}>
            send ▸
          </FillButton>
        )}
      </div>
    </div>
  );
}
```

(Verify `Textarea`'s API by reading `packages/ui/src/molecules/Textarea/Textarea.tsx` — adjust `value`/`onChange`/`disabled`/`onKeyDown`/`style` props to match. If `Textarea` is uncontrolled or uses different prop names, adapt. Same for `FillButton`'s `children`/`onClick`/`disabled`.)

- [ ] **Step 2: Verify Textarea + FillButton APIs**

Read `packages/ui/src/molecules/Textarea/Textarea.tsx` and `packages/ui/src/atoms/FillButton/FillButton.tsx`; adjust the calls in Step 1 to their real signatures.

- [ ] **Step 3: Create the story**

```tsx
// packages/ui/src/molecules/ChatComposer/ChatComposer.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ChatComposer } from "./ChatComposer";

const meta: Meta<typeof ChatComposer> = {
  title: "OCTANT/Molecules/ChatComposer",
  component: ChatComposer,
};
export default meta;

export const Idle: StoryObj = {
  render: () => {
    const [v, setV] = useState("");
    return <ChatComposer value={v} onValueChange={setV} onSend={(t) => alert(t)} attachHint="drop a file" />;
  },
};

export const Streaming: StoryObj = {
  render: () => <ChatComposer streaming onSend={() => {}} onStop={() => alert("stop")} />,
};

export const WithText: StoryObj = {
  render: () => {
    const [v, setV] = useState("rasterise the field");
    return <ChatComposer value={v} onValueChange={setV} onSend={(t) => alert(t)} />;
  },
};
```

- [ ] **Step 4: Add to the molecules barrel**

Append to `packages/ui/src/molecules/index.ts`:

```ts
export * from "./ChatComposer/ChatComposer";
```

- [ ] **Step 5: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 6: Pause for user before committing**

---

### Task 14: ChatMessage molecule

**Files:**
- Create: `packages/ui/src/molecules/ChatMessage/ChatMessage.tsx`
- Create: `packages/ui/src/molecules/ChatMessage/ChatMessage.stories.tsx`

**Interfaces:**
- Consumes: `CellAvatar` from `../../atoms/CellAvatar/CellAvatar`, `AgentGlyph` from `../../atoms/AgentGlyph/AgentGlyph`, `BlockRenderer` from `../BlockRenderer/BlockRenderer`, `CitationList` is handled inside `BlockRenderer`; `ChatMessageData`, `Agent` types
- Produces: `ChatMessage`, `ChatMessageProps`

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/molecules/ChatMessage/ChatMessage.tsx
import { type CSSProperties } from "react";
import { AgentGlyph } from "../../atoms/AgentGlyph/AgentGlyph";
import { CellAvatar } from "../../atoms/CellAvatar/CellAvatar";
import type { Agent, ChatMessageData } from "../../organisms/ChatPanel/chat-types";
import { BlockRenderer } from "../BlockRenderer/BlockRenderer";

export interface ChatMessageProps {
  message: ChatMessageData;
  /** The agent that produced this message, if `role === "agent"` and `agentId` is set. */
  agent?: Agent;
  onArtifactOpen?: (id: string) => void;
  style?: CSSProperties;
}

/**
 * One chat message row: an avatar (CellAvatar for user/tool/system, AgentGlyph
 * for a named agent) + name + time + the block list via `BlockRenderer`. Agent
 * messages are accent-tinted and left-aligned; user messages neutral and
 * right-aligned; system centered/dimmed; tool left-aligned with a tool avatar.
 * An `error` status paints a red hairline + ERR badge. Pure render.
 */
export function ChatMessage({ message, agent, onArtifactOpen, style }: ChatMessageProps) {
  const isAgent = message.role === "agent";
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isTool = message.role === "tool";
  const errored = message.status === "error";

  const avatar =
    isAgent && agent ? (
      <AgentGlyph agent={agent} size={13} showLabel={false} />
    ) : (
      <CellAvatar
        kind={isUser ? "user" : isTool ? "tool" : "system"}
        size={13}
      />
    );

  const name = message.name ?? (isAgent ? (agent?.name ?? "AGENT") : isUser ? "USER" : isTool ? "TOOL" : "SYSTEM");

  const bubble = (
    <div
      style={{
        maxWidth: "82%",
        minWidth: 0,
        border: `1px solid ${
          errored
            ? "var(--bx-border-red, #3a2020)"
            : isAgent
              ? "var(--bx-border-accent, #2a3320)"
              : "var(--bx-border, #1c1d24)"
        }`,
        background: isAgent ? "#0e140e" : isSystem ? "transparent" : "#12131a",
        padding: "11px 13px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 9, alignItems: "baseline", fontSize: 11 }}>
        <span
          style={{
            color: isAgent ? "var(--bx-accent, #46c66d)" : "var(--bx-text-4, #9aa0ad)",
            letterSpacing: "0.08em",
          }}
        >
          {name}
        </span>
        {errored && (
          <span style={{ color: "#ff6b6f", border: "1px solid var(--bx-border-red, #3a2020)", padding: "0 5px" }}>
            ERR
          </span>
        )}
        {message.time != null && <span style={{ color: "#3f424d" }}>{message.time}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {message.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} onArtifactOpen={onArtifactOpen} />
        ))}
      </div>
    </div>
  );

  if (isSystem) {
    return (
      <div
        style={{
          textAlign: "center",
          color: "var(--bx-text-6, #5b616e)",
          fontSize: 11,
          padding: "6px 0",
          fontFamily: "var(--bx-font-mono, ui-monospace, monospace)",
          ...style,
        }}
      >
        {message.blocks.map((b, i) => (b.type === "text" ? <div key={i}>{b.text}</div> : <BlockRenderer key={i} block={b} />))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        justifyContent: isUser ? "flex-end" : "flex-start",
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        ...style,
      }}
    >
      {isUser ? (
        <>
          {bubble}
          {avatar}
        </>
      ) : (
        <>
          {avatar}
          {bubble}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the story**

```tsx
// packages/ui/src/molecules/ChatMessage/ChatMessage.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ChatMessage } from "./ChatMessage";
import type { Agent, ChatMessageData } from "../../organisms/ChatPanel/chat-types";

const meta: Meta<typeof ChatMessage> = {
  title: "OCTANT/Molecules/ChatMessage",
  component: ChatMessage,
};
export default meta;

const agent: Agent = { id: "router", name: "ROUTER" };

const userMsg: ChatMessageData = {
  id: "u1",
  role: "user",
  time: "12:01",
  blocks: [{ type: "text", text: "Rasterise the field and show me the result." }],
};

const agentMsg: ChatMessageData = {
  id: "a1",
  role: "agent",
  agentId: "router",
  time: "12:01",
  blocks: [
    { type: "reasoning", text: "Reach for `octantMaskField`, then dither." },
    { type: "text", text: "On it — calling `render_frame`.", streaming: true },
  ],
};

const toolMsg: ChatMessageData = {
  id: "t1",
  role: "tool",
  time: "12:02",
  blocks: [
    {
      type: "tool_call",
      id: "tc1",
      name: "render_frame",
      status: "done",
      args: { w: 80, h: 24 },
      result: { ok: true },
      startedAt: 0,
      endedAt: 42,
    },
  ],
};

export const User: StoryObj = { args: { message: userMsg } };
export const AgentStreaming: StoryObj = { args: { message: agentMsg, agent } };
export const Tool: StoryObj = { args: { message: toolMsg } };
export const System: StoryObj = {
  args: { message: { id: "s", role: "system", blocks: [{ type: "text", text: "context window reset" }] } },
};
export const Error: StoryObj = {
  args: {
    message: {
      id: "e",
      role: "agent",
      agentId: "router",
      status: "error",
      blocks: [{ type: "text", text: "buffer overflow — aborted." }],
    },
    agent,
  },
};
```

- [ ] **Step 3: Add to the molecules barrel**

Append to `packages/ui/src/molecules/index.ts`:

```ts
export * from "./ChatMessage/ChatMessage";
```

- [ ] **Step 4: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 5: Pause for user before committing**

---

### Task 15: ChatThread organism

**Files:**
- Create: `packages/ui/src/organisms/ChatThread/ChatThread.tsx`
- Create: `packages/ui/src/organisms/ChatThread/ChatThread.stories.tsx`

**Interfaces:**
- Consumes: `ChatMessage` from `../../molecules/ChatMessage/ChatMessage`, `TypingIndicator` from `../../molecules/TypingIndicator/TypingIndicator`, `EmptyState` from `../../molecules/EmptyState/EmptyState`, `ChatMessageData`, `Agent` types
- Produces: `ChatThread`, `ChatThreadProps`

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/organisms/ChatThread/ChatThread.tsx
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { EmptyState } from "../../molecules/EmptyState/EmptyState";
import { ChatMessage } from "../../molecules/ChatMessage/ChatMessage";
import { TypingIndicator } from "../../molecules/TypingIndicator/TypingIndicator";
import type { Agent, ChatMessageData } from "../ChatPanel/chat-types";

export interface ChatThreadProps {
  messages: ChatMessageData[];
  /** Indexed by id; used to resolve `agentId` on agent messages. */
  agents?: Record<string, Agent>;
  /** Show the typing indicator at the bottom (agent producing first block). */
  streaming?: boolean;
  onArtifactOpen?: (id: string) => void;
  style?: CSSProperties;
}

/**
 * The scrollable message list. Auto-follows the bottom when new content arrives
 * unless the user has scrolled up — in which case a "↓ jump to latest" button
 * appears. Shows `TypingIndicator` while `streaming`. Empty thread renders an
 * `EmptyState` prompt.
 */
export function ChatThread({ messages, agents, streaming = false, onArtifactOpen, style }: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  // Auto-follow: when atBottom and messages/streaming change, snap to bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && atBottom) el.scrollTop = el.scrollHeight;
  }, [messages, streaming, atBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(distance < 40);
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setAtBottom(true);
  };

  if (messages.length === 0 && !streaming) {
    return (
      <EmptyState
        title="NO MESSAGES"
        description="Start a conversation — the agent will respond here."
      />
    );
  }

  return (
    <div style={{ position: "relative", ...style }}>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          padding: 18,
          maxHeight: "100%",
        }}
      >
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} agent={m.agentId ? agents?.[m.agentId] : undefined} onArtifactOpen={onArtifactOpen} />
        ))}
        {streaming && <TypingIndicator />}
      </div>
      {!atBottom && (
        <button
          type="button"
          onClick={jumpToLatest}
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            fontFamily: "var(--bx-font-mono, ui-monospace, monospace)",
            fontSize: 11,
            padding: "5px 10px",
            background: "var(--bx-surface-2, #15161e)",
            border: "1px solid var(--bx-border-accent, #2a3320)",
            color: "var(--bx-accent, #46c66d)",
            cursor: "pointer",
          }}
        >
          ↓ latest
        </button>
      )}
    </div>
  );
}
```

(Verify `EmptyState`'s props by reading `packages/ui/src/molecules/EmptyState/EmptyState.tsx` — adjust `title`/`description` to its real API, e.g. `heading`/`body` or children.)

- [ ] **Step 2: Verify EmptyState API**

Read `packages/ui/src/molecules/EmptyState/EmptyState.tsx` and adjust the `EmptyState` call in Step 1 to its real props.

- [ ] **Step 3: Create the story**

```tsx
// packages/ui/src/organisms/ChatThread/ChatThread.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ChatThread } from "./ChatThread";
import type { Agent, ChatMessageData } from "../ChatPanel/chat-types";

const meta: Meta<typeof ChatThread> = {
  title: "OCTANT/Organisms/ChatThread",
  component: ChatThread,
};
export default meta;

const agents: Record<string, Agent> = {
  router: { id: "router", name: "ROUTER" },
  coder: { id: "coder", name: "CODER" },
};

const messages: ChatMessageData[] = [
  { id: "u1", role: "user", time: "12:01", blocks: [{ type: "text", text: "Rasterise the field." }] },
  {
    id: "a1",
    role: "agent",
    agentId: "router",
    time: "12:01",
    blocks: [
      { type: "reasoning", text: "Use `octantMaskField` then dither." },
      {
        type: "tool_call",
        id: "tc",
        name: "render_frame",
        status: "done",
        args: { w: 80, h: 24 },
        result: { ok: true },
        startedAt: 0,
        endedAt: 41,
      },
      { type: "text", text: "Done — frame rendered with `bar8`. See https://octant.io." },
      {
        type: "citations",
        sources: [
          { label: 1, children: "raster.ts — paintBuf" },
          { label: 2, children: "field.ts — octantMaskField" },
        ],
      },
    ],
  },
  {
    id: "a2",
    role: "agent",
    agentId: "coder",
    time: "12:03",
    blocks: [{ type: "text", text: "I can extend it — want a dither pass too?" }],
  },
];

export const MultiTurn: StoryObj = {
  render: () => (
    <div style={{ height: 420, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <ChatThread messages={messages} agents={agents} />
    </div>
  ),
};

export const Streaming: StoryObj = {
  render: () => (
    <div style={{ height: 420, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <ChatThread messages={messages.slice(0, 1)} agents={agents} streaming />
    </div>
  ),
};

export const Empty: StoryObj = {
  render: () => (
    <div style={{ height: 420, border: "1px solid var(--bx-border, #1c1d24)" }}>
      <ChatThread messages={[]} />
    </div>
  ),
};
```

- [ ] **Step 4: Add to the organisms barrel**

Append to `packages/ui/src/organisms/index.ts`:

```ts
export * from "./ChatThread/ChatThread";
```

- [ ] **Step 5: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 6: Pause for user before committing**

---

### Task 16: AgentPlan organism

**Files:**
- Create: `packages/ui/src/organisms/AgentPlan/AgentPlan.tsx`
- Create: `packages/ui/src/organisms/AgentPlan/AgentPlan.stories.tsx`

**Interfaces:**
- Consumes: `BrailleSpinner` from `../../atoms/BrailleSpinner/BrailleSpinner`, `PlanStep` type
- Produces: `AgentPlan`, `AgentPlanProps`

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/organisms/AgentPlan/AgentPlan.tsx
import { type CSSProperties } from "react";
import { BrailleSpinner } from "../../atoms/BrailleSpinner/BrailleSpinner";
import type { PlanStep } from "../ChatPanel/chat-types";

const STATUS_GLYPH: Record<PlanStep["status"], string> = {
  pending: "·",
  running: "◐",
  done: "✓",
  error: "✕",
};

const STATUS_COLOR: Record<PlanStep["status"], string> = {
  pending: "var(--bx-text-6, #5b616e)",
  running: "var(--bx-accent, #46c66d)",
  done: "var(--bx-accent, #46c66d)",
  error: "#ff6b6f",
};

export interface AgentPlanProps {
  steps: PlanStep[];
  onStepClick?: (id: string) => void;
  style?: CSSProperties;
}

/**
 * A multi-step plan: ordered steps with `pending`/`running`/`done`/`error`
 * states. The running step is highlighted with an accent rail and a spinner;
 * completed steps show `✓` and collapse to a single line. Clickable steps fire
 * `onStepClick`. Pure render from the `steps` prop.
 */
export function AgentPlan({ steps, onStepClick, style }: AgentPlanProps) {
  return (
    <div
      style={{
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-surface-3, #0c0d11)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)",
        ...style,
      }}
    >
      <div style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>
        PLAN · {steps.filter((s) => s.status === "done").length}/{steps.length}
      </div>
      {steps.map((step, i) => {
        const running = step.status === "running";
        return (
          <button
            key={step.id}
            type="button"
            onClick={onStepClick ? () => onStepClick(step.id) : undefined}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              width: "100%",
              textAlign: "left",
              fontFamily: "inherit",
              fontSize: 13,
              padding: "8px 10px",
              background: running ? "var(--bx-surface-2, #15161e)" : "transparent",
              border: 0,
              borderLeft: `2px solid ${running ? "var(--bx-accent, #46c66d)" : "transparent"}`,
              color: step.status === "pending" ? "var(--bx-text-6, #5b616e)" : "var(--bx-text-2, #9aa0ad)",
              cursor: onStepClick ? "pointer" : "default",
            }}
          >
            <span style={{ color: STATUS_COLOR[step.status], flex: "none", width: 16, display: "inline-flex", alignItems: "center" }}>
              {running ? <BrailleSpinner variant="pulse" /> : STATUS_GLYPH[step.status]}
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ color: "var(--bx-text-6, #5b616e)", marginRight: 6 }}>{String(i + 1).padStart(2, "0")}</span>
              {step.label}
              {step.detail && (
                <div style={{ color: "var(--bx-text-6, #5b616e)", fontSize: 11, marginTop: 3 }}>{step.detail}</div>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create the story**

```tsx
// packages/ui/src/organisms/AgentPlan/AgentPlan.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { AgentPlan } from "./AgentPlan";
import type { PlanStep } from "../ChatPanel/chat-types";

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
  args: { steps: [...steps.slice(0, 3), { id: "4", label: "Encode to glyphs", status: "error", detail: "overflow" }, ...steps.slice(4)] },
};
```

- [ ] **Step 3: Add to the organisms barrel**

Append to `packages/ui/src/organisms/index.ts`:

```ts
export * from "./AgentPlan/AgentPlan";
```

- [ ] **Step 4: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 5: Pause for user before committing**

---

### Task 17: ChatPanel organism

**Files:**
- Create: `packages/ui/src/organisms/ChatPanel/ChatPanel.tsx`
- Create: `packages/ui/src/organisms/ChatPanel/ChatPanel.stories.tsx`
- Modify: `packages/ui/src/organisms/ChatPanel/chat-types.ts` (already created in Task 1; this task re-exports types from the barrel)

**Interfaces:**
- Consumes: `ChatThread`, `ChatComposer`, `PresenceStatus`, `ArtifactPanel` (for the side panel), `Block`/`ChatMessageData`/`Agent`/`PlanStep` types
- Produces: `ChatPanel`, `ChatPanelProps`, and re-exports the type union via the organisms barrel

- [ ] **Step 1: Create the component**

```tsx
// packages/ui/src/organisms/ChatPanel/ChatPanel.tsx
import { type CSSProperties, useState } from "react";
import { PresenceStatus } from "../../atoms/PresenceStatus/PresenceStatus";
import { useControllableState } from "../../hooks/useControllableState";
import { ChatComposer } from "../../molecules/ChatComposer/ChatComposer";
import { ChatThread } from "../ChatThread/ChatThread";
import { ArtifactPanel } from "../../molecules/ArtifactPanel/ArtifactPanel";
import type { Block, ChatMessageData, PresenceItem } from "./chat-types";

export interface ChatPanelProps {
  messages: ChatMessageData[];
  /** Indexed by id. */
  agents?: Record<string, { id: string; name: string; accent?: string; glyph?: string }>;
  streaming?: boolean;
  /** Artifacts to show in the side panel (the `artifact` blocks' data). */
  artifacts?: Block[]; // filtered to type === "artifact" by caller, or this panel filters
  composerValue?: string;
  defaultComposerValue?: string;
  onComposerValueChange?: (value: string) => void;
  onSend: (text: string) => void;
  onStop?: () => void;
  onArtifactOpen?: (id: string) => void;
  /** Header presence rows. Defaults to a single ONLINE/thinking row. */
  presence?: PresenceItem[];
  style?: CSSProperties;
}

/**
 * The top-level chat surface: a header (agent name + `PresenceStatus`) +
 * `ChatThread` + `ChatComposer`, plus an optional artifact side panel that
 * lists `ArtifactPanel`s. Owns only UI state (composer value); all data and
 * stream state are controlled by the caller.
 */
export function ChatPanel({
  messages,
  agents,
  streaming = false,
  artifacts = [],
  composerValue,
  defaultComposerValue = "",
  onComposerValueChange,
  onSend,
  onStop,
  onArtifactOpen,
  presence,
  style,
}: ChatPanelProps) {
  const [composer, setComposer] = useControllableState(composerValue, defaultComposerValue, onComposerValueChange);
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);

  const artifactBlocks = artifacts.filter((a) => a.type === "artifact") as Extract<Block, { type: "artifact" }>[];
  const activeArtifact = artifactBlocks.find((a) => a.id === selectedArtifact) ?? artifactBlocks[0];
  const presenceRows: PresenceItem[] =
    presence ?? [{ label: streaming ? "THINKING" : "ONLINE", state: streaming ? "thinking" : "online" }];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: 600,
        border: "1px solid var(--bx-border, #1c1d24)",
        background: "var(--bx-bg, #0a0b0e)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--bx-border, #1c1d24)",
        }}
      >
        <span style={{ fontFamily: "var(--bx-font-mono, 'DepartureMono', ui-monospace, monospace)", fontSize: 14, color: "var(--bx-text-1, #f4f6fb)" }}>
          OCTANT · CHAT
        </span>
        <PresenceStatus items={presenceRows} />
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <ChatThread
            messages={messages}
            agents={agents}
            streaming={streaming}
            onArtifactOpen={onArtifactOpen}
            style={{ flex: 1 }}
          />
          <ChatComposer
            value={composer}
            onValueChange={setComposer}
            streaming={streaming}
            onSend={onSend}
            onStop={onStop}
            attachHint="drop a file"
          />
        </div>

        {artifactBlocks.length > 0 && (
          <div
            style={{
              width: 320,
              flex: "none",
              borderLeft: "1px solid var(--bx-border, #1c1d24)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "8px 10px",
                borderBottom: "1px solid var(--bx-border, #1c1d24)",
                overflowX: "auto",
              }}
            >
              {artifactBlocks.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedArtifact(a.id)}
                  style={{
                    fontFamily: "inherit",
                    fontSize: 11,
                    padding: "4px 8px",
                    background: a.id === activeArtifact?.id ? "var(--bx-surface-2, #15161e)" : "transparent",
                    border: "1px solid var(--bx-border, #1c1d24)",
                    color: a.id === activeArtifact?.id ? "var(--bx-accent, #46c66d)" : "var(--bx-text-4, #9aa0ad)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.title}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 10 }}>
              {activeArtifact && (
                <ArtifactPanel
                  block={activeArtifact}
                  onOpen={onArtifactOpen}
                  previewMaxHeight={Number.POSITIVE_INFINITY}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

Note: `PresenceItem` is exported from `atoms/PresenceStatus/PresenceStatus` — import it there rather than from `chat-types` (the spec's `chat-types.ts` does not redefine it). Adjust the import in Step 1: `import { PresenceStatus, type PresenceItem } from "../../atoms/PresenceStatus/PresenceStatus";` and drop `PresenceItem` from the `chat-types` import.

- [ ] **Step 2: Fix the PresenceItem import**

In `ChatPanel.tsx`, change the imports so `PresenceItem` comes from `../../atoms/PresenceStatus/PresenceStatus` and only `Block`, `ChatMessageData` come from `./chat-types`.

- [ ] **Step 3: Create the story**

```tsx
// packages/ui/src/organisms/ChatPanel/ChatPanel.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ChatPanel } from "./ChatPanel";
import type { Block, ChatMessageData } from "./chat-types";

const meta: Meta<typeof ChatPanel> = {
  title: "OCTANT/Organisms/ChatPanel",
  component: ChatPanel,
};
export default meta;

const agents = {
  router: { id: "router", name: "ROUTER" },
};

const artifact: Extract<Block, { type: "artifact" }> = {
  type: "artifact",
  id: "a1",
  title: "raster.ts",
  kind: "code",
  language: "ts",
  content: "export const V = (x: number) => (x + 1) & 7;\n",
};

const messages: ChatMessageData[] = [
  { id: "u1", role: "user", time: "12:01", blocks: [{ type: "text", text: "Rasterise the field and give me the file." }] },
  {
    id: "a1",
    role: "agent",
    agentId: "router",
    time: "12:01",
    blocks: [
      { type: "reasoning", text: "Build the raster module, then hand it back as an artifact." },
      { type: "text", text: "Here's the raster module — open it from the side panel." },
      artifact,
    ],
  },
];

export const Full: StoryObj = {
  render: () => {
    const [v, setV] = useState("");
    return (
      <ChatPanel
        messages={messages}
        agents={agents}
        artifacts={[artifact]}
        composerValue={v}
        onComposerValueChange={setV}
        onSend={(t) => alert(`send: ${t}`)}
        onStop={() => alert("stop")}
        onArtifactOpen={(id) => alert(`open: ${id}`)}
      />
    );
  },
};

export const Streaming: StoryObj = {
  render: () => (
    <ChatPanel
      messages={messages.slice(0, 1)}
      agents={agents}
      streaming
      onSend={() => {}}
      onStop={() => alert("stop")}
    />
  ),
};
```

- [ ] **Step 4: Add to the organisms barrel**

Append to `packages/ui/src/organisms/index.ts`:

```ts
export * from "./ChatPanel/ChatPanel";
export * from "./ChatPanel/chat-types";
```

- [ ] **Step 5: Verify**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS.

- [ ] **Step 6: Pause for user before committing**

---

### Task 18: Final verification + Storybook smoke

**Files:** none (verification only)

- [ ] **Step 1: Full check**

Run: `cd /home/alex/projects/balaur/design && bun run check`
Expected: PASS — typecheck + lint + all tests (including the new `agent-glyph.test.ts` and `text-block.test.ts`).

- [ ] **Step 2: Start Storybook and smoke-test**

Run: `cd /home/alex/projects/balaur/design/packages/ui && bunx storybook dev -p 6017 --ci --no-open`

Open `http://localhost:6017/` (or fetch `http://localhost:6017/index.json`). Confirm:
- All 16 new components appear under `OCTANT/Atoms/`, `OCTANT/Molecules/`, `OCTANT/Organisms/`.
- No console errors in the preview.
- `ChatPanel` renders the header, thread, composer, and artifact side panel.
- `AgentPlan` shows the running step with a spinner.
- `ChatMessage` agent variant shows a distinct `AgentGlyph`.

- [ ] **Step 3: Cross-repo check**

Run: `cd /home/alex/projects/balaur/web && bun run check` (if `web/` is cloned)
Expected: PASS (no consumption of the new components yet, so unchanged).

- [ ] **Step 4: Stop Storybook**

Kill the Storybook process.

- [ ] **Step 5: Pause for user before committing / final review**

Inform the user the implementation is complete and ask whether to commit the lot (one commit or per-task commits).

---

## Self-Review

**Spec coverage:**
- Tool calls → Task 4 (ToolPill), Task 9 (ToolCallBlock), Task 12 (BlockRenderer), stories.
- Reasoning → Task 8 (ReasoningBlock), Task 12, stories.
- Streaming → Task 2 (StreamingCursor), Task 7 (TextBlock streaming), Task 11 (TypingIndicator), Task 15 (ChatThread streaming).
- Multi-step plan → Task 16 (AgentPlan).
- Multi-agent → Task 5 (AgentGlyph), Task 14 (ChatMessage agent lookup), Task 15/17 (agents map).
- Citations → Task 12 (BlockRenderer citations branch), reuses existing `CitationList`/`CitationSource`.
- Artifacts → Task 6 (ArtifactChip), Task 10 (ArtifactPanel), Task 17 (side panel).
- Type model → Task 1.
- Error handling → Task 9 (error result), Task 14 (ERR badge + red hairline), Task 16 (error step), Task 12 (unknown block placeholder), Task 15 (EmptyState).
- Verification → Task 18.

**Placeholder scan:** Task 7's initial code block deliberately shows a broken first pass then the clean replacement — the implementer must end with only the clean `tokenizeInline`. Tasks 9/10/13/15/16/17 include "verify the real API" steps because this plan does not have read-access confirmation of `CodeBlock`/`Textarea`/`FillButton`/`EmptyState`/`BrailleSpinner` signatures; those steps make the adjustment explicit, not a placeholder. No TBDs.

**Type consistency:** `Block`, `ChatMessageData`, `Agent`, `PlanStep`, `BlockStatus` defined in Task 1 and used consistently. `ToolPillStatus = BlockStatus | "idle"` defined in Task 4. `ArtifactKind` defined in Task 6. `InlineToken` defined in Task 7. `PresenceItem` imported from the existing atom (corrected in Task 17 Step 2). Barrel `export *` lines match folder names.

One real risk: the existing `CodeBlock`, `Textarea`, `FillButton`, `EmptyState`, `BrailleSpinner` prop signatures are assumed but not yet confirmed. Each task that uses one has an explicit "verify the API" step. If a signature differs, the implementer adjusts the call — the component's own contract (props listed in "Produces") does not change.
