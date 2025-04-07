'use client';
import { useTranslation } from 'react-i18next';
import { UpdatePasswordForm } from '~components/update-password';

const Page = () => {
  const { i18n, t } = useTranslation();
  const locale = i18n.language;

  return (
    <div className="max-w-[500px]">
      <p className="my-4 text-xl">{t('updatePassword')}</p>
      <UpdatePasswordForm
        callBack={() => {
          console.log('update password');
        }}
        locale={locale}
      />
    </div>
  );
};

export default Page;
export { Page };
