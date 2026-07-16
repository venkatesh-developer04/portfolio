'use client';

import { useSyncExternalStore } from 'react';

/**
 * ~40 line external store. Everything here is UI state that genuinely needs a
 * re-render (nav highlight, modal, quality tier). Per-frame values live in
 * lib/scroll.js instead and never touch React.
 */

const listeners = new Set();

let state = {
  /** Intro finished (or skipped) — gates scroll lock and hero animation. */
  entered: false,
  /** True once the 3D scene has actually rendered a frame. Lets the intro end
   *  when the page is genuinely ready instead of on a fixed timer. */
  sceneReady: false,
  /** Currently active section id, drives nav highlight. */
  active: 'hero',
  /** 'high' desktop | 'low' mobile/weak GPU | 'off' reduced motion. */
  quality: 'high',
  /** Interaction sounds. Off by default — autoplay audio is hostile. */
  muted: true,
  /** Currently open project (object from resume.json) or null. */
  project: null,
  /** Hovered skill node id, shared between 3D scene and DOM legend. */
  hoveredSkill: null,
};

const serverState = state;

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setStore(patch) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  let changed = false;
  for (const key in next) {
    if (!Object.is(state[key], next[key])) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...next };
  emit();
}

export function getStore() {
  return state;
}

/**
 * Selector must return a primitive or a stable reference — it runs on every
 * store emit and its result is compared with Object.is.
 */
export function useStore(selector) {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(serverState),
  );
}
