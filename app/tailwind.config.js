/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          bg: '#1a1a2e',
          board: '#0f3460',
          tile: '#e94560',
          accent: '#16213e'
        }
      }
    },
  },
  plugins: [],
}
