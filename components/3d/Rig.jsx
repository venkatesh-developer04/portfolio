'use client';

import { Environment, Lightformer, AdaptiveDpr, Preload } from '@react-three/drei';

/**
 * Lighting environment.
 *
 * Deliberately built from <Lightformer> shapes rather than drei's HDRI presets
 * (`<Environment preset="city" />`), which fetch a multi-megabyte .hdr from a
 * CDN at runtime. These are procedural: zero network, zero asset weight, and
 * the reflections are art-directed to the palette instead of inherited from a
 * photo of a street.
 *
 * frames={1} bakes the cubemap once on mount — nothing in the environment
 * moves, so re-rendering it per frame would be pure waste.
 */
export default function Rig({ quality = 'high' }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 6]} intensity={1.1} color="#ffffff" />
      {/* Warm gold bounce from below/behind, standing in for the ember bed. */}
      <directionalLight position={[-6, -2, -4]} intensity={0.5} color="#FFB43F" />

      {/* 128 not 256: this cubemap is baked during scene mount, which is
          already the page's worst main-thread stall (measured ~1.7s long
          task). It only ever supplies soft reflections to metal and glass —
          nothing here has a mirror finish that would reveal the resolution. */}
      <Environment resolution={128} frames={1}>
        {/* Key — broad soft white from upper left. */}
        <Lightformer
          form="rect"
          intensity={2.6}
          position={[-4, 3, 4]}
          scale={[8, 8, 1]}
          color="#ffffff"
        />
        {/* Ember fill, brand accent in the reflections. */}
        <Lightformer
          form="circle"
          intensity={3.2}
          position={[5, 1, 3]}
          scale={[5, 5, 1]}
          color="#FF6A1A"
        />
        {/* Gold rim from behind — separates the gem from the void, and mirrors
            the blown-out backlight behind the hero plate's subject. */}
        <Lightformer
          form="rect"
          intensity={2.4}
          position={[0, -2, -6]}
          scale={[10, 4, 1]}
          color="#FFB43F"
        />
        {/* Overhead strip — gives the facets a moving highlight to catch.
            Deep red rather than a fourth orange: the palette needs one cooler-
            burning tone at the top or every facet returns the same hue. */}
        <Lightformer
          form="rect"
          intensity={1.6}
          rotation-x={Math.PI / 2}
          position={[0, 6, 0]}
          scale={[12, 2, 1]}
          color="#E03A0C"
        />
      </Environment>

      {/* Drops resolution instead of frames when the GPU is struggling. */}
      {quality === 'high' && <AdaptiveDpr pixelated />}
      <Preload all />
    </>
  );
}
