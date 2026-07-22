'use client';

/**
 * Kinetic tape — an endless strip of type on a slight diagonal, alternating
 * filled and stroke-only words with ember separators.
 *
 * MUST live INSIDE a section (absolutely positioned against it), never
 * between sections: lib/sections.js maps any scroll position that belongs to
 * no section to the LAST index, so a tape in a gap would teleport the 3D
 * camera to the contact stop every time the reader scrolled past it.
 *
 * aria-hidden and pointer-transparent: the tape repeats content that exists
 * properly elsewhere; announcing an infinite loop of it would be hostile.
 */
export default function Marquee({ items, reverse = false, className = '' }) {
  const row = (
    <span className="inline-flex items-center">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="inline-flex items-center">
          <span
            className={`mx-6 whitespace-nowrap text-2xl font-semibold uppercase tracking-tight md:text-3xl ${
              i % 2 === 0
                ? 'text-white/70'
                : 'text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.32)]'
            }`}
          >
            {item}
          </span>
          <span className="text-xl text-ember-brand">✦</span>
        </span>
      ))}
    </span>
  );

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 select-none overflow-hidden border-y border-white/[0.07] py-3 ${className}`}
    >
      <div className={`marquee__track ${reverse ? 'marquee__track--reverse' : ''}`}>
        {/* Two copies = seamless -50% loop. */}
        {row}
        {row}
      </div>
    </div>
  );
}
