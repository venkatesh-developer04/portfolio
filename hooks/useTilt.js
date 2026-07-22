'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Pointer tilt: the element leans toward the cursor in real perspective while
 * it is inside, then eases flat on exit. Same gsap.quickTo discipline as
 * useMagnetic — one tween instance per axis, reused at pointer rate, never
 * allocated per move.
 *
 * ATTACH THIS TO AN ELEMENT NOTHING ELSE TRANSFORMS. framer-motion entrance
 * animations also write `transform`, and two writers on one element silently
 * clobber each other — put the entrance on a wrapper and the tilt on a child.
 *
 * Listeners are on the element, not the window: tilt is a local physicality,
 * and N tilted cards each scanning every global pointermove is N rect reads
 * per move for elements the pointer isn't even near.
 */
export function useTilt(max = 6) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Ask the browser rather than the store: this hook runs inside sections
    // that mount before the parent's useQuality effect has set the tier.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Tilt without a hover state is a card that loads askew and stays askew.
    if (window.matchMedia('(pointer: coarse)').matches) return;

    gsap.set(el, { transformPerspective: 650 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      // Top edge leans away, side edges lean toward — how a card on a
      // fingertip actually behaves.
      rx(-py * max * 2);
      ry(px * max * 2);
    };
    const onLeave = () => {
      rx(0);
      ry(0);
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(el);
    };
  }, [max]);

  return ref;
}
