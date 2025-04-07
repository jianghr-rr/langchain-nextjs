import { NavbarLink } from 'flowbite-react';
import Link from 'next/link';
import { initServerTranslations } from '~/lib/i18n';

const MainNav = async ({ locale }: { locale: string }) => {
  const i18n = await initServerTranslations(locale, ['home']);
  const t = i18n.t.bind(i18n); // 使用服务器端翻译实例

  return (
    <NavbarLink as={Link} href="/">
      {t('home')}
    </NavbarLink>
  );
};

export default MainNav;
export { MainNav };
