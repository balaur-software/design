import { describe, expect, it } from "bun:test";
import { type MemoryStatus, STATUS_STYLE, statusGlyph, statusStyle } from "./StatusGlyph";

const STATUSES: MemoryStatus[] = [
  "proposed",
  "active",
  "archived",
  "rejected",
  "quarantined",
  "forgotten",
  "merged",
];

describe("statusGlyph", () => {
  it("returns the STATUS_STYLE glyph for each status", () => {
    for (const s of STATUSES) {
      expect(statusGlyph(s)).toBe(STATUS_STYLE[s]?.glyph);
    }
  });

  it("is a single non-empty character", () => {
    for (const s of STATUSES) {
      const g = statusGlyph(s);
      expect(g.length).toBe(1);
    }
  });
});

describe("statusStyle re-export", () => {
  it("matches the shared map", () => {
    expect(statusStyle("active").color).toBe(STATUS_STYLE.active?.color);
    expect(statusStyle("merged").label).toBe("MERGED");
  });
});
