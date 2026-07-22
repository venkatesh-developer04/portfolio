'use client';

import Reveal, { RevealWords } from '@/components/ui/Reveal';

/**
 * Section masthead.
 *
 * The index is architecture, not annotation: a ghost numeral at display scale
 * behind the title (stroke-only, so it reads as carved into the dark rather
 * than printed on it), the title itself at editorial size, and a full-width
 * baseline rule that gives every section a hard top edge — sections stop
 * being floating text stacks and start being numbered chapters of one
 * document. The numbering is honest structure: the corridor really is a
 * sequence, and the frame's slate quotes the same numbers.
 *
 * Stacking note: the numeral is absolutely positioned, and positioned boxes
 * paint over later STATIC siblings — so every sibling that must sit on top of
 * it carries `relative`. Remove one and the numeral eats that line.
 */
export default function SectionHeading({ index, eyebrow, title, lead }) {
  return (
    <header className="relative mb-14 md:mb-20">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-3 -top-8 select-none font-semibold leading-none tracking-tightest text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.07)] text-[6.5rem] md:-top-14 md:text-[10.5rem]"
      >
        {index}
      </span>

      <Reveal className="relative">
        <span className="eyebrow">{eyebrow}</span>
      </Reveal>

      <div className="relative mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-white/[0.08] pb-6">
        <h2 className="display text-4xl leading-[1.02] md:text-6xl lg:text-7xl">
          <RevealWords text={title} />
        </h2>
        {/* Position marker on the baseline — same figures the frame's slate
            shows, so the chrome and the chapters agree. */}
        <Reveal delay={0.15} className="hidden md:block">
          <span className="mb-1 block font-mono text-[11px] tracking-[0.3em] text-ember-brand/70">
            {index}&nbsp;/&nbsp;05
          </span>
        </Reveal>
      </div>

      {lead && (
        <Reveal delay={0.12} className="relative">
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/50 md:text-xl">
            {lead}
          </p>
        </Reveal>
      )}
    </header>
  );
}
