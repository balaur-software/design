import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EdgeArc } from "../../atoms/EdgeArc/EdgeArc";
import { NodeGlyph } from "../../atoms/NodeGlyph/NodeGlyph";
import { useForceLayout } from "../../hooks/useForceLayout";
import { edgeIsClosed, type MemoryEdge, type MemoryNode } from "../MemoryExplorer/memory-types";

export interface MemoryGraphProps {
  nodes: readonly MemoryNode[];
  edges: readonly MemoryEdge[];
  selectedId?: string;
  hoveredId?: string;
  /** Ids held still in the force layout (survive a re-render). */
  pinnedIds?: ReadonlySet<string>;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  onPinChange?: (id: string, pinned: boolean) => void;
  /** Canvas width. Default 800. */
  width?: number;
  /** Canvas height. Default 600. */
  height?: number;
  /** Show the crosshair grid background. Default true. */
  showGrid?: boolean;
  style?: CSSProperties;
}

const DRAG_THRESHOLD = 4;

/**
 * The Obsidian-style vault graph: a force-directed SVG canvas of memory nodes
 * + typed edges, with pan/zoom, click-to-select, hover, and drag-to-pin. The
 * force layout runs via `useForceLayout` and stops once it settles; the graph
 * re-renders each frame while the sim is awake, then goes inert.
 *
 * Selection dims non-neighbours (the 1-hop subgraph lights up). Dragging a
 * node pins it in place; double-click toggles the pin. Purely presentational
 * data: pass `nodes`/`edges` projections from the host's `Store` reads.
 */
export function MemoryGraph({
  nodes,
  edges,
  selectedId,
  hoveredId,
  pinnedIds,
  onSelect,
  onHover,
  onPinChange,
  width = 800,
  height = 600,
  showGrid = true,
  style,
}: MemoryGraphProps) {
  const ids = useMemo(() => nodes.map((n) => n.id), [nodes]);
  const { positions, pin, release, converged } = useForceLayout(ids, edges, { width, height });
  const [, setTick] = useState(0);
  const tickFrame = useRef(0);

  // Re-render while the sim is awake so we read fresh positions each frame.
  useEffect(() => {
    if (converged) return;
    let raf = 0;
    const loop = () => {
      setTick((t) => (t + 1) % 1_000_000);
      tickFrame.current++;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [converged]);

  // Viewport pan/zoom.
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  const panRef = useRef<{ x: number; y: number; startX: number; startY: number; panning: boolean }>({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    panning: false,
  });
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sync external pinnedIds into the layout (e.g. when the caller restores pins).
  useEffect(() => {
    if (!pinnedIds) return;
    for (const n of positions.current) {
      if (pinnedIds.has(n.id) && !n.pinned) pin(n.id, { x: n.x, y: n.y });
      if (!pinnedIds.has(n.id) && n.pinned) release(n.id);
    }
  }, [pinnedIds]);

  const toGraph = (clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    const sx = ((clientX - r.left) / r.width) * width;
    const sy = ((clientY - r.top) / r.height) * height;
    return { x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom };
  };

  // React attaches `wheel` passively at the root (since v17), so a JSX `onWheel`
  // can't preventDefault page scroll. Keep the latest handler in a ref and attach
  // a native non-passive listener once.
  const wheelRef = useRef<(e: WheelEvent) => void>(() => {});
  wheelRef.current = (e: WheelEvent) => {
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const next = Math.max(0.2, Math.min(3, zoom * factor));
    // Zoom around the cursor: keep the graph point under the pointer fixed.
    const r = svgRef.current?.getBoundingClientRect();
    if (r) {
      const sx = ((e.clientX - r.left) / r.width) * width;
      const sy = ((e.clientY - r.top) / r.height) * height;
      const gx = (sx - pan.x) / zoom;
      const gy = (sy - pan.y) / zoom;
      setPan({ x: sx - gx * next, y: sy - gy * next });
    }
    setZoom(next);
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelRef.current(e);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const onBackgroundDown = (e: ReactPointerEvent<SVGGElement>) => {
    panRef.current = { x: pan.x, y: pan.y, startX: e.clientX, startY: e.clientY, panning: true };
    setPanning(true);
    (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
  };

  const onBackgroundMove = (e: ReactPointerEvent<SVGGElement>) => {
    if (!panRef.current.panning) return;
    setPan({
      x:
        panRef.current.x +
        (e.clientX - panRef.current.startX) *
          (width / (svgRef.current?.getBoundingClientRect().width ?? width)),
      y:
        panRef.current.y +
        (e.clientY - panRef.current.startY) *
          (height / (svgRef.current?.getBoundingClientRect().height ?? height)),
    });
  };

  const onBackgroundUp = (e: ReactPointerEvent<SVGGElement>) => {
    panRef.current.panning = false;
    setPanning(false);
    (e.currentTarget as SVGGElement).releasePointerCapture(e.pointerId);
  };

  const onNodeDown = (e: ReactPointerEvent<SVGGElement>, id: string) => {
    e.stopPropagation();
    dragRef.current = { id, moved: false };
    (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
  };

  const onNodeMove = (e: ReactPointerEvent<SVGGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const g = toGraph(e.clientX, e.clientY);
    const lay = positions.current.find((l) => l.id === d.id);
    if (lay) {
      if (!d.moved && Math.hypot(g.x - lay.x, g.y - lay.y) > DRAG_THRESHOLD) d.moved = true;
      if (d.moved) {
        lay.x = g.x;
        lay.y = g.y;
        lay.vx = 0;
        lay.vy = 0;
        pin(d.id, { x: g.x, y: g.y });
        // The sim may already be converged (its rAF re-render loop stopped), so
        // force a render to redraw the dragged node at its new position.
        tickFrame.current++;
        setTick((t) => (t + 1) % 1_000_000);
      }
    }
  };

  const onNodeKeyDown = (e: ReactKeyboardEvent<SVGGElement>, id: string) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      onSelect?.(id);
    }
  };

  const onNodeUp = (e: ReactPointerEvent<SVGGElement>, id: string) => {
    const d = dragRef.current;
    (e.currentTarget as SVGGElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
    if (d && !d.moved) {
      onSelect?.(id);
    } else if (d?.moved) {
      onPinChange?.(id, true);
    }
  };

  const onNodeDouble = (id: string) => {
    const lay = positions.current.find((l) => l.id === id);
    if (!lay) return;
    if (lay.pinned) {
      release(id);
      onPinChange?.(id, false);
    } else {
      pin(id, { x: lay.x, y: lay.y });
      onPinChange?.(id, true);
    }
  };

  // 1-hop neighbour set for selection dimming.
  const neighbours = useMemo(() => {
    if (!selectedId) return null;
    const set = new Set<string>([selectedId]);
    for (const e of edges) {
      if (e.source === selectedId) set.add(e.target);
      if (e.target === selectedId) set.add(e.source);
    }
    return set;
  }, [selectedId, edges]);

  const posById = useMemo(() => {
    const m = new Map<string, { x: number; y: number; pinned: boolean }>();
    for (const l of positions.current) m.set(l.id, { x: l.x, y: l.y, pinned: l.pinned });
    return m;
    // Rebuild every render so we read fresh positions during the sim.
  }, [positions, tickFrame.current]);

  const grid = useMemo(() => {
    if (!showGrid) return null;
    const lines: string[] = [];
    for (let x = 0; x <= width; x += 40) lines.push(`M${x} 0 V${height}`);
    for (let y = 0; y <= height; y += 40) lines.push(`M0 ${y} H${width}`);
    return lines.join(" ");
  }, [showGrid, width, height]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{
        display: "block",
        background: "var(--bx-bg, #0a0b0e)",
        cursor: panning ? "grabbing" : "default",
        touchAction: "none",
        ...style,
      }}
    >
      <title>Memory graph</title>
      {grid && (
        <path d={grid} stroke="var(--bx-border, #1c1d24)" strokeWidth={0.5} strokeOpacity={0.5} fill="none" />
      )}
      <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
        <g onPointerDown={onBackgroundDown} onPointerMove={onBackgroundMove} onPointerUp={onBackgroundUp}>
          {/* Invisible rect to catch background pointer events across the canvas. */}
          <rect x={0} y={0} width={width} height={height} fill="transparent" />

          {edges.map((e) => {
            const a = posById.get(e.source);
            const b = posById.get(e.target);
            if (!a || !b) return null;
            const lit = neighbours === null || neighbours.has(e.source) || neighbours.has(e.target);
            return (
              <EdgeArc
                key={e.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                edgeType={e.type}
                closed={edgeIsClosed(e)}
                highlighted={lit && neighbours !== null}
                curve={0.08}
              />
            );
          })}

          {nodes.map((n) => {
            const p = posById.get(n.id);
            if (!p) return null;
            const dimmed = neighbours !== null && !neighbours.has(n.id);
            return (
              <g
                key={n.id}
                transform={`translate(${p.x} ${p.y})`}
                role="button"
                tabIndex={0}
                aria-label={n.title}
                aria-pressed={selectedId === n.id}
                onPointerDown={(e) => onNodeDown(e, n.id)}
                onPointerMove={onNodeMove}
                onPointerUp={(e) => onNodeUp(e, n.id)}
                onPointerEnter={() => onHover?.(n.id)}
                onPointerLeave={() => onHover?.(null)}
                onFocus={() => onHover?.(n.id)}
                onBlur={() => onHover?.(null)}
                onKeyDown={(e) => onNodeKeyDown(e, n.id)}
                onDoubleClick={() => onNodeDouble(n.id)}
                style={{ outline: "none", cursor: "pointer" }}
              >
                <NodeGlyph
                  node={n}
                  x={0}
                  y={0}
                  selected={selectedId === n.id}
                  hovered={hoveredId === n.id}
                  pinned={p.pinned}
                  dimmed={dimmed}
                  zoom={zoom}
                />
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
}
