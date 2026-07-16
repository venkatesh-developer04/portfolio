'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollRef } from '@/lib/scroll';

/**
 * Dust field spanning the full camera corridor. Gives the flight between
 * sections a sense of depth and speed — without it the camera move reads as
 * objects changing rather than the viewer travelling.
 *
 * The y range must cover past the LAST camera stop (contact, y -31.2) or the
 * closing section flies into empty void.
 *
 * One BufferGeometry, one draw call, no per-particle objects.
 */
export default function Particles({ count = 700 }) {
  const points = useRef(null);

  const positions = useMemo(() => {
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      array[i * 3] = (Math.random() - 0.5) * 26;
      array[i * 3 + 1] = 4 - Math.random() * 44; // +4 → -40
      array[i * 3 + 2] = (Math.random() - 0.5) * 20 - 3;
    }
    return array;
  }, [count]);

  useFrame((state, dt) => {
    if (!points.current) return;
    const delta = Math.min(dt, 0.1);
    points.current.rotation.y += delta * 0.012;
    // Scroll velocity streaks the field slightly — cheap sense of motion.
    points.current.position.y = Math.min(Math.abs(scrollRef.velocity) * 0.004, 0.4);
    points.current.material.opacity =
      0.34 + Math.sin(state.clock.elapsedTime * 0.4) * 0.06;
  });

  return (
    <points ref={points} raycast={() => null}>
      <bufferGeometry>
        {/* args constructs the BufferAttribute — count/itemSize are derived
            from it. Passing those as props too would set them twice and go
            stale if the array ever changes. */}
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        // Ember orange, not white. Additively blended against the warm darks
        // these stop reading as neutral dust and become airborne sparks — the
        // same thing the hero plate is full of, so the corridor and the
        // photograph share a vocabulary.
        color="#FF8A3D"
        transparent
        opacity={0.34}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
