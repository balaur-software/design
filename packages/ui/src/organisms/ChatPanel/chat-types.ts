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
