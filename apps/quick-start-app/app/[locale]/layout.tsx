import { ThemeModeScript } from 'flowbite-react';
import { dir } from 'i18next';
import Link from 'next/link';
import NextTopLoader from 'nextjs-toploader';
import type { ReactNode } from 'react';
import { inter, lexend } from '~/app/[locale]/fonts';
import { HomeNav } from '~/components/home-nav';
import i18nConfig from '~/i18nConfig';
import initTranslations from '~/lib/i18n';
import { AppProviders } from '~/providers/app-providers';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './globals.css';

export const metadata = {
  title: 'langchain-nextjs',
  description: 'langchain-nextjs',
};

interface LayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

export function generateStaticParams() {
  return i18nConfig.locales.map((locale: string) => ({ locale }));
}

const i18nNamespaces = ['common', 'response', 'home', 'auth'];

const RootLayout = async function ({ children, params }: LayoutProps) {
  const { locale } = await Promise.resolve(params); // 处理异步 `params`
  const { resources } = await initTranslations(locale, i18nNamespaces);

  return (
    <html
      lang={locale}
      dir={dir(locale)}
      className={`h-full scroll-smooth ${inter.variable} ${inter.className} ${lexend.className}`}
    >
      <head>
        <ThemeModeScript />
      </head>

      <body className="flex h-full flex-col">
        <NextTopLoader />
        <AppProviders
          namespaces={i18nNamespaces}
          locale={locale}
          resources={resources}
        >
          {/* <HomeNav locale={locale} /> */}
          <main className="mx-auto size-full">{children}</main>
          <footer className="mt-auto p-3 text-center text-sm">
            备案号:{' '}
            <Link
              href="https://beian.miit.gov.cn/"
              className="text-blue-500 no-underline hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              京ICP备19003478号-1
            </Link>
          </footer>
        </AppProviders>
      </body>
    </html>
  );
};

export default RootLayout;
