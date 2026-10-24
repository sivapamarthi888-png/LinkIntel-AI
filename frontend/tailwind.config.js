/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1e3a8a',
          900: '#0f172a',
        },
        primary: '#1e3a8a',
        secondary: '#3b82f6',
        accent: '#14b8a6',
      }
    },
  },
  plugins: [],
}
