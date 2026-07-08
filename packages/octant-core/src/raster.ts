// Framebuffer rasterizers + canvas ImageData painters, ported from the OCTANT
// reference.
//
// NOTE: the canvas painters (paintBuf, paintVal, paintLUT) require a DOM canvas
// 2D context and are not unit-tested (bun test has no DOM); they are exercised
// only in the browser. The framebuffer rasterizers (drawLine, strokeArc) and
// the painters' pixel-fill helpers (fillRGBA, fillRGBALut, fillRGBAVal) are
// pure and unit-tested.

/** A 1-bit-per-cell framebuffer: nonzero = lit. */
export type Buf = ArrayLike<number>;
/** A float-per-cell framebuffer: value in [0,1] scales brightness (clamped at 1). */
export type ValBuf = ArrayLike<number>;
/** A writable integer framebuffer (e.g. a `Uint8Array` or `number[]`). */
export type MutBuf = { length: number; [index: number]: number };
/**
 * A color lookup table: `lut[code]` -> `[r,g,b]`. Code `0` (and any nullish
 * entry) is treated as transparent / background.
 */
export type LUT = ReadonlyArray<readonly [number, number, number] | null | undefined>;

// One reusable frame per 2D context: painters run per animation frame, and
// allocating a fresh ImageData on every call is ~dw*dh*4 bytes of garbage per
// frame. WeakMap keys on the context so canvases can be GC'd normally.
const frames = new WeakMap<CanvasRenderingContext2D, ImageData>();

function frameFor(ctx: CanvasRenderingContext2D, dw: number, dh: number): ImageData {
  let im = frames.get(ctx);
  if (!im || im.width !== dw || im.height !== dh) {
    im = ctx.createImageData(dw, dh);
    frames.set(ctx, im);
  } else {
    im.data.fill(0); // painters only write lit cells — must clear stale pixels
  }
  return im;
}

/** Write lit cells of `buf` into an RGBA pixel array (assumed pre-cleared). */
export function fillRGBA(d: Uint8ClampedArray, buf: Buf, r: number, g: number, b: number): void {
  for (let i = 0, j = 0; i < buf.length; i++, j += 4) {
    if (buf[i]) {
      d[j] = r;
      d[j + 1] = g;
      d[j + 2] = b;
      d[j + 3] = 255;
    }
  }
}

/**
 * Paint a boolean framebuffer to a canvas at 1 pixel per cell in a single solid
 * color (r,g,b), fully opaque where the cell is lit and transparent elsewhere.
 */
export function paintBuf(
  c: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  buf: Buf,
  dw: number,
  dh: number,
  r: number,
  g: number,
  b: number,
): void {
  if (c.width !== dw || c.height !== dh) {
    c.width = dw;
    c.height = dh;
  }
  const im = frameFor(ctx, dw, dh);
  fillRGBA(im.data, buf, r, g, b);
  ctx.putImageData(im, 0, 0);
}

/**
 * Bresenham line into a writable integer framebuffer, writing `val` at each
 * step. Endpoints are floored to integers and out-of-bounds cells are clipped.
 * Ported from the wireframe `line()` / linechart `seg()`.
 */
export function drawLine(
  buf: MutBuf,
  dw: number,
  dh: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  val: number,
): void {
  x0 |= 0;
  y0 |= 0;
  x1 |= 0;
  y1 |= 0;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    if (x0 >= 0 && x0 < dw && y0 >= 0 && y0 < dh) buf[y0 * dw + x0] = val;
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/**
 * Stroke a circular arc of radius `r` from angle `a0` to `a1` (radians) into a
 * writable integer framebuffer, plotting `val` (max-blended: a cell only rises
 * to `val`, never drops). `thickness` is the number of radial offsets on each
 * side of `r` (offset step `0.55` cells), so the stroke spans `2*thickness+1`
 * concentric samples. Ported from the ring / donut / gauge arc rasterizers.
 */
export function strokeArc(
  buf: MutBuf,
  dw: number,
  dh: number,
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  val: number,
  thickness = 1,
): void {
  const steps = Math.max(1, Math.ceil(Math.abs(a1 - a0) * r * 2.2));
  for (let i = 0; i <= steps; i++) {
    const a = i / steps;
    const ang = a0 + a * (a1 - a0);
    for (let tk = -thickness; tk <= thickness; tk++) {
      const rr = r + tk * 0.55;
      const x = Math.round(cx + Math.cos(ang) * rr);
      const y = Math.round(cy + Math.sin(ang) * rr);
      if (x >= 0 && x < dw && y >= 0 && y < dh) {
        const idx = y * dw + x;
        if ((buf[idx] ?? 0) < val) buf[idx] = val;
      }
    }
  }
}

/**
 * Write `buf` codes into an RGBA pixel array via `lut[code]` (assumed
 * pre-cleared). Code `0` (and any nullish LUT entry) is left untouched.
 */
export function fillRGBALut(d: Uint8ClampedArray, buf: Buf, lut: LUT): void {
  for (let i = 0, j = 0; i < buf.length; i++, j += 4) {
    const code = buf[i];
    if (!code) continue;
    const col = lut[code];
    if (!col) continue;
    d[j] = col[0];
    d[j + 1] = col[1];
    d[j + 2] = col[2];
    d[j + 3] = 255;
  }
}

/**
 * Paint a code framebuffer to a canvas at 1 pixel per cell, coloring each cell
 * via `lut[code]`. Like {@link paintBuf}, but `buf` holds small integer codes
 * (e.g. 1 = dim, 2 = accent, 3 = head) and `lut` maps them to colors; code `0`
 * (and any nullish LUT entry) stays transparent. Used by ring / donut /
 * linechart / gauge.
 */
export function paintLUT(
  c: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  buf: Buf,
  dw: number,
  dh: number,
  lut: LUT,
): void {
  if (c.width !== dw || c.height !== dh) {
    c.width = dw;
    c.height = dh;
  }
  const im = frameFor(ctx, dw, dh);
  fillRGBALut(im.data, buf, lut);
  ctx.putImageData(im, 0, 0);
}

/**
 * Write `vbuf` values into an RGBA pixel array (assumed pre-cleared),
 * modulating (r,g,b) by the per-cell value (clamped to [0,1]); cells <= 0 are
 * left untouched.
 */
export function fillRGBAVal(d: Uint8ClampedArray, vbuf: ValBuf, r: number, g: number, b: number): void {
  for (let i = 0, j = 0; i < vbuf.length; i++, j += 4) {
    let v = vbuf[i] ?? 0;
    if (v > 0) {
      if (v > 1) v = 1;
      d[j] = r * v;
      d[j + 1] = g * v;
      d[j + 2] = b * v;
      d[j + 3] = 255;
    }
  }
}

/**
 * Paint a float framebuffer to a canvas at 1 pixel per cell, modulating (r,g,b)
 * by the per-cell value (clamped to [0,1]); cells <= 0 stay transparent.
 */
export function paintVal(
  c: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  vbuf: ValBuf,
  dw: number,
  dh: number,
  r: number,
  g: number,
  b: number,
): void {
  if (c.width !== dw || c.height !== dh) {
    c.width = dw;
    c.height = dh;
  }
  const im = frameFor(ctx, dw, dh);
  fillRGBAVal(im.data, vbuf, r, g, b);
  ctx.putImageData(im, 0, 0);
}
