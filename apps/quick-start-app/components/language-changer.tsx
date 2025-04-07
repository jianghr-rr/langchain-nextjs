'use client';
import { Avatar } from 'flowbite-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import i18nConfig from '~/i18nConfig';

function LanguageChanger() {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language;
  const router = useRouter();
  const currentPathname = usePathname();

  const handleChange = (value: string) => {
    const newLocale = value;

    // set cookie for next-i18n-router
    const days = 30;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `NEXT_LOCALE=${newLocale};expires=${date.toUTCString()};path=/`;

    // redirect to the new locale path
    if (
      currentLocale === i18nConfig.defaultLocale &&
      !i18nConfig.prefixDefault
    ) {
      router.push('/' + newLocale + currentPathname);
    } else {
      if (currentPathname) {
        router.push(
          currentPathname.replace(`/${currentLocale}`, `/${newLocale}`)
        );
      }
    }
    i18n.changeLanguage(newLocale).catch(console.error);
    router.refresh();
  };

  return (
    <Avatar
      className="cursor-pointer"
      placeholderInitials={currentLocale}
      onClick={() => handleChange(currentLocale === 'zh' ? 'en' : 'zh')}
      rounded
    />
  );
}

export default LanguageChanger;
export { LanguageChanger };
