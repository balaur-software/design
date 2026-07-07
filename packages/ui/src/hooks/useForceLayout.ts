import { useEffect, useMemo, useRef, useState } from "react";
import { seededRandom } from "../../../octant-core/src/index.ts";
import type { LayoutNode, MemoryEdge } from "../organisms/MemoryExplorer/memory-types";
import { useRafLoop } from "./useRafLoop";
import { useReducedMotion } from "./useReducedMotion";

export type { LayoutNode } from "../organisms/MemoryExplorer/memory-types";

export interface ForceLayoutOptions {
  /** Canvas width for centering gravity + initial placement. Default 800. */
  width?: number;
  /** Canvas height. Default 600. */
  height?: number;
  /** Edge spring rest length. Default 120. */
  linkDistance?: number;
  /** Spring stiffness. Default 0.02. */
  springStrength?: number;
  /** Node-node repulsion constant. Default 800. */
  repulsion?: number;
  /** Centering gravity strength. Default 0.012. */
  gravity?: number;
  /** Velocity damping per step (0..1). Default 0.82. */
  damping?: number;
  /** Kinetic energy below this stops the rAF loop. Default 0.4. */
  settleThreshold?: number;
  /** Seed for deterministic initial placement. Default "memory". */
  seed?: string;
}

/** A (source-index, target-index) adjacency pair. */
export type AdjPair = readonly [number, number];

/**
 * Deterministic initial placement: ids laid on a circle, angle hashed from each
 * id via `seededRandom` so the same set always starts in the same place. Starts
 * at rest (zero velocity, not pinned).
 */
export function initLayout(
  ids: readonly string[],
  opts: { width?: number; height?: number; seed?: string } = {},
): LayoutNode[] {
  const w = opts.width ?? 800;
  const h = opts.height ?? 600;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) / 2 - 40;
  return ids.map((id) => {
    const rnd = seededRandom(`${opts.seed ?? "memory"}:${id}`);
    const angle = rnd() * Math.PI * 2;
    return {
      id,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      pinned: false,
    };
  });
}

/** Pin a node by id (optionally at a specific point). No-op if absent. */
export function pinById(layout: LayoutNode[], id: string, xy?: { x: number; y: number }): void {
  const n = layout.find((l) => l.id === id);
  if (!n) return;
  n.pinned = true;
  n.vx = 0;
  n.vy = 0;
  if (xy) {
    n.x = xy.x;
    n.y = xy.y;
  }
}

/** Release a pinned node by id. No-op if absent. */
export function releaseById(layout: LayoutNode[], id: string): void {
  const n = layout.find((l) => l.id === id);
  if (!n) return;
  n.pinned = false;
}

/**
 * One Verlet-ish relaxation step. Forces: node-node repulsion (Coulomb-ish,
 * O(n²) — fine at personal scale), edge springs toward `linkDistance`,
 * centering gravity, velocity damping. Pinned nodes are skipped. Mutates the
 * passed layout and returns the total kinetic energy (sum of v²) — used by the
 * hook to stop the rAF loop once it settles.
 */
export function stepLayout(
  layout: LayoutNode[],
  edges: readonly AdjPair[],
  opts: ForceLayoutOptions = {},
): number {
  const o: Required<Omit<ForceLayoutOptions, "seed">> = { ...DEFAULTS, ...opts } as Required<
    Omit<ForceLayoutOptions, "seed">
  >;
  const n = layout.length;
  if (n === 0) return 0;

  const fx = new Array<number>(n).fill(0);
  const fy = new Array<number>(n).fill(0);

  // Repulsion (all pairs).
  for (let i = 0; i < n; i++) {
    const a = layout[i]!;
    for (let j = i + 1; j < n; j++) {
      const b = layout[j]!;
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < 1) {
        d2 = 1;
        dx = (Math.random() - 0.5) * 2;
        dy = (Math.random() - 0.5) * 2;
      }
      const d = Math.sqrt(d2);
      const force = o.repulsion / d2;
      const ux = dx / d;
      const uy = dy / d;
      fx[i]! += ux * force;
      fy[i]! += uy * force;
      fx[j]! -= ux * force;
      fy[j]! -= uy * force;
    }
  }

  // Springs along edges.
  for (const [si, ti] of edges) {
    if (si < 0 || ti < 0 || si >= n || ti >= n) continue;
    const a = layout[si]!;
    const b = layout[ti]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const force = o.springStrength * (d - o.linkDistance);
    const ux = dx / d;
    const uy = dy / d;
    fx[si]! += ux * force;
    fy[si]! += uy * force;
    fx[ti]! -= ux * force;
    fy[ti]! -= uy * force;
  }

  // Centering gravity + integrate.
  let energy = 0;
  for (let i = 0; i < n; i++) {
    const node = layout[i]!;
    if (node.pinned) {
      node.vx = 0;
      node.vy = 0;
      continue;
    }
    fx[i]! += (o.width / 2 - node.x) * o.gravity;
    fy[i]! += (o.height / 2 - node.y) * o.gravity;

    node.vx = (node.vx + fx[i]!) * o.damping;
    node.vy = (node.vy + fy[i]!) * o.damping;
    node.x += node.vx;
    node.y += node.vy;
    energy += node.vx * node.vx + node.vy * node.vy;
  }
  return energy;
}

const DEFAULTS: Required<Omit<ForceLayoutOptions, "seed">> = {
  width: 800,
  height: 600,
  linkDistance: 120,
  springStrength: 0.02,
  repulsion: 800,
  gravity: 0.012,
  damping: 0.82,
  settleThreshold: 0.4,
};

export interface UseForceLayoutResult {
  /** Live positions; mutated in place each frame. Read during render. */
  positions: React.MutableRefObject<LayoutNode[]>;
  /** Pin a node (optionally at a point) and wake the loop. */
  pin: (id: string, xy?: { x: number; y: number }) => void;
  /** Release a pinned node and wake the loop. */
  release: (id: string) => void;
  /** Run one relaxation step (used by the reduced-motion fallback). */
  settle: () => void;
  /** True once kinetic energy drops below `settleThreshold`. */
  converged: boolean;
  /** Bump to re-seed positions when the node set changes. */
  reseed: () => void;
}

/**
 * Force-directed layout for the memory graph. Runs a `useRafLoop` relaxation
 * using the pure `stepLayout` core, stopping once kinetic energy settles. Under
 * `prefers-reduced-motion` the loop never starts — positions stay at the
 * deterministic circular init (caller can `settle()` for a single step).
 *
 * `positions` is a ref mutated each frame: the graph reads it during its own
 * rAF render, so we don't trigger React re-renders 60×/s.
 */
export function useForceLayout(
  ids: readonly string[],
  edges: readonly MemoryEdge[],
  opts: ForceLayoutOptions = {},
): UseForceLayoutResult {
  const merged: Required<Omit<ForceLayoutOptions, "seed">> = { ...DEFAULTS, ...opts } as Required<
    Omit<ForceLayoutOptions, "seed">
  >;
  // `seed` is intentionally excluded from the merged required shape.
  const seed = opts.seed ?? "memory";
  const reduced = useReducedMotion();

  const initOpts = (): { width?: number; height?: number; seed?: string } => ({
    ...(opts.width !== undefined ? { width: opts.width } : {}),
    ...(opts.height !== undefined ? { height: opts.height } : {}),
    seed,
  });

  // Lazy init: a plain `useRef(initLayout(...))` would run the seeded hash for
  // every node on every render only to discard the result after the first.
  const positions = useRef<LayoutNode[]>([]);
  const seeded = useRef(false);
  if (!seeded.current) {
    seeded.current = true;
    positions.current = initLayout(ids, initOpts());
  }
  const [, forceTick] = useState(0);
  const [converged, setConverged] = useState(false);

  // Re-seed when the id set changes (added/removed nodes).
  const key = ids.join("\n");
  useEffect(() => {
    positions.current = initLayout(ids, initOpts());
    setConverged(false);
    forceTick((t) => (t + 1) % 1_000_000);
  }, [key, opts.width, opts.height, seed]);

  const adj: AdjPair[] = useMemo(() => {
    const idx = new Map<string, number>();
    ids.forEach((id, i) => {
      idx.set(id, i);
    });
    return edges
      .map((e) => [idx.get(e.source) ?? -1, idx.get(e.target) ?? -1] as const)
      .filter(([a, b]) => a >= 0 && b >= 0) as AdjPair[];
  }, [ids, edges]);

  const activeRef = useRef(!reduced && !converged);

  useRafLoop(() => {
    const energy = stepLayout(positions.current, adj, merged);
    if (energy < merged.settleThreshold) {
      setConverged(true);
      activeRef.current = false;
    }
  }, !reduced && !converged);

  const wake = () => {
    setConverged(false);
    activeRef.current = true;
  };

  const pin = (id: string, xy?: { x: number; y: number }) => {
    pinById(positions.current, id, xy);
    wake();
  };
  const release = (id: string) => {
    releaseById(positions.current, id);
    wake();
  };
  const settle = () => {
    stepLayout(positions.current, adj, merged);
    forceTick((t) => (t + 1) % 1_000_000);
  };
  const reseed = () => {
    positions.current = initLayout(ids, initOpts());
    wake();
    forceTick((t) => (t + 1) % 1_000_000);
  };

  return { positions, pin, release, settle, converged, reseed };
}
