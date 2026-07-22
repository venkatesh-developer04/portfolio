'use client';

import resume from '@/data/resume.json';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { useStore, setStore } from '@/lib/store';
import { play } from '@/lib/audio';

export default function Projects() {
  const quality = useStore((s) => s.quality);
  const showCanvasCards = quality === 'high';

  const open = (project) => {
    play('open');
    setStore({ project });
  };

  return (
    <section
      data-section="projects"
      id="projects"
      className="relative flex min-h-screen items-center py-32"
    >
      {/* Left column is capped rather than a 50/50 split: the 3D cards need
          the right ~60% of the frame, and a half-width column ran under them. */}
      <div className="shell grid gap-16 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="text-scrim">
          <SectionHeading
            index="04"
            eyebrow="Selected work"
            title="Two platforms. Real users."
            lead={
              showCanvasCards
                ? 'Reach into the scene and open a card — or use the list below.'
                : 'Production SaaS shipped for international clients.'
            }
          />

          {/* Always rendered, even when the 3D cards are present.
              Canvas meshes are invisible to keyboards and screen readers, so
              this list is the accessible path to the same modal — not a
              fallback, a parallel control. */}
          <ul className="space-y-px overflow-hidden rounded-2xl border border-white/[0.07]">
            {resume.projects.map((project) => (
              <Reveal key={project.id} y={16}>
                <li>
                  <button
                    onClick={() => open(project)}
                    className="group flex w-full items-center gap-5 bg-white/[0.015] p-5 text-left transition-colors duration-500 hover:bg-white/[0.05]"
                  >
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: project.accent }}
                    >
                      {project.index}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium tracking-tight text-white/90">
                        {project.name}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-white/35">
                        {project.kind} · {project.stack.join(', ')}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-white/25">
                      {project.year}
                    </span>
                    <span
                      className="shrink-0 text-white/25 transition-all duration-500 group-hover:translate-x-1 group-hover:text-white"
                      aria-hidden
                    >
                      →
                    </span>
                  </button>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* Right column: reserved space the 3D cards occupy on desktop.
            When there is no canvas, real DOM cards fill it instead. */}
        <div className={showCanvasCards ? 'hidden lg:block' : ''}>
          {!showCanvasCards && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {resume.projects.map((project, i) => (
                <Reveal key={project.id} delay={i * 0.1}>
                  <button
                    onClick={() => open(project)}
                    className="glass group w-full overflow-hidden p-7 text-left"
                  >
                    <div
                      className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl transition-opacity duration-700 group-hover:opacity-80"
                      style={{ background: `${project.accent}40` }}
                    />
                    <div className="relative">
                      <div className="mb-6 flex items-center justify-between">
                        <span
                          className="font-mono text-xs"
                          style={{ color: project.accent }}
                        >
                          {project.index}
                        </span>
                        <span className="font-mono text-[10px] text-white/25">
                          {project.year}
                        </span>
                      </div>
                      <h3 className="text-2xl font-semibold tracking-tightest text-white">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-sm" style={{ color: project.accent }}>
                        {project.kind}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-white/45">
                        {project.summary}
                      </p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {project.stack.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/50"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      <span className="mt-7 flex items-center gap-2 text-sm text-white/70">
                        View case
                        <span className="transition-transform duration-500 group-hover:translate-x-1">
                          →
                        </span>
                      </span>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
