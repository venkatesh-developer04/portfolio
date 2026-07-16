'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { scrollRef } from '@/lib/scroll';
import { setStore, getStore } from '@/lib/store';
import { measureSections, sampleSections } from '@/lib/sections';

let lenisInstance = null;
let lockRequested = false;

/** Imperative handle for nav links / "back to top". */
export function scrollToSection(id, opts = {}) {
  const target = document.querySelector(`[data-section="${id}"]`);
  if (!target) return;
  if (lenisInstance) lenisInstance.scrollTo(target, { offset: 0, duration: 1.4, ...opts });
  else target.scrollIntoView({ behavior: 'smooth' });
}

/**
 * The desired lock state is tracked at module scope rather than applied
 * straight to the instance, because callers can beat Lenis into existence:
 * React runs child effects before parent effects, so <Preloader>'s mount
 * effect fires before Shell's useLenis has constructed anything. Recording the
 * intent here lets useLenis honour it the moment it comes up.
 */
export function lockScroll(locked) {
  lockRequested = locked;
  if (!lenisInstance) return;
  if (locked) lenisInstance.stop();
  else lenisInstance.start();
}

/**
 * Owns the single rAF loop for the whole page: drives Lenis, then samples
 * section geometry and writes the frame-loop refs the 3D scene reads.
 * One loop, one place, no ordering ambiguity between scroll and camera.
 */
export function useLenis(sectionIds) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: 1.15,
      // Exponential ease-out: fast pickup, long glide, no rubber-band at rest.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduced,
      syncTouch: false, // native momentum on touch feels better than emulated
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    });
    lenisInstance = lenis;
    // Honour any lock requested before we existed.
    if (lockRequested) lenis.stop();

    let frame;
    const raf = (time) => {
      lenis.raf(time);

      const { index, active } = sampleSections(window.scrollY);
      scrollRef.index = index;
      scrollRef.velocity = lenis.velocity ?? 0;
      scrollRef.progress = lenis.progress ?? 0;

      if (active !== getStore().active) setStore({ active });

      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    const measure = () => measureSections(sectionIds);
    measure();
    // Fonts and images shift layout after first paint; re-measure once settled.
    const settle = setTimeout(measure, 400);
    document.fonts?.ready.then(measure);

    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      ro.disconnect();
      window.removeEventListener('resize', measure);
      lenis.destroy();
      lenisInstance = null;
    };
  }, [sectionIds]);
}
