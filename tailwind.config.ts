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
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
