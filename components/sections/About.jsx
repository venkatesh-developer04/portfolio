'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import resume from '@/data/resume.json';
import SectionHeading from '@/components/ui/SectionHeading';
import Marquee from '@/components/ui/Marquee';
import { useStore } from '@/lib/store';
import { useTilt } from '@/hooks/useTilt';

const EASE = [0.16, 1, 0.3, 1];

export default function About() {
  const quality = useStore((s) => s.quality);
  const still = quality === 'off';
  const section = useRef(null);

  /**
   * Scroll-linked drift.
   *
   * The section used to borrow its life from the 3D desk parked behind it —
   * the camera swung past and that motion carried the read. With the desk gone
   * the only movement left was one-shot entrance fades, which are over before
   * you have finished the first sentence, so the whole section sat dead.
   *
   * This drives each band off scroll position instead: they keep moving the
   * entire time the section is on screen. `offset` spans end-to-end (not
   * start-to-start like the hero's exit) because this is a *pass-through* —
   * the section is entered, read, and left.
   *
   * Transform + opacity only, riding MotionValues, so no React re-render and
   * no layout on scroll.
   */
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ['start end', 'end start'],
  });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  // Bands further down the section travel further — the same depth cue the
  // hero uses, so the two sections read as one system.
  const yHead = useTransform(p, [0, 1], [30, -30]);
  const yBody = useTransform(p, [0, 1], [55, -55]);
  const yStats = useTransform(p, [0, 1], [80, -80]);
  const yFoot = useTransform(p, [0, 1], [110, -110]);
  // Fills the void the desk left: an ember bloom that breathes up as the
  // section crosses the viewport and falls away as it leaves.
  const glow = useTransform(p, [0, 0.5, 1], [0, 0.55, 0]);

  const drift = (y) => (still ? undefined : { y });

  const reveal = (delay = 0, y = 22) =>
    still
      ? {}
      : {
          initial: { opacity: 0, y },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-10% 0px' },
          transition: { duration: 0.8, delay, ease: EASE },
        };

  return (
    <section
      ref={section}
      data-section="about"
      id="about"
      className="relative flex min-h-screen items-center py-32"
    >
      {/* The tape rides the hero→about seam, INSIDE this section on purpose —
          see Marquee.jsx for why a between-sections gap teleports the camera. */}
      <Marquee
        className="top-4 -rotate-[1.2deg]"
        items={[
          ...resume.skills[0].items.slice(0, 4),
          ...resume.stats.map((s) => s.value + ' ' + s.label),
        ]}
      />
      {/* Ambient ember field. Purely atmospheric, so it must never eat pointer
          events or be announced. */}
      {!still && (
        <motion.div
          aria-hidden="true"
          style={{ opacity: glow }}
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div
            className="absolute inset-0 blur-3xl"
            style={{
              background:
                'radial-gradient(45% 40% at 22% 45%, rgba(255,106,26,0.22), transparent 70%), radial-gradient(35% 35% at 78% 65%, rgba(255,180,63,0.12), transparent 70%)',
            }}
          />
        </motion.div>
      )}

      <div className="shell">
        {/*
         * Centred, not right-aligned. The old `ml-auto` existed to clear the 3D
         * desk that sat left of frame; with the desk deleted it was pinning the
         * copy to one side for no reason and leaving half the section empty.
         */}
        <div className="text-scrim mx-auto max-w-3xl">
          <motion.div style={drift(yHead)}>
            <SectionHeading index="01" eyebrow="About" title={resume.about.headline} />
          </motion.div>

          <motion.div style={drift(yBody)} className="space-y-6">
            {resume.about.body.map((paragraph, i) => (
              <Paragraph
                key={i}
                text={paragraph}
                delay={i * 0.12}
                still={still}
                // The first paragraph is the lede and sets the section's
                // voice; the rest support it. One flat size read as a wall.
                lede={i === 0}
              />
            ))}
          </motion.div>

          <motion.div
            style={drift(yStats)}
            className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.05] md:grid-cols-4"
          >
            {resume.stats.map((stat, i) => (
              <Stat key={stat.label} stat={stat} index={i} still={still} />
            ))}
          </motion.div>

          <motion.div style={drift(yFoot)} className="mt-16 grid gap-10 sm:grid-cols-2">
            <div>
              <motion.h3 {...reveal(0)} className="eyebrow mb-5">
                Education
              </motion.h3>
              {resume.education.map((item, i) => (
                <Entry key={item.degree} delay={0.08 + i * 0.1} still={still}>
                  <p className="font-medium text-white/90">{item.degree}</p>
                  <p className="mt-1 text-sm text-white/40">{item.institution}</p>
                  <p className="mt-2 font-mono text-xs text-white/30">
                    {item.year} · {item.detail}
                  </p>
                </Entry>
              ))}
            </div>

            <div>
              <motion.h3 {...reveal(0.1)} className="eyebrow mb-5">
                Certifications
              </motion.h3>
              <div className="space-y-5">
                {resume.certifications.map((item, i) => (
                  <Entry key={item.name} delay={0.18 + i * 0.1} still={still}>
                    <p className="font-medium text-white/90">{item.name}</p>
                    <p className="mt-1 text-sm text-white/40">{item.issuer}</p>
                    <p className="mt-2 font-mono text-xs text-white/30">{item.grade}</p>
                  </Entry>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const maskedVariants = {
  hidden: { y: '105%' },
  visible: { y: '0%' },
};

/**
 * A body paragraph rising through a mask.
 *
 * The mask is the block; the text slides up inside it. A plain opacity fade
 * reads as the page still loading — a masked rise reads as deliberate, and it
 * is the same gesture the hero headline uses, so the page keeps one accent.
 *
 * The trigger sits on the OUTER span and the text is driven by variants, for
 * the same reason RevealWords does it: the <p> starts translated fully out of
 * an overflow-hidden parent, so it is clipped to zero visible area, so
 * IntersectionObserver would report it as never intersecting and whileInView
 * on the <p> itself would never fire — leaving the paragraph invisible for
 * good. The span is never clipped, so it always triggers.
 */
function Paragraph({ text, delay, still, lede = false }) {
  const cls = lede
    ? 'text-xl leading-relaxed text-white/75 md:text-[1.6rem] md:leading-snug'
    : 'text-lg leading-relaxed text-white/55 md:text-xl';

  if (still) {
    return <p className={cls}>{text}</p>;
  }

  return (
    <motion.span
      className="block overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
    >
      <motion.p className={cls} variants={maskedVariants} transition={{ duration: 1, delay, ease: EASE }}>
        {text}
      </motion.p>
    </motion.span>
  );
}

/**
 * One stat tile: rises in, then an ember wipes across it once.
 *
 * The wipe is what makes the number feel struck rather than printed. It runs
 * once on entry and is never repeated — a looping shimmer on four tiles at
 * once would pull the eye off the copy for as long as the section is open.
 */
function Stat({ stat, index, still }) {
  // Tilt lives on the inner wrapper, NOT the motion.div: framer writes the
  // entrance transform on the outer element, and gsap writing rotation to the
  // same node would clobber it mid-animation (and vice versa). Separate
  // elements, separate transforms, no fight. The tile's background stays flat
  // while the numbers lean — which reads as the content floating in the tile.
  const tilt = useTilt(5);

  // The tile drives both itself and the sweep through variants. The sweep
  // parks at -left-full, i.e. fully outside its overflow-hidden parent, so a
  // whileInView on the sweep itself would never fire — clipped elements do not
  // intersect. The tile is always visible, so it is the safe trigger.
  const enter = still
    ? {}
    : {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: { once: true, margin: '-10% 0px' },
        variants: { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } },
        transition: { duration: 0.7, delay: index * 0.09, ease: EASE },
      };

  return (
    <motion.div
      {...enter}
      className="group relative h-full overflow-hidden bg-ink-950 p-5 transition-colors duration-500 hover:bg-ink-900"
    >
      {!still && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-full w-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,106,26,0.28), transparent)',
          }}
          variants={{ hidden: { x: 0 }, visible: { x: '200%' } }}
          transition={{ duration: 1.2, delay: 0.3 + index * 0.09, ease: EASE }}
        />
      )}

      <div ref={tilt} className="relative h-full">
        <Counter value={stat.value} />
        <div className="mt-2 text-[11px] uppercase tracking-[0.12em] text-white/35">
          {stat.label}
        </div>
        <div className="mt-3 max-h-0 overflow-hidden text-xs leading-relaxed text-white/30 opacity-0 transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100">
          {stat.detail}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * An education / certification entry whose left rule draws itself down as the
 * entry arrives, rather than being there from the start.
 *
 * The rule is driven by variants from the entry, not by its own whileInView: at
 * scaleY(0) it has zero visual area, and a zero-area box is not reliably
 * reported as intersecting — it could sit at scale 0 permanently.
 */
function Entry({ children, delay, still }) {
  if (still) {
    return <div className="border-l border-white/10 pl-5">{children}</div>;
  }

  return (
    <motion.div
      className="relative pl-5"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
      variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.75, delay, ease: EASE }}
    >
      <motion.span
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-px origin-top bg-gradient-to-b from-ember-brand/70 to-white/10"
        variants={{ hidden: { scaleY: 0 }, visible: { scaleY: 1 } }}
        transition={{ duration: 0.9, delay: delay + 0.1, ease: EASE }}
      />
      {children}
    </motion.div>
  );
}

/**
 * Counts up the numeric part of a stat while preserving its prefix/suffix,
 * so "~30%" animates the 30 and keeps the "~" and "%" pinned.
 */
function Counter({ value }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const match = value.match(/^(\D*)([\d,]+)(.*)$/);
    if (!match) return;

    const [, prefix, digits, suffix] = match;
    const target = parseInt(digits.replace(/,/g, ''), 10);
    if (Number.isNaN(target)) return;

    const node = ref.current;
    if (!node) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const format = (n) =>
      `${prefix}${digits.includes(',') ? n.toLocaleString('en-US') : n}${suffix}`;

    setDisplay(format(0));

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const DURATION = 1400;
        const tick = (now) => {
          const t = Math.min((now - start) / DURATION, 1);
          const eased = 1 - Math.pow(1 - t, 4);
          setDisplay(format(Math.round(target * eased)));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div
      ref={ref}
      className="text-3xl font-semibold tabular-nums tracking-tightest text-white md:text-4xl"
    >
      {display}
    </div>
  );
}
