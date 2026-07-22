'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import resume from '@/data/resume.json';
import { useStore } from '@/lib/store';

/**
 * The frame around the shot.
 *
 * The hero plate is a film still, and this treats the whole viewport as one:
 * registration ticks in the corners, a rail on each side. The left rail is a
 * live slate — which stop of the corridor you're on and its name — and the
 * right rail is scroll depth. Structure as information: both readouts are
 * true state, not decoration.
 *
 * Fixed and pointer-transparent, z-40: under the nav (50), over the copy.
 * Desktop only — on mobile these 24px rails would eat real column width, and
 * corner ticks under a thumb are noise.
 */
export default function CinematicFrame() {
  const entered = useStore((s) => s.entered);
  const active = useStore((s) => s.active);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const idx = resume.sections.findIndex((s) => s.id === active);
  const label = resume.sections[idx]?.label ?? '';
  const total = String(resume.sections.length).padStart(2, '0');

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: entered ? 1 : 0 }}
      transition={{ duration: 1, delay: 0.8 }}
      className="pointer-events-none fixed inset-0 z-40 hidden lg:block"
    >
      {/* Registration ticks. The top pair sits below the nav bar's band. */}
      <span className="absolute left-6 top-24 h-4 w-4 border-l border-t border-white/20" />
      <span className="absolute right-6 top-24 h-4 w-4 border-r border-t border-white/20" />
      <span className="absolute bottom-6 left-6 h-4 w-4 border-b border-l border-white/20" />
      <span className="absolute bottom-6 right-6 h-4 w-4 border-b border-r border-white/20" />

      {/* Left rail — the slate. Reads bottom-up, like spine text. */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 rotate-180 [writing-mode:vertical-rl]">
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/30">
          {String(idx + 1).padStart(2, '0')} / {total}
          <span className="text-ember-brand/80">&nbsp;&nbsp;·&nbsp;&nbsp;{label}</span>
        </span>
      </div>

      {/* Right rail — depth into the corridor. */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 rotate-180 [writing-mode:vertical-rl]">
        <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/30">
          Depth&nbsp;&nbsp;{String(Math.round(progress * 100)).padStart(3, '0')}
        </span>
      </div>
    </motion.div>
  );
}
