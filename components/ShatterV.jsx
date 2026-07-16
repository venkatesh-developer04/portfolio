'use client';

import { useEffect, useRef } from 'react';
import { sampleGlyph } from '@/lib/glyph';

const ACCENT = [124, 92, 255]; // violet
const ACCENT_2 = [34, 211, 238]; // cyan
const SHATTER_MS = 1100;
const DPR_CAP = 1.5; // same cap as the WebGL scene — fill rate is fill rate

/**
 * The "V" as a particle cloud.
 *
 * It has three jobs, in order:
 *   1. idle    — sit as a glyph, breathing very slightly
 *   2. fill    — light up bottom-to-top as `progress` climbs, so the loading
 *                number is doing visible work rather than ticking beside it
 *   3. shatter — blow apart on `shattered`, then report done
 *
 * `progress` and `shattered` are read through refs inside one rAF loop rather
 * than re-running an effect: a prop change per percent would otherwise tear
 * down and rebuild the loop 100 times during a 1.5s load.
 */
export default function ShatterV({ progress, shattered, onDone }) {
  const canvasRef = useRef(null);
  const progressRef = useRef(0);
  const shatteredRef = useRef(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);

  // Mirror props into refs via effects rather than assigning during render —
  // the rAF loop reads them, and StrictMode double-renders would otherwise
  // apply these mutations twice.
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  useEffect(() => {
    shatteredRef.current = shattered;
  }, [shattered]);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    let raf = 0;
    let cx = 0;
    let cy = 0;
    let cssW = 0;
    let cssH = 0;
    let disposed = false;

    const build = () => {
      if (disposed) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      cssW = vw;
      cssH = vh;

      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = Math.floor(vw * dpr);
      canvas.height = Math.floor(vh * dpr);
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Glyph scales with the viewport but never dominates a small screen.
      const fontSize = Math.min(vh * 0.46, vw * 0.62, 460);
      const step = vw < 700 ? 4 : 5;
      const { points, width, height } = sampleGlyph('V', { fontSize, weight: 700, step });

      const originX = (vw - width) / 2;
      const originY = (vh - height) / 2;
      cx = vw / 2;
      cy = vh / 2;

      particles = points.map((p) => {
        const hx = originX + p.x;
        const hy = originY + p.y;
        // Bottom fills first: threshold 0 at the glyph's base, 1 at its apex.
        const threshold = 1 - p.y / Math.max(height, 1);
        // Colour ramps violet→cyan across the glyph's width.
        const t = p.x / Math.max(width, 1);
        return {
          hx,
          hy,
          x: hx,
          y: hy,
          vx: 0,
          vy: 0,
          threshold,
          alpha: 0,
          size: step - 1.2,
          phase: Math.random() * Math.PI * 2,
          r: Math.round(ACCENT[0] + (ACCENT_2[0] - ACCENT[0]) * t),
          g: Math.round(ACCENT[1] + (ACCENT_2[1] - ACCENT[1]) * t),
          b: Math.round(ACCENT[2] + (ACCENT_2[2] - ACCENT[2]) * t),
        };
      });
    };

    const explode = () => {
      for (const p of particles) {
        // Radial burst from the glyph's centre, biased upward, plus jitter so
        // the cloud doesn't expand as one rigid ring.
        const dx = p.hx - cx;
        const dy = p.hy - cy;
        const dist = Math.max(Math.hypot(dx, dy), 1);
        const power = 0.055 + Math.random() * 0.075;
        p.vx = dx * power + (Math.random() - 0.5) * 3.2;
        p.vy = dy * power + (Math.random() - 0.5) * 3.2 - 2.6;
        p.dist = dist;
      }
    };

    let last = performance.now();
    let exploded = false;
    let shatterMs = 0;

    const frame = (now) => {
      /**
       * ONE clock for everything, clamped to 50ms.
       *
       * Mounting the WebGL scene blocks the main thread hard (measured: a
       * ~6s stall while three/drei parse and shaders compile). The first
       * version drove physics off a clamped dt but the fade off wall-clock
       * elapsed — so a stall left position barely moved while the fade jumped
       * straight to finished, and the shatter was skipped entirely in a single
       * frame. Accumulating *rendered* time means the animation always plays
       * its full arc; jank delays it, it can never eat it.
       */
      const stepMs = Math.min(now - last, 50);
      last = now;
      const dt = stepMs / 16.667; // in 60fps-frame units

      // The context is scaled by DPR, so clear in CSS pixels.
      ctx.clearRect(0, 0, cssW, cssH);

      const shattering = shatteredRef.current;
      if (shattering && !exploded) {
        explode();
        exploded = true;
      }
      if (shattering) shatterMs += stepMs;

      const k = shattering ? Math.min(shatterMs / SHATTER_MS, 1) : 0;
      const prog = progressRef.current / 100;

      for (const p of particles) {
        if (shattering) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 0.14 * dt; // gravity
          p.vx *= 0.985; // drag
          p.vy *= 0.985;
          // Fade from the outside in, so the glyph's core reads longest.
          p.alpha = Math.max(0, 1 - k * (1 + (p.dist / 400) * 0.6));
        } else {
          // Lit once progress passes this particle's height threshold.
          const lit = prog >= p.threshold;
          const target = lit ? 1 : 0.1;
          p.alpha += (target - p.alpha) * Math.min(0.12 * dt, 1);
          // Barely-there breathing keeps the glyph from looking like a bitmap.
          p.x = p.hx + Math.sin(now * 0.0012 + p.phase) * 0.7;
          p.y = p.hy + Math.cos(now * 0.001 + p.phase) * 0.7;
        }

        if (p.alpha <= 0.01) continue;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      if (shattering && k >= 1) {
        if (!doneRef.current) {
          doneRef.current = true;
          onDoneRef.current?.();
        }
        return; // stop the loop — nothing left to draw
      }
      raf = requestAnimationFrame(frame);
    };

    // The glyph must be sampled from Inter, not the fallback, or the V changes
    // shape mid-load. Race fonts.ready against a short timeout so a slow font
    // can never hold the intro hostage.
    const ready = document.fonts?.ready ?? Promise.resolve();
    Promise.race([ready, new Promise((r) => setTimeout(r, 400))]).then(() => {
      if (disposed) return;
      build();
      raf = requestAnimationFrame(frame);
    });

    // Rebuilding mid-shatter would snap the particles back to the glyph.
    const onResize = () => {
      if (!shatteredRef.current) build();
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
