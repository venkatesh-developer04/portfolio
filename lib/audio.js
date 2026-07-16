'use client';

import { getStore } from './store';

/**
 * Interaction sounds, synthesized with WebAudio — no audio files to download,
 * no asset weight. Each cue is a short filtered sine blip with an exponential
 * decay, which reads as a soft UI "tick" rather than a game sound.
 *
 * The AudioContext is created lazily on first play because browsers block
 * contexts created before a user gesture.
 */

let ctx = null;
let master = null;

function ensureContext() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const CUES = {
  hover: { freq: 880, dur: 0.06, gain: 0.35, type: 'sine' },
  select: { freq: 440, dur: 0.16, gain: 0.6, type: 'triangle' },
  open: { freq: 320, dur: 0.24, gain: 0.5, type: 'sine' },
  close: { freq: 220, dur: 0.18, gain: 0.4, type: 'sine' },
};

export function play(cue) {
  if (getStore().muted) return;
  const audio = ensureContext();
  if (!audio) return;

  const spec = CUES[cue];
  if (!spec) return;

  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();

  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.freq, now);
  // Slight downward glide keeps it from sounding like a beep.
  osc.frequency.exponentialRampToValueAtTime(spec.freq * 0.72, now + spec.dur);

  filter.type = 'lowpass';
  filter.frequency.value = 2400;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(spec.gain, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + spec.dur);

  osc.connect(filter).connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + spec.dur + 0.02);
}
