'use client';

import { Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useStore, setStore, getStore } from '@/lib/store';
import CameraRig from '@/components/3d/CameraRig';
import Rig from '@/components/3d/Rig';
import SkillOrbit from '@/components/3d/SkillOrbit';
import ProjectCards from '@/components/3d/ProjectCards';
import Particles from '@/components/3d/Particles';

/**
 * A single persistent Canvas fixed behind all DOM content.
 *
 * Not one canvas per section: the whole point is that the camera *travels*
 * between objects laid out in one continuous world, so there is exactly one
 * scene graph and one WebGL context for the entire page.
 */
/**
 * Reports the moment the scene has drawn its second frame — by then shaders
 * are compiled and the env map is baked, so the intro can lift knowing the
 * page behind it is actually live rather than guessing with a timer.
 */
function ReadySignal() {
  useFrame((state) => {
    if (state.clock.elapsedTime > 0 && !getStore().sceneReady) {
      setStore({ sceneReady: true });
    }
  });
  return null;
}

export default function Scene() {
  const quality = useStore((s) => s.quality);

  // Reduced motion / opted out — no WebGL context at all, CSS backdrop instead.
  // Nothing will ever render a frame, so release the intro's readiness gate.
  useEffect(() => {
    if (quality === 'off') setStore({ sceneReady: true });
  }, [quality]);

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
          <ReadySignal />
          <Rig quality={quality} />

          {/* Scroll camera only where the corridor exists. On 'low' the camera
              holds on the hero and the DOM carries the rest. */}
          <CameraRig enabled={high} />

          {/* The hero centrepiece is now the photographic plate in the DOM, so
              the 3D workspace that used to sit at y 0 is gone. The corridor
              still opens on empty space there by design — the particle field
              carries the hero, and the camera flies down to the orbit. */}

          {high && (
            <>
              <SkillOrbit quality={quality} />
              <ProjectCards quality={quality} />
            </>
          )}

          <Particles count={high ? 700 : 220} />
        </Suspense>
      </Canvas>
    </div>
  );
}
