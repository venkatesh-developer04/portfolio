'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import resume from '@/data/resume.json';
import { useStore, setStore } from '@/lib/store';
import { lockScroll } from '@/hooks/useLenis';

const EASE = [0.16, 1, 0.3, 1];

/**
 * The intro runs for exactly as long as the video does: the curtain lifts on
 * the video's `ended` event, not on a timer and not on scene-ready.
 *
 * Everything below is therefore a failure bound, not a timing choice — the
 * video ending is the happy path, and each of these exists so that a video
 * which never ends can't strand the reader on a black screen forever.
 */

/**
 * If the video hasn't produced a single frame by now, it is not going to:
 * autoplay was blocked, the codec is unsupported, or the asset 404'd. Bail to
 * the site rather than hold the reader behind a dead rectangle.
 */
const START_TIMEOUT = 3000;
/**
 * Absolute ceiling from mount. Generously past the ~10s runtime so ordinary
 * rebuffering on a slow connection is never guillotined, but a video that
 * stalls forever mid-play still releases.
 */
const HARD_CEILING = 25000;

/** Video cross-fades to flat black before the curtain moves. */
const FADE_MS = 500;
/** The two halves parting. Slow enough to read as doors, not a wipe. */
const OPEN_MS = 1200;

export default function Preloader() {
  const quality = useStore((s) => s.quality);
  const entered = useStore((s) => s.entered);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  // 'play' → video running · 'fade' → video dissolving to black · 'open' →
  // the black parting to reveal the hero.
  const [phase, setPhase] = useState('play');
  const videoRef = useRef(null);
  const done = useRef(false);
  const timers = useRef([]);

  const after = (ms, fn) => timers.current.push(setTimeout(fn, ms));

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setProgress(100);
    setPhase('fade');

    after(FADE_MS, () => {
      // Scroll unlocks HERE, as the doors start to part — not when they finish.
      // `entered` also releases the hero's own entrance, so the copy and the
      // plate rise into the widening gap instead of being found already there.
      setStore({ entered: true });
      setPhase('open');
      after(OPEN_MS, () => setVisible(false));
    });
  }, []);

  useEffect(() => {
    // Read the media query directly rather than the store: useQuality lives in
    // the parent, and React runs child effects first, so the store still holds
    // its default when this fires. A 10s forced video is exactly what someone
    // asking for reduced motion is asking not to get.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      done.current = true;
      setStore({ entered: true });
      setVisible(false);
      return;
    }

    lockScroll(true);
    window.scrollTo(0, 0);

    // The counter tracks the video's own playhead, so it is a real readout of
    // the wait rather than a decorative number racing a timer it can't see.
    let frame;
    const tick = () => {
      const v = videoRef.current;
      if (v && v.duration > 0 && !done.current) {
        setProgress(Math.min(Math.round((v.currentTime / v.duration) * 100), 100));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const ceiling = setTimeout(finish, HARD_CEILING);
    const startGuard = setTimeout(() => {
      const v = videoRef.current;
      // readyState < HAVE_CURRENT_DATA means not one frame is decodable yet.
      if (!v || v.readyState < 2 || v.paused) finish();
    }, START_TIMEOUT);

    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') finish();
    };
    window.addEventListener('keydown', onKey);

    const pending = timers.current;
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(ceiling);
      clearTimeout(startGuard);
      pending.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey);
    };
  }, [finish]);

  /**
   * autoPlay alone is a request, not a guarantee — a rejected play() promise is
   * the only reliable signal that the browser refused. Without this the reader
   * waits out START_TIMEOUT staring at a frozen frame.
   */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => finish());
  }, [finish]);

  useEffect(() => {
    if (entered) lockScroll(false);
  }, [entered]);

  /**
   * Quality resolves after mount (parent effect, plus a localStorage override
   * reduced-motion alone wouldn't catch). If it lands on 'off' this renders
   * null below — so `entered` must be set directly rather than via finish(),
   * whose curtain sequence would hold the nav and hero back behind an overlay
   * that is no longer on screen.
   */
  useEffect(() => {
    if (quality !== 'off') return;
    done.current = true;
    setStore({ entered: true });
    setVisible(false);
  }, [quality]);

  if (quality === 'off') return null;

  const opening = phase === 'open';
  const dimmed = phase !== 'play';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[80]"
          // Never intercept input once the page is live behind it.
          style={{ pointerEvents: entered ? 'none' : 'auto' }}
        >
          {/*
           * The black screen, built as two halves that later part. Split at
           * exactly 50% with the right half anchored to both 50% and the right
           * edge — giving each a `w-1/2` instead would leave a subpixel seam
           * at odd viewport widths, and a hairline of hero showing down the
           * centre of a black screen is exactly the kind of thing you only
           * notice once it ships.
           */}
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 bg-ink-950"
            animate={{ x: opening ? '-100%' : '0%' }}
            transition={{ duration: OPEN_MS / 1000, ease: EASE }}
          />
          <motion.div
            className="absolute inset-y-0 left-1/2 right-0 bg-ink-950"
            animate={{ x: opening ? '100%' : '0%' }}
            transition={{ duration: OPEN_MS / 1000, ease: EASE }}
          />

          {/* Ember seam — a hot line down the parting edge, so the doors read
              as being burned open rather than simply translated. */}
          {opening && (
            <motion.div
              aria-hidden="true"
              className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
              style={{
                background:
                  'linear-gradient(to bottom, transparent, #FF6A1A 35%, #FFB43F 50%, #FF6A1A 65%, transparent)',
              }}
              initial={{ opacity: 0, scaleX: 1 }}
              animate={{ opacity: [0, 1, 0], scaleX: [1, 60, 90] }}
              transition={{ duration: OPEN_MS / 1000, ease: 'easeOut', times: [0, 0.25, 1] }}
            />
          )}

          <motion.video
            ref={videoRef}
            // NO loop: the intro ends when the video does, so it has to be
            // allowed to end. muted + playsInline are what make autoplay legal
            // on mobile Safari and Chrome.
            autoPlay
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            src="/A_dark_cinematic_background_wi.mp4"
            onEnded={finish}
            onError={finish}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: dimmed ? 0 : 1 }}
            transition={{ duration: dimmed ? FADE_MS / 1000 : 0.6, ease: EASE }}
          />

          {/* Scrim: the chrome below is white-on-video, and the asset is not
              guaranteed dark under every one of its frames. */}
          <motion.div
            className="absolute inset-0 bg-ink-950/50"
            animate={{ opacity: dimmed ? 0 : 1 }}
            transition={{ duration: FADE_MS / 1000, ease: EASE }}
          />

          {/* Chrome clears out fast so the video is the only thing on screen. */}
          <motion.div
            animate={{ opacity: dimmed ? 0 : 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative flex h-full flex-col justify-between px-6 py-8 md:px-10 md:py-10"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow mb-2">{resume.meta.location}</p>
                <p className="text-sm text-white/50">{resume.meta.title}</p>
              </div>
              <button
                onClick={finish}
                className="group flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white"
              >
                Skip intro
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>

            <div>
              <div className="mb-5 flex items-end justify-between gap-6">
                {/* Not an <h1> — the hero owns that. This is chrome. */}
                <p className="text-lg font-medium tracking-tight text-white/80 md:text-xl">
                  {resume.meta.firstName}
                  <span className="text-white/30"> {resume.meta.lastName}</span>
                </p>
                <span className="font-mono text-3xl tabular-nums text-white/70 md:text-5xl">
                  {String(progress).padStart(3, '0')}
                </span>
              </div>

              <div className="h-px w-full bg-white/[0.08]">
                <div
                  className="h-full origin-left bg-gradient-to-r from-ember-brand to-amber-brand transition-transform duration-150 ease-out"
                  style={{ transform: `scaleX(${progress / 100})` }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
