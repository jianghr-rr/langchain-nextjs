import {
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarToggle,
} from 'flowbite-react';
import dynamic from 'next/dynamic';
import { initServerTranslations } from '~/lib/i18n';
import { MainNav } from './main-nav';
import User from './user';

const LanguageChanger = dynamic(() => import('../language-changer'));
const ThemeChanger = dynamic(() => import('../theme-changer'));

const HomeNav = async ({ locale }: { locale: string }) => {
  const i18n = await initServerTranslations(locale, ['home']);
  const t = i18n.t.bind(i18n); // 使用服务器端翻译实例

  return (
    <Navbar fluid rounded>
      <NavbarBrand>
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
          {t('title')}
        </span>
      </NavbarBrand>
      <div className="flex gap-2 md:order-2">
        <User locale={locale} />
        <LanguageChanger />
        <ThemeChanger />
        <NavbarToggle />
      </div>
      <NavbarCollapse>
        <MainNav locale={locale} />
      </NavbarCollapse>
    </Navbar>
  );
};

export default HomeNav;
export { HomeNav };
