import dynamic from 'next/dynamic';
import * as React from 'react';
import type { ReactNode } from 'react';
import { TranslationsProvider } from '~/components/translations-provider';
import initTranslations from '~/lib/i18n';

const DynamicSidebar = dynamic<{
  direction?: string; // 添加 direction 属性
}>(() => import('./@sidebar/page'));

const i18nNamespaces = ['home', 'personal-center', 'auth', 'common'];
export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
  const { resources } = await initTranslations(locale, i18nNamespaces);

  return (
    <TranslationsProvider
      namespaces={i18nNamespaces}
      locale={locale}
      resources={resources}
    >
      <div className="grid grid-cols-12 gap-4 p-4">
        <div className="col-span-3">
          <DynamicSidebar />
        </div>
        <div className="col-span-9">{children}</div>
      </div>
    </TranslationsProvider>
  );
}
