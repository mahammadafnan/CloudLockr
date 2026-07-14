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
        // Apple-inspired minimal palette
        brand: {
          50:  '#f5f9ff',
          100: '#e8f1ff',
          200: '#cfe1ff',
          300: '#a6c8ff',
          400: '#6ea6ff',
          500: '#0071e3', // Apple system blue
          600: '#0062c4',
          700: '#0053a6',
          800: '#004488',
          900: '#00366d',
          950: '#001b3a',
        },
        surface: {
          DEFAULT: '#060913',
          raised:  '#0b0f19',
          card:    'rgba(17, 24, 39, 0.55)',
          border:  'rgba(255, 255, 255, 0.08)',
          hover:   'rgba(255, 255, 255, 0.06)',
        },
        ink: {
          primary:   '#f8fafc',
          secondary: '#94a3b8',
          tertiary:  'rgba(148, 163, 184, 0.48)',
          quaternary:'rgba(148, 163, 184, 0.24)',
        },
        accent: {
          blue:    '#3b82f6',
          success: '#10b981',
          warning: '#fbbf24',
          danger:  '#f43f5e',
          info:    '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'sm':   '0.5rem',
        DEFAULT:'0.75rem',
        'md':   '1rem',
        'lg':   '1.25rem',
        'xl':   '1.5rem',
        '2xl':  '1.75rem',
        '3xl':  '2rem',
        '4xl':  '2.5rem',
      },
      boxShadow: {
        soft:   '0 8px 24px rgba(0,0,0,0.24)',
        float:  '0 20px 60px rgba(0,0,0,0.35)',
        subtle: '0 1px 2px rgba(0,0,0,0.2), 0 1px 1px rgba(0,0,0,0.14)',
        ring:   '0 0 0 1px rgba(255,255,255,0.06)',
      },
      backdropBlur: {
        xs: '8px',
        sm: '16px',
        md: '24px',
        lg: '40px',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        250: '250ms',
        350: '350ms',
      },
      keyframes: {
        'fade-in':  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-up':  {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 300ms ease-out both',
        'fade-up':  'fade-up 350ms ease-out both',
        'slide-up': 'slide-up 350ms ease-out both',
        'scale-in': 'scale-in 250ms ease-out both',
      },
    },
  },
  plugins: [],
}
