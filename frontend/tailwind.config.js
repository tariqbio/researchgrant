/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#E1F5EE',
          100: '#C2EAD8',
          600: '#1D9E75',
          700: '#0F6E56',
        },
      },
    },
  },
  plugins: [],
}
