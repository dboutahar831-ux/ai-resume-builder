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
          bg:      '#0A0A0A',
          surface: '#111111',
          raised:  '#1A1A1A',
          border:  '#2A2A2A',
          text:    '#EBEBEB',
          muted:   '#909090',
          dim:     '#545454',
        },
      },
      scale: {
        115: '1.15',
      },
    },
  },
  plugins: [],
}
