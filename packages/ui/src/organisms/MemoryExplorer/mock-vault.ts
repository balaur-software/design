import type { MemoryEdge, MemoryNode } from "./memory-types";

/**
 * A deterministic mock vault for Storybook: ~30 nodes across mixed types,
 * statuses, surfacing, and importance; ~50 typed edges (links, supersedes,
 * merged_into, derived_from, on_day, no_match). Stable ids so stories render
 * identically across reloads.
 */

const TYPES = ["memory", "person", "skill", "note", "place", "event", "task"] as const;
const TITLES = [
  "lake house",
  "Ana",
  "sourdough",
  "July recap",
  "the cabin",
  "dentist appt",
  "Q3 plan",
  "Marc",
  "espresso ratio",
  "mending jeans",
  "birthday list",
  "river run",
  "passport renewal",
  "guitar practice",
  "meeting notes 14",
  "book — Piranesi",
  "gift for Ana",
  "train tickets",
  "weather log",
  "recipe — ribollita",
  "Lou",
  "sketch pad",
  "rent spike",
  "MRI result",
  "phone call — dad",
  "garden bed 2",
  "commit log",
  "sleep window",
  "knot fix",
  "ai memory memo",
];

function date(daysAgo: number, hour = 9): string {
  const d = new Date(Date.UTC(2026, 6, 7, hour, 0, 0) - daysAgo * 86_400_000);
  return d.toISOString();
}

export const mockNodes: MemoryNode[] = TITLES.map((title, i) => {
  const type = TYPES[i % TYPES.length]!;
  // Cycle through statuses, weighted toward active.
  const statusCycle = [
    "active",
    "active",
    "active",
    "active",
    "proposed",
    "archived",
    "active",
    "quarantined",
    "active",
    "merged",
    "active",
    "rejected",
    "active",
    "forgotten",
  ] as const;
  const surfacingCycle = ["always", "always", "ask", "always", "never"] as const;
  const base = {
    id: `n${i + 1}`,
    type,
    title,
    status: statusCycle[i % statusCycle.length]!,
    surfacing: surfacingCycle[i % surfacingCycle.length]!,
    importance: i % 6,
    when: i % 4 === 0 ? date(-(i + 5)) : null,
    created: date(i),
    updated: date(Math.max(0, i - 2)),
    useCount: (i * 7) % 23,
    origin: i % 3 === 0 ? "turn:abc" : i % 5 === 0 ? "telegram:fwd" : "",
    author: i % 4 === 0 ? "Ana" : "",
  };
  return type === "person" ? { ...base, aliases: [title.toLowerCase()] } : base;
});

const EDGE_TYPES = [
  "links",
  "links",
  "links",
  "supersedes",
  "merged_into",
  "derived_from",
  "on_day",
  "no_match",
] as const;

function makeEdges(): MemoryEdge[] {
  const out: MemoryEdge[] = [];
  let k = 0;
  for (let i = 0; i < mockNodes.length; i++) {
    // 1-2 outgoing edges per node, deterministic.
    const deg = 1 + (i % 2);
    for (let d = 0; d < deg; d++) {
      const j = (i + 1 + d * 3) % mockNodes.length;
      if (i === j) continue;
      const type = EDGE_TYPES[(i + d) % EDGE_TYPES.length]!;
      out.push({
        id: `e${++k}`,
        source: mockNodes[i]!.id,
        target: mockNodes[j]!.id,
        type,
        validFrom: type === "derived_from" ? date(i) : null,
        validUntil: type === "merged_into" && d === 1 ? date(i - 1) : null,
        created: date(i),
      });
    }
  }
  return out;
}

export const mockEdges: MemoryEdge[] = makeEdges();
