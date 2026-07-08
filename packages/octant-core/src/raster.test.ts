import { describe, expect, test } from "bun:test";
import type { LUT } from "./raster";
import {
  drawLine,
  fillRGBA,
  fillRGBALut,
  fillRGBAVal,
  paintBuf,
  paintLUT,
  paintVal,
  strokeArc,
} from "./raster";

const W = 5;
const H = 5;
const lit = (buf: Uint8Array): number[] => {
  const out: number[] = [];
  for (let i = 0; i < buf.length; i++) if (buf[i]) out.push(i);
  return out;
};

describe("drawLine", () => {
  test("single-pixel line writes the value at the endpoint", () => {
    const buf = new Uint8Array(W * H);
    drawLine(buf, W, H, 1, 1, 1, 1, 7);
    expect(buf[1 * W + 1]).toBe(7);
    expect(lit(buf)).toEqual([1 * W + 1]);
  });

  test("horizontal line fills a whole row", () => {
    const buf = new Uint8Array(W * H);
    drawLine(buf, W, H, 0, 2, 4, 2, 1);
    expect(lit(buf)).toEqual([10, 11, 12, 13, 14]);
  });

  test("main diagonal", () => {
    const buf = new Uint8Array(W * H);
    drawLine(buf, W, H, 0, 0, 4, 4, 1);
    expect(lit(buf)).toEqual([0, 6, 12, 18, 24]);
  });

  test("writes the given value, not just 1", () => {
    const buf = new Uint8Array(W * H);
    drawLine(buf, W, H, 0, 0, 2, 0, 3);
    expect([buf[0], buf[1], buf[2]]).toEqual([3, 3, 3]);
  });

  test("clips out-of-bounds cells without throwing", () => {
    const buf = new Uint8Array(W * H);
    expect(() => drawLine(buf, W, H, 2, 2, 10, 2, 1)).not.toThrow();
    // only the in-bounds portion (x = 2..4 on row 2) is written
    expect(lit(buf)).toEqual([12, 13, 14]);
  });
});

describe("strokeArc", () => {
  test("thickness 0 plots a single cell at angle 0", () => {
    const buf = new Uint8Array(11 * 11);
    strokeArc(buf, 11, 11, 5, 5, 3, 0, 0, 5, 0);
    // cos(0)=1, sin(0)=0 -> (8, 5)
    expect(buf[5 * 11 + 8]).toBe(5);
    expect(lit(buf)).toEqual([5 * 11 + 8]);
  });

  test("a quarter arc hits both endpoints and leaves the center empty", () => {
    const buf = new Uint8Array(11 * 11);
    strokeArc(buf, 11, 11, 5, 5, 3, 0, Math.PI / 2, 2, 0);
    expect(buf[5 * 11 + 8]).toBe(2); // angle 0   -> (8,5)
    expect(buf[8 * 11 + 5]).toBe(2); // angle π/2 -> (5,8)
    expect(buf[5 * 11 + 5]).toBe(0); // center untouched
  });

  test("max-blends: never lowers an already-higher cell", () => {
    const buf = new Uint8Array(11 * 11);
    buf[5 * 11 + 8] = 9;
    strokeArc(buf, 11, 11, 5, 5, 3, 0, 0, 2, 0);
    expect(buf[5 * 11 + 8]).toBe(9);
  });

  test("thickness widens the stroke radially", () => {
    const buf = new Uint8Array(11 * 11);
    strokeArc(buf, 11, 11, 5, 5, 3, 0, 0, 1, 2);
    // rr = 3 + tk*0.55 for tk in -2..2 -> x in {7,7,8,9,9}, y = 5
    expect([buf[5 * 11 + 7], buf[5 * 11 + 8], buf[5 * 11 + 9]]).toEqual([1, 1, 1]);
  });
});

describe("canvas painters import cleanly (no DOM in bun)", () => {
  test("are all functions", () => {
    expect(typeof paintBuf).toBe("function");
    expect(typeof paintVal).toBe("function");
    expect(typeof paintLUT).toBe("function");
  });
});

describe("fill helpers", () => {
  test("fillRGBA writes RGBA at lit indices, leaves unlit at 0", () => {
    // 4x4 buffer, cells (0,0) and (1,2) lit (indices 0 and 9).
    const buf = new Uint8Array(16);
    buf[0] = 1;
    buf[9] = 1;
    const d = new Uint8ClampedArray(16 * 4);
    fillRGBA(d, buf, 10, 20, 30);
    expect(Array.from(d.slice(0, 4))).toEqual([10, 20, 30, 255]);
    expect(Array.from(d.slice(9 * 4, 9 * 4 + 4))).toEqual([10, 20, 30, 255]);
    // an unlit cell, e.g. index 1, stays all-zero.
    expect(Array.from(d.slice(1 * 4, 1 * 4 + 4))).toEqual([0, 0, 0, 0]);
  });

  test("fillRGBALut maps codes through the LUT; code 0 and unknown codes leave pixels untouched", () => {
    const lut: LUT = [null, [1, 2, 3], undefined, [4, 5, 6]];
    const buf = new Uint8Array([0, 1, 2, 3]);
    const d = new Uint8ClampedArray(4 * 4);
    fillRGBALut(d, buf, lut);
    expect(Array.from(d.slice(0, 4))).toEqual([0, 0, 0, 0]); // code 0
    expect(Array.from(d.slice(4, 8))).toEqual([1, 2, 3, 255]); // code 1
    expect(Array.from(d.slice(8, 12))).toEqual([0, 0, 0, 0]); // code 2 -> undefined entry
    expect(Array.from(d.slice(12, 16))).toEqual([4, 5, 6, 255]); // code 3
  });

  test("fillRGBAVal clamps v > 1 to 1 and skips v <= 0", () => {
    const vbuf = [0, -1, 0.5, 2];
    const d = new Uint8ClampedArray(4 * 4);
    fillRGBAVal(d, vbuf, 100, 100, 100);
    expect(Array.from(d.slice(0, 4))).toEqual([0, 0, 0, 0]); // v = 0, skipped
    expect(Array.from(d.slice(4, 8))).toEqual([0, 0, 0, 0]); // v < 0, skipped
    expect(Array.from(d.slice(8, 12))).toEqual([50, 50, 50, 255]); // v = 0.5
    expect(Array.from(d.slice(12, 16))).toEqual([100, 100, 100, 255]); // v = 2, clamped to 1
  });

  test("reuse regression: clearing between frames leaves no stale pixel from the prior frame", () => {
    // Simulates frameFor's contract: one array reused across two frames, with
    // an explicit clear in between. Frame A lights cell 0, frame B lights
    // cell 1 only — frame A's pixel must not survive into frame B.
    const d = new Uint8ClampedArray(4 * 4);
    const frameA = new Uint8Array([1, 0, 0, 0]);
    fillRGBA(d, frameA, 9, 9, 9);
    expect(Array.from(d.slice(0, 4))).toEqual([9, 9, 9, 255]);

    d.fill(0); // the clear that frameFor performs before reuse
    const frameB = new Uint8Array([0, 1, 0, 0]);
    fillRGBA(d, frameB, 5, 5, 5);

    expect(Array.from(d.slice(0, 4))).toEqual([0, 0, 0, 0]); // frame A's pixel is gone
    expect(Array.from(d.slice(4, 8))).toEqual([5, 5, 5, 255]); // frame B's pixel is present
  });
});
