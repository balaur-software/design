// Pixel-mask -> Unicode octant glyph encoder, ported from the OCTANT reference.
//
// An octant cell is a 2x4 grid of sub-pixels. Each sub-pixel maps to one bit of
// an 8-bit mask via `bit` (row-major, x-fastest): the top-left sub-pixel is bit 0
// (value 1), top-right is bit 1 (value 2), then down the rows to bottom-right
// (value 128). `octChar` turns that mask into a single-code-point string.

/** Base code point of the Unicode "Legacy Computing Supplement" octant block. */
export const OCTANT_BASE = 0x1cd00;

/** Sub-pixel bit weights in mask-assembly order (x-fastest, then y). */
export const bit: readonly number[] = [1, 2, 4, 8, 16, 32, 64, 128];

/**
 * 16 masks that coincide with legacy block / quadrant glyphs already present in
 * the Basic Multilingual Plane. Mapped directly to those characters so text
 * rendered with a fallback font still shows the right shape.
 */
const Q: Readonly<Record<number, string>> = {
  0: " ",
  5: "▘", // ▘
  10: "▝", // ▝
  15: "▀", // ▀
  80: "▖", // ▖
  85: "▌", // ▌
  90: "▞", // ▞
  95: "▛", // ▛
  160: "▗", // ▗
  165: "▚", // ▚
  170: "▐", // ▐
  175: "▜", // ▜
  240: "▄", // ▄
  245: "▙", // ▙
  250: "▟", // ▟
  255: "█", // █
};

/**
 * 10 special masks whose glyph lives outside the contiguous octant block;
 * encoded as explicit code points. Unicode 16 unified these octant patterns
 * with pre-existing (or separately allocated) characters, so they are absent
 * from the U+1CD00.. BLOCK OCTANT run (verified against UnicodeData 16.0).
 */
const S: Readonly<Record<number, number>> = {
  1: 0x1cea8, // LEFT HALF UPPER ONE QUARTER BLOCK (octant cell 1)
  2: 0x1ceab, // RIGHT HALF UPPER ONE QUARTER BLOCK (cell 2)
  3: 0x1fb82, // UPPER ONE QUARTER BLOCK (cells 1-2)
  20: 0x1fbe6, // MIDDLE LEFT ONE QUARTER BLOCK (cells 3,5)
  40: 0x1fbe7, // MIDDLE RIGHT ONE QUARTER BLOCK (cells 4,6)
  63: 0x1fb85, // UPPER THREE QUARTERS BLOCK (cells 1-6)
  64: 0x1cea3, // LEFT HALF LOWER ONE QUARTER BLOCK (cell 7)
  128: 0x1cea0, // RIGHT HALF LOWER ONE QUARTER BLOCK (cell 8)
  192: 0x2582, // LOWER ONE QUARTER BLOCK (cells 7-8)
  252: 0x2586, // LOWER THREE QUARTERS BLOCK (cells 3-8)
};

/**
 * Precomputed mask -> glyph table. The 26 masks covered by Q or S map to their
 * unified characters; the remaining 230 masks are compressed into the
 * contiguous BLOCK OCTANT run (U+1CD00..U+1CDE5), whose code points ascend in
 * mask order.
 */
const _glyph: readonly string[] = (() => {
  const t: string[] = [];
  let next = OCTANT_BASE;
  for (let mask = 0; mask <= 255; mask++) {
    const q = Q[mask];
    const s = S[mask];
    if (q !== undefined) t.push(q);
    else if (s !== undefined) t.push(String.fromCodePoint(s));
    else t.push(String.fromCodePoint(next++));
  }
  return t;
})();

/**
 * Encode an 8-bit octant sub-pixel mask (0..255) to its single-code-point glyph.
 */
export function octChar(mask: number): string {
  return _glyph[mask] ?? " ";
}

/**
 * Sextant (2x3) encoder, ported for completeness. Maps a 6-bit mask (0..63) to a
 * legacy-computing sextant glyph, reusing the half-block glyphs for the columns.
 */
export function sext(mask: number): string {
  if (mask === 0) return " ";
  if (mask === 21) return "▌"; // ▌
  if (mask === 42) return "▐"; // ▐
  if (mask === 63) return "█"; // █
  let o = mask - 1;
  if (mask > 21) o--;
  if (mask > 42) o--;
  return String.fromCodePoint(0x1fb00 + o);
}

/**
 * DOM/canvas-dependent glyph-availability probe. Renders the sparsest octant
 * (`octChar(1)`) and `ch` — a **dense** glyph, defaulting to `octChar(254)` —
 * to an offscreen canvas and compares lit-pixel counts: a real font shows a
 * large density ratio between the two, whereas tofu ".notdef" boxes (which
 * draw the hex code point) have near-identical counts. Pass a dense glyph
 * (e.g. a mostly-lit octant or `"█"`) for a meaningful answer; the default
 * probes support for the octant block itself.
 *
 * NOTE: requires a DOM (`document`, canvas 2D + getImageData). Not unit-tested.
 */
export function glyphSupported(ch: string = octChar(254)): boolean {
  try {
    const s = 24;
    const cv = document.createElement("canvas");
    cv.width = s;
    cv.height = s;
    const c = cv.getContext("2d", { willReadFrequently: true });
    if (!c) return false;
    const count = (t: string): number => {
      c.fillStyle = "#000";
      c.fillRect(0, 0, s, s);
      c.fillStyle = "#fff";
      c.textBaseline = "top";
      c.font = '20px "DepartureMono",monospace';
      c.fillText(t, 1, 1);
      const d = c.getImageData(0, 0, s, s).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        const v = d[i];
        if (v !== undefined && v > 120) n++;
      }
      return n;
    };
    const lo = count(octChar(1));
    const hi = count(ch);
    return lo > 0 && hi > lo * 2.5;
  } catch {
    return false;
  }
}
