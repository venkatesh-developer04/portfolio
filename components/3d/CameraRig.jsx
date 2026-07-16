'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { easing } from 'maath';
import { scrollRef, pointerRef } from '@/lib/scroll';
import { clamp, easeInOutCubic, damp } from '@/lib/utils';

/**
 * ── CAMERA TUNING TABLE ───────────────────────────────────────────────────
 * One keyframe per section, indexed to match resume.json `sections`.
 *
 * The scene is a vertical corridor in world space, with every object parked
 * right of centre (x ≈ +2.2) so the DOM copy has the left:
 *   y   0  → hero            — EMPTY. The hero centrepiece is a photographic
 *                              plate in the DOM; only the particle field is
 *                              here. The stop is kept so the corridor still
 *                              begins above the orbit and flies down into it.
 *   y -12  → skills orbit      (x +3.6, it is the widest object)
 *   y -24  → project cards     (x +3.9, the pair is wide)
 *
 * Each object is visited twice from different angles. Framing follows from
 * where the camera sits *relative to the object's x*:
 *   camera left of it  → object appears right of frame → copy goes left
 *   camera right of it → object appears left of frame  → copy goes right
 *
 * This is the only place framing is defined. To re-frame a section, edit its
 * row — nothing else needs to change.
 */
const STOPS = [
  // hero — nothing to frame any more; this is just the corridor's start height.
  { pos: [0.0, 0.15, 7.6], look: [1.0, 0.0, 0] },
  // about — also empty since the desk went. Retained as an intermediate so the
  // drop from hero to the orbit is a travelled move rather than a jump cut.
  { pos: [6.6, -1.4, 6.4], look: [4.0, -0.6, 0] },
  // skills — drop into the orbit from its left → orbit right, legend left
  { pos: [0.6, -12.0, 8.8], look: [1.6, -12.0, 0] },
  // experience — swing right past the orbit → orbit hangs left, copy right
  { pos: [8.4, -13.4, 7.4], look: [5.5, -12.8, 0] },
  // projects — square up from the left → cards right, list left
  { pos: [0.3, -24.0, 9.6], look: [1.3, -24.0, 0] },
  // contact — drop well below the cards so they sweep up out of frame and the
  // closing copy gets clean space. Sitting 2 units under them (the obvious
  // choice) left them filling the shot, straight under the text; at -30 their
  // bottom edge still grazed the headline.
  { pos: [3.4, -31.2, 7.2], look: [2.8, -30.2, 0] },
];

/**
 * Mobile tier holds one framing instead of flying. It used to square up on the
 * workspace; with that gone it holds an empty, particle-only field behind the
 * DOM — which is the intent on mobile, where the hero plate and the copy stack
 * to fill the viewport and a competing 3D subject would only fight them.
 */
const MOBILE_STOP = { pos: [2.2, 0, 9.4], look: [2.2, 0, 0] };

const vA = new THREE.Vector3();
const vB = new THREE.Vector3();
const target = new THREE.Vector3();
const lookA = new THREE.Vector3();
const lookB = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

export default function CameraRig({ enabled = true }) {
  const { camera, size } = useThree();
  // Persisted so lookAt is damped too — snapping the target is what makes
  // scroll cameras feel jerky even when the position itself is smooth.
  const currentLook = useRef(new THREE.Vector3(1, 0, 0));

  /**
   * FOV is vertical, so a portrait viewport crops horizontally and would slice
   * the sides off every object. Widen it as the viewport narrows.
   */
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    camera.fov = aspect < 0.8 ? 68 : aspect < 1.3 ? 52 : 42;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  useFrame((_, dt) => {
    // dt can spike after a tab regains focus; clamp so damping can't overshoot.
    const delta = Math.min(dt, 0.1);

    // Scroll camera disabled (mobile tier): hold one framing.
    if (!enabled) {
      easing.damp3(camera.position, MOBILE_STOP.pos, 0.5, delta);
      easing.damp3(currentLook.current, MOBILE_STOP.look, 0.5, delta);
      camera.lookAt(currentLook.current);
      return;
    }

    const i = clamp(scrollRef.index, 0, STOPS.length - 1);
    const lo = Math.floor(i);
    const hi = Math.min(lo + 1, STOPS.length - 1);
    const t = easeInOutCubic(i - lo);

    vA.fromArray(STOPS[lo].pos);
    vB.fromArray(STOPS[hi].pos);
    target.lerpVectors(vA, vB, t);

    lookA.fromArray(STOPS[lo].look);
    lookB.fromArray(STOPS[hi].look);
    lookTarget.lerpVectors(lookA, lookB, t);

    // Damp the raw pointer first so parallax lags the cursor slightly — an
    // instant response reads as twitchy rather than weighty.
    pointerRef.sx = damp(pointerRef.sx, pointerRef.x, 3, delta);
    pointerRef.sy = damp(pointerRef.sy, pointerRef.y, 3, delta);

    target.x += pointerRef.sx * 0.45;
    target.y += pointerRef.sy * 0.28;

    // Scroll velocity nudges the camera back — a subtle sense of inertia.
    target.z += Math.min(Math.abs(scrollRef.velocity) * 0.012, 0.5);

    easing.damp3(camera.position, target, 0.28, delta);
    easing.damp3(currentLook.current, lookTarget, 0.34, delta);
    camera.lookAt(currentLook.current);
  });

  return null;
}
