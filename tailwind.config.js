/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0B1E36',
        'primary-light': '#1C314D',
        accent: '#FACC15',
        background: '#f8f9fb',
        surface: '#ffffff',
        'surface-raised': '#f2f4f6',
        'text-primary': '#191c1e',
        'text-secondary': '#43474f',
        'text-muted': '#747780',
        'status-sale': '#217128',
        'status-sale-bg': '#a0f399',
        'status-rent': '#1a5fb4',
        'status-rent-bg': '#d0e4ff',
        'status-occupied': '#43474f',
        'status-occupied-bg': '#e0e3e5',
        'status-construction': '#7a4f00',
        'status-construction-bg': '#ffe8b0',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
