/** @type {import('tailwindcss').Config} */
// Dark theme tokens mirrored from ios/src/styles/theme.ts to keep the web
// and iOS apps visually aligned. Do not drift these values without also
// updating ios/src/styles/theme.ts.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        // Custom pixel-art sizes used by Vanna sprite.
        // Tailwind only ships spacing in multiples of 4 (plus 0.5/1.5/2.5/3.5) —
        // w-13 and w-18 are non-standard. The Vanna sprite was authored against
        // these, so re-add them here (13 * 4px = 52px; 18 * 4px = 72px).
        13: '3.25rem',
        18: '4.5rem',
      },
      colors: {
        // Standard-mode chrome, retinted to the puzzle-board palette so the
        // Main Game and Toss-Up screens sit on the same board as Home.
        game: {
          bg: 'oklch(0.20 0.032 225)',     // screen background
          board: '#0f3460',                 // the literal puzzle board (unchanged)
          tile: '#e94560',                  // wheel-red tile accent (unchanged)
          accent: 'oklch(0.28 0.042 218)',  // header / raised chrome
        },

        // iOS-parity dark theme tokens. Keys here mirror
        // ios/src/styles/theme.ts `colors` so utilities like
        // `bg-background-dark` / `text-accent` line up with native colors.
        background: {
          DEFAULT: '#0f172a', // slate-900
          dark: '#020617',    // near-black
          card: 'rgba(30, 41, 59, 0.8)', // slate-800 @ 80% (PackBrowser card)
          overlay: 'rgba(0, 0, 0, 0.5)',
        },
        primary: {
          DEFAULT: '#a855f7',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        accent: {
          DEFAULT: '#facc15', // yellow-400 — matches iOS active/brand accent
          yellow: '#facc15',
          pink: '#ec4899',
          orange: '#f97316',
          green: '#22c55e',
          blue: '#3b82f6',
        },
        text: {
          DEFAULT: '#ffffff',
          primary: '#ffffff',
          secondary: '#94a3b8', // slate-400
          muted: '#64748b',     // slate-500
        },

        // Wheel of Fortune puzzle-board palette. The show's own identity:
        // a deep blue-green board, warm letter tiles, and gold. OKLCH so
        // neutrals stay tinted toward the board hue instead of going to navy.
        wof: {
          ink: 'oklch(0.19 0.03 228)',        // deepest base background
          board: 'oklch(0.30 0.045 216)',     // panel / card surface
          'board-hi': 'oklch(0.36 0.052 212)',// raised edge, hover
          tile: 'oklch(0.95 0.013 95)',       // warm letter-tile white
          'tile-ink': 'oklch(0.27 0.024 245)',// text on a tile
          gold: 'oklch(0.81 0.128 86)',       // the show's gold (committed accent)
          'gold-hi': 'oklch(0.88 0.115 90)',
          blue: 'oklch(0.64 0.13 240)',       // wheel blue (mode accent)
          red: 'oklch(0.60 0.17 25)',         // wheel red (mode accent)
        },
      },
      backgroundImage: {
        // Matches colors.gradient from ios/src/styles/theme.ts
        'ios-gradient':
          'linear-gradient(135deg, #581c87 0%, #9d174d 50%, #c2410c 100%)',
        'ios-dark':
          'linear-gradient(180deg, #0f172a 0%, #1a1a2e 50%, #1e293b 100%)',
      },
    },
  },
  plugins: [],
}
