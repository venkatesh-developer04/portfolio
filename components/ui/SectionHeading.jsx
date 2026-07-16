'use client';

import Reveal, { RevealWords } from '@/components/ui/Reveal';

export default function SectionHeading({ index, eyebrow, title, lead }) {
  return (
    <header className="mb-14 md:mb-20">
      <Reveal>
        <div className="mb-5 flex items-center gap-4">
          <span className="font-mono text-[11px] tabular-nums text-white/30">{index}</span>
          <span className="h-px w-10 bg-gradient-to-r from-white/30 to-transparent" />
          <span className="eyebrow">{eyebrow}</span>
        </div>
      </Reveal>

      <h2 className="display text-4xl leading-[1.05] md:text-6xl">
        <RevealWords text={title} />
      </h2>

      {lead && (
        <Reveal delay={0.12}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/50 md:text-xl">
            {lead}
          </p>
        </Reveal>
      )}
    </header>
  );
}
