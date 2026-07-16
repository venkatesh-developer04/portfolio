export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

export const lerp = (a, b, t) => a + (b - a) * t;

/** Frame-rate independent lerp. Use this instead of raw lerp inside useFrame. */
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));

export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const smoothstep = (t) => t * t * (3 - 2 * t);

/** Maps v from [inMin,inMax] to [outMin,outMax], clamped. */
export const mapRange = (v, inMin, inMax, outMin, outMax) => {
  const t = clamp((v - inMin) / (inMax - inMin), 0, 1);
  return outMin + t * (outMax - outMin);
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');
