import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

// Tailwind config is processed outside the webpack pipeline and cannot
// import from app modules. Keep these values in sync with config/theme.ts.
const OFFENSE = '#ff0055';
const DEFENSE = '#00e5ff';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './utils/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        offense: OFFENSE,
        defense: DEFENSE,
      },
      fontFamily: {
        display: ['var(--font-share-tech-mono)', 'monospace'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulseColor 2s infinite ease-in-out',
      },
      typography: {
        DEFAULT: {
          css: {
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
