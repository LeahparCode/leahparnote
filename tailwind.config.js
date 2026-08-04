/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        console: {
          bg: 'var(--c-bg)',
          panel: 'var(--c-panel)',
          panel2: 'var(--c-panel-2)',
          inset: 'var(--c-inset)',
          line: 'var(--c-line)',
          ink: 'var(--c-ink)',
          sub: 'var(--c-sub)',
        },
        signal: {
          teal: '#4FB8B0',
          tealDim: '#2E7A75',
        },
        meter: {
          green: '#7BC17A',
          amber: '#E3A73E',
          red: '#D96A56',
        },
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        insetscreen: 'inset 0 2px 6px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.35)',
      },
      borderRadius: {
        panel: '10px',
        module: '6px',
      },
    },
  },
  plugins: [],
}
