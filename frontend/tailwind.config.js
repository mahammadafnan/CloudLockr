/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Apple.com exact palette
        background: '#ffffff',
        foreground: '#1d1d1f',
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f5f5f7',   // Apple off-white section band
        },
        ink: {
          primary:   '#1d1d1f',   // near-black text
          secondary: '#6e6e73',   // muted gray
          tertiary:  '#86868b',
        },
        apple: {
          blue:       '#0071e3',
          blueHover:  '#0077ed',
          blueDark:   '#2997ff',  // blue on dark bg
          success:    '#35c759',
          warning:    '#ff9f0a',
          danger:     '#e30000',
          dangerDark: '#ff453a',
        },
        border: {
          DEFAULT: '#d2d2d7',     // Apple divider
          dark:    'rgba(255,255,255,0.12)',
        },
        // Legacy aliases so old classes keep working
        brand: {
          50:  '#f5f9ff',
          100: '#e8f1ff',
          200: '#cfe1ff',
          300: '#a6c8ff',
          400: '#6ea6ff',
          500: '#0071e3',
          600: '#0062c4',
          700: '#0053a6',
          800: '#004488',
          900: '#00366d',
          950: '#001b3a',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont',
          '"SF Pro Text"', '"SF Pro Display"',
          '"Helvetica Neue"', '"Segoe UI"', 'Arial', 'sans-serif',
        ],
        display: [
          '-apple-system', 'BlinkMacSystemFont',
          '"SF Pro Display"', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        // Apple type scale
        'caption': ['13px', { lineHeight: '1.38', letterSpacing: '-0.01em' }],
        'body':    ['17px', { lineHeight: '1.47', letterSpacing: '-0.022em' }],
        'sub':     ['21px', { lineHeight: '1.38', letterSpacing: '-0.021em' }],
        'h4':      ['24px', { lineHeight: '1.16', letterSpacing: '-0.022em' }],
        'h3':      ['32px', { lineHeight: '1.12', letterSpacing: '-0.024em' }],
        'h2':      ['48px', { lineHeight: '1.08', letterSpacing: '-0.028em' }],
        'h1':      ['64px', { lineHeight: '1.05', letterSpacing: '-0.03em'  }],
        'hero':    ['80px', { lineHeight: '1.05', letterSpacing: '-0.035em' }],
      },
      borderRadius: {
        'sm':  '6px',
        DEFAULT: '8px',
        'md':  '12px',
        'lg':  '16px',
        'xl':  '20px',
        '2xl': '28px',
        '3xl': '36px',
        'pill':'9999px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.03)',
        card:   '0 4px 16px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        soft:   '0 8px 24px rgba(0,0,0,0.06)',
        float:  '0 20px 60px rgba(0,0,0,0.10)',
      },
      backdropBlur: {
        nav: '20px',
        xl:  '40px',
      },
      backdropSaturate: {
        180: '1.8',
      },
      maxWidth: {
        'apple': '1200px',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        250: '250ms',
        320: '320ms',
        400: '400ms',
      },
      keyframes: {
        'fade-in':  {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up':  {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 320ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-up':  'fade-up 400ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up': 'slide-up 400ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 320ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
