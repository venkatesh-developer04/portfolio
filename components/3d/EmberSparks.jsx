'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNearSection } from '@/hooks/useNearSection';

/**
 * Rising sparks at the corridor's last stop — the hero photograph's airborne
 * embers, drifting up behind the closing "Let's build something fast."
 *
 * One instanced mesh, one draw call, self-lit (basic material, additive), so
 * the contact section stays as cheap as it measures. Per-instance motion is
 * derived from index-seeded phases, not Math.random(), so the field is
 * identical on every reload and needs no state between frames.
 */

const COUNT = 44;
const CENTER = [2.8, -30.3, -0.6]; // around the contact stop's look target
const SPREAD = { x: 8.5, y: 4.2, z: 3.5 };

const rand = (i) => {
  const x = Math.sin(i * 269.5 + 183.3) * 43758.5453;
  return x - Math.floor(x);
};

const SEEDS = Array.from({ length: COUNT }, (_, i) => ({
  x: (rand(i) - 0.5) * SPREAD.x,
  z: (rand(i + 100) - 0.5) * SPREAD.z,
  offset: rand(i + 200) * SPREAD.y,
  speed: 0.16 + rand(i + 300) * 0.3, // world units per second, upward
  wobble: 0.4 + rand(i + 400) * 0.8,
  phase: rand(i + 500) * Math.PI * 2,
  size: 0.55 + rand(i + 600) * 0.9,
}));

export default function EmberSparks() {
  // Section index 5 = contact.
  const near = useNearSection(5, 1.9);
  const mesh = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < COUNT; i++) {
      const s = SEEDS[i];
      // Wrap through the band bottom→top; a spark that tops out is reborn low.
      const y = CENTER[1] - SPREAD.y / 2 + ((t * s.speed + s.offset) % SPREAD.y);
      const x = CENTER[0] + s.x + Math.sin(t * s.wobble + s.phase) * 0.35;
      const z = CENTER[2] + s.z;

      // Flicker by scale, not opacity — per-instance opacity would need a
      // custom attribute; scale is free in the matrix we're writing anyway.
      const flicker = 0.65 + 0.35 * Math.sin(t * (1.4 + s.wobble) + s.phase * 2);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.045 * s.size * flicker);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  if (!near) return null;

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} raycast={() => null}>
      <tetrahedronGeometry args={[1, 0]} />
      {/* toneMapped off keeps the sparks hot; additive means overlapping
          sparks brighten each other the way real embers read against dark. */}
      <meshBasicMaterial
        color="#FF8A3D"
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
