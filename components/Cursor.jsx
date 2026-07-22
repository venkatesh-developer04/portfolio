'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { damp } from '@/lib/utils';

const HOVER_SELECTOR = 'a, button, [data-hover], input, textarea, label[for]';

/**
 * Dot + trailing ring cursor.
 *
 * Hover state is read from the DOM via event delegation (`closest`), so any
 * link or button anywhere in the tree gets the behaviour for free — no
 * component needs to register itself with the cursor.
 *
 * Positioning is done in one rAF loop writing transforms directly. Driving
 * this through React state would re-render on every pointer move.
 */
export default function Cursor() {
  const quality = useStore((s) => s.quality);
  const dot = useRef(null);
  const ring = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // No custom cursor on touch (there is no cursor) or reduced motion.
    const fine = window.matchMedia('(pointer: fine)').matches;
    setEnabled(fine && quality !== 'off');
  }, [quality]);

  useEffect(() => {
    if (!enabled) {
      document.body.removeAttribute('data-cursor');
      return;
    }
    document.body.setAttribute('data-cursor', 'on');

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...pos };
    const state = { hover: false, down: false, visible: false };
    let frame;

    const onMove = (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!state.visible) {
        state.visible = true;
        ringPos.x = pos.x;
        ringPos.y = pos.y;
      }
    };

    const onOver = (e) => {
      state.hover = !!e.target?.closest?.(HOVER_SELECTOR);
    };

    const onDown = () => (state.down = true);
    const onUp = () => (state.down = false);
    const onLeave = () => (state.visible = false);

    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      // The ring lags the dot — that gap is what makes it feel physical.
      ringPos.x = damp(ringPos.x, pos.x, 14, dt);
      ringPos.y = damp(ringPos.y, pos.y, 14, dt);

      const ringScale = state.down ? 0.7 : state.hover ? 1.9 : 1;
      const dotScale = state.hover ? 0.35 : 1;
      const opacity = state.visible ? 1 : 0;

      if (dot.current) {
        dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${dotScale})`;
        dot.current.style.opacity = opacity;
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%) scale(${ringScale})`;
        ring.current.style.opacity = opacity * (state.hover ? 1 : 0.55);
      }

      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      document.body.removeAttribute('data-cursor');
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
      <div
        ref={ring}
        className="fixed left-0 top-0 h-8 w-8 rounded-full border border-white/70 transition-[width,height] duration-300"
        style={{ mixBlendMode: 'difference', willChange: 'transform' }}
      />
      <div
        ref={dot}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-white"
        style={{ mixBlendMode: 'difference', willChange: 'transform' }}
      />
    </div>
  );
}
