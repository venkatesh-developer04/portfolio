'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNearSection } from '@/hooks/useNearSection';

/**
 * The ember gate — twin carved stone pillars flanking the About copy.
 *
 * This is the hero photograph's own composition restated in the corridor: the
 * plate frames its subject between two carved pillars with embers in the air,
 * and scrolling into About puts the reader in that same doorway, with the copy
 * where the subject stood. Built from primitives like everything else here —
 * no .glb, no asset to license or download.
 *
 * Deliberately still. Stone does not float, bob, or spin; the only thing that
 * moves is the fire in its seams (a slow emissive breathe) — which is also the
 * one uniform this costs per frame.
 */

const STONE = '#241813';
const STONE_DARK = '#180F0B';
const EMBER = '#FF6A1A';

const PILLAR_X = 3.1; // clear of the centred About column (max-w-3xl) at z 0
const SHAFT_H = 4.2;

/**
 * Deterministic pseudo-random from an index — the same convention the old
 * workspace used for its hair curls: the carving must be identical on every
 * reload, or the gate would visibly rearrange itself between visits.
 */
const rand = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Carved groove bands: [side (-1|1), y, slightly varied depth]. */
const GROOVES = Array.from({ length: 14 }, (_, i) => ({
  side: i % 2 === 0 ? -1 : 1,
  y: -SHAFT_H / 2 + 0.35 + rand(i) * (SHAFT_H - 0.7),
  scale: 0.94 + rand(i + 40) * 0.1,
}));

/** Ember seams: short glowing strips seated in some of the grooves. */
const SEAMS = GROOVES.filter((_, i) => rand(i + 80) > 0.35);

export default function EmberGate() {
  // Section index 1 = about. Fog hides the gate long before this fires; the
  // cull stops paying draw calls for it once the camera has flown to skills.
  const near = useNearSection(1, 1.9);
  const seamMat = useRef(null);
  const grooveRef = useRef(null);
  const seamRef = useRef(null);

  // Instance matrices are static — written once, never per frame.
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    // The breathe: one shared material, one uniform, whole gate pulses as one
    // fire. Slow and shallow on purpose — embers, not a hazard light.
    if (seamMat.current) {
      seamMat.current.emissiveIntensity =
        1.5 + Math.sin(state.clock.elapsedTime * 0.9) * 0.45;
    }

    // Lay the instances out on first frame (refs are null during render).
    if (grooveRef.current && !grooveRef.current.userData.laid) {
      GROOVES.forEach((g, i) => {
        dummy.position.set(g.side * PILLAR_X, g.y, 0);
        dummy.scale.set(g.scale, 1, g.scale);
        dummy.updateMatrix();
        grooveRef.current.setMatrixAt(i, dummy.matrix);
      });
      grooveRef.current.instanceMatrix.needsUpdate = true;
      grooveRef.current.userData.laid = true;
    }
    if (seamRef.current && !seamRef.current.userData.laid) {
      SEAMS.forEach((g, i) => {
        // Seated just proud of the front face, inside the groove's shadow.
        dummy.position.set(g.side * PILLAR_X, g.y + 0.028, 0.34);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        seamRef.current.setMatrixAt(i, dummy.matrix);
      });
      seamRef.current.instanceMatrix.needsUpdate = true;
      seamRef.current.userData.laid = true;
    }
  });

  if (!near) return null;

  return (
    <group position={[4.0, -1.15, 0]}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * PILLAR_X, 0, 0]}>
          {/* Shaft */}
          <mesh>
            <boxGeometry args={[0.64, SHAFT_H, 0.64]} />
            <meshStandardMaterial color={STONE} roughness={0.92} flatShading />
          </mesh>
          {/* Capstone */}
          <mesh position={[0, SHAFT_H / 2 + 0.12, 0]}>
            <boxGeometry args={[0.84, 0.24, 0.84]} />
            <meshStandardMaterial color={STONE_DARK} roughness={0.88} flatShading />
          </mesh>
          {/* Plinth */}
          <mesh position={[0, -SHAFT_H / 2 - 0.16, 0]}>
            <boxGeometry args={[0.96, 0.32, 0.96]} />
            <meshStandardMaterial color={STONE_DARK} roughness={0.88} flatShading />
          </mesh>
        </group>
      ))}

      {/* Carved bands — one instanced draw for every groove on both pillars. */}
      <instancedMesh
        ref={grooveRef}
        args={[undefined, undefined, GROOVES.length]}
        raycast={() => null}
      >
        <boxGeometry args={[0.7, 0.055, 0.7]} />
        <meshStandardMaterial color={STONE_DARK} roughness={1} flatShading />
      </instancedMesh>

      {/* Ember seams — one instanced draw, one shared breathing material.
          toneMapped off so the glow stays hot instead of being greyed by ACES. */}
      <instancedMesh
        ref={seamRef}
        args={[undefined, undefined, SEAMS.length]}
        raycast={() => null}
      >
        <boxGeometry args={[0.52, 0.03, 0.02]} />
        <meshStandardMaterial
          ref={seamMat}
          color="#1A0B04"
          emissive={EMBER}
          emissiveIntensity={1.5}
          toneMapped={false}
          roughness={0.6}
        />
      </instancedMesh>

      {/* The fire between the pillars — what actually lights the stone. Low
          and slightly behind, so the grooves catch it as rim rather than key. */}
      <pointLight position={[0, -1.4, -0.8]} color={EMBER} intensity={5} distance={8} decay={2} />
    </group>
  );
}
