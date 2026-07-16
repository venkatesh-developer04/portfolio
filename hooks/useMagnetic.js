'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Magnetic hover: the element leans toward the cursor while it is inside a
 * padded hit area, then springs back on exit.
 *
 * Uses gsap.quickTo — it reuses one tween instance per property instead of
 * allocating a new tween on every pointermove, which matters because this
 * fires at pointer rate.
 */
export function useMagnetic(strength = 0.4, radius = 90) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Ask the browser rather than the store: this hook runs inside sections
    // that mount before the parent's useQuality effect has set the tier.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Magnetic hover is meaningless without a fine pointer.
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      if (Math.hypot(dx, dy) < Math.max(rect.width, rect.height) / 2 + radius) {
        xTo(dx * strength);
        yTo(dy * strength);
      } else {
        xTo(0);
        yTo(0);
      }
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onLeave);
      gsap.killTweensOf(el);
    };
  }, [strength, radius]);

  return ref;
}
