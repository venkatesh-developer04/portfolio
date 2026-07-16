'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';

const EASE = [0.16, 1, 0.3, 1];

/**
 * Scroll-triggered entrance. `once: true` matters — re-animating on every pass
 * makes a page feel restless when the reader scrolls back up.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 26,
  duration = 0.85,
  className,
  as = 'div',
}) {
  const quality = useStore((s) => s.quality);
  const Tag = motion[as] ?? motion.div;

  if (quality === 'off') return <div className={className}>{children}</div>;

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px -8% 0px' }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/**
 * Word-by-word headline reveal. Splits on words rather than characters:
 * per-character staggers on a long line look like a slot machine and wreck
 * screen-reader output. The whole string stays readable via aria-label.
 *
 * The trigger lives on the OUTER span and the words are driven by variants —
 * load-bearing, not stylistic. Each word starts translated 110% down inside an
 * `overflow-hidden` mask, so the word itself is clipped to zero visible area.
 * Putting `whileInView` on the word deadlocks: IntersectionObserver accounts
 * for ancestor clipping, so it reports the word as never intersecting, so the
 * word never animates in, so it stays clipped — forever. The unclipped parent
 * is always observable, and variants cascade down to the children.
 */
const wordVariants = {
  hidden: { y: '110%' },
  visible: { y: '0%' },
};

export function RevealWords({ text, className, delay = 0, stagger = 0.055 }) {
  const quality = useStore((s) => s.quality);

  if (quality === 'off') return <span className={className}>{text}</span>;

  return (
    <motion.span
      className={className}
      aria-label={text}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {text.split(' ').map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            aria-hidden
            className="inline-block"
            variants={wordVariants}
            transition={{ duration: 0.9, ease: EASE }}
          >
            {word}
            {' '}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
