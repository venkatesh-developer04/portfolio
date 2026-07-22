'use client';

import resume from '@/data/resume.json';

/**
 * Spinning sticker badge — circular text orbiting an ember mark, the whole
 * thing a mailto. Rotation rides Tailwind's built-in `spin` keyframes at a
 * lazy 16s; the global reduced-motion override freezes it into a plain round
 * sticker, which still works.
 */
export default function SpinBadge({ className = '' }) {
  return (
    <a
      href={`mailto:${resume.meta.email}`}
      aria-label={`Email ${resume.meta.name}`}
      className={`group block h-28 w-28 ${className}`}
    >
      <span className="relative block h-full w-full">
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full animate-[spin_16s_linear_infinite] transition-transform duration-500 group-hover:scale-110"
          aria-hidden="true"
        >
          <defs>
            <path
              id="badge-orbit"
              d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"
            />
          </defs>
          <text
            fill="rgba(255,255,255,0.5)"
            fontSize="10.5"
            letterSpacing="2.6"
            className="font-mono uppercase"
          >
            <textPath href="#badge-orbit">
              Open to work ✦ React.js ✦ Next.js ✦
            </textPath>
          </text>
        </svg>
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center text-2xl text-ember-brand transition-transform duration-500 group-hover:rotate-90"
        >
          ✦
        </span>
      </span>
    </a>
  );
}
