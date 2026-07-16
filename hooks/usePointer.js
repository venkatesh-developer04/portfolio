'use client';

import { useEffect } from 'react';
import { pointerRef } from '@/lib/scroll';

/**
 * Writes normalized pointer coords into the frame-loop ref. Deliberately not
 * React state — this value is read by useFrame and by the cursor's rAF loop,
 * neither of which needs a render.
 */
export function usePointer() {
  useEffect(() => {
    const onMove = (e) => {
      pointerRef.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
}
