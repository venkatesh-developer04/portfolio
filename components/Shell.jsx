'use client';

import dynamic from 'next/dynamic';
import resume from '@/data/resume.json';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useLenis } from '@/hooks/useLenis';
import { useQuality } from '@/hooks/useQuality';
import { usePointer } from '@/hooks/usePointer';
import Nav from '@/components/Nav';
import CinematicFrame from '@/components/CinematicFrame';
import SkewOnScroll from '@/components/SkewOnScroll';
import Cursor from '@/components/Cursor';
import Preloader from '@/components/Preloader';
import ProjectModal from '@/components/ProjectModal';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Skills from '@/components/sections/Skills';
import Experience from '@/components/sections/Experience';
import Projects from '@/components/sections/Projects';
import Contact from '@/components/sections/Contact';

/**
 * The whole WebGL scene is code-split and client-only. It is by far the
 * heaviest thing on the page (three + drei ≈ most of the JS), and it renders
 * nothing on the server — so it must never block first paint or ship in the
 * initial bundle. The DOM content is fully readable before it arrives.
 */
const Scene = dynamic(() => import('@/components/Scene'), { ssr: false });

// Module scope: a fresh array literal here would be a new reference on every
// render and re-run the Lenis effect.
const SECTION_IDS = resume.sections.map((s) => s.id);

export default function Shell() {
  useQuality();
  usePointer();
  useLenis(SECTION_IDS);

  // Only for the smoke: OS-level reduced motion already freezes it via the
  // global media query, but the nav's own "Reduce animation" toggle sets the
  // store without touching any media query — and a pure-CSS animation cannot
  // see the store. Without this class the one control that promises stillness
  // would quiet everything except the smoke.
  const quality = useStore((s) => s.quality);

  return (
    <>
      <Preloader />
      <Cursor />
      <Scene />

      {/* Site-wide smoke, screen-blended over the canvas. Purely atmospheric:
          never announced, never interactive. Sits at z-0 — above the canvas at
          -z-10, below the grain at z-1 and all copy at z-10. */}
      <div className={cn('atmo', quality === 'off' && 'atmo--still')} aria-hidden="true" />

      <Nav />
      <CinematicFrame />

      <main id="main" className="relative z-10">
        {/* Full tier only: skewing the page rasterises a document-sized layer,
            which is exactly the kind of cost the low tier exists to refuse. */}
        <SkewOnScroll enabled={quality === 'high'}>
          <Hero />
          <About />
          <Skills />
          <Experience />
          <Projects />
          <Contact />
        </SkewOnScroll>
      </main>

      <ProjectModal />
    </>
  );
}
