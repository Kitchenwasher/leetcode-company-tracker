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
        background: '#080B0F',
        surface: '#0E1217',
        surfaceElevated: '#141820',
        border: 'rgba(255, 255, 255, 0.08)',
        borderActive: 'var(--theme-accent, #E5FF00)',

        primary: 'var(--theme-accent, #E5FF00)',
        primaryHover: 'var(--theme-accent-hover, #D4ED00)',
        primaryLight: 'var(--theme-accent, #F7FF9E)',
        primaryDim: 'var(--theme-accent-hover, #A8BC00)',

        easy: '#10B981',
        medium: '#F59E0B',
        hard: '#F43F5E',

        error: '#EF4444',

        textPrimary: '#F3F4F6',
        textSecondary: '#9CA3AF',
        textMuted: '#6B7280',

        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          800: '#1a1a1a',
          850: '#141414',
          900: '#0E1217',
          950: '#080B0F',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        'subtle-glow': '0 0 20px -5px rgba(229, 255, 0, 0.25)',
        'space-glow': '0 0 25px -2px rgba(229, 255, 0, 0.4)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 8px 30px -4px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
