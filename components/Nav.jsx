'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import resume from '@/data/resume.json';
import { useStore, setStore, getStore } from '@/lib/store';
import { scrollToSection } from '@/hooks/useLenis';
import { toggleMotion } from '@/hooks/useQuality';
import { play } from '@/lib/audio';
import { cn } from '@/lib/utils';

export default function Nav() {
  const active = useStore((s) => s.active);
  const entered = useStore((s) => s.entered);
  const muted = useStore((s) => s.muted);
  const quality = useStore((s) => s.quality);
  const [open, setOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id) => {
    setOpen(false);
    play('select');
    scrollToSection(id);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: entered ? 0 : -80, opacity: entered ? 1 : 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div
          className={cn(
            'transition-all duration-500',
            condensed && 'border-b border-white/[0.06] bg-ink-950/60 backdrop-blur-xl',
          )}
        >
          <nav className="shell flex h-[68px] items-center justify-between">
            <button
              onClick={() => go('hero')}
              className="group flex items-center gap-3"
              aria-label="Back to top"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-ember-brand" />
                {resume.meta.available && (
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-ember-brand" />
                )}
              </span>
              <span className="text-sm font-medium tracking-tight text-white/90">
                {resume.meta.firstName}
                <span className="text-white/35"> {resume.meta.lastName}</span>
              </span>
            </button>

            {/* Desktop links */}
            <ul className="hidden items-center gap-1 md:flex">
              {resume.sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => go(section.id)}
                    className={cn(
                      'relative rounded-full px-4 py-2 text-[13px] transition-colors duration-300',
                      active === section.id
                        ? 'text-white'
                        : 'text-white/40 hover:text-white/75',
                    )}
                  >
                    {active === section.id && (
                      /* layoutId lets the pill slide between items instead of
                         cross-fading — one shared element, not six. */
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.06]"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{section.label}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <IconButton
                label={muted ? 'Enable interaction sounds' : 'Mute interaction sounds'}
                onClick={() => {
                  const next = !getStore().muted;
                  setStore({ muted: next });
                  if (!next) play('select');
                }}
                active={!muted}
              >
                {muted ? <IconMuted /> : <IconSound />}
              </IconButton>

              <IconButton
                label={quality === 'off' ? 'Enable animation' : 'Reduce animation'}
                onClick={() => {
                  play('select');
                  toggleMotion();
                }}
                active={quality !== 'off'}
              >
                <IconMotion />
              </IconButton>

              <a
                href={`mailto:${resume.meta.email}`}
                className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] text-white/80 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.09] hover:text-white sm:block"
              >
                Get in touch
              </a>

              <button
                onClick={() => setOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 md:hidden"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
              >
                <span className="relative block h-3 w-4">
                  <span
                    className={cn(
                      'absolute left-0 h-px w-full bg-white transition-all duration-300',
                      open ? 'top-1.5 rotate-45' : 'top-0',
                    )}
                  />
                  <span
                    className={cn(
                      'absolute left-0 h-px w-full bg-white transition-all duration-300',
                      open ? 'top-1.5 -rotate-45' : 'top-3',
                    )}
                  />
                </span>
              </button>
            </div>
          </nav>
        </div>

        {/* Scroll progress hairline */}
        <ScrollProgress />
      </motion.header>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-ink-950/90 backdrop-blur-2xl md:hidden"
          >
            <ul className="flex h-full flex-col items-start justify-center gap-2 px-10">
              {resume.sections.map((section, i) => (
                <motion.li
                  key={section.id}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.1, ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
                >
                  <button
                    onClick={() => go(section.id)}
                    className="flex items-baseline gap-4 py-2 text-4xl font-semibold tracking-tightest text-white/85"
                  >
                    <span className="font-mono text-xs text-white/25">
                      0{i + 1}
                    </span>
                    {section.label}
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ScrollProgress() {
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

  return (
    <div className="h-px w-full bg-white/[0.05]">
      <div
        className="h-full origin-left bg-gradient-to-r from-ember-brand to-amber-brand"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

function IconButton({ children, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300',
        active
          ? 'border-white/20 bg-white/[0.08] text-white'
          : 'border-white/10 text-white/40 hover:text-white/70',
      )}
    >
      {children}
    </button>
  );
}

const iconProps = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const IconSound = () => (
  <svg {...iconProps}>
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 5a9 9 0 0 1 0 14" />
  </svg>
);

const IconMuted = () => (
  <svg {...iconProps}>
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="m23 9-6 6" />
    <path d="m17 9 6 6" />
  </svg>
);

const IconMotion = () => (
  <svg {...iconProps}>
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="m4.93 4.93 2.83 2.83" />
    <path d="m16.24 16.24 2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="m4.93 19.07 2.83-2.83" />
    <path d="m16.24 7.76 2.83-2.83" />
  </svg>
);
