/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0D1B2A',
          800: '#1B2A3B',
          700: '#243447',
        },
        gold: {
          400: '#C9A84C',
          500: '#B8963E',
        }
      },
      fontFamily: {
        hebrew: ['var(--font-heebo)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
