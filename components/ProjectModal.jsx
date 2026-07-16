'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, setStore } from '@/lib/store';
import { lockScroll } from '@/hooks/useLenis';
import { play } from '@/lib/audio';

const EASE = [0.16, 1, 0.3, 1];

export default function ProjectModal() {
  const project = useStore((s) => s.project);
  const panel = useRef(null);
  const restoreFocus = useRef(null);

  const close = () => {
    play('close');
    setStore({ project: null });
  };

  useEffect(() => {
    if (!project) return;

    restoreFocus.current = document.activeElement;
    lockScroll(true);
    panel.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      // Focus trap. A modal that lets Tab escape into the page behind it is
      // just a div that looks like a modal.
      if (e.key !== 'Tab' || !panel.current) return;
      const focusable = panel.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      lockScroll(false);
      restoreFocus.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-xl"
            onClick={close}
            aria-hidden
          />

          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="glass relative max-h-[88vh] w-full max-w-3xl overflow-y-auto p-8 md:p-12"
          >
            {/* Accent bloom tinted to the project. */}
            <div
              className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full blur-3xl"
              style={{ background: `${project.accent}30` }}
              aria-hidden
            />

            <div className="relative">
              <div className="mb-8 flex items-start justify-between gap-6">
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className="font-mono text-xs"
                      style={{ color: project.accent }}
                    >
                      {project.index}
                    </span>
                    <span className="h-px w-8 bg-white/20" />
                    <span className="eyebrow">{project.year}</span>
                  </div>
                  <h3
                    id="project-modal-title"
                    className="display text-4xl md:text-5xl"
                  >
                    {project.name}
                  </h3>
                  <p
                    className="mt-2 text-lg"
                    style={{ color: project.accent }}
                  >
                    {project.kind}
                  </p>
                </div>

                <button
                  onClick={close}
                  aria-label="Close"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:border-white/30 hover:text-white"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/60">
                {project.summary}
              </p>

              <div className="mb-10 grid grid-cols-2 gap-4">
                {project.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5"
                  >
                    <div className="text-3xl font-semibold tracking-tightest text-white">
                      {metric.value}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.14em] text-white/35">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="eyebrow mb-5">What I built</h4>
              <ul className="mb-10 space-y-4">
                {project.highlights.map((item) => (
                  <li key={item} className="flex gap-4 text-white/65">
                    <span
                      className="mt-2.5 h-1 w-1 shrink-0 rounded-full"
                      style={{ background: project.accent }}
                    />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>

              <h4 className="eyebrow mb-4">Stack</h4>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm text-white/70"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
