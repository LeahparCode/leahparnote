/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        paper: token('paper'),
        surface: token('surface'),
        surfaceMuted: token('surface-muted'),
        line: token('line'),
        ink: token('ink'),
        sub: token('sub'),
        rail: token('rail'),
        railInk: token('rail-ink'),
        brand: {
          DEFAULT: token('signal'),
          strong: token('signal-strong'),
        },
        good: token('good'),
        warn: token('warn'),
        bad: token('bad'),
      },
    },
  },
  plugins: [],
}
