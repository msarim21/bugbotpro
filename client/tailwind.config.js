/** @type {import('tailwindcss').Config} */
  export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
      extend: {
        colors: {
          neon: { cyan: '#22d3ee', blue: '#06b6d4', purple: '#8b5cf6', green: '#34d399', red: '#f87171' },
          surface: { DEFAULT: 'rgba(255,255,255,0.03)', elevated: 'rgba(255,255,255,0.06)' },
        },
        fontFamily: {
          mono: ['JetBrains Mono', 'monospace'],
          display: ['Plus Jakarta Sans', 'sans-serif'],
          body: ['Inter', 'system-ui', 'sans-serif'],
        },
        animation: {
          'pulse-slow': 'pulse 3s ease-in-out infinite',
          'fade-in': 'fadeIn 0.4s ease-out',
          'slide-up': 'slideUp 0.4s ease-out',
        },
        keyframes: {
          fadeIn: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
          slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        },
      }
    },
    plugins: []
  };
  