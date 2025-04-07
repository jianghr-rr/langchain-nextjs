import localFont from 'next/font/local';

export const lexend = localFont({
  src: [
    {
      path: './fonts/Lexend-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-lexend',
});

export const lexendBold = localFont({
  src: [
    {
      path: './fonts/Lexend-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-lexend-bold',
});

export const inter = localFont({
  src: [
    {
      path: './fonts/Inter-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Inter-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
});
