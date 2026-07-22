'use client';

import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import { scrollRef } from '@/lib/scroll';
import { clamp, damp } from '@/lib/utils';

/**
 * Scroll-velocity skew: the whole page leans with scroll speed and settles
 * flat at rest — content behaves like it has mass.
 *
 * One transform on ONE wrapper, riding a MotionValue in the frame loop; no
 * React re-render is involved and at rest the transform is an identity skew.
 * Reads Lenis velocity from scrollRef, same as the 3D camera, so the DOM and
 * the corridor lean to the same physics.
 *
 * Only wraps <main>. Everything position:fixed (nav, cursor, frame, smoke,
 * modal) lives OUTSIDE this wrapper by existing structure — a transformed
 * ancestor becomes the containing block for fixed descendants and would pin
 * them all to the skewing box. Keep it that way.
 */
export default function SkewOnScroll({ enabled = true, children }) {
  const skew = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    if (!enabled) return;
    const target = clamp(scrollRef.velocity * 0.03, -2.4, 2.4);
    skew.set(damp(skew.get(), target, 5, Math.min(delta, 100) / 1000));
  });

  // Hooks above run unconditionally; only the wrapper is conditional.
  if (!enabled) return children;

  return <motion.div style={{ skewY: skew }}>{children}</motion.div>;
}
