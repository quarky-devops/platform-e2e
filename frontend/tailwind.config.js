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
        // QuarkFin Brand Colors
        'quark-blue': '#3A50D9',
        'quark-light-blue': '#A9C1FF',
        'quark-purple': '#2C2F8F',
        'quark-grey': '#2D2D2D',
        primary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#3A50D9',
          600: '#2C2F8F',
          700: '#1e1b4b',
          800: '#1e1b4b',
          900: '#1e1b4b',
        }
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
