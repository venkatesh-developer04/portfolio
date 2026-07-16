'use client';

/**
 * Samples a character's rendered pixels into a point cloud.
 *
 * Draw the glyph to an offscreen canvas, read the alpha channel, and keep one
 * point per opaque cell on a `step` grid. This gets a real glyph silhouette
 * from the font already loaded by next/font — no font binary to parse, no SVG
 * path to hand-author, and it follows the typeface automatically.
 *
 * `step` trades fidelity for particle count: the count scales with 1/step², so
 * 4 → ~2x the particles of 6. Keep it coarse enough that the draw loop stays
 * cheap (see ShatterV).
 */
export function sampleGlyph(char, { fontSize = 400, weight = 700, step = 5 } = {}) {
  if (typeof document === 'undefined') return { points: [], width: 0, height: 0 };

  const family =
    getComputedStyle(document.documentElement).getPropertyValue('--font-inter').trim() ||
    'system-ui, sans-serif';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const font = `${weight} ${fontSize}px ${family}`;

  // Measure first so the canvas is sized to the glyph's real ink box —
  // em-box padding would offset every particle.
  ctx.font = font;
  const m = ctx.measureText(char);
  const ascent = Math.ceil(m.actualBoundingBoxAscent);
  const descent = Math.ceil(m.actualBoundingBoxDescent);
  const left = Math.ceil(m.actualBoundingBoxLeft);
  const right = Math.ceil(m.actualBoundingBoxRight);

  const width = Math.max(1, left + right);
  const height = Math.max(1, ascent + descent);

  canvas.width = width;
  canvas.height = height;
  // Resizing a canvas resets its context state — the font must be set again.
  ctx.font = font;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(char, left, ascent);

  const { data } = ctx.getImageData(0, 0, width, height);
  const points = [];

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      // Alpha only — the glyph is drawn in flat white, so alpha IS coverage.
      if (data[(y * width + x) * 4 + 3] > 128) points.push({ x, y });
    }
  }

  return { points, width, height };
}
