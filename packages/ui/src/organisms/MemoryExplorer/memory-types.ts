/**
 * Memory navigation types — plain, JSON-safe projections of the
 * `balaur-memory` `Node`/`Edge` (see `balaur/memory/src/types.ts` + the SCHEMA
 * contract). Re-typed locally so `@balaur/ui` carries no runtime dep on the
 * memory package; the host maps `Store` reads into these shapes.
 *
 * Ids are plain `string` here (the memory layer brands them; the UI doesn't
 * care). Status / surfacing / system edge types mirror the schema 1:1.
 */

/** Node lifecycle (SCHEMA.md "Status semantics"); rejected/forgotten/merged terminal. */
export type MemoryStatus =
  | "proposed"
  | "active"
  | "archived"
  | "rejected"
  | "quarantined"
  | "forgotten"
  | "merged";

/** The third axis besides status and importance (I2). */
export type MemorySurfacing = "always" | "ask" | "never";

/** One row of the spine, projected for display. */
export interface MemoryNode {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly body?: string;
  readonly status: MemoryStatus;
  readonly surfacing: MemorySurfacing;
  /** 0 = not applicable for this type; 1..5 otherwise. */
  readonly importance: number;
  /** ISO-8601 UTC scheduled moment, or null = undated (I17). */
  readonly when: string | null;
  readonly created: string;
  readonly updated: string;
  readonly useCount: number;
  /** Provenance: host-defined source ref. */
  readonly origin: string;
  /** "" = the owner's own words; otherwise a third-party attribution. */
  readonly author: string;
  /** Names the node also answers to (normalized), alphabetical. */
  readonly aliases?: readonly string[];
}

/** A typed link between nodes. System edge types: on_day, supersedes,
 * merged_into, no_match, derived_from (SYSTEM_EDGE_TYPES). */
export interface MemoryEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly type: string;
  /** World-time validity window (TEMPORAL.md): null from = undated, null until = still true. */
  readonly validFrom: string | null;
  readonly validUntil: string | null;
  readonly created: string;
}

/** Filter scope for the graph + lists. */
export interface NodeFilter {
  readonly types?: readonly string[];
  readonly statuses?: readonly MemoryStatus[];
  readonly minImportance?: number;
  readonly query?: string;
}

/** A node the force-directed layout is simulating. */
export interface LayoutNode {
  readonly id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
}

/** The verdict the owner can return on a proposed node (consent gate, I1/I4/I5). */
export type PendingVerdict = "approve" | "reject" | "supersede" | "archive";

/** A pre-mutation snapshot of a node (TEMPORAL.md, I16). */
export interface MemoryHistorySnapshot {
  readonly seq: number;
  readonly title: string;
  readonly body: string;
  readonly when: string | null;
  readonly actor: "owner" | "agent" | "system";
  readonly action: string;
  readonly at: string;
}

/* ───────────────────────── visual maps (single source of truth) ──────────────── */

export interface StatusStyle {
  readonly glyph: string;
  readonly color: string;
  readonly label: string;
}

/** Status → glyph + color. Used by `StatusGlyph`, `NodeGlyph`, `GraphLegend`. */
export const STATUS_STYLE: Readonly<Record<MemoryStatus, StatusStyle>> = {
  active: { glyph: "●", color: "var(--bx-accent, #46c66d)", label: "ACTIVE" },
  proposed: { glyph: "◔", color: "#f2c94c", label: "PROPOSED" },
  archived: { glyph: "▽", color: "#7b8290", label: "ARCHIVED" },
  rejected: { glyph: "✕", color: "#ff6b6f", label: "REJECTED" },
  quarantined: { glyph: "⚠", color: "#ff6b6f", label: "QUARANTINED" },
  forgotten: { glyph: "◌", color: "#3f424d", label: "FORGOTTEN" },
  merged: { glyph: "◇", color: "#2bd9d9", label: "MERGED" },
};

export interface SurfacingStyle {
  readonly glyph: string;
  readonly color: string;
  readonly label: string;
}

/** Surfacing → glyph + color (I2: always / ask / never). */
export const SURFACING_STYLE: Readonly<Record<MemorySurfacing, SurfacingStyle>> = {
  always: { glyph: "◉", color: "var(--bx-accent, #46c66d)", label: "ALWAYS" },
  ask: { glyph: "◑", color: "#f2c94c", label: "ASK" },
  never: { glyph: "○", color: "#5b616e", label: "NEVER" },
};

export interface EdgeStyle {
  /** SVG stroke-dasharray, or `undefined` for a solid line. */
  readonly dash?: string;
  readonly color: string;
  /** Per-edge opacity multiplier (closed edges render faded). */
  readonly baseOpacity: number;
  readonly label: string;
}

/** Edge type → stroke style. System edge types per SCHEMA.md; `links` is the default. */
export const EDGE_STYLE: Readonly<Record<string, EdgeStyle>> = {
  links: { color: "#3f424d", baseOpacity: 0.9, label: "LINKS" },
  supersedes: { dash: "5 4", color: "var(--bx-accent, #46c66d)", baseOpacity: 0.9, label: "SUPERSEDES" },
  merged_into: { dash: "1 4", color: "#2bd9d9", baseOpacity: 0.9, label: "MERGED_INTO" },
  derived_from: { dash: "6 3", color: "#5b616e", baseOpacity: 0.8, label: "DERIVED_FROM" },
  on_day: { dash: "1 6", color: "#2a2c34", baseOpacity: 0.5, label: "ON_DAY" },
  no_match: { dash: "4 2 1 2", color: "#ff6b6f", baseOpacity: 0.7, label: "NO_MATCH" },
};

/** The ordered edge types the legend renders (system + default). */
export const EDGE_TYPE_ORDER: readonly string[] = [
  "links",
  "supersedes",
  "merged_into",
  "derived_from",
  "on_day",
  "no_match",
];

/** Resolve an edge style, falling back to the `links` default for unknown types. */
export function edgeStyle(type: string): EdgeStyle {
  return EDGE_STYLE[type] ?? EDGE_STYLE.links!;
}

/** Resolve a status style (total over `MemoryStatus`). */
export function statusStyle(status: MemoryStatus): StatusStyle {
  return STATUS_STYLE[status];
}

/** Resolve a surfacing style (total over `MemorySurfacing`). */
export function surfacingStyle(surfacing: MemorySurfacing): SurfacingStyle {
  return SURFACING_STYLE[surfacing];
}

/** Is this edge currently closed (its fact stopped being true)? */
export function edgeIsClosed(edge: MemoryEdge): boolean {
  return edge.validUntil !== null;
}

/** Node radius on the graph, scaled by importance (0..5). */
export function nodeRadius(importance: number): number {
  return 4 + Math.max(0, Math.min(5, importance));
}
