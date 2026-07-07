import { describe, expect, it } from "bun:test";
import { initLayout, type LayoutNode, pinById, stepLayout } from "./useForceLayout";

const ids = ["a", "b", "c", "d", "e"];

function byId(layout: LayoutNode[], id: string): LayoutNode {
  const n = layout.find((l) => l.id === id);
  if (!n) throw new Error(`missing ${id}`);
  return n;
}

describe("initLayout", () => {
  it("places every id exactly once", () => {
    const l = initLayout(ids);
    expect(l.length).toBe(ids.length);
    expect(new Set(l.map((n) => n.id))).toEqual(new Set(ids));
  });

  it("is deterministic for the same ids", () => {
    expect(initLayout(ids)).toEqual(initLayout(ids));
  });

  it("starts at rest (zero velocity, not pinned)", () => {
    const l = initLayout(ids);
    for (const n of l) {
      expect(n.vx).toBe(0);
      expect(n.vy).toBe(0);
      expect(n.pinned).toBe(false);
    }
  });
});

describe("stepLayout", () => {
  it("pulls connected nodes closer over many steps", () => {
    const layout = initLayout(ids, { width: 800, height: 600 });
    const edges: Array<[number, number]> = [[0, 1]];
    const before = Math.hypot(
      byId(layout, "a").x - byId(layout, "b").x,
      byId(layout, "a").y - byId(layout, "b").y,
    );
    for (let i = 0; i < 200; i++) stepLayout(layout, edges, { width: 800, height: 600 });
    const after = Math.hypot(
      byId(layout, "a").x - byId(layout, "b").x,
      byId(layout, "a").y - byId(layout, "b").y,
    );
    expect(after).toBeLessThan(before);
  });

  it("returns non-negative kinetic energy", () => {
    const layout = initLayout(ids);
    const e = stepLayout(layout, [[0, 1]], { width: 400, height: 400 });
    expect(e).toBeGreaterThanOrEqual(0);
  });

  it("never moves a pinned node", () => {
    const layout = initLayout(ids, { width: 400, height: 400 });
    pinById(layout, "a", { x: 42, y: 7 });
    const x0 = byId(layout, "a").x;
    const y0 = byId(layout, "a").y;
    for (let i = 0; i < 50; i++)
      stepLayout(
        layout,
        [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
        { width: 400, height: 400 },
      );
    expect(byId(layout, "a").x).toBe(x0);
    expect(byId(layout, "a").y).toBe(y0);
    expect(byId(layout, "a").pinned).toBe(true);
  });

  it("converges — energy trends downward over time", () => {
    const layout = initLayout(ids, { width: 400, height: 400 });
    const edges: Array<[number, number]> = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ];
    let early = 0;
    let late = 0;
    for (let i = 0; i < 300; i++) {
      const e = stepLayout(layout, edges, { width: 400, height: 400 });
      if (i < 5) early += e;
      if (i > 250) late += e;
    }
    expect(late).toBeLessThan(early);
  });
});
