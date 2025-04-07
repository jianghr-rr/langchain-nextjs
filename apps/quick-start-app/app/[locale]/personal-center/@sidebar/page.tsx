'use client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SideBar } from '~/components/sidebar';

export default function PatternsPageSideBar() {
  const { t } = useTranslation();

  const links = useMemo(
    () => [
      {
        href: '/personal-center',
        label: t('personalCenter'),
        children: [
          {
            href: '/personal-center/update-password',
            label: t('updatePassword'),
          },
        ],
      },
    ],
    [t]
  );

  return <SideBar links={links} />;
}
