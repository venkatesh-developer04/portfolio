'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import resume from '@/data/resume.json';
import { useStore } from '@/lib/store';
import { useMagnetic } from '@/hooks/useMagnetic';
import { scrollToSection } from '@/hooks/useLenis';
import { play } from '@/lib/audio';

const EASE = [0.16, 1, 0.3, 1];

export default function Hero() {
  const entered = useStore((s) => s.entered);
  const quality = useStore((s) => s.quality);
  const cta = useMagnetic(0.35);
  const section = useRef(null);
  const plate = useRef(null);

  // Reduced motion gets the content, none of the choreography.
  const still = quality === 'off';

  /**
   * The torch.
   *
   * Pointer coords are written to a ref and consumed in a rAF, never held in
   * state — a re-render per pointermove would rebuild the hero sixty times a
   * second, and this file follows usePointer's precedent of keeping pointer
   * data out of React entirely.
   *
   * The rect is read inside the frame rather than per event: pointermove can
   * fire many times between paints, and getBoundingClientRect is a layout read.
   * One read per frame, immediately before the write, cannot thrash.
   */
  useEffect(() => {
    const host = section.current;
    const target = plate.current;
    if (!host || !target || still) return;
    // Touch has no torch — see the (pointer: coarse) branch in globals.css.
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let frame = null;
    let px = 0;
    let py = 0;

    const apply = () => {
      frame = null;
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--mx', `${px - rect.left}px`);
      target.style.setProperty('--my', `${py - rect.top}px`);
    };

    const onMove = (e) => {
      px = e.clientX;
      py = e.clientY;
      target.classList.add('is-lit');
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onLeave = () => target.classList.remove('is-lit');

    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, [still]);

  /**
   * Scroll-linked exit. Transform + opacity only (GPU-composited, no layout)
   * riding MotionValues, so it never re-renders React on scroll.
   */
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ['start start', 'end start'],
  });
  // Spring smooths the pointer-precise scroll input; without it the parallax
  // tracks a trackpad's jitter exactly and looks nervous.
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 32, mass: 0.28 });

  // The plate is the backdrop and barely moves; the copy over it travels — the
  // gap between the two is the depth cue.
  const yPlate = useTransform(p, [0, 1], [0, -40]);
  const yCopy = useTransform(p, [0, 1], [0, -150]);
  const fade = useTransform(p, [0, 0.55], [1, 0]);
  const cueFade = useTransform(p, [0, 0.12], [1, 0]);

  const layer = (y) => (still ? undefined : { y, opacity: fade });

  const rise = (delay) => ({
    initial: { opacity: 0, y: 24 },
    animate: entered ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    transition: { duration: 0.9, delay, ease: EASE },
  });

  return (
    <section
      ref={section}
      data-section="hero"
      id="hero"
      className="relative flex min-h-[100svh] items-center overflow-hidden py-24 lg:py-0"
    >
      {/* ── Full-bleed plate ──────────────────────────────────────────────
          aria-hidden: the subject is decorative here. His identity is carried
          by the <h1> sitting over him, and announcing a second copy of the
          same name as alt text would only duplicate it in a screen reader. */}
      <motion.div
        ref={plate}
        aria-hidden="true"
        style={still ? undefined : { y: yPlate }}
        className={`plate pointer-events-none absolute inset-0 select-none ${
          still ? 'plate--flat' : ''
        }`}
      >
        <Image
          src="/hero-portrait.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="plate__base object-cover object-center"
        />

        {/* The torch: same image at full strength, revealed through a moving
            radial mask. Identical src/sizes to the base, so this is a cache
            hit and not a second download. */}
        <div className="plate__spot">
          <Image
            src="/hero-portrait.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Edge vignette. The copy sits at the left and right margins where the
            plate is busiest with smoke and embers; this darkens only those
            margins and leaves the centre — the subject — untouched. */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/10 to-ink-950" />
        {/* Floor fade, so the plate resolves into the page instead of stopping
            on a hard horizontal edge at the section boundary. */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />
      </motion.div>

      {/* ── Overlaid copy ────────────────────────────────────────────────── */}
      <div className="shell relative">
        {/*
         * The empty centre column is deliberate: it reserves the subject's
         * space so the two text columns are pushed out to the margins and
         * never land on his face. It carries no content, so it is hidden from
         * the accessibility tree.
         */}
        {/*
         * The centre column is capped in px, NOT vw. The shell is capped at
         * 1152px, so a vw-sized centre keeps growing with the monitor while
         * the grid it lives in does not — at 1920w a 26vw centre demanded
         * 499px of a 1072px grid and crushed the name columns below the
         * min-content width of "Venkatesh", which cannot wrap. Grid tracks
         * refuse to shrink below min-content, so the whole grid overflowed
         * and the section's overflow-hidden clipped the right column's edge.
         */}
        <div className="grid items-center gap-y-10 lg:grid-cols-[1fr_minmax(200px,320px)_1fr] lg:gap-x-8">
          {/*
           * Left: the name. No `order` on any of these three — the DOM order is
           * already name / spacer / details, and grid follows it. An explicit
           * order-1 here (with the spacer left at the default order-0) is what
           * previously sorted the spacer into the left column and squeezed the
           * name into the narrow centre one, on top of the subject's face.
           */}
          <motion.div style={layer(yCopy)} className="min-w-0">
            <motion.div {...rise(0.15)} className="mb-6 flex items-center gap-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-ember-brand" />
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-ember-brand" />
              </span>
              <span className="eyebrow !text-white/60">
                Available for work · {resume.meta.location}
              </span>
            </motion.div>

            {/* clamp, not a fixed 6rem: the upper bound is what "Venkatesh"
                measures at the widest the side column can ever be (~344px
                inside the capped shell). A fixed 6rem set the word wider than
                the column at every desktop width. */}
            <h1 className="display text-[15vw] leading-[0.86] drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)] sm:text-[11vw] lg:text-[clamp(3.25rem,5vw,4.5rem)]">
              <Line delay={0.16} entered={entered} still={still}>
                {resume.meta.firstName}
              </Line>
              <Line delay={0.26} entered={entered} still={still} className="gradient-text">
                {resume.meta.lastName}
              </Line>
            </h1>
          </motion.div>

          {/* Centre: reserved for the subject. */}
          <div aria-hidden="true" className="hidden lg:block" />

          {/* Right: the details, right-aligned back against the margin so the
              two columns read as bookends either side of the subject. */}
          <motion.div style={layer(yCopy)} className="min-w-0 lg:text-right">
            <motion.div {...rise(0.52)} className="flex items-center gap-4 lg:justify-end">
              {/* The rule flips direction with the alignment: it must always
                  fade AWAY from the text it introduces, so on the right-aligned
                  side the ember end is the one touching the title. */}
              <motion.span
                className="h-px bg-gradient-to-r from-ember-brand to-transparent lg:bg-gradient-to-l"
                initial={{ width: 0 }}
                animate={entered ? { width: 48 } : { width: 0 }}
                transition={{ duration: 1, delay: 0.62, ease: EASE }}
              />
              <p className="text-lg font-medium tracking-tight text-white md:text-xl">
                {resume.meta.title}
              </p>
            </motion.div>

            {/* max-w-md caps the measure; ml-auto is what actually pulls that
                capped block over to the right edge. */}
            <motion.p
              {...rise(0.62)}
              className="mt-6 max-w-md text-base leading-relaxed text-white/60 md:text-lg lg:ml-auto"
            >
              {resume.meta.tagline}
            </motion.p>

            <motion.div
              {...rise(0.74)}
              className="mt-10 flex flex-wrap items-center gap-4 lg:justify-end"
            >
              <button
                ref={cta}
                onClick={() => {
                  play('select');
                  scrollToSection('projects');
                }}
                className="group relative overflow-hidden rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black"
              >
                {/* Accent sweep on hover — the button acknowledges the pointer
                    rather than just nudging its arrow. */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-ember-brand to-amber-brand transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" />
                <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 group-hover:text-white">
                  View work
                  <span className="transition-transform duration-500 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </button>

              <a
                href={`mailto:${resume.meta.email}`}
                className="rounded-full border border-white/15 bg-ink-950/40 px-7 py-3.5 text-sm text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-ember-brand/40 hover:text-white"
              >
                {resume.meta.email}
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll affordance — first thing to go once you actually scroll. */}
      <motion.div
        style={still ? undefined : { opacity: cueFade }}
        className="absolute inset-x-0 bottom-8 hidden justify-center lg:flex"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: entered ? 1 : 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="flex flex-col items-center gap-3"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
            Scroll
          </span>
          <span className="relative h-10 w-px overflow-hidden bg-white/12">
            <motion.span
              className="absolute inset-x-0 h-4 bg-gradient-to-b from-transparent via-ember-brand to-transparent"
              animate={{ y: [-16, 40] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}

/**
 * One masked headline line.
 *
 * The mask is an overflow-hidden block and the inner span slides up through it.
 * The small `skewY` is what stops it reading as a plain slide: the line appears
 * to rotate into place, and unskewing as it settles gives the motion a pivot.
 */
function Line({ children, delay, entered, still, className = '' }) {
  if (still) return <span className={`block ${className}`}>{children}</span>;

  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className={`block origin-left ${className}`}
        initial={{ y: '115%', skewY: 5 }}
        animate={entered ? { y: '0%', skewY: 0 } : { y: '115%', skewY: 5 }}
        transition={{ duration: 1.15, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}
