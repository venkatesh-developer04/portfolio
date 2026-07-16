'use client';

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import resume from '@/data/resume.json';
import { pointerRef } from '@/lib/scroll';
import { setStore } from '@/lib/store';
import { play } from '@/lib/audio';
import { useNearSection } from '@/hooks/useNearSection';

// Pushed further right than the other objects: the orbit is the widest thing
// in the scene, and at x 2.2 its outer ring ran straight under the legend.
const CENTER_X = 3.6;
const CENTER_Y = -12;

/**
 * Skills as an orbital system. Each resume skill *category* becomes a ring:
 * ring radius grows with category index, and every skill in that category is a
 * node evenly distributed around it. Rings are tilted off-axis and counter-
 * rotate at different speeds so the system never reads as flat or looped.
 *
 * Occupies world x +2.2, y -12. Sections 2 (skills) and 3 (experience) look at
 * it from opposite sides — see the STOPS table in CameraRig.
 */
export default function SkillOrbit({ quality = 'high' }) {
  const group = useRef(null);
  // Sections 2-3 own the orbit; 2.5±1.5 covers both plus the transitions in.
  const near = useNearSection(2.5, 1.5);
  // Labels are real DOM — only mount them when the camera is actually here.
  const showLabels = near && quality === 'high';

  const rings = useMemo(
    () =>
      resume.skills.map((category, ci) => ({
        ...category,
        // Outer ring lands at ~3.2 world units. At the skills camera distance
        // that keeps the whole system inside the right half of the frame,
        // clear of the legend column.
        radius: 1.3 + ci * 0.62,
        tilt: [0.34 + ci * 0.16, 0, 0.12 - ci * 0.1],
        speed: (ci % 2 === 0 ? 1 : -1) * (0.09 + ci * 0.022),
        nodes: category.items.map((label, ni) => ({
          label,
          angle: (ni / category.items.length) * Math.PI * 2 + ci * 0.6,
          bob: ni * 1.7 + ci,
        })),
      })),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    group.current.visible = near;
    if (!near) return;
    // Whole system leans with the pointer.
    group.current.rotation.x = pointerRef.sy * 0.12;
    group.current.rotation.y = pointerRef.sx * 0.16 + Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
  });

  return (
    <group ref={group} position={[CENTER_X, CENTER_Y, 0]}>
      {/* Core the system orbits — the "sun". Faceted (detail 0) and dark with
          a tight emissive, so it reads as a cut stone rather than a flat ball
          of colour. */}
      <mesh>
        <icosahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial
          color="#1A1310"
          emissive="#FF6A1A"
          emissiveIntensity={0.45}
          roughness={0.18}
          metalness={0.9}
          flatShading
        />
      </mesh>
      <pointLight color="#FF6A1A" intensity={6} distance={9} />

      {rings.map((ring) => (
        <Ring key={ring.category} ring={ring} showLabels={showLabels} quality={quality} />
      ))}
    </group>
  );
}

function Ring({ ring, showLabels, quality }) {
  const ref = useRef(null);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += Math.min(dt, 0.1) * ring.speed;
  });

  return (
    <group ref={ref} rotation={ring.tilt}>
      {/* The orbit path itself. */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ring.radius, 0.004, 8, 128]} />
        <meshBasicMaterial
          color={ring.accent}
          transparent
          opacity={0.28}
          toneMapped={false}
        />
      </mesh>

      {ring.nodes.map((node) => (
        <SkillNode
          key={node.label}
          node={node}
          radius={ring.radius}
          accent={ring.accent}
          category={ring.category}
          showLabel={showLabels}
          quality={quality}
        />
      ))}
    </group>
  );
}

function SkillNode({ node, radius, accent, category, showLabel, quality }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const color = useMemo(() => new THREE.Color(accent), [accent]);

  useFrame((state, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;

    mesh.position.set(
      Math.cos(node.angle) * radius,
      Math.sin(t * 0.5 + node.bob) * 0.14,
      Math.sin(node.angle) * radius,
    );
    mesh.rotation.x += dt * 0.5;
    mesh.rotation.y += dt * 0.35;

    const targetScale = hovered ? 1.9 : 1;
    mesh.scale.lerp(scratch.setScalar(targetScale), 1 - Math.exp(-9 * Math.min(dt, 0.1)));
  });

  const onOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    setStore({ hoveredSkill: node.label });
    document.body.style.cursor = 'pointer';
    play('hover');
  };

  const onOut = (e) => {
    e.stopPropagation();
    setHovered(false);
    setStore({ hoveredSkill: null });
    document.body.style.cursor = '';
  };

  return (
    <mesh
      ref={ref}
      scale={0.001}
      onPointerOver={quality === 'high' ? onOver : undefined}
      onPointerOut={quality === 'high' ? onOut : undefined}
    >
      <icosahedronGeometry args={[0.11, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 3 : 1.1}
        roughness={0.25}
        metalness={0.6}
        toneMapped={false}
      />

      {showLabel && (
        <Html
          center
          // Labels sit above the node and must never eat pointer events —
          // the mesh underneath owns the hover.
          position={[0, 0.3, 0]}
          zIndexRange={[20, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <span
            className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.16em] transition-all duration-300"
            style={{
              color: hovered ? '#fff' : 'rgba(255,255,255,0.42)',
              textShadow: hovered ? `0 0 14px ${accent}` : 'none',
            }}
          >
            {node.label}
          </span>
        </Html>
      )}

      {hovered && (
        <Html center position={[0, -0.34, 0]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <span
            className="whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            {category}
          </span>
        </Html>
      )}
    </mesh>
  );
}

// Shared scratch vector — allocating inside useFrame would churn the GC.
const scratch = new THREE.Vector3();
