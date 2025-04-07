import Link from 'next/link';
import initTranslations from '~/lib/i18n';
const NotFound = async ({ locale }: { locale: string }) => {
  const { t } = await initTranslations(locale, ['home']);

  return (
    <div className="align-center flex h-full flex-1 items-center justify-center">
      <div className="text-center">
        <div className="max-w-md">
          <h1 className="mb-4 text-5xl font-bold">{t('not_found.title')}</h1>
          <Link className="btn btn-primary" href="/">
            {t('not_found.go_back')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
export { NotFound };
