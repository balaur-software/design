import { describe, expect, it } from "bun:test";
import type { MemoryEdge, MemoryStatus, MemorySurfacing } from "./memory-types";
import {
  EDGE_STYLE,
  EDGE_TYPE_ORDER,
  edgeIsClosed,
  edgeStyle,
  nodeRadius,
  STATUS_STYLE,
  SURFACING_STYLE,
  statusStyle,
  surfacingStyle,
} from "./memory-types";

const STATUSES: MemoryStatus[] = [
  "proposed",
  "active",
  "archived",
  "rejected",
  "quarantined",
  "forgotten",
  "merged",
];
const SURFACINGS: MemorySurfacing[] = ["always", "ask", "never"];

describe("STATUS_STYLE", () => {
  it("is total over MemoryStatus", () => {
    for (const s of STATUSES) {
      const st = STATUS_STYLE[s];
      expect(typeof st?.glyph).toBe("string");
      expect(typeof st?.color).toBe("string");
      expect(st?.glyph.length).toBeGreaterThan(0);
    }
  });

  it("statusStyle resolves each status", () => {
    expect(statusStyle("active").label).toBe("ACTIVE");
    expect(statusStyle("forgotten").color).toBe("#3f424d");
  });
});

describe("SURFACING_STYLE", () => {
  it("is total over MemorySurfacing", () => {
    for (const s of SURFACINGS) {
      const st = SURFACING_STYLE[s];
      expect(typeof st?.glyph).toBe("string");
      expect(st?.label.length).toBeGreaterThan(0);
    }
  });

  it("surfacingStyle resolves each surfacing", () => {
    expect(surfacingStyle("always").label).toBe("ALWAYS");
    expect(surfacingStyle("never").glyph).toBe("○");
  });
});

describe("EDGE_STYLE", () => {
  it("covers every type in EDGE_TYPE_ORDER", () => {
    for (const t of EDGE_TYPE_ORDER) {
      const st = EDGE_STYLE[t];
      expect(st, `missing edge style for ${t}`).toBeDefined();
      expect(typeof st?.color).toBe("string");
    }
  });

  it("edgeStyle falls back to links for unknown types", () => {
    expect(edgeStyle("totally_unknown").label).toBe("LINKS");
  });

  it("edgeStyle resolves known types", () => {
    expect(edgeStyle("supersedes").dash).toBe("5 4");
    expect(edgeStyle("no_match").color).toBe("#ff6b6f");
  });
});

describe("edgeIsClosed", () => {
  const base: MemoryEdge = {
    id: "e",
    source: "a",
    target: "b",
    type: "links",
    validFrom: null,
    validUntil: null,
    created: "t",
  };

  it("is false while validUntil is null", () => {
    expect(edgeIsClosed(base)).toBe(false);
  });

  it("is true once validUntil is set", () => {
    expect(edgeIsClosed({ ...base, validUntil: "2026-07-07T00:00:00.000Z" })).toBe(true);
  });
});

describe("nodeRadius", () => {
  it("grows with importance and clamps to 0..5", () => {
    expect(nodeRadius(0)).toBe(4);
    expect(nodeRadius(5)).toBe(9);
    expect(nodeRadius(3)).toBe(7);
    expect(nodeRadius(-2)).toBe(4);
    expect(nodeRadius(99)).toBe(9);
  });
});
