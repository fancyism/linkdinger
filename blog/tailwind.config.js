/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        peach: {
          DEFAULT: '#FF6B35',
          light: '#FF8C5A',
          dark: '#E55A2B',
          glow: 'rgba(255, 107, 53, 0.2)',
        },
        dark: {
          DEFAULT: '#0D0D0D',
          surface: '#1A1A1A',
          elevated: '#2D2D2D',
        },
        light: {
          DEFAULT: '#FAFAFA',
          surface: '#FFFFFF',
          elevated: '#F0F0F0',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.03)',
          hover: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.1)',
        },
        'glass-light': {
          DEFAULT: 'rgba(0, 0, 0, 0.03)',
          hover: 'rgba(0, 0, 0, 0.05)',
          border: 'rgba(0, 0, 0, 0.08)',
          strong: 'rgba(0, 0, 0, 0.1)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'Fira Code', 'monospace'],
      },
      backdropBlur: {
        glass: '20px',
        'glass-heavy': '40px',
      },
      animation: {
        'float': 'float 20s ease-in-out infinite',
        'float-delayed': 'float 25s ease-in-out 5s infinite',
        'float-slow': 'float 30s ease-in-out 10s infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
