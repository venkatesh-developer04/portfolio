'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { scrollRef } from '@/lib/scroll';

/**
 * True while the camera is within `range` sections of `center`.
 *
 * Used to cull scene groups the camera has flown away from. Fog already hides
 * them visually, but they still cost draw calls and material updates every
 * frame — this stops paying for geometry nobody can see.
 *
 * The comparison is done against a ref and only calls setState on an actual
 * transition, so this costs one re-render per crossing, not one per frame.
 */
export function useNearSection(center, range = 1.6) {
  const [near, setNear] = useState(false);
  const previous = useRef(false);

  useFrame(() => {
    const next = Math.abs(scrollRef.index - center) < range;
    if (next !== previous.current) {
      previous.current = next;
      setNear(next);
    }
  });

  return near;
}
