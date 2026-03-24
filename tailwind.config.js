/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0D0D0D',
        'primary-light': '#1A1A1A',
        accent: '#C9A84C',
        'accent-light': '#E0C068',
        'accent-dark': '#A88A3A',
        background: '#111111',
        surface: '#1A1A1A',
        'surface-raised': '#222222',
        'text-primary': '#F5F0E8',
        'text-secondary': '#BDB5A4',
        'text-muted': '#7A7468',
        'status-sale': '#4ADE80',
        'status-sale-bg': 'rgba(74, 222, 128, 0.15)',
        'status-rent': '#60A5FA',
        'status-rent-bg': 'rgba(96, 165, 250, 0.15)',
        'status-occupied': '#9CA3AF',
        'status-occupied-bg': 'rgba(156, 163, 175, 0.12)',
        'status-construction': '#FBBF24',
        'status-construction-bg': 'rgba(251, 191, 36, 0.15)',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
