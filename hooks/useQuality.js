'use client';

import { useEffect } from 'react';
import { setStore, getStore } from '@/lib/store';

const STORAGE_KEY = 'vs-portfolio-quality';

/**
 * Quality tiers:
 *   'high' — full scene: workspace, orbit, cards, particles, scroll camera.
 *   'low'  — mobile / weak GPU: workspace only, low dpr, static camera, no orbit
 *            or card geometry. The DOM content is identical.
 *   'off'  — prefers-reduced-motion or user opt-out: no canvas at all, CSS
 *            gradient backdrop instead. Everything stays readable.
 */
export function detectQuality() {
  if (typeof window === 'undefined') return 'high';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'off';

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = navigator.deviceMemory ?? 8;

  if (narrow || coarse || cores <= 4 || memory <= 4) return 'low';
  return 'high';
}

/** True when the user has explicitly chosen a tier this session. */
function storedOverride() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setQualityOverride(quality) {
  try {
    localStorage.setItem(STORAGE_KEY, quality);
  } catch {
    /* private mode — honour it for this session only */
  }
  setStore({ quality });
}

/** Cycles the perf toggle: full motion ⇄ no motion. */
export function toggleMotion() {
  const next = getStore().quality === 'off' ? detectQuality() : 'off';
  setQualityOverride(next === 'off' ? 'off' : next);
}

export function useQuality() {
  useEffect(() => {
    const override = storedOverride();
    setStore({ quality: override ?? detectQuality() });

    const mq = window.matchMedia('(max-width: 900px)');
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');

    const onChange = () => {
      // A stored override always wins over redetection.
      if (storedOverride()) return;
      setStore({ quality: detectQuality() });
    };

    mq.addEventListener('change', onChange);
    rm.addEventListener('change', onChange);
    return () => {
      mq.removeEventListener('change', onChange);
      rm.removeEventListener('change', onChange);
    };
  }, []);
}
