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
        // High fidelity cybersecurity palette
        brand: {
          50: '#f4f6fa',
          100: '#e9edf5',
          200: '#cdd7eb',
          300: '#a2b6dc',
          400: '#6f8fc9',
          500: '#4a6eb3',
          600: '#385596',
          700: '#2f457c',
          800: '#2a3b67',
          900: '#263357',
          950: '#151c31', // Main dark background
        },
        cyber: {
          bg: '#0a0f1d',
          card: '#111827',
          border: '#1f2937',
          accent: '#3b82f6',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#06b6d4',
          muted: '#9ca3af',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
