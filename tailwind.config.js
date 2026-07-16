/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        /**
         * Warm near-blacks, sampled from the hero plate's shadow field. The
         * previous ink ramp was blue-black (#050507 → #1a1a25); against an
         * ember palette that cast read as a cold bruise. These carry a red/
         * brown bias so the darks agree with the embers sitting on them.
         */
        ink: {
          950: '#080605',
          900: '#0F0B09',
          800: '#1A1310',
          700: '#2A1E18',
        },
        // Primary accent — the hot spark orange of the embers.
        ember: {
          brand: '#FF6A1A',
        },
        // Secondary — the gold of the backlit smoke. Extends Tailwind's amber
        // rather than replacing it, so amber-400 etc. still resolve.
        amber: {
          brand: '#FFB43F',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 6s linear infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.16,1,0.3,1) infinite',
      },
    },
  },
  plugins: [],
};
