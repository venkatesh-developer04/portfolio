'use client';

/**
 * Measures section geometry once (and on resize), then samples it cheaply on
 * every scroll tick. Measuring inside the scroll loop would force layout on
 * every frame — this keeps the hot path to pure arithmetic.
 */

let cache = [];

export function measureSections(ids) {
  if (typeof document === 'undefined') return;
  cache = ids
    .map((id) => {
      const el = document.querySelector(`[data-section="${id}"]`);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { id, top: rect.top + window.scrollY, height: rect.height || 1 };
    })
    .filter(Boolean);
}

export function hasMeasurements() {
  return cache.length > 0;
}

/**
 * @returns {{ index: number, active: string }}
 *  index  — continuous section index driven by the *top* of the viewport, so
 *           it reads exactly 0 at document top and N at the last section.
 *  active — section under the *centre* of the viewport, which is what actually
 *           feels "current" to a reader and drives the nav highlight.
 */
export function sampleSections(scrollY) {
  if (!cache.length) return { index: 0, active: 'hero' };

  const index = sample(scrollY, cache);
  const centre = sample(scrollY + window.innerHeight * 0.5, cache);

  // floor, not round: sample() already returns `i + t` where i is the section
  // *containing* the probe and t is 0→1 progress through it, so the integer
  // part IS the answer. Rounding jumps to the next section past its halfway
  // point — and at the last section (5.5) rounds to 6, off the end of the
  // array, silently falling back to 'hero' at the bottom of the page.
  const i = Math.min(Math.floor(centre), cache.length - 1);
  return { index, active: cache[i]?.id ?? cache[0].id };
}

function sample(probe, list) {
  const first = list[0];
  const last = list[list.length - 1];

  if (probe <= first.top) return 0;
  if (probe >= last.top + last.height) return list.length - 1;

  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    if (probe >= s.top && probe < s.top + s.height) {
      return i + (probe - s.top) / s.height;
    }
  }
  return list.length - 1;
}
