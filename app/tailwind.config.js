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
        // Legacy tokens used by the standard-mode StandardModeApp markup.
        game: {
          bg: '#1a1a2e',
          board: '#0f3460',
          tile: '#e94560',
          accent: '#16213e',
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
      },
      backgroundImage: {
        // Matches colors.gradient from ios/src/styles/theme.ts
        'ios-gradient':
          'linear-gradient(135deg, #581c87 0%, #9d174d 50%, #c2410c 100%)',
        // Standard-mode dark background used on the Home screen.
        'ios-dark':
          'linear-gradient(180deg, #0f172a 0%, #1a1a2e 50%, #1e293b 100%)',
      },
    },
  },
  plugins: [],
}
