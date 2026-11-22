import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: { 900: 'var(--night-900)', 700: 'var(--night-700)' },
        snow: { 50: 'var(--snow-50)' },
        pine: { 600: 'var(--pine-600)', 400: 'var(--pine-400)' },
        berry: { 600: 'var(--berry-600)' },
        gold: { 400: 'var(--gold-400)' },
        kraft: { 200: 'var(--kraft-200)' },
        ink: { 800: 'var(--ink-800)' },
      },
      borderRadius: { card: 'var(--radius-card)' },
      boxShadow: { card: 'var(--shadow-card)' },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
        hand: ['var(--font-hand)', 'cursive'],
      },
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
    },
  },
  plugins: [],
} satisfies Config;
