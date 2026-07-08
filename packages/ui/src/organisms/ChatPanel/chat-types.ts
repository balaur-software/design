import type { ReactNode } from "react";
import type { CitationSourceProps } from "../../atoms/InlineCitation/InlineCitation";

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
  | { type: "citations"; sources: CitationSourceProps[] };

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

/**
 * Optional per-block render override. Return a node to render a block your own
 * way (e.g. a syntax-highlighted code block), or `null`/`undefined` to fall
 * back to the built-in `BlockRenderer`. This is the escape hatch that keeps the
 * design system dependency-free: highlighting, custom block types, etc. live in
 * the caller, which can still compose OCTANT molecules like `CodeBlock`.
 */
export type ChatBlockRenderer = (block: Block) => ReactNode;

/** A file the user has attached to the composer, app-owned end to end. */
export interface ComposerAttachment {
  id: string;
  name: string;
  /** Mirrors artifact kinds so a sent attachment can become an artifact block. */
  kind: "code" | "document" | "image";
  /** Optional byte size for display; formatting (KB/MB) is the component's job. */
  size?: number;
  /** App-owned upload lifecycle. Absent/undefined reads the same as "ready". */
  status?: "pending" | "ready" | "error";
}

/** One entry in the composer's slash-command menu. */
export interface SlashCommand {
  id: string;
  /** The typed name, matched case-insensitively against the query after `/`. */
  name: string;
  /** Optional one-line description shown beside the name. */
  hint?: string;
  /** Optional leading glyph (mirrors ToolPill/ArtifactChip's glyph-first chip shape). */
  glyph?: string;
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
