/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { Config } from 'tailwindcss';
const flowbite = require('flowbite-react/tailwind');
const config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Note the addition of the `app` directory.
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    flowbite.content(),
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)'],
        lexend: ['var(--font-lexend)'],
        lexendBold: ['var(--font-lexend-bold)'],
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    flowbite.plugin(),
  ],
  // variants: {
  //   extend: {
  //     display: ['group-hover'],
  //   },
  // },
} satisfies Config;

export default config;
