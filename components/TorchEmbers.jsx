'use client';

import { useEffect, useRef } from 'react';

/**
 * Embers shed by the hero torch. As the pointer moves across the plate, small
 * sparks spawn at the torch position, rise, and burn out — the same airborne
 * embers the photograph is full of, answering the reveal instead of just
 * accompanying it.
 *
 * A 2D canvas, not the WebGL scene: these live in the hero's own stacking
 * order (above the plate, below the copy) and must die with the section on
 * scroll-out — routing them through the persistent 3D corridor would mean
 * projecting DOM coords into world space for something that is, honestly,
 * forty translucent circles.
 *
 * Perf rules follow the house style: DPR capped at 1.5 (fill rate is fill
 * rate), a hard particle cap, and the rAF loop STOPS when the last ember dies
 * rather than idling forever — a hero at rest costs zero.
 *
 * Math.random() is fine here, unlike in the 3D models: these are transient
 * sparks, not architecture. Nothing needs to look identical on reload.
 */

const DPR_CAP = 1.5;
const MAX = 90;

export default function TorchEmbers({ host }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = host.current;
    if (!canvas || !section) return;
    // No pointer, no torch, no embers. Reduced motion gets none either —
    // particles chasing the cursor are exactly what that preference declines.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);

    const resize = () => {
      const r = section.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(section);

    const parts = [];
    const last = { x: 0, y: 0, has: false };
    let frame = null;
    let lastT = 0;

    const spawn = (x, y, dist) => {
      // Faster strokes shed more embers, like dragging a brand through air.
      const n = Math.min(1 + Math.floor(dist / 18), 3);
      for (let i = 0; i < n && parts.length < MAX; i++) {
        parts.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 20,
          vy: -26 - Math.random() * 36, // embers rise
          life: 0,
          ttl: 0.9 + Math.random() * 1.1,
          size: 1 + Math.random() * 2.2,
        });
      }
    };

    const loop = (now) => {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        if (p.life >= p.ttl) {
          parts.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 8 * dt; // buoyancy: an ember accelerates upward as it lightens

        const t = p.life / p.ttl;
        const alpha = (1 - t) * 0.85;
        const r = Math.max(p.size * (1 - t * 0.6), 0.2);
        ctx.fillStyle = `rgba(255,140,60,${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        // Hot core — what makes it read as burning rather than orange dust.
        ctx.fillStyle = `rgba(255,220,170,${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // The canvas was just cleared, so stopping on empty leaves no residue.
      frame = parts.length ? requestAnimationFrame(loop) : null;
    };

    const onMove = (e) => {
      const r = section.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const dist = last.has ? Math.hypot(x - last.x, y - last.y) : 0;
      // Distance-gated, not per-event: pointermove can fire far faster than
      // paint, and spawning per event floods the cap in one sweep.
      if (!last.has || dist > 9) {
        spawn(x, y, dist);
        last.x = x;
        last.y = y;
        last.has = true;
      }
      if (!frame) {
        lastT = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };
    const onLeave = () => {
      last.has = false;
    };

    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerleave', onLeave);
    return () => {
      ro.disconnect();
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [host]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
