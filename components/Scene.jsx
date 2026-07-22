'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from '@/lib/store';
import CameraRig from '@/components/3d/CameraRig';
import Rig from '@/components/3d/Rig';
import EmberGate from '@/components/3d/EmberGate';
import SkillOrbit from '@/components/3d/SkillOrbit';
import ProjectCards from '@/components/3d/ProjectCards';
import EmberSparks from '@/components/3d/EmberSparks';
import Particles from '@/components/3d/Particles';

/**
 * A single persistent Canvas fixed behind all DOM content.
 *
 * Not one canvas per section: the whole point is that the camera *travels*
 * between objects laid out in one continuous world, so there is exactly one
 * scene graph and one WebGL context for the entire page.
 */
export default function Scene() {
  const quality = useStore((s) => s.quality);

  // Reduced motion / opted out — no WebGL context at all, CSS backdrop instead.
  // (No readiness signalling any more: the intro is gated by its video's
  // `ended` event, so nothing waits on the scene's first frame.)
  if (quality === 'off') {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="aurora absolute inset-0" />
      </div>
    );
  }

  const high = quality === 'high';

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        // Cap DPR hard. Fragment cost scales with the SQUARE of this, so 1.8 →
        // 1.5 is ~30% fewer pixels shaded every frame, and against a dark
        // scene of flat-shaded facets the difference is not visible. This is
        // the cheapest real win available on integrated GPUs.
        dpr={high ? [1, 1.5] : [1, 1.25]}
        gl={{
          antialias: high,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 0.15, 7.4], fov: 42, near: 0.1, far: 90 }}
      >
        <color attach="background" args={['#080605']} />
        {/* Fog does the heavy lifting: sections the camera has left dissolve
            into the void instead of hanging in the distance. Must match the
            background exactly or the horizon banks against the clear colour. */}
        <fog attach="fog" args={['#080605', 11, 27]} />

        <Suspense fallback={null}>
          <Rig quality={quality} />

          {/* Scroll camera only where the corridor exists. On 'low' the camera
              holds on the hero and the DOM carries the rest. */}
          <CameraRig enabled={high} />

          {/* The hero centrepiece is the photographic plate in the DOM, so the
              corridor opens on empty space at y 0 by design — the particle
              field carries the hero, then the drop lands in the ember gate. */}

          {high && (
            <>
              <EmberGate />
              <SkillOrbit quality={quality} />
              <ProjectCards quality={quality} />
              <EmberSparks />
            </>
          )}

          <Particles count={high ? 700 : 220} />
        </Suspense>
      </Canvas>
    </div>
  );
}
