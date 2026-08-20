/** @type {import('tailwindcss').Config} */

/**
 * Design tokens for Cadence.
 *
 * The look is an operations register: blue-black ink on drafting paper, one
 * ultramarine accent for anything actionable, and vermilion reserved strictly
 * for work that is late or blocked. Three signal colours, no more, so a red
 * mark on screen always means the same thing.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        paper: '#EDEEEA',        // page - a neutral drafting grey
        surface: '#FFFFFF',
        raised: '#F7F7F5',
        ink: {
          DEFAULT: '#101215',    // primary text, nav rail
          soft: '#1D2126',       // rail hover
          line: '#2E333A',       // rail dividers
          muted: '#585F69',      // secondary text
          faint: '#8A9099',      // tertiary text, disabled
        },
        line: { DEFAULT: '#DFE0DB', strong: '#CBCDC6' },

        // The single accent. Anything clickable, active or focused.
        accent: {
          DEFAULT: '#2B36C4',
          hover: '#232CA3',
          soft: '#E9EAFA',
          line: '#C0C4F0',
        },

        // Signals. Each colour means exactly one thing across the whole app.
        flag: { DEFAULT: '#B23A2E', soft: '#FAEAE8', hover: '#953026' },  // late / blocked
        ochre: { DEFAULT: '#96650B', soft: '#FBF1DD' },                    // due soon / high
        moss: { DEFAULT: '#2C6149', soft: '#E4EFE9' },                     // done / healthy

        status: {
          pending: '#6B7280',
          progress: '#2B36C4',
          completed: '#2C6149',
          blocked: '#B23A2E',
        },
        priority: {
          low: '#8A9099',
          medium: '#4B5563',
          high: '#96650B',
          urgent: '#B23A2E',
        },
      },
      fontFamily: {
        // IBM Plex was drawn for enterprise software, which is exactly what
        // this is. Self-hosted via @fontsource so it renders offline.
        sans: ['"IBM Plex Sans Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.06em' }],
        '3xs': ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0.08em' }],
      },
      borderRadius: { DEFAULT: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.625rem' },
      boxShadow: {
        card: '0 1px 2px rgba(16, 18, 21, 0.05)',
        pop: '0 8px 24px -8px rgba(16, 18, 21, 0.24), 0 2px 6px -2px rgba(16, 18, 21, 0.10)',
        modal: '0 24px 56px -20px rgba(16, 18, 21, 0.42)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: 0, transform: 'translateX(-12px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
        'tick-in': {
          from: { opacity: 0, transform: 'scaleY(0.2)' },
          to: { opacity: 1, transform: 'scaleY(1)' },
        },
        grow: { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in': 'slide-in 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        'tick-in': 'tick-in 320ms cubic-bezier(0.22, 1, 0.36, 1) both',
        grow: 'grow 480ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
