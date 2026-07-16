'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import resume from '@/data/resume.json';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { useStore } from '@/lib/store';

export default function Experience() {
  const track = useRef(null);
  const quality = useStore((s) => s.quality);

  // Timeline spine draws itself as the section scrolls past.
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ['start 65%', 'end 55%'],
  });
  const spring = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });
  const scaleY = useTransform(spring, [0, 1], [0, 1]);

  return (
    <section
      data-section="experience"
      id="experience"
      className="relative flex min-h-screen items-center py-32"
    >
      <div className="shell">
        {/* Camera swings right of the orbit here, so the copy takes the right. */}
        <div className="text-scrim ml-auto max-w-2xl">
          <SectionHeading
            index="03"
            eyebrow="Experience"
            title="Shipping production SaaS, daily."
          />

          <div ref={track} className="relative pl-8">
            {/* Rail */}
            <div className="absolute left-0 top-2 h-full w-px bg-white/[0.07]" />
            <motion.div
              className="absolute left-0 top-2 h-full w-px origin-top bg-gradient-to-b from-ember-brand via-amber-brand to-transparent"
              style={{ scaleY: quality === 'off' ? 1 : scaleY }}
            />

            {resume.experience.map((job) => (
              <div key={job.company} className="relative">
                <span className="absolute -left-[34px] top-2 flex h-3 w-3 items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-ember-brand" />
                  {job.current && (
                    <span className="absolute inset-0 animate-pulse-ring rounded-full bg-ember-brand/70" />
                  )}
                </span>

                <Reveal>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3 className="text-2xl font-semibold tracking-tightest text-white md:text-3xl">
                      {job.role}
                    </h3>
                    {job.current && (
                      <span className="rounded-full border border-amber-brand/30 bg-amber-brand/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-brand">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-lg text-white/70">{job.company}</p>
                  <p className="mt-1 font-mono text-xs text-white/30">{job.period}</p>
                  <p className="mt-5 max-w-xl leading-relaxed text-white/45">
                    {job.summary}
                  </p>
                </Reveal>

                <ul className="mt-9 space-y-px overflow-hidden rounded-2xl border border-white/[0.07]">
                  {job.highlights.map((item, i) => (
                    <Reveal key={i} delay={0.05 * i} y={16}>
                      <li className="group flex gap-4 bg-white/[0.015] p-5 transition-colors duration-500 hover:bg-white/[0.045]">
                        <span className="mt-1 font-mono text-[10px] text-white/20 transition-colors duration-500 group-hover:text-ember-brand">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="leading-relaxed text-white/60 transition-colors duration-500 group-hover:text-white/85">
                          {item}
                        </span>
                      </li>
                    </Reveal>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Reveal delay={0.15}>
            <div className="glass mt-12 p-6">
              <p className="eyebrow mb-4">Reference</p>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white/90">{resume.reference.name}</p>
                  <p className="mt-1 text-sm text-white/40">
                    {resume.reference.role} · {resume.reference.company}
                  </p>
                </div>
                <a
                  href={`mailto:${resume.reference.email}`}
                  className="link-underline font-mono text-xs text-white/50 hover:text-white"
                >
                  {resume.reference.email}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
