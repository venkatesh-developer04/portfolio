'use client';

import resume from '@/data/resume.json';
import Reveal, { RevealWords } from '@/components/ui/Reveal';
import { useMagnetic } from '@/hooks/useMagnetic';
import { play } from '@/lib/audio';

export default function Contact() {
  const cta = useMagnetic(0.3);
  const year = new Date().getFullYear();

  return (
    <section
      data-section="contact"
      id="contact"
      className="relative flex min-h-screen flex-col justify-between py-32"
    >
      <div className="shell flex flex-1 items-center">
        <div className="text-scrim mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow mb-8">Contact</p>
          </Reveal>

          <h2 className="display text-[11vw] leading-[0.9] md:text-[6.5rem]">
            <RevealWords text="Let's build" />
            <br />
            <span className="gradient-text">
              <RevealWords text="something fast." delay={0.15} />
            </span>
          </h2>

          <Reveal delay={0.3}>
            <p className="mx-auto mt-10 max-w-md text-lg leading-relaxed text-white/45">
              Open to frontend roles and freelance work. The quickest way to reach
              me is email — I reply to everything.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <a
              ref={cta}
              href={`mailto:${resume.meta.email}`}
              onClick={() => play('select')}
              className="group mt-12 inline-flex items-center gap-3 rounded-full bg-white px-9 py-4 text-sm font-medium text-black"
            >
              {resume.meta.email}
              <span className="transition-transform duration-500 group-hover:translate-x-1">
                →
              </span>
            </a>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {resume.socials
                .filter((s) => s.label !== 'Email')
                .map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-center gap-2 text-sm text-white/40 transition-colors duration-300 hover:text-white"
                  >
                    <span className="link-underline">{social.label}</span>
                    <span
                      className="text-[10px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                      aria-hidden
                    >
                      ↗
                    </span>
                  </a>
                ))}
              <a
                href={`tel:${resume.meta.phone.replace(/\s/g, '')}`}
                className="link-underline text-sm text-white/40 transition-colors duration-300 hover:text-white"
              >
                {resume.meta.phone}
              </a>
            </div>
          </Reveal>
        </div>
      </div>

      <footer className="shell">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-8 text-xs text-white/25 sm:flex-row">
          <p>
            © {year} {resume.meta.name}
          </p>
          <p className="font-mono">
            Built with Next.js · React Three Fiber · GSAP
          </p>
          <p>{resume.meta.location}</p>
        </div>
      </footer>
    </section>
  );
}
