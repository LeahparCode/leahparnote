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
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        surface: 'var(--surface)',
        surfaceMuted: 'var(--surface-muted)',
        line: 'var(--border)',
        ink: 'var(--ink)',
        sub: 'var(--sub)',
        brand: {
          DEFAULT: 'var(--brand)',
          strong: 'var(--brand-strong)',
        },
      },
    },
  },
  plugins: [],
}
