'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import resume from '@/data/resume.json';
import { pointerRef } from '@/lib/scroll';
import { setStore } from '@/lib/store';
import { play } from '@/lib/audio';
import { createCardTexture } from '@/lib/cardTexture';
import { useNearSection } from '@/hooks/useNearSection';
import { damp } from '@/lib/utils';

// The pair spans ±3.1 units, so the centre has to sit well right to keep the
// left card clear of the accessible list column.
const CENTER_X = 3.9;
const CENTER_Y = -24;
const CARD_W = 2.8;
const CARD_H = 3.9;

/**
 * Occupies world x +2.4, y -24. Sections 4 (projects) and 5 (contact) look at
 * it — see the STOPS table in CameraRig.
 */
export default function ProjectCards({ quality = 'high' }) {
  const group = useRef(null);
  // Sections 4-5 own the cards; 4.5±1.5 covers both plus the transitions in.
  const near = useNearSection(4.5, 1.5);

  useFrame(() => {
    if (!group.current) return;
    group.current.visible = near;
    if (!near) return;
    group.current.rotation.y = pointerRef.sx * 0.1;
    group.current.rotation.x = pointerRef.sy * 0.06;
  });

  return (
    <group ref={group} position={[CENTER_X, CENTER_Y, 0]}>
      {resume.projects.map((project, i) => (
        <Card
          key={project.id}
          project={project}
          // Two cards, fanned symmetrically about the origin.
          x={(i - (resume.projects.length - 1) / 2) * (CARD_W + 0.55)}
          faceIn={i === 0 ? 1 : -1}
          quality={quality}
          interactive={near}
        />
      ))}

      <pointLight position={[0, 2.4, 3]} intensity={12} distance={12} color="#ffffff" />
    </group>
  );
}

function Card({ project, x, faceIn, quality, interactive }) {
  const group = useRef(null);
  const glow = useRef(null);
  const [hovered, setHovered] = useState(false);

  // Card faces are drawn to a 2D canvas once, not rendered as DOM or SDF text.
  const { texture, dispose } = useMemo(() => createCardTexture(project), [project]);
  useEffect(() => dispose, [dispose]);

  const accent = useMemo(() => new THREE.Color(project.accent), [project.accent]);

  const restY = faceIn * 0.17;

  useFrame((state, dt) => {
    const node = group.current;
    if (!node) return;
    const delta = Math.min(dt, 0.1);
    const t = state.clock.elapsedTime;

    // Idle float, phase-offset per card so they never bob in lockstep.
    const float = Math.sin(t * 0.7 + x) * 0.07;

    if (hovered) {
      // Square up to the reader, step forward, and tilt toward the cursor.
      node.rotation.y = damp(node.rotation.y, pointerRef.sx * 0.22, 6, delta);
      node.rotation.x = damp(node.rotation.x, -pointerRef.sy * 0.16, 6, delta);
      node.position.z = damp(node.position.z, 0.65, 6, delta);
      node.position.y = damp(node.position.y, float + 0.14, 6, delta);
      node.scale.setScalar(damp(node.scale.x, 1.045, 6, delta));
    } else {
      node.rotation.y = damp(node.rotation.y, restY, 4, delta);
      node.rotation.x = damp(node.rotation.x, 0, 4, delta);
      node.position.z = damp(node.position.z, 0, 4, delta);
      node.position.y = damp(node.position.y, float, 4, delta);
      node.scale.setScalar(damp(node.scale.x, 1, 4, delta));
    }

    if (glow.current) {
      glow.current.intensity = damp(glow.current.intensity, hovered ? 9 : 2.2, 5, delta);
    }
  });

  const enter = (e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
    play('hover');
  };

  const leave = (e) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = '';
  };

  const open = (e) => {
    e.stopPropagation();
    play('open');
    setStore({ project });
  };

  const handlers = interactive
    ? { onPointerOver: enter, onPointerOut: leave, onClick: open }
    : {};

  return (
    <group ref={group} position={[x, 0, 0]} rotation={[0, restY, 0]}>
      {/* Glass slab. Hit target for the whole card. */}
      <RoundedBox args={[CARD_W, CARD_H, 0.14]} radius={0.11} smoothness={4} {...handlers}>
        <meshPhysicalMaterial
          color="#0F0B09"
          metalness={0.35}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.08}
          reflectivity={0.6}
          envMapIntensity={1.2}
        />
      </RoundedBox>

      {/* Printed face, floated just off the slab so it never z-fights. */}
      <mesh position={[0, 0, 0.076]} raycast={() => null}>
        <planeGeometry args={[CARD_W - 0.02, CARD_H - 0.02]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>

      {/* Accent rim that lights up on hover. */}
      <mesh position={[0, 0, -0.08]} raycast={() => null}>
        <planeGeometry args={[CARD_W + 0.16, CARD_H + 0.16]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={hovered ? 0.5 : 0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <pointLight
        ref={glow}
        position={[0, 0, 1.4]}
        color={accent}
        intensity={2.2}
        distance={5}
      />

      {quality === 'high' && (
        <mesh position={[0, -CARD_H / 2 - 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <planeGeometry args={[CARD_W * 1.4, 2.4]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0.06}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
