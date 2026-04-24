import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#006A4D',
        'primary-hi': '#007F3E',
        accent: '#38A169',
        navy: '#1A2B3C',
        gold: '#D4A017',
        cream: '#FBF9F4',
        error: '#C53030',
        'n-100': '#F7F7F7',
        'n-200': '#E2E8F0',
        'n-500': '#718096',
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '4px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg,#006A4D 0%,#007F3E 100%)',
        'streak-gradient': 'linear-gradient(135deg,#FFF7ED 0%,#FEF3C7 100%)',
      },
      keyframes: {
        sheen: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(300%)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        sheen: 'sheen 2s ease-in-out infinite',
        'fade-in': 'fadeIn 200ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
