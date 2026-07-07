import { describe, expect, test } from "bun:test";
import { bit, OCTANT_BASE, octChar, sext } from "./encode";

describe("octChar golden values (from reference Q/S tables)", () => {
  test("Q-table masks map to legacy block/quadrant glyphs", () => {
    // Golden values taken directly from the reference Q table.
    expect(octChar(0)).toBe(" "); // U+0020
    expect(octChar(255)).toBe("█"); // U+2588
    expect(octChar(85)).toBe("▌"); // U+258C
    expect(octChar(5)).toBe("▘"); // U+2598
    expect(octChar(10)).toBe("▝"); // U+259D
    expect(octChar(15)).toBe("▀"); // U+2580
    expect(octChar(80)).toBe("▖"); // U+2596
    expect(octChar(90)).toBe("▞"); // U+259E
    expect(octChar(95)).toBe("▛"); // U+259B
    expect(octChar(160)).toBe("▗"); // U+2597
    expect(octChar(165)).toBe("▚"); // U+259A
    expect(octChar(170)).toBe("▐"); // U+2590
    expect(octChar(175)).toBe("▜"); // U+259C
    expect(octChar(240)).toBe("▄"); // U+2584
    expect(octChar(245)).toBe("▙"); // U+2599
    expect(octChar(250)).toBe("▟"); // U+259F
  });

  test("S-table masks map to their explicit code points", () => {
    expect(octChar(1)).toBe(String.fromCodePoint(0x1cea8)); // LEFT HALF UPPER ONE QUARTER BLOCK
    expect(octChar(2)).toBe(String.fromCodePoint(0x1ceab)); // RIGHT HALF UPPER ONE QUARTER BLOCK
    expect(octChar(3)).toBe(String.fromCodePoint(0x1fb82)); // UPPER ONE QUARTER BLOCK
    expect(octChar(20)).toBe(String.fromCodePoint(0x1fbe6)); // MIDDLE LEFT ONE QUARTER BLOCK
    expect(octChar(40)).toBe(String.fromCodePoint(0x1fbe7)); // MIDDLE RIGHT ONE QUARTER BLOCK
    expect(octChar(63)).toBe(String.fromCodePoint(0x1fb85)); // UPPER THREE QUARTERS BLOCK
    expect(octChar(64)).toBe(String.fromCodePoint(0x1cea3)); // LEFT HALF LOWER ONE QUARTER BLOCK
    expect(octChar(128)).toBe(String.fromCodePoint(0x1cea0)); // RIGHT HALF LOWER ONE QUARTER BLOCK
    expect(octChar(192)).toBe(String.fromCodePoint(0x2582)); // LOWER ONE QUARTER BLOCK
    expect(octChar(252)).toBe(String.fromCodePoint(0x2586)); // LOWER THREE QUARTERS BLOCK
  });

  test("OCTANT_BASE constant", () => {
    expect(OCTANT_BASE).toBe(0x1cd00);
  });

  test("first non-Q/S mask (4) lands at OCTANT_BASE", () => {
    // masks 0..3 are covered by Q(0) and S(1,2,3); mask 4 is the first "free"
    // index and must land exactly at the block base.
    expect(octChar(4)).toBe(String.fromCodePoint(OCTANT_BASE));
  });
});

describe("octChar exhaustive invariants over masks 0..255", () => {
  const outputs: string[] = [];
  for (let m = 0; m <= 255; m++) outputs.push(octChar(m));

  test("every output is exactly one code point", () => {
    for (let m = 0; m <= 255; m++) {
      const s = outputs[m]!;
      expect([...s].length).toBe(1);
    }
  });

  test("all 256 outputs are unique", () => {
    expect(new Set(outputs).size).toBe(256);
  });

  test("non-Q/S masks land in the BLOCK OCTANT run [U+1CD00, U+1CDE5]", () => {
    const qMasks = new Set([0, 5, 10, 15, 80, 85, 90, 95, 160, 165, 170, 175, 240, 245, 250, 255]);
    const sMasks = new Set([1, 2, 3, 20, 40, 63, 64, 128, 192, 252]);
    for (let m = 0; m <= 255; m++) {
      if (qMasks.has(m) || sMasks.has(m)) continue;
      const cp = outputs[m]!.codePointAt(0)!;
      expect(cp).toBeGreaterThanOrEqual(OCTANT_BASE);
      expect(cp).toBeLessThanOrEqual(0x1cde5);
    }
  });
});

describe("octChar exhaustive characterization (UnicodeData 16.0)", () => {
  // The 26 octant patterns Unicode 16 unified with pre-existing (or separately
  // allocated) characters, keyed by mask. Every entry verified against
  // UnicodeData 16.0 character names (octant cell n = bit n-1 of the mask).
  const unified: Record<number, number> = {
    0: 0x20, // SPACE (encoder emits " ")
    1: 0x1cea8, // LEFT HALF UPPER ONE QUARTER BLOCK (cell 1)
    2: 0x1ceab, // RIGHT HALF UPPER ONE QUARTER BLOCK (cell 2)
    3: 0x1fb82, // UPPER ONE QUARTER BLOCK (cells 1-2)
    5: 0x2598, // QUADRANT UPPER LEFT (cells 1,3)
    10: 0x259d, // QUADRANT UPPER RIGHT (cells 2,4)
    15: 0x2580, // UPPER HALF BLOCK (cells 1-4)
    20: 0x1fbe6, // MIDDLE LEFT ONE QUARTER BLOCK (cells 3,5)
    40: 0x1fbe7, // MIDDLE RIGHT ONE QUARTER BLOCK (cells 4,6)
    63: 0x1fb85, // UPPER THREE QUARTERS BLOCK (cells 1-6)
    80: 0x2596, // QUADRANT LOWER LEFT (cells 5,7)
    85: 0x258c, // LEFT HALF BLOCK (cells 1,3,5,7)
    90: 0x259e, // QUADRANT UPPER RIGHT AND LOWER LEFT
    95: 0x259b, // QUADRANT UPPER LEFT AND UPPER RIGHT AND LOWER LEFT
    160: 0x2597, // QUADRANT LOWER RIGHT (cells 6,8)
    165: 0x259a, // QUADRANT UPPER LEFT AND LOWER RIGHT
    170: 0x2590, // RIGHT HALF BLOCK (cells 2,4,6,8)
    175: 0x259c, // QUADRANT UPPER LEFT AND UPPER RIGHT AND LOWER RIGHT
    192: 0x2582, // LOWER ONE QUARTER BLOCK (cells 7-8)
    240: 0x2584, // LOWER HALF BLOCK (cells 5-8)
    245: 0x2599, // QUADRANT UPPER LEFT AND LOWER LEFT AND LOWER RIGHT
    250: 0x259f, // QUADRANT UPPER RIGHT AND LOWER LEFT AND LOWER RIGHT
    252: 0x2586, // LOWER THREE QUARTERS BLOCK (cells 3-8)
    255: 0x2588, // FULL BLOCK
    64: 0x1cea3, // LEFT HALF LOWER ONE QUARTER BLOCK (cell 7)
    128: 0x1cea0, // RIGHT HALF LOWER ONE QUARTER BLOCK (cell 8)
  };

  test("all 256 masks encode to the exact Unicode 16 code point", () => {
    // The 230 non-unified masks fill the BLOCK OCTANT run U+1CD00..U+1CDE5
    // sequentially in ascending mask order (verified against UnicodeData 16.0:
    // U+1CD00 is BLOCK OCTANT-3 / mask 4, U+1CDE5 is BLOCK OCTANT-2345678 /
    // mask 254, with code points strictly ascending in mask order).
    let next = OCTANT_BASE;
    for (let mask = 0; mask <= 255; mask++) {
      const expected = unified[mask] ?? next++;
      expect(octChar(mask).codePointAt(0)).toBe(expected);
    }
    // Exactly 230 code points consumed: the run ends at U+1CDE5.
    expect(next - 1).toBe(0x1cde5);
  });
});

describe("tables", () => {
  test("bit weights are the octant sub-pixel powers of two", () => {
    expect([...bit]).toEqual([1, 2, 4, 8, 16, 32, 64, 128]);
  });
});

describe("sext (sextant encoder)", () => {
  test("golden endpoints and half-block special cases", () => {
    expect(sext(0)).toBe(" ");
    expect(sext(21)).toBe("▌");
    expect(sext(42)).toBe("▐");
    expect(sext(63)).toBe("█");
    expect(sext(1)).toBe(String.fromCodePoint(0x1fb00));
  });
});
