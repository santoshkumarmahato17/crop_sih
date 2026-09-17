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
        agri: {
          50: '#f0faf4',
          100: '#d6f2e0',
          200: '#ade5c2',
          300: '#7ad49e',
          400: '#4abe78',
          500: '#2F855A', // Secondary green
          600: '#236b47',
          700: '#1c5639',
          800: '#173F2C',
          900: '#123D2A', // Primary deep green
          950: '#0a1f14', // Darkest green (dark mode bg)
        },
        satellite: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617', // Deep slate space background
        },
        spectral: {
          ndvi_high: '#15803d',
          ndvi_mid: '#eab308',
          ndvi_low: '#ef4444',
          water_stress: '#0284c7',
          thermal_hot: '#f97316',
        },
        accent: {
          lime: '#A3E635',
          limeHover: '#bef264',
          limeDark: '#84cc16',
        },
        surface: {
          light: '#F4F7F2',
          card: '#FFFFFF',
          darkBg: '#0a1f14',
          darkCard: '#112920',
          darkElevated: '#163b2c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(18, 61, 42, 0.08), 0 1px 2px rgba(18, 61, 42, 0.06)',
        'card-hover': '0 10px 25px -5px rgba(18, 61, 42, 0.12), 0 4px 10px -2px rgba(18, 61, 42, 0.08)',
        'card-dark': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'card-dark-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 4px 10px -2px rgba(0, 0, 0, 0.3)',
        'glow-green': '0 0 20px -4px rgba(47, 133, 90, 0.4)',
        'glow-lime': '0 0 20px -4px rgba(163, 230, 53, 0.35)',
        'sidebar': '4px 0 24px -4px rgba(18, 61, 42, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
