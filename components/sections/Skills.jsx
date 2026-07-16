'use client';

import resume from '@/data/resume.json';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function Skills() {
  const hoveredSkill = useStore((s) => s.hoveredSkill);
  const quality = useStore((s) => s.quality);

  return (
    <section
      data-section="skills"
      id="skills"
      className="relative flex min-h-screen items-center py-32"
    >
      <div className="shell">
        {/* Orbit is framed right; legend takes the left. */}
        <div className="text-scrim max-w-xl">
          <SectionHeading
            index="02"
            eyebrow="Capabilities"
            title="The stack I ship with."
            lead={
              quality === 'high'
                ? 'Four orbits, one per discipline. Hover a node in the scene to isolate it.'
                : 'Four disciplines, grouped by how I actually use them day to day.'
            }
          />

          <div className="space-y-10">
            {resume.skills.map((group, gi) => (
              <Reveal key={group.category} delay={gi * 0.08}>
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: group.accent }}
                    />
                    <h3 className="text-sm font-medium tracking-tight text-white/80">
                      {group.category}
                    </h3>
                    <span className="h-px flex-1 bg-white/[0.07]" />
                    <span className="font-mono text-[10px] text-white/25">
                      {String(group.items.length).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => {
                      // The 3D scene and this legend share one hover state, so
                      // pointing at a node lights up its chip and vice versa.
                      const isActive = hoveredSkill === item;
                      return (
                        <span
                          key={item}
                          className={cn(
                            'rounded-full border px-3.5 py-1.5 text-[13px] transition-all duration-300',
                            isActive
                              ? 'border-white/40 bg-white/10 text-white'
                              : 'border-white/[0.08] bg-white/[0.02] text-white/50',
                          )}
                          style={
                            isActive
                              ? { boxShadow: `0 0 24px -6px ${group.accent}` }
                              : undefined
                          }
                        >
                          {item}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
