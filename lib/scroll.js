/**
 * Frame-loop state.
 *
 * This is intentionally a plain mutable object, NOT React state. It is written
 * by the Lenis scroll callback and the pointermove listener, and read inside
 * useFrame every frame. Routing this through React would re-render the tree
 * ~60x/sec for values that only ever drive imperative camera math.
 *
 * `index` is a *continuous* section index: 2.35 means "35% of the way through
 * section 2". The camera rig interpolates its keyframes against it directly.
 */
export const scrollRef = {
  /** Continuous section index, e.g. 0 → 5 for six sections. */
  index: 0,
  /** Raw document scroll progress, 0 → 1. */
  progress: 0,
  /** Lenis scroll velocity, used for motion-reactive effects. */
  velocity: 0,
};

/** Normalized pointer, -1 → 1 on both axes, origin at viewport centre. */
export const pointerRef = {
  x: 0,
  y: 0,
  /** Damped copies the 3D scene reads, so parallax never snaps. */
  sx: 0,
  sy: 0,
};

export function resetScrollRefs() {
  scrollRef.index = 0;
  scrollRef.progress = 0;
  scrollRef.velocity = 0;
  pointerRef.x = pointerRef.y = pointerRef.sx = pointerRef.sy = 0;
}
