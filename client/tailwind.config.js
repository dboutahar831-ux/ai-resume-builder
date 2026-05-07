/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        primary: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
        dm: {
          bg: '#0B0E14',
          surface: '#151921',
          border: '#21262E',
          text: '#E8ECF1',
          muted: '#8B95A5',
          raised: '#1A1F2B',
        },
      },
    },
  },
  plugins: [],
}
