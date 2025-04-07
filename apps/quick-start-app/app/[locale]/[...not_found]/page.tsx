import { NotFound } from '~/components/not-found';

export default async function NotFoundPage(params: {
  locale: string;
  params: {
    locale: string;
  };
}) {
  const { locale } = await Promise.resolve(params.params); // 处理异步 `params`
  return <NotFound locale={locale} />;
}
